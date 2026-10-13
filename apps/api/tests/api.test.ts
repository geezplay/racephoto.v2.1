import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { sequelize } from '../src/config/db';
import { User } from '../src/models';

const email = `buyer_${Date.now()}@test.local`;

afterAll(async () => {
  await User.destroy({ where: { email } });
  await sequelize.close();
});

describe('RacePhoto API smoke tests', () => {
  it('returns health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('lists public events', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it('registers a buyer and ignores a role supplied in the body', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Buyer', email, password: 'secret123', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('buyer');
  });

  it('logs the registered buyer in', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects unauthenticated access to the order list', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('rejects unauthenticated access to the admin dashboard', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });
});
