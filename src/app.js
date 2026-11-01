// CareerBridge API — Express аппын тохиргоо
// Сервер асаахаас тусад нь байлгаснаар Supertest-ээр порт нээлгүйгээр турших боломжтой.
const express = require('express');
const { validateRegistration } = require('./registration');
const { version } = require('../package.json');

// db: createDb()-ийн буцаасан объект эсвэл null (DB тохируулаагүй)
function createApp({ db = null } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  // Docker HEALTHCHECK, CI-ийн smoke test, Render-ийн health check ашиглана
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'careerbridge-api', version, uptime: Math.round(process.uptime()) });
  });

  // Өгөгдлийн сантай холбогдож байгаа эсэх (Docker Compose: api → db)
  app.get('/health/db', async (req, res) => {
    if (!db) {
      return res.status(503).json({ status: 'unavailable', error: 'DATABASE_URL тохируулаагүй' });
    }
    try {
      const info = await db.check();
      return res.json({ status: 'ok', database: 'postgresql', ...info });
    } catch (err) {
      return res.status(503).json({ status: 'error', error: 'Өгөгдлийн сантай холбогдож чадсангүй' });
    }
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
