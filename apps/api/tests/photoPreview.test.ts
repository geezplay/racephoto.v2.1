import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { sequelize } from '../src/config/db';
import { Event, Photo, RecapPhoto, PhotoPreview } from '../src/models';
import {
  regeneratePhotoPreview,
  getPhotoPreview,
  columnsFor,
  contentHash,
} from '../src/services/photoPreviewService';

const uploadsDir = path.resolve(__dirname, '..', 'uploads');
const recapsDir = path.join(uploadsDir, 'recaps');
const previewsDir = path.join(uploadsDir, 'previews');

const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;

describe('photoPreviewService pure helpers', () => {
  it('maps variant counts to grid columns at the boundaries', () => {
    expect(columnsFor(1)).toBe(1);
    expect(columnsFor(2)).toBe(1);
    expect(columnsFor(3)).toBe(2);
    expect(columnsFor(4)).toBe(2);
    expect(columnsFor(9)).toBe(3);
    expect(columnsFor(10)).toBe(4);
    expect(columnsFor(16)).toBe(4);
    expect(columnsFor(17)).toBe(5);
    expect(columnsFor(25)).toBe(5);
    expect(columnsFor(26)).toBe(6);
    expect(columnsFor(36)).toBe(6);
    expect(columnsFor(37)).toBe(7);
  });

  it('hashes recap content deterministically', () => {
    const base = [{ id: 1, file_path: 'recap-a.jpg' }];

    const hash = contentHash(base);
    expect(hash).toBe(contentHash([{ id: 1, file_path: 'recap-a.jpg' }]));
    expect(hash).toHaveLength(8);
    expect(contentHash([{ id: 2, file_path: 'recap-a.jpg' }])).not.toBe(hash);
    expect(contentHash([{ id: 1, file_path: 'recap-b.jpg' }])).not.toBe(hash);
  });
});

let dbAvailable = false;
let event: Event | null = null;
let photo: Photo | null = null;
const fixtureFiles: string[] = [];

async function writeRecapFixture(name: string): Promise<string> {
  const file = path.join(recapsDir, name);
  await sharp({ create: { width: 96, height: 96, channels: 3, background: '#336699' } })
    .jpeg()
    .toFile(file);
  fixtureFiles.push(file);
  return name;
}

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    dbAvailable = true;
  } catch (error) {
    console.warn('Database unavailable, skipping photoPreview integration tests:', (error as Error).message);
    return;
  }

  fs.mkdirSync(recapsDir, { recursive: true });

  event = await Event.create({
    name: `Photo Preview Test ${suffix}`,
    location: 'Test Circuit',
  });

  photo = await Photo.create({
    event_id: event.id,
    class: 'A',
    start_no: '77',
    price: 10000,
    url: `/uploads/photos/photo_preview_${suffix}.jpg`,
  });

  const files = [
    await writeRecapFixture(`recap_test_${suffix}_1.jpg`),
    await writeRecapFixture(`recap_test_${suffix}_2.jpg`),
    await writeRecapFixture(`recap_test_${suffix}_3.jpg`),
  ];

  await RecapPhoto.bulkCreate([
    { photo_id: photo.id, variant_number: 1, file_path: files[0] },
    { photo_id: photo.id, variant_number: 2, file_path: files[1] },
    { photo_id: photo.id, variant_number: 3, file_path: files[2] },
  ]);
});

afterAll(async () => {
  try {
    if (dbAvailable && photo) {
      const previews = await PhotoPreview.findAll({ where: { photo_id: photo.id } });
      for (const preview of previews) {
        if (preview.file_path) {
          const full = path.join(previewsDir, preview.file_path);
          if (fs.existsSync(full)) fs.unlinkSync(full);
        }
      }
      await PhotoPreview.destroy({ where: { photo_id: photo.id } });
      await RecapPhoto.destroy({ where: { photo_id: photo.id } });
      await Photo.destroy({ where: { id: photo.id } });
      if (event) await Event.destroy({ where: { id: event.id } });
    }

    for (const file of fixtureFiles) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  } finally {
    await sequelize.close();
  }
});

describe('photoPreviewService integration', () => {
  it('generates a contact sheet from the recap variants and writes the file', async (context) => {
    if (!dbAvailable) return context.skip();

    await regeneratePhotoPreview(photo!.id);
    const row = await getPhotoPreview(photo!.id);

    expect(row).not.toBeNull();
    expect(row!.variant_count).toBe(3);
    expect(row!.content_hash).toBeTruthy();
    expect(row!.failed_at).toBeNull();
    expect(row!.file_path).toBeTruthy();
    expect(fs.existsSync(path.join(previewsDir, row!.file_path!))).toBe(true);
  });

  it('reduces the variant count after a recap is deleted', async (context) => {
    if (!dbAvailable) return context.skip();

    const recap = await RecapPhoto.findOne({ where: { photo_id: photo!.id, variant_number: 3 } });
    await recap!.destroy();

    await regeneratePhotoPreview(photo!.id);
    const row = await getPhotoPreview(photo!.id);

    expect(row).not.toBeNull();
    expect(row!.variant_count).toBe(2);
    expect(row!.failed_at).toBeNull();
  });

  it('removes the preview when all recap variants are gone', async (context) => {
    if (!dbAvailable) return context.skip();

    await RecapPhoto.destroy({ where: { photo_id: photo!.id } });

    await regeneratePhotoPreview(photo!.id);
    const row = await getPhotoPreview(photo!.id);

    expect(row).toBeNull();
    const leftovers = fs.existsSync(previewsDir)
      ? fs.readdirSync(previewsDir).filter((f) => f.startsWith(`photo-${photo!.id}-`))
      : [];
    expect(leftovers).toHaveLength(0);
  });
});
