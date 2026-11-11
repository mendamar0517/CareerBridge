// US-08 тохироо, US-14 оноо, US-10 төлөвийн шилжилт, туслах функцуудын unit тест (DB шаардлагагүй)
const request = require('supertest');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { computeMatch } = require('../src/matching');
const { scoreAttempt } = require('../src/scoring');
const { canEmployerSet, canWithdraw, isFinal, LABELS } = require('../src/applicationStatus');
const { idParam, likePattern, mapDbError, parse } = require('../src/http');
const { createTokenService, requireAuth, requireRole } = require('../src/tokens');
const { renderCvPdf } = require('../src/cvPdf');
const { createApp } = require('../src/app');
const { z } = require('zod');

describe('computeMatch (US-08)', () => {
  test('бүх заавал ур чадвар таарвал 100%, нэмэлтийг тусад нь', () => {
    const r = computeMatch([{ name: 'node.js' }, { name: 'SQL' }], [
      { name: 'Node.js', isRequired: true }, { name: 'SQL' }, { name: 'Docker', isRequired: false },
    ]);
    expect(r).toMatchObject({ percent: 100, matched: ['Node.js', 'SQL'], missing: [], required: 2 });
    expect(r.optional).toEqual([{ name: 'Docker', owned: false }]);
  });
  test('хагас таарвал 50%, дутууг жагсаана', () => {
    const r = computeMatch([{ name: 'React' }], [{ name: 'React' }, { name: 'Jest' }]);
    expect(r.percent).toBe(50);
    expect(r.missing).toEqual(['Jest']);
  });
  test('шаардлагагүй бол 100%, 3-аас 1 нь 33.3%', () => {
    expect(computeMatch([], []).percent).toBe(100);
    expect(computeMatch([{ name: 'a', level: 2 }], [{ name: 'a' }, { name: 'b' }, { name: 'c' }]).percent).toBeCloseTo(33.3, 5);
  });
});

describe('scoreAttempt (US-14)', () => {
  const questions = [
    { id: 1, type: 'SINGLE_CHOICE', points: 1, options: [{ id: 11, isCorrect: false }, { id: 12, isCorrect: true }] },
    { id: 2, type: 'MULTIPLE_CHOICE', points: 2, options: [{ id: 21, isCorrect: true }, { id: 22, isCorrect: true }, { id: 23, isCorrect: false }] },
    { id: 3, type: 'TEXT', points: 2, options: [] },
  ];
  test('бүгд зөв (TEXT-ийг автоматаар үнэлэхгүй)', () => {
    const r = scoreAttempt(questions, [{ questionId: 1, optionIds: [12] }, { questionId: 2, optionIds: [22, 21, 21] }, { questionId: 3, text: 'x' }]);
    expect(r).toMatchObject({ earned: 3, max: 5, percent: 60 });
    expect(r.perQuestion[2].awarded).toBeNull();
  });
  test('олон хариулттайд дутуу/илүү сонгосон бол 0, хариулаагүй бол 0', () => {
    expect(scoreAttempt(questions, [{ questionId: 2, optionIds: [21] }]).earned).toBe(0);
    expect(scoreAttempt(questions, [{ questionId: 2, optionIds: [21, 22, 23] }]).earned).toBe(0);
    expect(scoreAttempt(questions, [{ questionId: 1, optionIds: [11, 12] }]).earned).toBe(0);
    expect(scoreAttempt(questions, []).percent).toBe(0);
  });
  test('асуултгүй бол 0%', () => {
    expect(scoreAttempt([], []).percent).toBe(0);
  });
});

describe('Хүсэлтийн төлөв (US-10)', () => {
  test('ажил олгогчийн шилжилт', () => {
    expect(canEmployerSet('SUBMITTED', 'REVIEWING')).toBe(true);
    expect(canEmployerSet('REVIEWING', 'REVIEWING')).toBe(false);
    expect(canEmployerSet('ACCEPTED', 'REJECTED')).toBe(false);
    expect(canEmployerSet('SUBMITTED', 'WITHDRAWN')).toBe(false);
  });
  test('буцаах, эцсийн төлөв, шошго', () => {
    expect(canWithdraw('INTERVIEW')).toBe(true);
    expect(canWithdraw('WITHDRAWN')).toBe(false);
    expect(isFinal('REJECTED')).toBe(true);
    expect(LABELS.SUBMITTED).toBe('Илгээсэн');
  });
});

