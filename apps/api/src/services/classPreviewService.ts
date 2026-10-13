import sharp, { OverlayOptions } from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { Photo, ClassPreview } from '../models';

const PREVIEW_DIR = path.join(__dirname, '..', '..', 'uploads', 'previews');
const PHOTOS_DIR = path.join(__dirname, '..', '..', 'uploads');

const TILE_W = 320;
const TILE_H = 240;
const CAPTION_H = 34;
const GAP = 12;
const HEADER_H = 52;
const MAX_PHOTOS = 200;

const inflight = new Map<string, Promise<void>>();
const dirty = new Set<string>();

export function columnsFor(n: number): number {
  if (n <= 2) return 1;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  if (n <= 16) return 4;
  if (n <= 30) return 5;
  return 6;
}

export function slugify(s: string): string {
  const slug = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'class';
}

export function contentHash(photos: Array<{ id: number; updatedAt: Date; url: string }>): string {
  const payload = photos.map((p) => ({
    id: p.id,
    updatedAt: new Date(p.updatedAt).toISOString(),
    url: p.url,
  }));
  return crypto.createHash('sha1').update(JSON.stringify(payload)).digest('hex').slice(0, 8);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 3)}...` : s;
}

function resolvePhotoPath(url: string): string {
  if (!url) throw new Error('Photo url missing');
  const marker = '/uploads/';
  const idx = url.indexOf(marker);
  const rel = idx >= 0 ? url.slice(idx + marker.length) : url.replace(/^\/+/, '');
  return path.join(PHOTOS_DIR, rel);
}

function headerSvg(className: string, width: number, height: number): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#151515"/>
  <text x="16" y="${height / 2 + 6}" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#ffffff">${escapeXml(truncate(className, 80))}</text>
</svg>`;
}

function captionSvg(text: string, width: number, height: number): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#111111"/>
  <text x="8" y="${height / 2 + 5}" font-family="Arial, sans-serif" font-size="14" fill="#ffffff">${escapeXml(truncate(text, 44))}</text>
</svg>`;
}

async function buildTile(photo: Photo): Promise<Buffer> {
  let base: Buffer;
  let caption: string;
  try {
    const source = resolvePhotoPath(photo.url);
    base = await sharp(source).resize(TILE_W, TILE_H, { fit: 'cover' }).toBuffer();
    caption = `${photo.start_no || ''} ${path.basename(source)}`.trim();
  } catch {
    base = await sharp({
      create: { width: TILE_W, height: TILE_H, channels: 3, background: '#555555' },
    })
      .jpeg()
      .toBuffer();
    caption = 'gagal dimuat';
  }
  return sharp(base)
    .extend({ bottom: CAPTION_H, background: '#111111' })
    .composite([{ input: Buffer.from(captionSvg(caption, TILE_W, CAPTION_H)), top: TILE_H, left: 0 }])
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
}

async function renderGrid(className: string, photos: Photo[]): Promise<Buffer> {
  const n = photos.length;
  const cols = columnsFor(n);
  const rows = Math.ceil(n / cols);
  const tileH = TILE_H + CAPTION_H;
  const width = cols * TILE_W + (cols + 1) * GAP;
  const gridH = rows * tileH + (rows - 1) * GAP;
  const height = HEADER_H + GAP + gridH + GAP;

  const composites: OverlayOptions[] = [
    { input: Buffer.from(headerSvg(className, width, HEADER_H)), top: 0, left: 0 },
  ];

  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const top = HEADER_H + GAP + r * (tileH + GAP);
    const left = GAP + c * (TILE_W + GAP);
    composites.push({ input: await buildTile(photos[i]), top, left });
  }

  return sharp({ create: { width, height, channels: 3, background: '#0a0a0a' } })
    .composite(composites)
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
}

function unlinkPreview(file: string | null): void {
  if (!file) return;
  try {
    const full = path.join(PREVIEW_DIR, file);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (e) {
    console.warn('Failed to delete preview file:', (e as Error).message);
  }
}

async function recordFailure(eventId: number, className: string, message: string): Promise<void> {
  const trimmed = message.slice(0, 500);
  try {
    const row = await ClassPreview.findOne({ where: { event_id: eventId, class_name: className } });
    if (row) {
      await row.update({ failed_at: new Date(), error: trimmed });
    } else {
      await ClassPreview.create({
        event_id: eventId,
        class_name: className,
        file_path: null,
        photo_count: 0,
        content_hash: null,
        generated_at: null,
        failed_at: new Date(),
        error: trimmed,
      });
    }
  } catch (e) {
    console.error('Failed to record class preview failure:', (e as Error).message);
  }
  console.error(`Class preview generation failed for ${eventId}:${className}:`, message);
}

async function runRegenerate(eventId: number, className: string): Promise<void> {
  try {
    const existing = await ClassPreview.findOne({ where: { event_id: eventId, class_name: className } });
    const photos = await Photo.findAll({
      where: { event_id: eventId, class: className },
      order: [['start_no', 'ASC']],
    });

    if (photos.length === 0) {
      if (existing) {
        const oldFile = existing.file_path;
        await existing.destroy();
        unlinkPreview(oldFile);
      }
      return;
    }

    if (photos.length > MAX_PHOTOS) {
      await recordFailure(eventId, className, 'Terlalu banyak foto (maks 200) untuk preview kelas');
      return;
    }

    const hash = contentHash(photos);
    const slug = slugify(className).slice(0, 40);
    const filename = `class-${eventId}-${slug}-${hash}.jpg`;
    const fullPath = path.join(PREVIEW_DIR, filename);

    if (
      existing &&
      existing.content_hash === hash &&
      existing.file_path === filename &&
      existing.failed_at === null &&
      fs.existsSync(fullPath)
    ) {
      return;
    }

    const buffer = await renderGrid(className, photos);
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
    fs.writeFileSync(fullPath, buffer);

    const oldFile = existing?.file_path ?? null;

    if (existing) {
      await existing.update({
        file_path: filename,
        photo_count: photos.length,
        content_hash: hash,
        generated_at: new Date(),
        failed_at: null,
        error: null,
      });
    } else {
      await ClassPreview.create({
        event_id: eventId,
        class_name: className,
        file_path: filename,
        photo_count: photos.length,
        content_hash: hash,
        generated_at: new Date(),
        failed_at: null,
        error: null,
      });
    }

    if (oldFile && oldFile !== filename) {
      const stillReferenced = await ClassPreview.count({ where: { file_path: oldFile } });
      if (stillReferenced === 0) unlinkPreview(oldFile);
    }
  } catch (error) {
    await recordFailure(eventId, className, (error as Error).message || 'Preview generation failed');
  }
}

export async function regenerateClassPreview(eventId: number, className: string): Promise<void> {
  const key = `${eventId}:${className}`;
  const running = inflight.get(key);
  if (running) {
    dirty.add(key);
    return;
  }

  const task = (async () => {
    try {
      await runRegenerate(eventId, className);
    } finally {
      inflight.delete(key);
      if (dirty.has(key)) {
        dirty.delete(key);
        void regenerateClassPreview(eventId, className);
      }
    }
  })();

  inflight.set(key, task);
  await task;
}

export async function getClassPreview(eventId: number, className: string): Promise<ClassPreview | null> {
  return ClassPreview.findOne({ where: { event_id: eventId, class_name: className } });
}

export async function listClassPreviews(eventId?: number): Promise<ClassPreview[]> {
  return ClassPreview.findAll({
    where: eventId ? { event_id: eventId } : {},
    order: [['updatedAt', 'DESC']],
  });
}
