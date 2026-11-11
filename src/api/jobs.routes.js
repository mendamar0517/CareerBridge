// US-06 хайх, US-07 дэлгэрэнгүй, US-08 тохироо, US-09 хүсэлт гаргах
const express = require('express');
const { computeMatch } = require('../matching');
const { parse, idParam, notFound, badRequest, conflict, forbidden, likePattern } = require('../http');
const { z, seekerSkills, eligibilityOf, createCv } = require('./shared');
const { requireRole } = require('../tokens');

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'];
const DAY = 24 * 60 * 60 * 1000;

const searchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  profession: z.string().trim().max(120).optional(),
  skill: z.string().trim().max(100).optional(),
  type: z.enum(EMPLOYMENT_TYPES).optional().or(z.literal('').transform(() => undefined)),
  location: z.string().trim().max(150).optional(),
  sort: z.enum(['match', 'new', 'salary']).optional(),
});

// Нийтлэгдсэн ажлын байрны үндсэн SELECT (ур чадвар JSON массиваар)
const JOB_SELECT = `
  SELECT j.id, j.title, j.description, j.profession, j.location, j.employment_type AS "employmentType",
         j.salary_min AS "salaryMin", j.salary_max AS "salaryMax", j.status, j.published_at AS "publishedAt", j.deadline,
         json_build_object('id', c.id, 'name', c.name, 'industry', c.industry) AS company,
         (SELECT count(*)::int FROM applications a WHERE a.job_id = j.id) AS "applicantCount",
         COALESCE((SELECT json_agg(json_build_object('id', s.id, 'name', s.name, 'isRequired', js.is_required, 'minLevel', js.min_level)
                                   ORDER BY js.is_required DESC, s.name)
                     FROM job_skills js JOIN skills s ON s.id = js.skill_id WHERE js.job_id = j.id), '[]') AS skills
    FROM jobs j JOIN companies c ON c.id = j.company_id`;

function decorate(job, mySkills, now = Date.now()) {
  const published = job.publishedAt ? new Date(job.publishedAt).getTime() : 0;
  const deadline = job.deadline ? new Date(`${job.deadline}T23:59:59`).getTime() : null;
  return {
    ...job,
    isNew: now - published < 3 * DAY,
    isUrgent: deadline !== null && deadline - now < 7 * DAY && deadline >= now,
    match: mySkills ? computeMatch(mySkills, job.skills) : null,
  };
}

