const request = require('supertest');
const { createApp } = require('../src/app');
const { createDb } = require('../src/db');

describe('GET /health/db', () => {
  test('DB тохируулаагүй бол 503', async () => {
    const res = await request(createApp()).get('/health/db');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unavailable');
  });

  test('DB хариу өгвөл 200 ба хүснэгтийн тоо', async () => {
    const fakeDb = { check: async () => ({ version: '16.0', tables: 18, views: 2 }) };
    const res = await request(createApp({ db: fakeDb })).get('/health/db');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', tables: 18, views: 2 });
  });

  test('DB холбогдохгүй бол 503', async () => {
    const brokenDb = { check: async () => { throw new Error('ECONNREFUSED'); } };
    const res = await request(createApp({ db: brokenDb })).get('/health/db');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
  });

  test('DATABASE_URL байхгүй бол createDb() null буцаана', () => {
    expect(createDb('')).toBeNull();
  });
});

// Бодит PostgreSQL дээрх integration тест: DATABASE_URL өгсөн үед л ажиллана
const itDb = process.env.DATABASE_URL ? describe : describe.skip;
itDb('PostgreSQL integration (DATABASE_URL)', () => {
  const db = createDb();
  afterAll(() => db.close());

  test('схем 18 хүснэгт, 2 view-тэй', async () => {
    const info = await db.check();
    expect(info.tables).toBe(18);
    expect(info.views).toBe(2);
  });
});
