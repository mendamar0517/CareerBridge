// US-10 хүсэлтийн төлөв (ажил горилогч), US-14 онлайн шалгалт өгөх
const express = require('express');
const { scoreAttempt } = require('../scoring');
const { canWithdraw } = require('../applicationStatus');
const { parse, idParam, notFound, badRequest, conflict } = require('../http');
const { z } = require('./shared');

const GRACE_SECONDS = 60; // сүлжээний сааталд зориулсан нэмэлт хугацаа

const submitSchema = z.object({
  answers: z.array(z.object({
    questionId: z.coerce.number().int().positive(),
    optionIds: z.array(z.coerce.number().int().positive()).max(20).optional(),
    text: z.string().max(5000).optional(),
  })).max(200),
});

async function loadQuestions(q, assessmentId, withAnswers) {
  const { rows } = await q(
    `SELECT qu.id, qu.body, qu.type, qu.points, qu.order_no AS "orderNo",
            COALESCE(json_agg(json_build_object('id', o.id, 'body', o.body, 'isCorrect', o.is_correct) ORDER BY o.id)
                     FILTER (WHERE o.id IS NOT NULL), '[]') AS options
       FROM questions qu LEFT JOIN question_options o ON o.question_id = qu.id
      WHERE qu.assessment_id = $1 GROUP BY qu.id ORDER BY qu.order_no`, [assessmentId]);
  if (withAnswers) return rows;
  return rows.map((qu) => ({ ...qu, options: qu.options.map(({ isCorrect: _c, ...o }) => o) }));
}

