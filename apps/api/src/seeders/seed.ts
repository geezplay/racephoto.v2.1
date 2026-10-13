import 'dotenv/config';
import { connectDB, sequelize } from '../config/db';
import { Event, EventClass, Photo, RecapPhoto, User } from '../models';

const DEMO_EVENTS = [
  {
    name: 'Road Race Championship Sentul 2026',
    date: '15 Maret 2026',
    start_time: new Date('2026-03-15T08:00:00Z'),
    location: 'Sentul International Circuit, Bogor',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=800',
    category: 'road_race' as const,
    classes: ['Sport 150cc', 'Bebek 4T 116cc'],
    photos: [
      { class: 'Sport 150cc', start_no: '07', price: 35000, url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=600' },
      { class: 'Sport 150cc', start_no: '14', price: 35000, url: 'https://images.unsplash.com/photo-1591637246582-8c794c1d7ba6?auto=format&fit=crop&q=80&w=600' },
      { class: 'Sport 150cc', start_no: '21', price: 35000, url: 'https://images.unsplash.com/photo-1558981033-7c6e8be63f7c?auto=format&fit=crop&q=80&w=600' },
      { class: 'Bebek 4T 116cc', start_no: '03', price: 25000, url: 'https://images.unsplash.com/photo-1558981852-426c6c22a060?auto=format&fit=crop&q=80&w=600' },
      { class: 'Bebek 4T 116cc', start_no: '09', price: 25000, url: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&q=80&w=600' },
    ],
  },
  {
    name: 'Drag Race Series Semarang 2026',
    date: '22 Maret 2026',
    start_time: new Date('2026-03-22T09:00:00Z'),
    location: 'Bandara Ahmad Yani, Semarang',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800',
    category: 'drag' as const,
    classes: ['FFA 200m', 'Pro Stock 201m'],
    photos: [
      { class: 'FFA 200m', start_no: '88', price: 50000, url: 'https://images.unsplash.com/photo-1571607388263-1044f9ea01dd?auto=format&fit=crop&q=80&w=600' },
      { class: 'FFA 200m', start_no: '55', price: 50000, url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=600' },
      { class: 'Pro Stock 201m', start_no: '12', price: 45000, url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600' },
      { class: 'Pro Stock 201m', start_no: '33', price: 45000, url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&q=80&w=600' },
    ],
  },
];

async function seedSuperAdmin(): Promise<void> {
  const existing = await User.findOne({ where: { role: 'super_admin' } });
  if (existing) {
    console.log('Super admin already exists:', existing.email);
    return;
  }
  const admin = await User.create({
    name: 'Super Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@racephoto.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'password123',
    role: 'super_admin',
    balance: 0,
  });
  console.log('Super admin created:', admin.email);
}

async function seedDemoData(): Promise<void> {
  const existing = await Event.count();
  if (existing > 0) {
    console.log(`Database already has ${existing} events. Skipping demo seed.`);
    return;
  }

  for (const eventData of DEMO_EVENTS) {
    const event = await Event.create({
      name: eventData.name,
      date: eventData.date,
      start_time: eventData.start_time,
      location: eventData.location,
      image: eventData.image,
      category: eventData.category,
      is_published: true,
      status: 'approved',
    });

    for (const name of eventData.classes) {
      await EventClass.create({ event_id: event.id, name });
    }

    for (const p of eventData.photos) {
      const photo = await Photo.create({
        event_id: event.id,
        class: p.class,
        start_no: p.start_no,
        price: p.price,
        url: p.url,
      });
      await RecapPhoto.create({ photo_id: photo.id, variant_number: 1, file_path: p.url });
    }
    console.log(`Seeded event: ${event.name}`);
  }
}

async function main(): Promise<void> {
  try {
    await connectDB();
    await seedSuperAdmin();
    if (process.env.SEED_DEMO !== 'false') {
      await seedDemoData();
    }
    console.log('Seeding complete.');
  } catch (error) {
    console.error('Seed error:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

void main();
