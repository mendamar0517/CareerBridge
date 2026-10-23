const request = require('supertest');
const { createApp } = require('../src/app');

const app = createApp();

describe('API – суурь endpoint-ууд', () => {
  test('GET /health нь 200 болон status=ok буцаана', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/v1/registrations/validate — зөв өгөгдөл 200', async () => {
    const res = await request(app)
      .post('/api/v1/registrations/validate')
      .send({ fullName: 'Бат', email: 'bat@example.com', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  test('POST /api/v1/registrations/validate — буруу өгөгдөл 400 ба алдааны жагсаалт', async () => {
    const res = await request(app)
      .post('/api/v1/registrations/validate')
      .send({ fullName: '', email: 'bat.example.com', password: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveLength(3);
  });

  test('буруу JSON нь 400 буцаана', async () => {
    const res = await request(app)
      .post('/api/v1/registrations/validate')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(res.status).toBe(400);
  });

  test('байхгүй зам 404 буцаана', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });
});
