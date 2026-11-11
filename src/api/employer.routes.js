// Ажил олгогч: US-11 байгууллага, US-12 ажлын байр, US-13 шаардлага, US-14 шалгалт үүсгэх, US-15 горилогчид
const express = require('express');
const { computeMatch } = require('../matching');
const { canEmployerSet } = require('../applicationStatus');
const { parse, idParam, notFound, badRequest, conflict } = require('../http');
const { z, optDate, optText, reqText, level, upsertSkill, seekerSkills, seekerEducations, seekerExperiences, eligibilityOf } = require('./shared');
const { EMPLOYMENT_TYPES } = require('./jobs.routes');
const { loadQuestions } = require('./applications.routes');

const companySchema = z.object({
  name: reqText(200, 'Байгууллагын нэр'),
  registerNo: z.string().trim().regex(/^\d{7}$/, 'Регистрийн дугаар 7 оронтой тоо байна').nullish().or(z.literal('')).transform((v) => v || null),
  industry: optText(120),
  description: optText(3000),
  address: optText(300),
  website: z.string().trim().url('Вэб хаяг буруу байна').max(255).nullish().or(z.literal('')).transform((v) => v || null),
});

const jobSkillSchema = z.object({ name: reqText(100, 'Ур чадварын нэр'), isRequired: z.boolean().default(true), minLevel: level });
const skillsSchema = z.array(jobSkillSchema).max(30, 'Хамгийн ихдээ 30 ур чадвар');

const money = z.coerce.number().int().min(0).max(1_000_000_000).nullish().transform((v) => v ?? null);
const jobSchema = z.object({
  title: reqText(200, 'Ажлын байрны нэр'),
  description: reqText(10000, 'Тодорхойлолт'),
  profession: reqText(120, 'Мэргэжил'),
  location: optText(150),
  employmentType: z.enum(EMPLOYMENT_TYPES).default('FULL_TIME'),
  salaryMin: money,
  salaryMax: money,
  deadline: optDate,
  skills: skillsSchema.optional(),
}).refine((j) => j.salaryMin === null || j.salaryMax === null || j.salaryMax >= j.salaryMin, { message: 'Дээд цалин доод цалингаас бага байж болохгүй', path: ['salaryMax'] });

const questionSchema = z.object({
  body: reqText(2000, 'Асуулт'),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT']),
  points: z.coerce.number().positive().max(100).default(1),
  options: z.array(z.object({ body: reqText(500, 'Хариултын хувилбар'), isCorrect: z.boolean().default(false) })).max(10).default([]),
}).superRefine((qu, ctx) => {
  if (qu.type === 'TEXT') return;
  const correct = qu.options.filter((o) => o.isCorrect).length;
  if (qu.options.length < 2) ctx.addIssue({ code: 'custom', message: 'Сонголттой асуулт дор хаяж 2 хувилбартай байна', path: ['options'] });
  else if (correct === 0) ctx.addIssue({ code: 'custom', message: 'Зөв хариултыг тэмдэглэнэ үү', path: ['options'] });
  else if (qu.type === 'SINGLE_CHOICE' && correct > 1) ctx.addIssue({ code: 'custom', message: 'Нэг сонголттой асуулт ганц зөв хариулттай байна', path: ['options'] });
});
const assessmentSchema = z.object({
  title: reqText(200, 'Шалгалтын нэр'),
  timeLimitMinutes: z.coerce.number().int().min(1).max(300).nullish().transform((v) => v ?? null),
  passScore: z.coerce.number().min(0).max(100).nullish().transform((v) => v ?? null),
  questions: z.array(questionSchema).min(1, 'Дор хаяж 1 асуулт нэмнэ үү').max(100),
});

const statusSchema = z.object({ status: z.enum(['REVIEWING', 'ASSESSMENT', 'INTERVIEW', 'ACCEPTED', 'REJECTED']) });

