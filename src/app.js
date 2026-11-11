// CareerBridge API — Express аппын тохиргоо
// Сервер асаахаас тусад нь байлгаснаар Supertest-ээр порт нээлгүйгээр турших боломжтой.
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');
const { validateRegistration } = require('./registration');
const { createMetrics } = require('./metrics');
const { createTokenService } = require('./tokens');
const { createApiRouter } = require('./api');
const { HttpError, mapDbError } = require('./http');
const { version } = require('../package.json');

// db: createDb()-ийн буцаасан объект эсвэл null (DB тохируулаагүй)
// staticDir: frontend-ийн build (web/dist). Өгвөл SPA-г ижил домэйноос түгээнэ.
function createApp({ db = null, jwtSecret, bcryptCost = Number(process.env.BCRYPT_COST) || 12, staticDir = null } = {}) {
  const app = express();
  app.disable('x-powered-by');

  // Лаб 13: хүсэлт бүрийг хэмжиж, /metrics-ээр Prometheus-т өгнө
  const metrics = createMetrics();
  app.use(metrics.middleware);
  app.get('/metrics', metrics.handler);

  app.use(express.json({ limit: '100kb' }));

  // Docker HEALTHCHECK, CI-ийн smoke test, Render-ийн health check ашиглана
  app.get('/health', (req, res) => {
    // instance: контейнерийн hostname = Kubernetes дээр Pod-ийн нэр (Лаб 09: аль Pod хариулсныг харах)
    res.json({ status: 'ok', service: 'careerbridge-api', version, instance: os.hostname(), uptime: Math.round(process.uptime()) });
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
      // Алдааг логт үлдээнэ (оношлоход хэрэгтэй), хэрэглэгчид дотоод мэдээллийг харуулахгүй
      console.error('/health/db:', err.message);
      return res.status(503).json({ status: 'error', error: 'Өгөгдлийн сантай холбогдож чадсангүй' });
    }
  });

  // US-01: бүртгэлийн өгөгдлийг шалгах (DB холбогдохоос өмнөх түр endpoint)
  app.post('/api/v1/registrations/validate', (req, res) => {
    const result = validateRegistration(req.body);
    res.status(result.valid ? 200 : 400).json(result);
  });

  // US-01 … US-15: REST API
  app.use('/api/v1', createApiRouter({ db, tokens: createTokenService(jwtSecret), bcryptCost }));

  // React SPA: файл байвал түгээнэ, бусад GET замд index.html (client-side routing)
  // staticDir нь серверийн тохиргоо (env), хэрэглэгчийн оролт биш
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (staticDir && fs.existsSync(path.join(staticDir, 'index.html'))) {
    app.use(express.static(staticDir, { index: false, maxAge: '1h' }));
    app.get(/^\/(?!api\/|health|metrics).*/, (req, res) => res.sendFile(path.join(staticDir, 'index.html')));
  }

  app.use((req, res) => {
    res.status(404).json({ error: 'Хуудас олдсонгүй' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'JSON формат буруу байна' });
    }
    const known = err instanceof HttpError ? err : mapDbError(err);
    if (known) {
      return res.status(known.status).json({ error: known.message, ...known.extra });
    }
    console.error(err);
    return res.status(500).json({ error: 'Серверийн алдаа' });
  });

  return app;
}

module.exports = { createApp };
