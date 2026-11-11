// Хэд хэдэн router-т хэрэглэгддэг query, Zod туслах
const { z } = require('zod');
const { getSeekerEligibility } = require('../eligibility');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const date = z.string().regex(DATE_RE, 'Огноо YYYY-MM-DD хэлбэртэй байна');
const optDate = date.nullish().or(z.literal('')).transform((v) => v || null);
const optText = (max) => z.string().trim().max(max, `${max} тэмдэгтээс ихгүй байна`).nullish().transform((v) => v || null);
const reqText = (max, label) => z.string({ error: `${label} оруулна уу` }).trim().min(1, `${label} оруулна уу`).max(max, `${label} ${max} тэмдэгтээс ихгүй байна`);
const level = z.coerce.number().int().min(1).max(5).nullish().transform((v) => v ?? null);

/** Ур чадварыг нэрээр нь олж, байхгүй бол үүсгэнэ (том/жижиг үсэг ялгахгүй, ux_skills_name). */
async function upsertSkill(q, rawName) {
  const name = rawName.trim();
  await q('INSERT INTO skills (name) VALUES ($1) ON CONFLICT ((lower(name))) DO NOTHING', [name]);
  const { rows } = await q('SELECT id, name FROM skills WHERE lower(name) = lower($1)', [name]);
  return rows[0];
}

async function seekerSkills(q, seekerId) {
  const { rows } = await q(
    `SELECT s.id, s.name, ss.level FROM seeker_skills ss JOIN skills s ON s.id = ss.skill_id
      WHERE ss.seeker_id = $1 ORDER BY s.name`, [seekerId]);
  return rows;
}

async function seekerEducations(q, seekerId) {
  const { rows } = await q(
    `SELECT e.id, sc.name AS school, e.degree, e.major, e.start_date AS "startDate", e.graduation_date AS "graduationDate"
       FROM educations e JOIN schools sc ON sc.id = e.school_id
      WHERE e.seeker_id = $1 ORDER BY e.graduation_date DESC NULLS FIRST, e.id DESC`, [seekerId]);
  return rows;
}

async function seekerExperiences(q, seekerId) {
  const { rows } = await q(
    `SELECT id, company_name AS "companyName", position, start_date AS "startDate", end_date AS "endDate", description
       FROM work_experiences WHERE seeker_id = $1 ORDER BY end_date DESC NULLS FIRST, start_date DESC`, [seekerId]);
  return rows;
}

/** US-02: eligibility.js-ийн getSeekerEligibility-д PostgreSQL repository дамжуулна. */
function eligibilityOf(q, seekerId) {
  const repo = {
    async findLatestGraduationDate(id) {
      const { rows } = await q(
        'SELECT max(graduation_date) AS d FROM educations WHERE seeker_id = $1 AND graduation_date <= CURRENT_DATE', [id]);
      return rows[0].d;
    },
  };
  return getSeekerEligibility(repo, seekerId);
}

/** US-05: CV-ийн тухайн үеийн хуулбар (snapshot) */
async function buildCvSnapshot(q, seekerId) {
  const { rows } = await q(
    `SELECT sp.full_name AS "fullName", u.email, sp.phone, sp.profession, sp.summary
       FROM seeker_profiles sp JOIN users u ON u.id = sp.user_id WHERE sp.user_id = $1`, [seekerId]);
  // Transaction-ий нэг client дээр query-г дараалан ажиллуулна (зэрэгцүүлбэл pg анхааруулна)
  const educations = await seekerEducations(q, seekerId);
  const experiences = await seekerExperiences(q, seekerId);
  const skills = await seekerSkills(q, seekerId);
  const eligibility = await eligibilityOf(q, seekerId);
  return {
    profile: rows[0],
    educations: educations.map(({ id: _id, ...e }) => e),
    experiences: experiences.map(({ id: _id, ...x }) => x),
    skills: skills.map(({ name, level: l }) => ({ name, level: l })),
    eligible: eligibility.eligible,
    generatedAt: new Date().toISOString(),
  };
}

async function createCv(q, seekerId, title) {
  const snapshot = await buildCvSnapshot(q, seekerId);
  const { rows } = await q(
    'INSERT INTO cvs (seeker_id, title, snapshot) VALUES ($1, $2, $3) RETURNING id, title, created_at AS "createdAt"',
    [seekerId, title || 'Миний CV', snapshot]);
  return { ...rows[0], snapshot };
}

module.exports = {
  z, date, optDate, optText, reqText, level,
  upsertSkill, seekerSkills, seekerEducations, seekerExperiences, eligibilityOf, buildCvSnapshot, createCv,
};
