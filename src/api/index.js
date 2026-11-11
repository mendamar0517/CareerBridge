// /api/v1 — бүх REST endpoint-ийг нэгтгэнэ
const express = require('express');
const { HttpError } = require('../http');
const { requireAuth, requireRole } = require('../tokens');
const { authRouter } = require('./auth.routes');
const { seekerRouter, cvRouter } = require('./seeker.routes');
const { jobsRouter } = require('./jobs.routes');
const { applicationsRouter } = require('./applications.routes');
const { employerRouter } = require('./employer.routes');
const { likePattern } = require('../http');

function createApiRouter({ db, tokens, bcryptCost }) {
  const r = express.Router();

  // DB тохируулаагүй орчинд (CI smoke test, k8s демо) API-ийн өгөгдлийн хэсэг ажиллахгүй
  r.use((req, _res, next) => (db?.query ? next() : next(new HttpError(503, 'Өгөгдлийн сан тохируулаагүй байна'))));
  r.use(tokens.authenticate);

  r.use('/auth', authRouter({ db, tokens, bcryptCost }));
  r.use('/me/applications', requireRole('SEEKER'), applicationsRouter({ db }));
  r.use('/me', requireRole('SEEKER'), seekerRouter({ db }));
  r.use('/cvs', requireAuth, cvRouter({ db }));
  r.use('/jobs', jobsRouter({ db }));
  r.use('/employer', requireRole('EMPLOYER'), employerRouter({ db }));

  // Лавлах: ур чадварын автомат бөглөлт, мэргэжлүүд, нүүр хуудасны статистик
  r.get('/skills', async (req, res) => {
    const term = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 50) : '';
    const { rows } = await db.query(
      `SELECT s.id, s.name, (SELECT count(*)::int FROM job_skills js WHERE js.skill_id = s.id) AS "jobCount"
         FROM skills s WHERE ($1 = '' OR s.name ILIKE $2) ORDER BY "jobCount" DESC, s.name LIMIT 20`, [term, likePattern(term)]);
    res.json(rows);
  });
  r.get('/professions', async (_req, res) => {
    const { rows } = await db.query(
      "SELECT profession, count(*)::int AS n FROM jobs WHERE status = 'PUBLISHED' GROUP BY profession ORDER BY n DESC, profession LIMIT 30");
    res.json(rows);
  });
  r.get('/stats', async (_req, res) => {
    const { rows } = await db.query(`
      SELECT (SELECT count(*)::int FROM jobs WHERE status = 'PUBLISHED') AS jobs,
             (SELECT count(*)::int FROM companies) AS companies,
             (SELECT count(*)::int FROM seeker_profiles) AS seekers,
             (SELECT count(*)::int FROM applications WHERE applied_at > now() - interval '30 days') AS "applications30d"`);
    res.json(rows[0]);
  });

  return r;
}

module.exports = { createApiRouter };