function employerRouter({ db }) {
  const r = express.Router();
  const q = (text, params) => db.query(text, params); // db нь DB-гүй горимд null байж болно

  // Нэвтэрсэн хэрэглэгчийн байгууллага
  r.use(async (req, _res, next) => {
    const { rows } = await q('SELECT id FROM companies WHERE owner_user_id = $1', [req.user.id]);
    if (!rows[0]) return next(notFound('Байгууллагын бүртгэл олдсонгүй'));
    req.companyId = rows[0].id;
    return next();
  });

  async function ownJob(req) {
    const { rows } = await q('SELECT id, status FROM jobs WHERE id = $1 AND company_id = $2', [idParam(req.params.id), req.companyId]);
    if (!rows[0]) throw notFound('Ажлын байр олдсонгүй');
    return rows[0];
  }

  // ---------- US-11 ----------
  r.get('/company', async (req, res) => {
    const { rows } = await q(
      `SELECT id, name, register_no AS "registerNo", industry, description, address, website, created_at AS "createdAt"
         FROM companies WHERE id = $1`, [req.companyId]);
    res.json(rows[0]);
  });
  r.put('/company', async (req, res) => {
    const b = parse(companySchema, req.body);
    try {
      await q('UPDATE companies SET name = $2, register_no = $3, industry = $4, description = $5, address = $6, website = $7 WHERE id = $1',
        [req.companyId, b.name, b.registerNo, b.industry, b.description, b.address, b.website]);
    } catch (err) {
      if (err.code === '23505') throw conflict('Энэ регистрийн дугаартай байгууллага бүртгэлтэй байна');
      throw err;
    }
    res.json({ ok: true, message: 'Байгууллагын мэдээлэл хадгалагдлаа' });
  });

  // ---------- US-12 / US-13 ----------
  async function replaceSkills(t, jobId, skills) {
    await t('DELETE FROM job_skills WHERE job_id = $1', [jobId]);
    const seen = new Set();
    for (const s of skills) {
      const skill = await upsertSkill(t, s.name);
      if (seen.has(skill.id)) continue;
      seen.add(skill.id);
      await t('INSERT INTO job_skills (job_id, skill_id, is_required, min_level) VALUES ($1, $2, $3, $4)', [jobId, skill.id, s.isRequired, s.minLevel]);
    }
  }

  r.get('/jobs', async (req, res) => {
    const { rows } = await q(
      `SELECT j.id, j.title, j.profession, j.status, j.employment_type AS "employmentType", j.location,
              j.published_at AS "publishedAt", j.deadline, j.created_at AS "createdAt",
              (SELECT count(*)::int FROM applications a WHERE a.job_id = j.id) AS "applicantCount",
              (SELECT count(*)::int FROM applications a WHERE a.job_id = j.id AND a.status = 'SUBMITTED') AS "newCount",
              (SELECT count(*)::int FROM job_skills js WHERE js.job_id = j.id) AS "skillCount",
              EXISTS (SELECT 1 FROM assessments s WHERE s.job_id = j.id) AS "hasAssessment"
         FROM jobs j WHERE j.company_id = $1 ORDER BY j.created_at DESC`, [req.companyId]);
    res.json(rows);
  });

  r.post('/jobs', async (req, res) => {
    const b = parse(jobSchema, req.body);
    const id = await db.tx(async (t) => {
      const { rows } = await t(
        `INSERT INTO jobs (company_id, title, description, profession, location, employment_type, salary_min, salary_max, deadline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [req.companyId, b.title, b.description, b.profession, b.location, b.employmentType, b.salaryMin, b.salaryMax, b.deadline]);
      if (b.skills) await replaceSkills(t, rows[0].id, b.skills);
      return rows[0].id;
    });
    res.status(201).json({ id, status: 'DRAFT', message: 'Ажлын байр ноорог хэлбэрээр хадгалагдлаа' });
  });

  r.get('/jobs/:id', async (req, res) => {
    const job = await ownJob(req);
    const { rows: [full] } = await q(
      `SELECT id, title, description, profession, location, employment_type AS "employmentType", salary_min AS "salaryMin",
              salary_max AS "salaryMax", status, published_at AS "publishedAt", deadline FROM jobs WHERE id = $1`, [job.id]);
    const skills = await q(
      `SELECT s.id, s.name, js.is_required AS "isRequired", js.min_level AS "minLevel"
         FROM job_skills js JOIN skills s ON s.id = js.skill_id WHERE js.job_id = $1 ORDER BY js.is_required DESC, s.name`, [job.id]);
    res.json({ ...full, skills: skills.rows });
  });

  r.put('/jobs/:id', async (req, res) => {
    const job = await ownJob(req);
    if (job.status === 'CLOSED') throw badRequest('Хаагдсан ажлын байрыг засах боломжгүй');
    const b = parse(jobSchema, req.body);
    await db.tx(async (t) => {
      await t(`UPDATE jobs SET title = $2, description = $3, profession = $4, location = $5, employment_type = $6,
                      salary_min = $7, salary_max = $8, deadline = $9 WHERE id = $1`,
      [job.id, b.title, b.description, b.profession, b.location, b.employmentType, b.salaryMin, b.salaryMax, b.deadline]);
      if (b.skills) await replaceSkills(t, job.id, b.skills);
    });
    res.json({ ok: true, message: 'Хадгалагдлаа' });
  });

  r.put('/jobs/:id/skills', async (req, res) => {
    const job = await ownJob(req);
    const skills = parse(skillsSchema, req.body?.skills);
    await db.tx((t) => replaceSkills(t, job.id, skills));
    res.json({ ok: true });
  });

  r.post('/jobs/:id/publish', async (req, res) => {
    const job = await ownJob(req);
    if (job.status === 'PUBLISHED') throw badRequest('Ажлын байр аль хэдийн нийтлэгдсэн байна');
    const { rows } = await q('SELECT count(*)::int AS n FROM job_skills WHERE job_id = $1', [job.id]);
    if (rows[0].n === 0) throw badRequest('Нийтлэхийн өмнө шаардлагатай ур чадвараа тодорхойлно уу');
    await q("UPDATE jobs SET status = 'PUBLISHED', published_at = now() WHERE id = $1", [job.id]);
    res.json({ ok: true, status: 'PUBLISHED', message: 'Ажлын байр нийтлэгдлээ' });
  });

  r.post('/jobs/:id/close', async (req, res) => {
    const job = await ownJob(req);
    if (job.status !== 'PUBLISHED') throw badRequest('Зөвхөн нийтлэгдсэн ажлын байрыг хаана');
    await q("UPDATE jobs SET status = 'CLOSED' WHERE id = $1", [job.id]);
    res.json({ ok: true, status: 'CLOSED' });
  });

  r.delete('/jobs/:id', async (req, res) => {
    const job = await ownJob(req);
    if (job.status !== 'DRAFT') throw badRequest('Зөвхөн ноорог ажлын байрыг устгана. Нийтлэгдсэнийг хаана уу');
    await q('DELETE FROM jobs WHERE id = $1', [job.id]);
    res.status(204).end();
  });

  // ---------- US-14: шалгалт үүсгэх ----------
  async function jobAssessment(jobId) {
    const { rows } = await q(
      `SELECT id, title, time_limit_minutes AS "timeLimitMinutes", pass_score AS "passScore",
              (SELECT count(*)::int FROM assessment_attempts t WHERE t.assessment_id = a.id) AS "attemptCount"
         FROM assessments a WHERE job_id = $1 ORDER BY id LIMIT 1`, [jobId]);
    return rows[0] ?? null;
  }

  r.get('/jobs/:id/assessment', async (req, res) => {
    const job = await ownJob(req);
    const a = await jobAssessment(job.id);
    if (!a) return res.json(null);
    return res.json({ ...a, questions: await loadQuestions(q, a.id, true) });
  });

  r.put('/jobs/:id/assessment', async (req, res) => {
    const job = await ownJob(req);
    const b = parse(assessmentSchema, req.body);
    const existing = await jobAssessment(job.id);
    if (existing?.attemptCount > 0) throw conflict('Шалгалтыг өгсөн горилогч байгаа тул асуултыг өөрчлөх боломжгүй');
    const id = await db.tx(async (t) => {
      if (existing) await t('DELETE FROM assessments WHERE id = $1', [existing.id]);
      const { rows } = await t('INSERT INTO assessments (job_id, title, time_limit_minutes, pass_score) VALUES ($1, $2, $3, $4) RETURNING id',
        [job.id, b.title, b.timeLimitMinutes, b.passScore]);
      let order = 1;
      for (const qu of b.questions) {
        const { rows: [created] } = await t('INSERT INTO questions (assessment_id, body, type, points, order_no) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [rows[0].id, qu.body, qu.type, qu.points, order++]);
        if (qu.type === 'TEXT') continue;
        for (const o of qu.options) {
          await t('INSERT INTO question_options (question_id, body, is_correct) VALUES ($1, $2, $3)', [created.id, o.body, o.isCorrect]);
        }
      }
      return rows[0].id;
    });
    res.json({ id, message: 'Шалгалт хадгалагдлаа' });
  });

  r.delete('/jobs/:id/assessment', async (req, res) => {
    const job = await ownJob(req);
    const existing = await jobAssessment(job.id);
    if (!existing) throw notFound('Шалгалт байхгүй');
    if (existing.attemptCount > 0) throw conflict('Шалгалтыг өгсөн горилогч байгаа тул устгах боломжгүй');
    await q('DELETE FROM assessments WHERE id = $1', [existing.id]);
    res.status(204).end();
  });

  // ---------- US-15: хүсэлт гаргагчид, харьцуулалт ----------
  r.get('/jobs/:id/applicants', async (req, res) => {
    const job = await ownJob(req);
    const jobSkills = (await q(
      `SELECT s.name, js.is_required AS "isRequired" FROM job_skills js JOIN skills s ON s.id = js.skill_id WHERE js.job_id = $1`, [job.id])).rows;
    const assessment = await jobAssessment(job.id);
    const { rows } = await q(
      `SELECT a.id, a.status, a.applied_at AS "appliedAt", a.cv_id AS "cvId", a.seeker_id AS "seekerId",
              sp.full_name AS "fullName", u.email, sp.phone, sp.profession, sp.summary,
              t.score, t.submitted_at AS "assessmentSubmittedAt"
         FROM applications a JOIN seeker_profiles sp ON sp.user_id = a.seeker_id JOIN users u ON u.id = a.seeker_id
         LEFT JOIN assessment_attempts t ON t.application_id = a.id AND t.assessment_id = $2
        WHERE a.job_id = $1 ORDER BY a.applied_at`, [job.id, assessment?.id ?? 0]);

    const applicants = await Promise.all(rows.map(async (a) => {
      const [skills, educations, experiences, eligibility] = await Promise.all([
        seekerSkills(q, a.seekerId), seekerEducations(q, a.seekerId), seekerExperiences(q, a.seekerId), eligibilityOf(q, a.seekerId),
      ]);
      const passed = a.score === null || (assessment?.passScore ?? null) === null ? null : a.score >= assessment.passScore;
      return { ...a, skills, educations, experiences, eligible: eligibility.eligible, match: computeMatch(skills, jobSkills), passed };
    }));
    res.json({ assessment, applicants });
  });

  r.patch('/applications/:id/status', async (req, res) => {
    const b = parse(statusSchema, req.body);
    const { rows: [app] } = await q(
      `SELECT a.id, a.status FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = $1 AND j.company_id = $2`,
      [idParam(req.params.id), req.companyId]);
    if (!app) throw notFound('Хүсэлт олдсонгүй');
    if (!canEmployerSet(app.status, b.status)) throw badRequest('Энэ төлөв рүү шилжүүлэх боломжгүй');
    await db.tx(async (t) => {
      await t('UPDATE applications SET status = $2, updated_at = now() WHERE id = $1', [app.id, b.status]);
      await t('INSERT INTO application_status_history (application_id, old_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
        [app.id, app.status, b.status, req.user.id]);
    });
    res.json({ ok: true, status: b.status });
  });

  return r;
}

module.exports = { employerRouter };
