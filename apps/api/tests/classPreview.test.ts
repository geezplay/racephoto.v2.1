import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { sequelize } from '../src/config/db';
import { Event, Photo, ClassPreview } from '../src/models';
import {
  regenerateClassPreview,
  getClassPreview,
  columnsFor,
  slugify,
  contentHash,
} from '../src/services/classPreviewService';

const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const photosDir = path.join(uploadsDir, 'photos');
const previewsDir = path.join(uploadsDir, 'previews');

const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

describe('classPreviewService pure helpers', () => {
  it('maps photo counts to grid columns at the boundaries', () => {
    expect(columnsFor(1)).toBe(1);
    expect(columnsFor(2)).toBe(1);
    expect(columnsFor(3)).toBe(2);
    expect(columnsFor(4)).toBe(2);
    expect(columnsFor(5)).toBe(3);
    expect(columnsFor(9)).toBe(3);
    expect(columnsFor(10)).toBe(4);
    expect(columnsFor(16)).toBe(4);
    expect(columnsFor(17)).toBe(5);
    expect(columnsFor(30)).toBe(5);
    expect(columnsFor(31)).toBe(6);
  });

  it('slugifies class names into lowercase hyphenated slugs', () => {
    expect(slugify('GT 3000 cc!!')).toBe('gt-3000-cc');
    expect(slugify('GT 3000 cc!!')).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(slugify('')).toBe('class');
    expect(slugify('!!!')).toBe('class');
  });

  it('hashes photo content deterministically', () => {
    const updatedAt = new Date('2026-01-01T00:00:00.000Z');
    const base = [{ id: 1, updatedAt, url: '/uploads/photos/a.jpg' }];

    const hash = contentHash(base);
    expect(hash).toBe(contentHash([{ id: 1, updatedAt: new Date(updatedAt), url: '/uploads/photos/a.jpg' }]));
    expect(hash).toHaveLength(8);
    expect(contentHash([{ id: 1, updatedAt: new Date(updatedAt.getTime() + 1000), url: '/uploads/photos/a.jpg' }])).not.toBe(
      hash,
    );
    expect(contentHash([{ id: 1, updatedAt, url: '/uploads/photos/b.jpg' }])).not.toBe(hash);
  });
});

let dbAvailable = false;
let event: Event | null = null;
const fixtureFiles: string[] = [];
let firstHash: string | null = null;

async function writeFixture(name: string): Promise<string> {
  const file = path.join(photosDir, name);
  await sharp({ create: { width: 64, height: 64, channels: 3, background: '#336699' } })
    .jpeg()
    .toFile(file);
  fixtureFiles.push(file);
  return `/uploads/photos/${name}`;
}

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    dbAvailable = true;
  } catch (error) {
    console.warn('Database unavailable, skipping classPreview integration tests:', (error as Error).message);
    return;
  }

  fs.mkdirSync(photosDir, { recursive: true });

  event = await Event.create({
    name: `Class Preview Test ${suffix}`,
    location: 'Test Circuit',
  });

  const urlA1 = await writeFixture(`preview_a1_${suffix}.jpg`);
  const urlA2 = await writeFixture(`preview_a2_${suffix}.jpg`);
  const urlB1 = await writeFixture(`preview_b1_${suffix}.jpg`);

  await Photo.bulkCreate([
    { event_id: event.id, class: 'A', start_no: '1', price: 10000, url: urlA1 },
    { event_id: event.id, class: 'A', start_no: '2', price: 10000, url: urlA2 },
    { event_id: event.id, class: 'B', start_no: '3', price: 10000, url: urlB1 },
  ]);
});

afterAll(async () => {
  try {
    if (dbAvailable && event) {
      const previews = await ClassPreview.findAll({ where: { event_id: event.id } });
      for (const preview of previews) {
        if (preview.file_path) {
          const full = path.join(previewsDir, preview.file_path);
          if (fs.existsSync(full)) fs.unlinkSync(full);
        }
      }
      await ClassPreview.destroy({ where: { event_id: event.id } });
      await Photo.destroy({ where: { event_id: event.id } });
      await Event.destroy({ where: { id: event.id } });
    }

    for (const file of fixtureFiles) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  } finally {
    await sequelize.close();
  }
});

describe('classPreviewService integration', () => {
  it('generates a preview for a class and writes the file to disk', async (context) => {
    if (!dbAvailable) return context.skip();

    await regenerateClassPreview(event!.id, 'A');
    const row = await getClassPreview(event!.id, 'A');

    expect(row).not.toBeNull();
    expect(row!.photo_count).toBe(2);
    expect(row!.content_hash).toBeTruthy();
    expect(row!.failed_at).toBeNull();
    expect(row!.file_path).toBeTruthy();
    expect(fs.existsSync(path.join(previewsDir, row!.file_path!))).toBe(true);

    firstHash = row!.content_hash;
  });

  it('keeps classes separate', async (context) => {
    if (!dbAvailable) return context.skip();

    await regenerateClassPreview(event!.id, 'B');
    const row = await getClassPreview(event!.id, 'B');

    expect(row).not.toBeNull();
    expect(row!.photo_count).toBe(1);
  });

  it('changes the content hash when a photo is updated', async (context) => {
    if (!dbAvailable) return context.skip();

    const photo = await Photo.findOne({ where: { event_id: event!.id, class: 'A' } });
    await sequelize.query('UPDATE "photos" SET "updated_at" = $1 WHERE "id" = $2', {
      bind: [new Date(Date.now() + 60000), photo!.id],
    });

    await regenerateClassPreview(event!.id, 'A');
    const row = await getClassPreview(event!.id, 'A');

    expect(row!.content_hash).toBeTruthy();
    expect(row!.content_hash).not.toBe(firstHash);
  });

  it('reduces the photo count after a photo is deleted', async (context) => {
    if (!dbAvailable) return context.skip();

    const photo = await Photo.findOne({ where: { event_id: event!.id, class: 'A' } });
    await photo!.destroy();

    await regenerateClassPreview(event!.id, 'A');
    const row = await getClassPreview(event!.id, 'A');

    expect(row).not.toBeNull();
    expect(row!.photo_count).toBe(1);
  });

  it('removes the preview for a class with no photos', async (context) => {
    if (!dbAvailable) return context.skip();

    await regenerateClassPreview(event!.id, 'Kosong');
    const row = await getClassPreview(event!.id, 'Kosong');

    expect(row).toBeNull();
    const leftovers = fs.existsSync(previewsDir)
      ? fs.readdirSync(previewsDir).filter((f) => f.startsWith(`class-${event!.id}-kosong-`))
      : [];
    expect(leftovers).toHaveLength(0);
  });
});
