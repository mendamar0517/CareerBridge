// CareerBridge API — Express аппын тохиргоо
// Сервер асаахаас тусад нь байлгаснаар Supertest-ээр порт нээлгүйгээр турших боломжтой.
const express = require('express');
const { validateRegistration } = require('./registration');
const { version } = require('../package.json');

function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  // Docker HEALTHCHECK, CI-ийн smoke test, Render-ийн health check ашиглана
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'careerbridge-api', version, uptime: Math.round(process.uptime()) });
  });

  // US-01: бүртгэлийн өгөгдлийг шалгах (DB холбогдохоос өмнөх түр endpoint)
  app.post('/api/v1/registrations/validate', (req, res) => {
    const result = validateRegistration(req.body);
    res.status(result.valid ? 200 : 400).json(result);
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Хуудас олдсонгүй' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON формат буруу байна' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Серверийн алдаа' });
  });

  return app;
}

module.exports = { createApp };
