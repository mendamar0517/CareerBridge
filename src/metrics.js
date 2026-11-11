// Prometheus metrics (Лаб 13)
// - http_requests_total{method,route,status}: хүсэлтийн тоо (counter)
// - http_request_duration_seconds{method,route,status}: хариу өгөх хугацаа (histogram)
// - Node.js процессын суурь metrics (CPU, санах ой, event loop lag …)
const client = require('prom-client');

// Апп бүр өөрийн registry-тэй: тестэд олон апп үүсгэхэд metric давхар бүртгэгдэхгүй
function createMetrics() {
  const registry = new client.Registry();
  registry.setDefaultLabels({ service: 'careerbridge-api' });
  client.collectDefaultMetrics({ register: registry });

  const requests = new client.Counter({
    name: 'http_requests_total',
    help: 'HTTP хүсэлтийн тоо',
    labelNames: ['method', 'route', 'status'],
    registers: [registry],
  });

  const duration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP хүсэлтэд хариу өгөх хугацаа (секунд)',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    registers: [registry],
  });

  // route label-д бодит URL биш, Express-ийн route загварыг (жишээ нь /api/v1/…) ашиглана.
  // Ингэснээр /unknown-123 гэх мэт хязгааргүй олон утга (high cardinality) үүсэхгүй.
  function middleware(req, res, next) {
    if (req.path === '/metrics') return next();
    const end = duration.startTimer();
    res.on('finish', () => {
      const route = req.route ? `${req.baseUrl}${req.route.path}` : 'unmatched';
      const labels = { method: req.method, route, status: String(res.statusCode) };
      requests.inc(labels);
      end(labels);
    });
    return next();
  }

  async function handler(req, res) {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  }

  return { registry, middleware, handler };
}

module.exports = { createMetrics };
