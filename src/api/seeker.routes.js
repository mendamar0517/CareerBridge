// Ажил горилогчийн профайл: US-02 төгсөлт, US-03 боловсрол/туршлага, US-04 ур чадвар, US-05 CV
const express = require('express');
const { renderCvPdf } = require('../cvPdf');
const { parse, idParam, notFound, badRequest } = require('../http');
const {
  z, date, optDate, optText, reqText, level,
  upsertSkill, seekerSkills, seekerEducations, seekerExperiences, eligibilityOf, createCv,
} = require('./shared');

const profileSchema = z.object({
  fullName: reqText(150, 'Овог нэр'),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{5,18}$/, 'Утасны дугаар буруу байна').nullish().or(z.literal('')).transform((v) => v || null),
  profession: optText(120),
  summary: optText(2000),
});

const educationSchema = z.object({
  school: reqText(200, 'Сургуулийн нэр'),
  degree: z.enum(['DIPLOMA', 'BACHELOR', 'MASTER', 'DOCTOR'], { error: 'Зэрэг сонгоно уу' }),
  major: reqText(150, 'Мэргэжил'),
  startDate: optDate,
  graduationDate: date,
}).refine((e) => !e.startDate || e.graduationDate > e.startDate, { message: 'Төгссөн огноо элссэн огнооноос хойш байна', path: ['graduationDate'] });

const experienceSchema = z.object({
  companyName: reqText(200, 'Байгууллагын нэр'),
  position: reqText(150, 'Албан тушаал'),
  startDate: date,
  endDate: optDate,
  description: optText(2000),
}).refine((x) => !x.endDate || x.endDate >= x.startDate, { message: 'Дууссан огноо эхэлсэн огнооноос өмнө байж болохгүй', path: ['endDate'] });

const skillSchema = z.object({ name: reqText(100, 'Ур чадварын нэр'), level });

