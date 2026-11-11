// Лаборатори 13 — /metrics endpoint (Prometheus)
const request = require('supertest');
const { createApp } = require('../src/app');

// Prometheus text формат: `name{label="…",…} value` мөрөөс тоон утгыг авна
function metricValue(text, name, labels) {
  const line = text.split('\n').find((l) =>
    l.startsWith(`${name}{`) && Object.entries(labels).every(([k, v]) => l.includes(`${k}="${v}"`)));
  return line ? Number(line.split(' ').pop()) : undefined;
}

describe('GET /metrics', () => {
  test('Prometheus text форматаар суурь metrics буцаана', async () => {
    // Arrange
    const app = createApp();
    // Act
    const res = await request(app).get('/metrics');
    // Assert
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('# TYPE http_requests_total counter');
    expect(res.text).toContain('# TYPE http_request_duration_seconds histogram');
    expect(res.text).toContain('process_cpu_user_seconds_total');
  });

  test('хүсэлт бүрийг method, route, status-аар тоолно', async () => {
    // Arrange
    const app = createApp();
    // Act
    await request(app).get('/health');
    await request(app).get('/health');
    await request(app).post('/api/v1/registrations/validate').send({ fullName: '', email: 'x', password: '1' });
    const res = await request(app).get('/metrics');
    // Assert
    expect(metricValue(res.text, 'http_requests_total', { method: 'GET', route: '/health', status: '200' })).toBe(2);
    expect(metricValue(res.text, 'http_requests_total',
      { method: 'POST', route: '/api/v1/registrations/validate', status: '400' })).toBe(1);
  });

  test('хариу өгөх хугацааг histogram-д бүртгэнэ', async () => {
    // Arrange
    const app = createApp();
    // Act
    await request(app).get('/health');
    const res = await request(app).get('/metrics');
    // Assert
    expect(metricValue(res.text, 'http_request_duration_seconds_count', { route: '/health' })).toBe(1);
    expect(res.text).toMatch(/http_request_duration_seconds_bucket\{le="0\.005"/);
  });

  test('бүртгэлгүй замуудыг нэг "unmatched" label-д нэгтгэнэ (high cardinality-гүй)', async () => {
    // Arrange
    const app = createApp();
    // Act
    await request(app).get('/random-1');
    await request(app).get('/random-2');
    const res = await request(app).get('/metrics');
    // Assert
    expect(metricValue(res.text, 'http_requests_total', { route: 'unmatched', status: '404' })).toBe(2);
    expect(res.text).not.toContain('random-1');
  });

  test('/metrics хүсэлт өөрөө тоологдохгүй', async () => {
    // Arrange
    const app = createApp();
    // Act
    await request(app).get('/metrics');
    const res = await request(app).get('/metrics');
    // Assert
    expect(res.text).not.toContain('route="/metrics"');
  });
});