function applicationsRouter({ db }) {
  const r = express.Router();
  const q = (text, params) => db.query(text, params); // db нь DB-гүй горимд null байж болно

  r.get('/', async (req, res) => {
    const { rows } = await q(
      `SELECT a.id, a.status, a.applied_at AS "appliedAt", a.updated_at AS "updatedAt", a.cv_id AS "cvId",
              json_build_object('id', j.id, 'title', j.title, 'status', j.status, 'location', j.location,
                                'employmentType', j.employment_type, 'salaryMin', j.salary_min, 'salaryMax', j.salary_max) AS job,
              json_build_object('id', c.id, 'name', c.name) AS company,
              (SELECT json_agg(json_build_object('oldStatus', h.old_status, 'newStatus', h.new_status, 'changedAt', h.changed_at) ORDER BY h.changed_at, h.id)
                 FROM application_status_history h WHERE h.application_id = a.id) AS history,
              (SELECT json_build_object('title', s.title, 'timeLimitMinutes', s.time_limit_minutes, 'passScore', s.pass_score,
                                        'submittedAt', t.submitted_at, 'score', t.score)
                 FROM assessments s LEFT JOIN assessment_attempts t ON t.assessment_id = s.id AND t.application_id = a.id
                WHERE s.job_id = j.id ORDER BY s.id LIMIT 1) AS assessment
         FROM applications a JOIN jobs j ON j.id = a.job_id JOIN companies c ON c.id = j.company_id
        WHERE a.seeker_id = $1 ORDER BY a.applied_at DESC`, [req.user.id]);
    res.json(rows);
  });

  async function ownApplication(req) {
    const { rows } = await q('SELECT id, job_id AS "jobId", status FROM applications WHERE id = $1 AND seeker_id = $2', [idParam(req.params.id), req.user.id]);
    if (!rows[0]) throw notFound('Хүсэлт олдсонгүй');
    return rows[0];
  }

  r.post('/:id/withdraw', async (req, res) => {
    const app = await ownApplication(req);
    if (!canWithdraw(app.status)) throw badRequest('Энэ төлөвтэй хүсэлтийг буцаах боломжгүй');
    await db.tx(async (t) => {
      await t("UPDATE applications SET status = 'WITHDRAWN', updated_at = now() WHERE id = $1", [app.id]);
      await t('INSERT INTO application_status_history (application_id, old_status, new_status, changed_by) VALUES ($1, $2, $3, $4)',
        [app.id, app.status, 'WITHDRAWN', req.user.id]);
    });
    res.json({ ok: true, status: 'WITHDRAWN' });
  });

  async function assessmentFor(app) {
    if (app.status === 'WITHDRAWN' || app.status === 'REJECTED') throw badRequest('Энэ хүсэлтийн шалгалт хаагдсан байна');
    const { rows } = await q(
      `SELECT id, title, time_limit_minutes AS "timeLimitMinutes", pass_score AS "passScore"
         FROM assessments WHERE job_id = $1 ORDER BY id LIMIT 1`, [app.jobId]);
    if (!rows[0]) throw notFound('Энэ ажлын байранд шалгалт байхгүй');
    return rows[0];
  }

  // Шалгалт эхлүүлэх (анх нээхэд оролдлого үүснэ) эсвэл дүнг харах
  r.get('/:id/assessment', async (req, res) => {
    const app = await ownApplication(req);
    const assessment = await assessmentFor(app);
    await q(`INSERT INTO assessment_attempts (assessment_id, application_id) VALUES ($1, $2)
             ON CONFLICT (assessment_id, application_id) DO NOTHING`, [assessment.id, app.id]);
    const { rows: [attempt] } = await q(
      'SELECT started_at AS "startedAt", submitted_at AS "submittedAt", score FROM assessment_attempts WHERE assessment_id = $1 AND application_id = $2',
      [assessment.id, app.id]);
    const questions = attempt.submittedAt ? [] : await loadQuestions(q, assessment.id, false);
    res.json({ ...assessment, attempt, questions, serverTime: new Date().toISOString() });
  });

  r.post('/:id/assessment/submit', async (req, res) => {
    const app = await ownApplication(req);
    const assessment = await assessmentFor(app);
    const b = parse(submitSchema, req.body);
    const { rows: [attempt] } = await q(
      'SELECT id, started_at AS "startedAt", submitted_at AS "submittedAt" FROM assessment_attempts WHERE assessment_id = $1 AND application_id = $2',
      [assessment.id, app.id]);
    if (!attempt) throw badRequest('Шалгалтыг эхлүүлээгүй байна');
    if (attempt.submittedAt) throw conflict('Шалгалтыг аль хэдийн илгээсэн байна');

    const questions = await loadQuestions(q, assessment.id, true);
    const valid = new Map(questions.map((qu) => [qu.id, new Set(qu.options.map((o) => o.id))]));
    const answers = b.answers.filter((a) => valid.has(a.questionId))
      .map((a) => ({ ...a, optionIds: (a.optionIds ?? []).filter((o) => valid.get(a.questionId).has(o)) }));

    const limitMs = (assessment.timeLimitMinutes ?? 0) * 60000;
    const late = limitMs > 0 && Date.now() > new Date(attempt.startedAt).getTime() + limitMs + GRACE_SECONDS * 1000;
    // Хугацаа хэтэрсэн бол хариултыг хүлээн авахгүй, 0 оноо
    const result = late ? { percent: 0, earned: 0, max: questions.reduce((s, qu) => s + qu.points, 0), perQuestion: [] } : scoreAttempt(questions, answers);
    const awarded = new Map(result.perQuestion.map((p) => [p.questionId, p.awarded]));

    await db.tx(async (t) => {
      if (!late) {
        for (const a of answers) {
          const pts = awarded.get(a.questionId);
          for (const optionId of a.optionIds) {
            await t('INSERT INTO attempt_answers (attempt_id, question_id, selected_option_id, points_awarded) VALUES ($1, $2, $3, $4)',
              [attempt.id, a.questionId, optionId, pts]);
          }
          if (a.text && a.text.trim()) {
            await t('INSERT INTO attempt_answers (attempt_id, question_id, text_answer, points_awarded) VALUES ($1, $2, $3, $4)',
              [attempt.id, a.questionId, a.text.trim(), pts]);
          }
        }
      }
      await t('UPDATE assessment_attempts SET submitted_at = now(), score = $2 WHERE id = $1', [attempt.id, result.percent]);
    });

    const passed = assessment.passScore === null ? null : result.percent >= assessment.passScore;
    res.json({ score: result.percent, earned: result.earned, max: result.max, passed, late,
      message: late ? 'Шалгалтын хугацаа дууссан тул хариулт хүлээн авагдсангүй' : 'Шалгалт амжилттай илгээгдлээ' });
  });

  return r;
}

module.exports = { applicationsRouter, loadQuestions };