describe('http туслах', () => {
  test('idParam буруу бол 404', () => {
    expect(idParam('7')).toBe(7);
    for (const v of ['0', '-1', 'abc', '1.5']) expect(() => idParam(v)).toThrow(expect.objectContaining({ status: 404 }));
  });
  test('likePattern тусгай тэмдэгтийг escape хийнэ', () => {
    expect(likePattern('50%_a\\')).toBe('%50\\%\\_a\\\\%');
  });
  test('mapDbError', () => {
    expect(mapDbError({ code: '23505' }).status).toBe(409);
    expect(mapDbError({ code: '22P02' }).status).toBe(400);
    expect(mapDbError({ code: 'XX000' })).toBeNull();
  });
  test('parse алдааны жагсаалт буцаана', () => {
    expect(() => parse(z.object({ a: z.string() }), null)).toThrow(expect.objectContaining({ status: 400 }));
  });
});

describe('JWT (US-01)', () => {
  const tokens = createTokenService('test-secret');
  const run = (mw, req) => new Promise((resolve) => mw(req, {}, resolve));
  const req = (authorization) => ({ get: () => authorization });

  test('зөв token → req.user', async () => {
    const r = req(`Bearer ${tokens.sign({ id: 5, role: 'SEEKER', email: 'a@b.mn' })}`);
    expect(await run(tokens.authenticate, r)).toBeUndefined();
    expect(r.user).toEqual({ id: 5, role: 'SEEKER', email: 'a@b.mn' });
  });
  test('token байхгүй, буруу хэлбэр, хуурамч token', async () => {
    expect(await run(tokens.authenticate, req(undefined))).toBeUndefined();
    expect((await run(tokens.authenticate, req('Basic abc'))).status).toBe(401);
    expect((await run(tokens.authenticate, req('Bearer bad.token'))).status).toBe(401);
    const other = createTokenService().sign({ id: 1, role: 'SEEKER' });
    expect((await run(tokens.authenticate, req(`Bearer ${other}`))).status).toBe(401);
  });
  test('requireAuth / requireRole', async () => {
    expect((await run(requireAuth, {})).status).toBe(401);
    expect(await run(requireAuth, { user: {} })).toBeUndefined();
    expect((await run(requireRole('EMPLOYER'), {})).status).toBe(401);
    expect((await run(requireRole('EMPLOYER'), { user: { role: 'SEEKER' } })).status).toBe(403);
    expect((await run(requireRole('SEEKER'), { user: { role: 'EMPLOYER' } })).message).toMatch('ажил горилогчид');
  });
});

describe('CV PDF (US-05)', () => {
  test('кирилл тексттэй PDF үүсгэнэ, хоосон хэсгийг харуулна', async () => {
    const pdf = await renderCvPdf({
      profile: { fullName: 'Тест Хэрэглэгч', email: 't@t.mn' },
      educations: [], experiences: [], skills: [], generatedAt: '2026-11-11T00:00:00Z',
    });
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    const full = await renderCvPdf({
      profile: { fullName: 'Б', profession: 'Инженер', phone: '99', summary: 'Товч' },
      educations: [{ school: 'ШУТИС', degree: 'BACHELOR', major: 'ПХ', startDate: '2021-09-01', graduationDate: '2025-06-01' },
        { school: 'X', degree: 'OTHER', major: 'Y', startDate: null, graduationDate: null }],
      experiences: [{ companyName: 'A', position: 'Dev', startDate: '2024-01-01', endDate: null, description: 'D' },
        { companyName: 'B', position: 'QA', startDate: '2023-01-01', endDate: '2023-06-01' }],
      skills: [{ name: 'SQL', level: 3 }, { name: 'Git', level: null }], generatedAt: '2026-11-11',
    });
    expect(full.length).toBeGreaterThan(pdf.length);
  });
});

describe('App: DB-гүй болон SPA түгээлт', () => {
  test('DB тохируулаагүй бол API 503', async () => {
    const res = await request(createApp()).get('/api/v1/jobs');
    expect(res.status).toBe(503);
  });
  test('staticDir өгвөл SPA-г түгээнэ, API/health-д нөлөөлөхгүй', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cb-web-'));
    fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>CareerBridge</title>');
    const app = createApp({ staticDir: dir });
    const page = await request(app).get('/jobs/12');
    expect(page.status).toBe(200);
    expect(page.text).toContain('CareerBridge');
    expect((await request(app).get('/health')).body.status).toBe('ok');
    expect((await request(app).get('/api/v1/unknown')).status).toBe(503);
  });
  test('staticDir-д index.html байхгүй бол 404 JSON', async () => {
    const res = await request(createApp({ staticDir: os.tmpdir() + '/cb-none' })).get('/jobs');
    expect(res.status).toBe(404);
  });
});
