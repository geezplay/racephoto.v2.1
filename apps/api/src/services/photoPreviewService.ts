import sharp, { OverlayOptions } from 'sharp';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { Photo, RecapPhoto, PhotoPreview } from '../models';

const PREVIEW_DIR = path.join(__dirname, '..', '..', 'uploads', 'previews');
const RECAPS_DIR = path.join(__dirname, '..', '..', 'uploads', 'recaps');

const TILE_W = 300;
const TILE_H = 300;
const CAPTION_H = 34;
const GAP = 12;
const HEADER_H = 56;
const MAX_VARIANTS = 100;

const inflight = new Map<string, Promise<void>>();
const dirty = new Set<string>();

export function columnsFor(n: number): number {
  if (n <= 2) return 1;
  if (n <= 4) return 2;
  if (n <= 9) return 3;
  if (n <= 16) return 4;
  if (n <= 25) return 5;
  if (n <= 36) return 6;
  return 7;
}

export function contentHash(recaps: Array<{ id: number; file_path: string }>): string {
  const payload = recaps.map((r) => ({ id: r.id, file_path: r.file_path }));
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

function resolveRecapPath(filePath: string): string {
  return path.join(RECAPS_DIR, filePath);
}

function headerSvg(text: string, width: number, height: number): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#151515"/>
  <text x="16" y="${height / 2 + 7}" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff">${escapeXml(truncate(text, 80))}</text>
</svg>`;
}

function captionSvg(text: string, width: number, height: number): string {
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#111111"/>
  <text x="8" y="${height / 2 + 5}" font-family="Arial, sans-serif" font-size="14" fill="#ffffff">${escapeXml(truncate(text, 40))}</text>
</svg>`;
}

function badgeSvg(variantNumber: number): string {
  const label = escapeXml(`V${variantNumber}`);
  return `<svg width="76" height="38" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="6" width="64" height="32" rx="8" fill="#111111" fill-opacity="0.85"/>
  <text x="38" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#ffffff">${label}</text>
</svg>`;
}

async function buildTile(recap: RecapPhoto): Promise<Buffer> {
  let base: Buffer;
  let caption: string;
  try {
    const source = resolveRecapPath(recap.file_path);
    base = await sharp(source).resize(TILE_W, TILE_H, { fit: 'cover' }).toBuffer();
    caption = path.basename(recap.file_path);
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
    .composite([
      { input: Buffer.from(badgeSvg(recap.variant_number)), top: 0, left: 0 },
      { input: Buffer.from(captionSvg(caption, TILE_W, CAPTION_H)), top: TILE_H, left: 0 },
    ])
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}

async function renderGrid(photo: Photo, recaps: RecapPhoto[]): Promise<Buffer> {
  const n = recaps.length;
  const cols = columnsFor(n);
  const rows = Math.ceil(n / cols);
  const tileH = TILE_H + CAPTION_H;
  const width = cols * TILE_W + (cols + 1) * GAP;
  const gridH = rows * tileH + (rows - 1) * GAP;
  const height = HEADER_H + GAP + gridH + GAP;

  const header = `#${photo.start_no || ''} • ${n} varian`;
  const composites: OverlayOptions[] = [
    { input: Buffer.from(headerSvg(header, width, HEADER_H)), top: 0, left: 0 },
  ];

  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const top = HEADER_H + GAP + r * (tileH + GAP);
    const left = GAP + c * (TILE_W + GAP);
    composites.push({ input: await buildTile(recaps[i]), top, left });
  }

  return sharp({ create: { width, height, channels: 3, background: '#0a0a0a' } })
    .composite(composites)
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}

function unlinkPreview(file: string | null): void {
  if (!file) return;
  try {
    const full = path.join(PREVIEW_DIR, file);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  } catch (e) {
    console.warn('Failed to delete photo preview file:', (e as Error).message);
  }
}

async function recordFailure(photoId: number, message: string): Promise<void> {
  const trimmed = message.slice(0, 500);
  try {
    const row = await PhotoPreview.findOne({ where: { photo_id: photoId } });
    if (row) {
      await row.update({ failed_at: new Date(), error: trimmed });
    } else {
      await PhotoPreview.create({
        photo_id: photoId,
        file_path: null,
        variant_count: 0,
        content_hash: null,
        generated_at: null,
        failed_at: new Date(),
        error: trimmed,
      });
    }
  } catch (e) {
    console.error('Failed to record photo preview failure:', (e as Error).message);
  }
  console.error(`Photo preview generation failed for ${photoId}:`, message);
}

async function runRegenerate(photoId: number): Promise<void> {
  try {
    const photo = await Photo.findByPk(photoId);
    if (!photo) return;

    const recaps = await RecapPhoto.findAll({
      where: { photo_id: photoId },
      order: [['variant_number', 'ASC']],
    });

    const existing = await PhotoPreview.findOne({ where: { photo_id: photoId } });

    if (recaps.length === 0) {
      if (existing) {
        const oldFile = existing.file_path;
        await existing.destroy();
        unlinkPreview(oldFile);
      }
      return;
    }

    if (recaps.length > MAX_VARIANTS) {
      await recordFailure(photoId, 'Terlalu banyak varian (maks 100) untuk preview');
      return;
    }

    const hash = contentHash(recaps);
    const filename = `photo-${photoId}-${hash}.jpg`;
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

    const buffer = await renderGrid(photo, recaps);
    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
    fs.writeFileSync(fullPath, buffer);

    const oldFile = existing?.file_path ?? null;

    if (existing) {
      await existing.update({
        file_path: filename,
        variant_count: recaps.length,
        content_hash: hash,
        generated_at: new Date(),
        failed_at: null,
        error: null,
      });
    } else {
      await PhotoPreview.create({
        photo_id: photoId,
        file_path: filename,
        variant_count: recaps.length,
        content_hash: hash,
        generated_at: new Date(),
        failed_at: null,
        error: null,
      });
    }

    if (oldFile && oldFile !== filename) {
      const stillReferenced = await PhotoPreview.count({ where: { file_path: oldFile } });
      if (stillReferenced === 0) unlinkPreview(oldFile);
    }
  } catch (error) {
    await recordFailure(photoId, (error as Error).message || 'Preview generation failed');
  }
}

export async function regeneratePhotoPreview(photoId: number): Promise<void> {
  const key = `${photoId}`;
  const running = inflight.get(key);
  if (running) {
    dirty.add(key);
    return;
  }

  const task = (async () => {
    try {
      await runRegenerate(photoId);
    } finally {
      inflight.delete(key);
      if (dirty.has(key)) {
        dirty.delete(key);
        void regeneratePhotoPreview(photoId);
      }
    }
  })();

  inflight.set(key, task);
  await task;
}

export async function getPhotoPreview(photoId: number): Promise<PhotoPreview | null> {
  return PhotoPreview.findOne({ where: { photo_id: photoId } });
}