function jobsRouter({ db }) {
  const r = express.Router();
  const q = (text, params) => db.query(text, params); // db нь DB-гүй горимд null байж болно
  const isSeeker = (req) => req.user?.role === 'SEEKER';

  r.get('/', async (req, res) => {
    const f = parse(searchSchema, req.query);
    const where = ["j.status = 'PUBLISHED'", '(j.deadline IS NULL OR j.deadline >= CURRENT_DATE)'];
    const params = [];
    const add = (value) => { params.push(value); return `$${params.length}`; };

    if (f.q) {
      const p = add(likePattern(f.q));
      where.push(`(j.title ILIKE ${p} OR j.profession ILIKE ${p} OR c.name ILIKE ${p}
                   OR EXISTS (SELECT 1 FROM job_skills js JOIN skills s ON s.id = js.skill_id WHERE js.job_id = j.id AND s.name ILIKE ${p}))`);
    }
    if (f.profession) where.push(`j.profession ILIKE ${add(likePattern(f.profession))}`);
    if (f.skill) {
      where.push(`EXISTS (SELECT 1 FROM job_skills js JOIN skills s ON s.id = js.skill_id
                           WHERE js.job_id = j.id AND lower(s.name) = lower(${add(f.skill)}))`);
    }
    if (f.type) where.push(`j.employment_type = ${add(f.type)}`);
    if (f.location) where.push(`j.location ILIKE ${add(likePattern(f.location))}`);

    const order = f.sort === 'salary' ? 'COALESCE(j.salary_max, j.salary_min, 0) DESC, j.published_at DESC' : 'j.published_at DESC';
    const { rows } = await q(`${JOB_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT 200`, params);

    let mySkills = null;
    let applied = new Set();
    if (isSeeker(req)) {
      mySkills = await seekerSkills(q, req.user.id);
      const a = await q('SELECT job_id FROM applications WHERE seeker_id = $1', [req.user.id]);
      applied = new Set(a.rows.map((x) => x.job_id));
    }
    let jobs = rows.map((j) => ({ ...decorate(j, mySkills), hasApplied: applied.has(j.id), description: j.description.slice(0, 220) }));
    if (f.sort === 'match' && mySkills) jobs = jobs.sort((a, b) => b.match.percent - a.match.percent);
    res.json({ total: jobs.length, jobs });
  });

  r.get('/:id', async (req, res) => {
    const id = idParam(req.params.id);
    const { rows } = await q(`${JOB_SELECT} WHERE j.id = $1`, [id]);
    const job = rows[0];
    // Нийтлээгүй ажлын байрыг зөвхөн эзэмшигч байгууллага харна
    const ownerCheck = job && job.status !== 'PUBLISHED'
      ? await q('SELECT 1 FROM companies WHERE id = $1 AND owner_user_id = $2', [job.company.id, req.user?.id ?? 0])
      : null;
    if (!job || (ownerCheck && ownerCheck.rowCount === 0)) throw notFound('Ажлын байр олдсонгүй');

    const [company, assessment] = await Promise.all([
      q('SELECT id, name, industry, description, address, website FROM companies WHERE id = $1', [job.company.id]),
      q(`SELECT a.title, a.time_limit_minutes AS "timeLimitMinutes", a.pass_score AS "passScore",
                (SELECT count(*)::int FROM questions WHERE assessment_id = a.id) AS "questionCount"
           FROM assessments a WHERE a.job_id = $1 ORDER BY a.id LIMIT 1`, [id]),
    ]);

    let mySkills = null;
    let application = null;
    let eligibility = null;
    if (isSeeker(req)) {
      [mySkills, eligibility] = await Promise.all([seekerSkills(q, req.user.id), eligibilityOf(q, req.user.id)]);
      const a = await q('SELECT id, status, applied_at AS "appliedAt" FROM applications WHERE job_id = $1 AND seeker_id = $2', [id, req.user.id]);
      application = a.rows[0] ?? null;
    }
    res.json({ ...decorate(job, mySkills), company: company.rows[0], assessment: assessment.rows[0] ?? null, application, eligibility });
  });

  // US-09: хүсэлт гаргах — нээлттэй ажлын байр, 2 жилийн шалгуур, CV, давхар хүсэлтгүй
  r.post('/:id/apply', requireRole('SEEKER'), async (req, res) => {
    const id = idParam(req.params.id);
    const b = parse(z.object({ cvId: z.coerce.number().int().positive().nullish() }), req.body);
    const seekerId = req.user.id;

    const { rows: [job] } = await q(
      "SELECT id, title FROM jobs WHERE id = $1 AND status = 'PUBLISHED' AND (deadline IS NULL OR deadline >= CURRENT_DATE)", [id]);
    if (!job) throw notFound('Нээлттэй ажлын байр олдсонгүй');

    const eligibility = await eligibilityOf(q, seekerId);
    if (!eligibility.eligible) {
      throw forbidden(eligibility.reason === 'NO_GRADUATION'
        ? 'Хүсэлт гаргахын өмнө төгсөлтийн мэдээллээ оруулна уу'
        : 'CareerBridge нь сүүлийн 2 жилд төгссөн залуучуудад зориулагдсан тул хүсэлт гаргах боломжгүй');
    }
    const dup = await q('SELECT id FROM applications WHERE job_id = $1 AND seeker_id = $2', [id, seekerId]);
    if (dup.rowCount) throw conflict('Та энэ ажлын байранд аль хэдийн хүсэлт гаргасан байна');

    const application = await db.tx(async (t) => {
      let cvId = b.cvId;
      if (cvId) {
        const own = await t('SELECT 1 FROM cvs WHERE id = $1 AND seeker_id = $2', [cvId, seekerId]);
        if (!own.rowCount) throw badRequest('Сонгосон CV олдсонгүй');
      } else {
        cvId = (await createCv(t, seekerId, `CV — ${job.title}`)).id; // CV сонгоогүй бол профайлаас шинээр үүсгэнэ
      }
      const { rows } = await t(
        'INSERT INTO applications (job_id, seeker_id, cv_id) VALUES ($1, $2, $3) RETURNING id, status, applied_at AS "appliedAt", cv_id AS "cvId"',
        [id, seekerId, cvId]);
      await t('INSERT INTO application_status_history (application_id, old_status, new_status, changed_by) VALUES ($1, NULL, $2, $3)',
        [rows[0].id, 'SUBMITTED', seekerId]);
      return rows[0];
    });
    res.status(201).json({ ...application, message: 'Хүсэлт амжилттай илгээгдлээ' });
  });

  return r;
}

module.exports = { jobsRouter, EMPLOYMENT_TYPES };
