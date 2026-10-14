import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { sequelize } from '../src/config/db';
import { Event, Photo, DiscountCode, Order } from '../src/models';

const suffix = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const email = `discount_${suffix}@test.local`;

let dbAvailable = false;
let event: Event | null = null;
let otherEvent: Event | null = null;
let photo: Photo | null = null;
let photoOther: Photo | null = null;

const createdDiscountIds: number[] = [];
const createdOrderIds: number[] = [];
let codeSeq = 0;

async function makeDiscount(overrides: Record<string, unknown>) {
  codeSeq += 1;
  const d = await DiscountCode.create({
    code: `T${suffix}_${codeSeq}`.toUpperCase().slice(0, 40),
    discount_type: 'percent',
    discount_value: 50,
    is_active: true,
    ...overrides,
  } as any);
  createdDiscountIds.push(d.id);
  return d;
}

beforeAll(async () => {
  try {
    await sequelize.authenticate();
    dbAvailable = true;
  } catch (error) {
    console.warn('Database unavailable, skipping discount integration tests:', (error as Error).message);
    return;
  }

  event = await Event.create({ name: `Discount Event ${suffix}`, location: 'Circuit A' });
  otherEvent = await Event.create({ name: `Discount Event B ${suffix}`, location: 'Circuit B' });
  photo = await Photo.create({
    event_id: event.id,
    class: 'A',
    start_no: '1',
    price: 20000,
    url: `/uploads/photos/discount_${suffix}.jpg`,
  });
  photoOther = await Photo.create({
    event_id: otherEvent.id,
    class: 'A',
    start_no: '2',
    price: 20000,
    url: `/uploads/photos/discount_${suffix}_b.jpg`,
  });
});

afterAll(async () => {
  try {
    if (dbAvailable) {
      if (createdOrderIds.length) await Order.destroy({ where: { id: createdOrderIds } });
      await Order.destroy({ where: { email } });
      if (createdDiscountIds.length) await DiscountCode.destroy({ where: { id: createdDiscountIds } });
      if (photo) await Photo.destroy({ where: { id: photo.id } });
      if (photoOther) await Photo.destroy({ where: { id: photoOther.id } });
      if (event) await Event.destroy({ where: { id: event.id } });
      if (otherEvent) await Event.destroy({ where: { id: otherEvent.id } });
    }
  } finally {
    await sequelize.close();
  }
});

describe('discount validate endpoint', () => {
  it('applies a global percentage discount even when items omit eventId', async (context) => {
    if (!dbAvailable) return context.skip();
    const d = await makeDiscount({ discount_value: 50 });

    const res = await request(app)
      .post('/api/discounts/validate')
      .send({ code: d.code, subtotal: 40000, items: [{ photoId: 1, price: 20000 }, { photoId: 2, price: 20000 }] });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.discount_amount).toBe(20000);
  });

  it('rejects an unknown code', async (context) => {
    if (!dbAvailable) return context.skip();
    const res = await request(app)
      .post('/api/discounts/validate')
      .send({ code: `NOPE${suffix}`, subtotal: 10000, items: [{ photoId: 1, price: 10000 }] });
    expect(res.status).toBe(404);
  });

  it('rejects an inactive code', async (context) => {
    if (!dbAvailable) return context.skip();
    const d = await makeDiscount({ is_active: false });
    const res = await request(app)
      .post('/api/discounts/validate')
      .send({ code: d.code, subtotal: 10000, items: [{ photoId: 1, price: 10000 }] });
    expect(res.status).toBe(400);
  });

  it('rejects an expired code', async (context) => {
    if (!dbAvailable) return context.skip();
    const d = await makeDiscount({ valid_until: new Date('2000-01-01') });
    const res = await request(app)
      .post('/api/discounts/validate')
      .send({ code: d.code, subtotal: 10000, items: [{ photoId: 1, price: 10000 }] });
    expect(res.status).toBe(400);
  });

  it('rejects a code that reached its usage limit', async (context) => {
    if (!dbAvailable) return context.skip();
    const d = await makeDiscount({ usage_limit: 1, used_count: 1 });
    const res = await request(app)
      .post('/api/discounts/validate')
      .send({ code: d.code, subtotal: 10000, items: [{ photoId: 1, price: 10000 }] });
    expect(res.status).toBe(400);
  });

  it('rejects when no cart item belongs to the allowed events', async (context) => {
    if (!dbAvailable) return context.skip();
    const d = await makeDiscount({ event_ids: [event!.id] });
    const res = await request(app)
      .post('/api/discounts/validate')
      .send({ code: d.code, subtotal: 20000, items: [{ photoId: 99, price: 20000, eventId: otherEvent!.id }] });
    expect(res.status).toBe(400);
  });

  it('caps the discount at max_photos', async (context) => {
    if (!dbAvailable) return context.skip();
    const d = await makeDiscount({ discount_value: 100, max_photos: 1 });
    const res = await request(app)
      .post('/api/discounts/validate')
      .send({
        code: d.code,
        subtotal: 40000,
        items: [
          { photoId: 1, price: 20000 },
          { photoId: 2, price: 20000 },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.discount_amount).toBe(20000);
    expect(res.body.eligible_photo_count).toBe(1);
  });
});

describe('order creation applies discount', () => {
  it('persists discount code/amount and increments used_count', async (context) => {
    if (!dbAvailable) return context.skip();
    const d = await makeDiscount({ discount_value: 50 });

    const res = await request(app)
      .post('/api/orders')
      .send({
        email,
        whatsapp: '081234567890',
        items: [{ photoId: photo!.id, variant: 1 }],
        discountCode: d.code,
      });

    expect(res.status).toBe(201);
    expect(res.body.discountCode).toBe(d.code);
    expect(res.body.discountAmount).toBe(10000);
    expect(res.body.totalPrice).toBe(10000);
    if (res.body.order_id) createdOrderIds.push(res.body.order_id);

    const refreshed = await DiscountCode.findByPk(d.id);
    expect(refreshed!.used_count).toBe(1);

    const order = await Order.findByPk(res.body.order_id);
    expect(order!.discount_code).toBe(d.code);
    expect(Number(order!.discount_amount)).toBe(10000);
  });
});