function seekerRouter({ db }) {
  const r = express.Router();
  const q = (text, params) => db.query(text, params); // db нь DB-гүй горимд null байж болно

  // ---------- US-03: үндсэн мэдээлэл ----------
  r.get('/profile', async (req, res) => {
    const id = req.user.id;
    const { rows } = await q(
      `SELECT sp.full_name AS "fullName", u.email, sp.phone, sp.profession, sp.summary, sp.updated_at AS "updatedAt"
         FROM seeker_profiles sp JOIN users u ON u.id = sp.user_id WHERE sp.user_id = $1`, [id]);
    if (!rows[0]) throw notFound('Профайл олдсонгүй');
    const [educations, experiences, skills, eligibility, cvCount] = await Promise.all([
      seekerEducations(q, id), seekerExperiences(q, id), seekerSkills(q, id), eligibilityOf(q, id),
      q('SELECT count(*)::int AS n FROM cvs WHERE seeker_id = $1', [id]),
    ]);
    const p = rows[0];
    // Профайл бүрдүүлэлт: 5 хэсэг тус бүр 20%
    const parts = [Boolean(p.phone && p.profession), Boolean(p.summary), educations.length > 0, experiences.length > 0, skills.length > 0];
    const completeness = parts.filter(Boolean).length * 20;
    res.json({ ...p, educations, experiences, skills, eligibility, completeness, cvCount: cvCount.rows[0].n });
  });

  r.put('/profile', async (req, res) => {
    const b = parse(profileSchema, req.body);
    await q('UPDATE seeker_profiles SET full_name = $2, phone = $3, profession = $4, summary = $5, updated_at = now() WHERE user_id = $1',
      [req.user.id, b.fullName, b.phone, b.profession, b.summary]);
    res.json({ ok: true, message: 'Профайл хадгалагдлаа' });
  });

  // ---------- US-02: төгсөлтийн мэдээлэл, 2 жилийн шалгуур ----------
  r.get('/eligibility', async (req, res) => {
    res.json(await eligibilityOf(q, req.user.id));
  });

  r.get('/educations', async (req, res) => res.json(await seekerEducations(q, req.user.id)));

  async function saveEducation(req, eduId) {
    const b = parse(educationSchema, req.body);
    return db.tx(async (t) => {
      await t('INSERT INTO schools (name) VALUES ($1) ON CONFLICT ((lower(name))) DO NOTHING', [b.school]);
      const { rows: [school] } = await t('SELECT id FROM schools WHERE lower(name) = lower($1)', [b.school]);
      const params = [req.user.id, school.id, b.degree, b.major, b.startDate, b.graduationDate];
      const { rows } = eduId
        ? await t(`UPDATE educations SET school_id = $2, degree = $3, major = $4, start_date = $5, graduation_date = $6
                    WHERE id = $7 AND seeker_id = $1 RETURNING id`, [...params, eduId])
        : await t(`INSERT INTO educations (seeker_id, school_id, degree, major, start_date, graduation_date)
                   VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`, params);
      if (!rows[0]) throw notFound('Боловсролын мэдээлэл олдсонгүй');
      return rows[0].id;
    });
  }

  r.post('/educations', async (req, res) => {
    const id = await saveEducation(req, null);
    res.status(201).json({ id, eligibility: await eligibilityOf(q, req.user.id) });
  });
  r.put('/educations/:id', async (req, res) => {
    const id = await saveEducation(req, idParam(req.params.id));
    res.json({ id, eligibility: await eligibilityOf(q, req.user.id) });
  });
  r.delete('/educations/:id', async (req, res) => {
    const { rowCount } = await q('DELETE FROM educations WHERE id = $1 AND seeker_id = $2', [idParam(req.params.id), req.user.id]);
    if (!rowCount) throw notFound();
    res.status(204).end();
  });

  r.get('/schools', async (req, res) => {
    const { rows } = await q('SELECT name FROM schools ORDER BY name LIMIT 200');
    res.json(rows.map((s) => s.name));
  });

  // ---------- US-03: ажлын туршлага ----------
  r.get('/experiences', async (req, res) => res.json(await seekerExperiences(q, req.user.id)));

  r.post('/experiences', async (req, res) => {
    const b = parse(experienceSchema, req.body);
    const { rows } = await q(
      `INSERT INTO work_experiences (seeker_id, company_name, position, start_date, end_date, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`, [req.user.id, b.companyName, b.position, b.startDate, b.endDate, b.description]);
    res.status(201).json({ id: rows[0].id });
  });
  r.put('/experiences/:id', async (req, res) => {
    const b = parse(experienceSchema, req.body);
    const { rowCount } = await q(
      `UPDATE work_experiences SET company_name = $3, position = $4, start_date = $5, end_date = $6, description = $7
        WHERE id = $1 AND seeker_id = $2`, [idParam(req.params.id), req.user.id, b.companyName, b.position, b.startDate, b.endDate, b.description]);
    if (!rowCount) throw notFound();
    res.json({ ok: true });
  });
  r.delete('/experiences/:id', async (req, res) => {
    const { rowCount } = await q('DELETE FROM work_experiences WHERE id = $1 AND seeker_id = $2', [idParam(req.params.id), req.user.id]);
    if (!rowCount) throw notFound();
    res.status(204).end();
  });

  // ---------- US-04: ур чадвар ----------
  r.get('/skills', async (req, res) => res.json(await seekerSkills(q, req.user.id)));

  // Нэмэх эсвэл түвшинг шинэчлэх (давхардуулахгүй — skills.js addSkill-ийн дүрэм)
  r.post('/skills', async (req, res) => {
    const b = parse(skillSchema, req.body);
    const skill = await upsertSkill(q, b.name);
    await q(`INSERT INTO seeker_skills (seeker_id, skill_id, level) VALUES ($1, $2, $3)
             ON CONFLICT (seeker_id, skill_id) DO UPDATE SET level = EXCLUDED.level`, [req.user.id, skill.id, b.level]);
    res.status(201).json({ ...skill, level: b.level });
  });
  r.put('/skills/:skillId', async (req, res) => {
    const b = parse(z.object({ level }), req.body);
    const { rowCount } = await q('UPDATE seeker_skills SET level = $3 WHERE seeker_id = $1 AND skill_id = $2', [req.user.id, idParam(req.params.skillId), b.level]);
    if (!rowCount) throw notFound();
    res.json({ ok: true });
  });
  r.delete('/skills/:skillId', async (req, res) => {
    const { rowCount } = await q('DELETE FROM seeker_skills WHERE seeker_id = $1 AND skill_id = $2', [req.user.id, idParam(req.params.skillId)]);
    if (!rowCount) throw notFound();
    res.status(204).end();
  });

  // ---------- US-05: CV ----------
  r.get('/cvs', async (req, res) => {
    const { rows } = await q('SELECT id, title, created_at AS "createdAt", snapshot FROM cvs WHERE seeker_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(rows);
  });
  r.post('/cvs', async (req, res) => {
    const b = parse(z.object({ title: optText(150) }), req.body);
    const { rows } = await q('SELECT count(*)::int AS n FROM educations WHERE seeker_id = $1', [req.user.id]);
    if (rows[0].n === 0) throw badRequest('CV үүсгэхийн өмнө боловсролын мэдээллээ оруулна уу');
    res.status(201).json(await createCv(q, req.user.id, b.title));
  });
  r.delete('/cvs/:id', async (req, res) => {
    const id = idParam(req.params.id);
    const { rows } = await q('SELECT count(*)::int AS n FROM applications WHERE cv_id = $1', [id]);
    if (rows[0].n > 0) throw badRequest('Хүсэлтэд хавсаргасан CV-г устгах боломжгүй');
    const { rowCount } = await q('DELETE FROM cvs WHERE id = $1 AND seeker_id = $2', [id, req.user.id]);
    if (!rowCount) throw notFound();
    res.status(204).end();
  });

  return r;
}

/** CV харах/татах: өөрийн CV эсвэл өөрийн ажлын байранд хавсаргасан CV (US-15) */
function cvRouter({ db }) {
  const r = express.Router();

  async function loadCv(req) {
    const id = idParam(req.params.id);
    const { rows } = await db.query(
      `SELECT c.id, c.title, c.snapshot, c.created_at AS "createdAt" FROM cvs c
        WHERE c.id = $1 AND (c.seeker_id = $2 OR EXISTS (
          SELECT 1 FROM applications a JOIN jobs j ON j.id = a.job_id JOIN companies co ON co.id = j.company_id
           WHERE a.cv_id = c.id AND co.owner_user_id = $2))`, [id, req.user.id]);
    if (!rows[0]) throw notFound('CV олдсонгүй');
    return rows[0];
  }

  r.get('/:id', async (req, res) => res.json(await loadCv(req)));
  r.get('/:id/pdf', async (req, res) => {
    const cv = await loadCv(req);
    const pdf = await renderCvPdf(cv.snapshot);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="careerbridge-cv-${cv.id}.pdf"` });
    res.send(pdf);
  });
  return r;
}

module.exports = { seekerRouter, cvRouter };
