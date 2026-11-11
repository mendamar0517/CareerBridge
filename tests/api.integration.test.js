// US-01 … US-15 REST API — бодит PostgreSQL дээрх integration тест (DATABASE_URL өгсөн үед)
// Хэрэглэгч бүрийг санамсаргүй имэйлээр үүсгэдэг тул seed-тэй DB дээр ч давхцахгүй.
const { randomInt } = require('crypto');
const request = require('supertest');
const { createApp } = require('../src/app');
const { createDb } = require('../src/db');

const itDb = process.env.DATABASE_URL ? describe : describe.skip;

itDb('REST API integration (US-01 … US-15)', () => {
  const db = createDb();
  const app = createApp({ db, jwtSecret: 'integration-secret', bcryptCost: 4 });
  const api = request(app);
  const uid = `${Date.now()}${randomInt(1e6)}`;
  const mail = (name) => `${name}.${uid}@test.mn`;
  const auth = (token) => ({ Authorization: `Bearer ${token}` });
  const today = new Date();
  const iso = (d) => d.toISOString().slice(0, 10);
  const yearsAgo = (n) => { const d = new Date(today); d.setFullYear(d.getFullYear() - n); return iso(d); };

  const register = async (body) => {
    const res = await api.post('/api/v1/auth/register').send({ password: 'Secret123', ...body });
    expect(res.status).toBe(201);
    return res.body;
  };

  let seeker; let seeker2; let oldGrad; let employer; let employer2;
  let jobId; let draftJobId; let applicationId; let cvId;

  afterAll(() => db.close());

  beforeAll(async () => {
    seeker = await register({ role: 'SEEKER', fullName: 'Тест Горилогч', email: mail('seeker') });
    seeker2 = await register({ fullName: 'Хоёр дахь', email: mail('seeker2') });
    oldGrad = await register({ fullName: 'Хуучин төгсөгч', email: mail('old') });
    employer = await register({ role: 'EMPLOYER', companyName: 'Тест ХХК', email: mail('emp') });
    employer2 = await register({ role: 'EMPLOYER', companyName: 'Өөр ХХК', email: mail('emp2') });
  });

  // ---------------- US-01 ----------------
  describe('Нэвтрэлт (US-01, US-11)', () => {
    test('бүртгэл буцаасан хэрэглэгч, байгууллага', () => {
      expect(seeker.user).toMatchObject({ role: 'SEEKER', name: 'Тест Горилогч' });
      expect(employer.user).toMatchObject({ role: 'EMPLOYER', name: 'Тест ХХК' });
      expect(employer.user.companyId).toEqual(expect.any(Number));
    });
    test('буруу өгөгдөл 400 ба алдааны жагсаалт', async () => {
      const res = await api.post('/api/v1/auth/register').send({ role: 'EMPLOYER', email: 'bad', password: '1' });
      expect(res.status).toBe(400);
      expect(res.body.errors.map((e) => e.message)).toContain('Байгууллагын нэр хоосон байна');
      const res2 = await api.post('/api/v1/auth/register').send({ fullName: 'х'.repeat(151), email: mail('long'), password: 'Secret123' });
      expect(res2.status).toBe(400);
      expect((await api.post('/api/v1/auth/register').send({ fullName: 5 })).status).toBe(400);
    });
    test('давхар имэйл 409 (том жижиг үсэг ялгахгүй)', async () => {
      const res = await api.post('/api/v1/auth/register').send({ fullName: 'Давхар', email: mail('seeker').toUpperCase(), password: 'Secret123' });
      expect(res.status).toBe(409);
    });
    test('нэвтрэх: амжилттай, буруу нууц үг, буруу оролт, идэвхгүй данс', async () => {
      const ok = await api.post('/api/v1/auth/login').send({ email: mail('seeker'), password: 'Secret123' });
      expect(ok.status).toBe(200);
      expect(ok.body.token).toEqual(expect.any(String));
      expect((await api.post('/api/v1/auth/login').send({ email: mail('seeker'), password: 'Wrong123' })).status).toBe(401);
      expect((await api.post('/api/v1/auth/login').send({ email: 'nobody@test.mn', password: 'Wrong123' })).status).toBe(401);
      expect((await api.post('/api/v1/auth/login').send({})).status).toBe(400);
      const off = await register({ fullName: 'Идэвхгүй', email: mail('off') });
      await db.query('UPDATE users SET is_active = FALSE WHERE id = $1', [off.user.id]);
      const res = await api.post('/api/v1/auth/login').send({ email: mail('off'), password: 'Secret123' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ACCOUNT_DISABLED');
    });
    test('/auth/me ба эрхийн хамгаалалт', async () => {
      expect((await api.get('/api/v1/auth/me').set(auth(employer.token))).body.user.name).toBe('Тест ХХК');
      expect((await api.get('/api/v1/auth/me')).status).toBe(401);
      expect((await api.get('/api/v1/me/profile')).status).toBe(401);
      expect((await api.get('/api/v1/employer/jobs').set(auth(seeker.token))).status).toBe(403);
      expect((await api.get('/api/v1/me/profile').set(auth(employer.token))).status).toBe(403);
    });
  });

  // ---------------- US-02 … US-05 ----------------
  describe('Ажил горилогчийн профайл (US-02 … US-05)', () => {
    const t = () => auth(seeker.token);

    test('профайл шинэчлэх (US-03)', async () => {
      expect((await api.put('/api/v1/me/profile').set(t()).send({ fullName: 'Тест', phone: 'abc' })).status).toBe(400);
      const res = await api.put('/api/v1/me/profile').set(t()).send({ fullName: 'Тест Горилогч', phone: '99112233', profession: 'Инженер', summary: 'Товч' });
      expect(res.status).toBe(200);
      const p = await api.get('/api/v1/me/profile').set(t());
      expect(p.body).toMatchObject({ phone: '99112233', profession: 'Инженер', completeness: 40 });
      expect(p.body.eligibility.reason).toBe('NO_GRADUATION');
    });

    test('CV боловсролгүйгээр үүсэхгүй', async () => {
      expect((await api.post('/api/v1/me/cvs').set(t()).send({})).status).toBe(400);
    });

    test('төгсөлтийн мэдээлэл ба 2 жилийн шалгуур (US-02)', async () => {
      const bad = await api.post('/api/v1/me/educations').set(t()).send({ school: 'ШУТИС', degree: 'BACHELOR', major: 'ПХ', startDate: '2025-01-01', graduationDate: '2024-01-01' });
      expect(bad.status).toBe(400);
      expect((await api.post('/api/v1/me/educations').set(t()).send({ school: 'ШУТИС', degree: 'X', major: 'ПХ', graduationDate: '2024-01-01' })).status).toBe(400);
      const res = await api.post('/api/v1/me/educations').set(t()).send({ school: 'ШУТИС', degree: 'BACHELOR', major: 'ПХ', startDate: '2020-09-01', graduationDate: yearsAgo(1) });
      expect(res.status).toBe(201);
      expect(res.body.eligibility).toMatchObject({ eligible: true, reason: 'WITHIN_2_YEARS' });
      const upd = await api.put(`/api/v1/me/educations/${res.body.id}`).set(t()).send({ school: 'шутис', degree: 'MASTER', major: 'ПХ', startDate: '', graduationDate: yearsAgo(1) });
      expect(upd.status).toBe(200);
      expect((await api.put('/api/v1/me/educations/999999999').set(t()).send({ school: 'A', degree: 'MASTER', major: 'B', graduationDate: yearsAgo(1) })).status).toBe(404);
      const list = await api.get('/api/v1/me/educations').set(t());
      expect(list.body[0]).toMatchObject({ school: 'ШУТИС', degree: 'MASTER' });
      expect((await api.get('/api/v1/me/eligibility').set(t())).body.eligible).toBe(true);
      expect((await api.get('/api/v1/me/schools').set(t())).body).toContain('ШУТИС');

      const tmp = await api.post('/api/v1/me/educations').set(t()).send({ school: 'МУИС', degree: 'DIPLOMA', major: 'X', graduationDate: yearsAgo(5) });
      expect((await api.delete(`/api/v1/me/educations/${tmp.body.id}`).set(t())).status).toBe(204);
      expect((await api.delete(`/api/v1/me/educations/${tmp.body.id}`).set(t())).status).toBe(404);

      // Хуучин төгсөгч: 2 жилээс өмнө
      const old = await api.post('/api/v1/me/educations').set(auth(oldGrad.token)).send({ school: 'МУИС', degree: 'BACHELOR', major: 'X', graduationDate: yearsAgo(4) });
      expect(old.body.eligibility.reason).toBe('OVER_2_YEARS');
    });

    test('ажлын туршлага CRUD (US-03)', async () => {
      expect((await api.post('/api/v1/me/experiences').set(t()).send({ companyName: 'A', position: 'B', startDate: '2024-05-01', endDate: '2024-01-01' })).status).toBe(400);
      const res = await api.post('/api/v1/me/experiences').set(t()).send({ companyName: 'Номад', position: 'Дадлагажигч', startDate: '2024-06-01' });
      expect(res.status).toBe(201);
      expect((await api.put(`/api/v1/me/experiences/${res.body.id}`).set(t()).send({ companyName: 'Номад', position: 'Хөгжүүлэгч', startDate: '2024-06-01', endDate: '2024-09-01', description: 'API' })).status).toBe(200);
      expect((await api.put('/api/v1/me/experiences/999999999').set(t()).send({ companyName: 'A', position: 'B', startDate: '2024-06-01' })).status).toBe(404);
      expect((await api.get('/api/v1/me/experiences').set(t())).body[0].position).toBe('Хөгжүүлэгч');
      const tmp = await api.post('/api/v1/me/experiences').set(t()).send({ companyName: 'X', position: 'Y', startDate: '2023-01-01' });
      expect((await api.delete(`/api/v1/me/experiences/${tmp.body.id}`).set(t())).status).toBe(204);
      expect((await api.delete(`/api/v1/me/experiences/${tmp.body.id}`).set(t())).status).toBe(404);
    });

    test('ур чадвар нэмэх, давхардуулахгүй, засах, устгах (US-04)', async () => {
      for (const name of ['Node.js', 'SQL', 'git']) {
        expect((await api.post('/api/v1/me/skills').set(t()).send({ name: `${name}-${uid}`, level: 3 })).status).toBe(201);
      }
      const again = await api.post('/api/v1/me/skills').set(t()).send({ name: `NODE.JS-${uid}`, level: 5 });
      expect(again.body.name).toBe(`Node.js-${uid}`);
      let skills = (await api.get('/api/v1/me/skills').set(t())).body;
      expect(skills).toHaveLength(3);
      expect(skills.find((s) => s.name === `Node.js-${uid}`).level).toBe(5);
      const git = skills.find((s) => s.name === `git-${uid}`);
      expect((await api.put(`/api/v1/me/skills/${git.id}`).set(t()).send({ level: 9 })).status).toBe(400);
      expect((await api.put(`/api/v1/me/skills/${git.id}`).set(t()).send({ level: 2 })).status).toBe(200);
      expect((await api.put('/api/v1/me/skills/999999999').set(t()).send({ level: 2 })).status).toBe(404);
      expect((await api.post('/api/v1/me/skills').set(t()).send({ name: '  ' })).status).toBe(400);
      const tmp = await api.post('/api/v1/me/skills').set(t()).send({ name: `Tmp-${uid}` });
      expect((await api.delete(`/api/v1/me/skills/${tmp.body.id}`).set(t())).status).toBe(204);
      expect((await api.delete(`/api/v1/me/skills/${tmp.body.id}`).set(t())).status).toBe(404);
      skills = (await api.get('/api/v1/me/skills').set(t())).body;
      expect(skills).toHaveLength(3);
    });

    test('CV үүсгэх, харах, татах, устгах (US-05)', async () => {
      const res = await api.post('/api/v1/me/cvs').set(t()).send({ title: 'Backend CV' });
      expect(res.status).toBe(201);
      expect(res.body.snapshot.educations).toHaveLength(1);
      expect(res.body.snapshot.experiences).toHaveLength(1);
      expect(res.body.snapshot.skills).toHaveLength(3);
      cvId = res.body.id;
      expect((await api.get('/api/v1/me/cvs').set(t())).body[0].title).toBe('Backend CV');
      expect((await api.get(`/api/v1/cvs/${cvId}`).set(t())).body.snapshot.profile.fullName).toBe('Тест Горилогч');
      const pdf = await api.get(`/api/v1/cvs/${cvId}/pdf`).set(t());
      expect(pdf.status).toBe(200);
      expect(pdf.headers['content-type']).toBe('application/pdf');
      expect((await api.get(`/api/v1/cvs/${cvId}`).set(auth(seeker2.token))).status).toBe(404);
      const tmp = await api.post('/api/v1/me/cvs').set(t()).send({});
      expect(tmp.body.title).toBe('Миний CV');
      expect((await api.delete(`/api/v1/me/cvs/${tmp.body.id}`).set(t())).status).toBe(204);
      expect((await api.delete(`/api/v1/me/cvs/${tmp.body.id}`).set(t())).status).toBe(404);
    });
  });

  // ---------------- US-11 … US-13 ----------------
  describe('Ажил олгогч (US-11 … US-13)', () => {
    const e = () => auth(employer.token);
    const jobBody = (extra = {}) => ({
      title: `Junior Backend ${uid}`, description: 'Тодорхойлолт', profession: `Программист${uid}`,
      location: 'Улаанбаатар', employmentType: 'FULL_TIME', salaryMin: 2000000, salaryMax: 3000000, ...extra,
    });

    test('байгууллагын мэдээлэл (US-11)', async () => {
      const regNo = String(randomInt(1e6, 1e7));
      expect((await api.put('/api/v1/employer/company').set(e()).send({ name: 'Тест ХХК', registerNo: '12' })).status).toBe(400);
      expect((await api.put('/api/v1/employer/company').set(e()).send({ name: 'Тест ХХК', website: 'not a url' })).status).toBe(400);
      const ok = await api.put('/api/v1/employer/company').set(e()).send({ name: 'Тест ХХК', registerNo: regNo, industry: 'IT', website: 'https://example.com' });
      expect(ok.status).toBe(200);
      expect((await api.get('/api/v1/employer/company').set(e())).body).toMatchObject({ registerNo: regNo, industry: 'IT' });
      expect((await api.put('/api/v1/employer/company').set(auth(employer2.token)).send({ name: 'Өөр', registerNo: regNo })).status).toBe(409);
    });

    test('ажлын байр үүсгэх, шаардлага, нийтлэх (US-12, US-13)', async () => {
      expect((await api.post('/api/v1/employer/jobs').set(e()).send(jobBody({ salaryMin: 5, salaryMax: 1 }))).status).toBe(400);
      expect((await api.post('/api/v1/employer/jobs').set(e()).send({})).status).toBe(400);
      const res = await api.post('/api/v1/employer/jobs').set(e()).send(jobBody({
        skills: [{ name: `Node.js-${uid}` }, { name: `SQL-${uid}`, minLevel: 2 }, { name: `sql-${uid}` }, { name: `Docker-${uid}`, isRequired: false }],
      }));
      expect(res.status).toBe(201);
      jobId = res.body.id;
      const detail = await api.get(`/api/v1/employer/jobs/${jobId}`).set(e());
      expect(detail.body.status).toBe('DRAFT');
      expect(detail.body.skills).toHaveLength(3);

      // Ноорог: горилогчид харагдахгүй, эзэмшигчид харагдана
      expect((await api.get(`/api/v1/jobs/${jobId}`)).status).toBe(404);
      expect((await api.get(`/api/v1/jobs/${jobId}`).set(e())).status).toBe(200);

      expect((await api.put(`/api/v1/employer/jobs/${jobId}`).set(e()).send(jobBody({ title: `Junior Backend хөгжүүлэгч ${uid}`, deadline: iso(new Date(Date.now() + 3 * 864e5)) }))).status).toBe(200);
      expect((await api.put(`/api/v1/employer/jobs/${jobId}/skills`).set(e()).send({ skills: [{ name: '' }] })).status).toBe(400);
      expect((await api.put(`/api/v1/employer/jobs/${jobId}/skills`).set(e()).send({
        skills: [{ name: `Node.js-${uid}` }, { name: `SQL-${uid}` }, { name: `git-${uid}` }, { name: `Docker-${uid}`, isRequired: false }],
      })).status).toBe(200);

      const draft = await api.post('/api/v1/employer/jobs').set(e()).send(jobBody({ title: `Ноорог ${uid}` }));
      draftJobId = draft.body.id;
      expect((await api.post(`/api/v1/employer/jobs/${draftJobId}/publish`).set(e())).status).toBe(400);

      const pub = await api.post(`/api/v1/employer/jobs/${jobId}/publish`).set(e());
      expect(pub.body.status).toBe('PUBLISHED');
      expect((await api.post(`/api/v1/employer/jobs/${jobId}/publish`).set(e())).status).toBe(400);
      expect((await api.get(`/api/v1/employer/jobs/${jobId}`).set(auth(employer2.token))).status).toBe(404);
      expect((await api.get('/api/v1/employer/jobs/abc').set(e())).status).toBe(404);
      const list = await api.get('/api/v1/employer/jobs').set(e());
      expect(list.body.map((j) => j.id)).toEqual(expect.arrayContaining([jobId, draftJobId]));
    });

    test('онлайн шалгалт үүсгэх (US-14)', async () => {
      const base = { title: 'Суурь шалгалт', timeLimitMinutes: 10, passScore: 50 };
      const bads = [
        { ...base, questions: [] },
        { ...base, questions: [{ body: 'Q', type: 'SINGLE_CHOICE', options: [{ body: 'A', isCorrect: true }] }] },
        { ...base, questions: [{ body: 'Q', type: 'SINGLE_CHOICE', options: [{ body: 'A' }, { body: 'B' }] }] },
        { ...base, questions: [{ body: 'Q', type: 'SINGLE_CHOICE', options: [{ body: 'A', isCorrect: true }, { body: 'B', isCorrect: true }] }] },
      ];
      for (const b of bads) expect((await api.put(`/api/v1/employer/jobs/${jobId}/assessment`).set(e()).send(b)).status).toBe(400);
      expect((await api.get(`/api/v1/employer/jobs/${jobId}/assessment`).set(e())).body).toBeNull();
      expect((await api.delete(`/api/v1/employer/jobs/${jobId}/assessment`).set(e())).status).toBe(404);

      const questions = [
        { body: 'POST?', type: 'SINGLE_CHOICE', options: [{ body: 'GET' }, { body: 'POST', isCorrect: true }] },
        { body: 'SQL?', type: 'MULTIPLE_CHOICE', points: 2, options: [{ body: 'WHERE', isCorrect: true }, { body: 'HAVING', isCorrect: true }, { body: 'DROP' }] },
        { body: 'Тайлбарла', type: 'TEXT', points: 1, options: [{ body: 'ignored' }] },
      ];
      expect((await api.put(`/api/v1/employer/jobs/${jobId}/assessment`).set(e()).send({ ...base, title: 'Хуучин', questions })).status).toBe(200);
      expect((await api.put(`/api/v1/employer/jobs/${jobId}/assessment`).set(e()).send({ ...base, questions })).status).toBe(200);
      const a = await api.get(`/api/v1/employer/jobs/${jobId}/assessment`).set(e());
      expect(a.body.title).toBe('Суурь шалгалт');
      expect(a.body.questions).toHaveLength(3);
      expect(a.body.questions[2].options).toHaveLength(0);
    });
  });

  // ---------------- US-06 … US-09 ----------------
  describe('Хайлт, тохироо, хүсэлт (US-06 … US-09)', () => {
    test('хайлт: түлхүүр үг, мэргэжил, ур чадвар, төрөл, байршил (US-06)', async () => {
      const find = async (query, token) => {
        const r = api.get('/api/v1/jobs').query(query);
        const res = await (token ? r.set(auth(token)) : r);
        expect(res.status).toBe(200);
        return res.body.jobs.map((j) => j.id);
      };
      expect(await find({ q: `хөгжүүлэгч ${uid}` })).toEqual([jobId]);
      expect(await find({ q: `git-${uid}` })).toEqual([jobId]);
      expect(await find({ profession: `программист${uid}` })).toEqual([jobId]);
      expect(await find({ skill: `SQL-${uid}`, type: 'FULL_TIME', location: 'улаан' })).toEqual([jobId]);
      expect(await find({ skill: `SQL-${uid}`, type: 'INTERNSHIP' })).toEqual([]);
      expect(await find({ q: `${uid}`, type: '' })).toContain(jobId);
      expect(await find({ q: `${uid}`, sort: 'salary' })).toContain(jobId);
      expect(await find({ q: `${uid}`, sort: 'match' }, seeker.token)).toContain(jobId);
      expect((await api.get('/api/v1/jobs').query({ type: 'BAD' })).status).toBe(400);
    });

    test('дэлгэрэнгүй ба ур чадварын тохироо (US-07, US-08)', async () => {
      const anon = await api.get(`/api/v1/jobs/${jobId}`);
      expect(anon.body.match).toBeNull();
      expect(anon.body.company.name).toBe('Тест ХХК');
      expect(anon.body.assessment).toMatchObject({ questionCount: 3, timeLimitMinutes: 10 });
      expect(anon.body).toMatchObject({ isNew: true, isUrgent: true });

      const res = await api.get(`/api/v1/jobs/${jobId}`).set(auth(seeker.token));
      expect(res.body.match).toMatchObject({ percent: 100, missing: [] });
      expect(res.body.match.optional).toEqual([{ name: `Docker-${uid}`, owned: false }]);
      expect(res.body.application).toBeNull();
      const other = await api.get(`/api/v1/jobs/${jobId}`).set(auth(seeker2.token));
      expect(other.body.match).toMatchObject({ percent: 0, matched: [] });
      expect((await api.get('/api/v1/jobs/999999999')).status).toBe(404);
    });

    test('хүсэлт: шалгуур, CV, давхар хүсэлтгүй (US-09)', async () => {
      const path = `/api/v1/jobs/${jobId}/apply`;
      expect((await api.post(path)).status).toBe(401);
      expect((await api.post(path).set(auth(employer.token))).status).toBe(403);
      const noGrad = await api.post(path).set(auth(seeker2.token)).send({});
      expect(noGrad.status).toBe(403);
      expect(noGrad.body.error).toMatch('төгсөлтийн');
      const over = await api.post(path).set(auth(oldGrad.token)).send({});
      expect(over.status).toBe(403);
      expect(over.body.error).toMatch('2 жил');
      expect((await api.post(`/api/v1/jobs/${draftJobId}/apply`).set(auth(seeker.token)).send({})).status).toBe(404);
      expect((await api.post(path).set(auth(seeker.token)).send({ cvId: 999999999 })).status).toBe(400);

      const ok = await api.post(path).set(auth(seeker.token)).send({ cvId });
      expect(ok.status).toBe(201);
      expect(ok.body).toMatchObject({ status: 'SUBMITTED', cvId, message: 'Хүсэлт амжилттай илгээгдлээ' });
      applicationId = ok.body.id;
      expect((await api.post(path).set(auth(seeker.token)).send({})).status).toBe(409);

      // CV сонгоогүй бол профайлаас автоматаар үүсгэнэ
      await api.post('/api/v1/me/educations').set(auth(seeker2.token)).send({ school: 'СЭЗИС', degree: 'BACHELOR', major: 'X', graduationDate: yearsAgo(1) });
      const auto = await api.post(path).set(auth(seeker2.token)).send({});
      expect(auto.status).toBe(201);
      expect(auto.body.cvId).not.toBe(cvId);
      expect((await api.get(`/api/v1/jobs/${jobId}`).set(auth(seeker.token))).body.application.status).toBe('SUBMITTED');
      expect((await api.get('/api/v1/jobs').query({ q: `${uid}` }).set(auth(seeker.token))).body.jobs[0].hasApplied).toBe(true);
      expect((await api.delete(`/api/v1/me/cvs/${cvId}`).set(auth(seeker.token))).status).toBe(400);
    });
  });

  // ---------------- US-10, US-14, US-15 ----------------
  describe('Төлөв, шалгалт, горилогчдыг харьцуулах (US-10, US-14, US-15)', () => {
    test('шалгалт өгөх, автомат оноо (US-14)', async () => {
      const s = auth(seeker.token);
      const base = `/api/v1/me/applications/${applicationId}/assessment`;
      expect((await api.post(`${base}/submit`).set(auth(seeker2.token)).send({ answers: [] })).status).toBe(404);
      const seeker2App = (await api.get('/api/v1/me/applications').set(auth(seeker2.token))).body[0].id;
      expect((await api.post(`/api/v1/me/applications/${seeker2App}/assessment/submit`).set(auth(seeker2.token)).send({ answers: [] })).status).toBe(400);

      const start = await api.get(base).set(s);
      expect(start.status).toBe(200);
      expect(start.body.questions).toHaveLength(3);
      expect(start.body.questions[0].options[0]).not.toHaveProperty('isCorrect');
      expect((await api.get(base).set(s)).body.attempt.startedAt).toBe(start.body.attempt.startedAt);

      const full = (await api.get(`/api/v1/employer/jobs/${jobId}/assessment`).set(auth(employer.token))).body.questions;
      const correct = (qi) => full.at(qi).options.filter((o) => o.isCorrect).map((o) => o.id);
      expect((await api.post(`${base}/submit`).set(s).send({ answers: 'x' })).status).toBe(400);
      const res = await api.post(`${base}/submit`).set(s).send({ answers: [
        { questionId: full[0].id, optionIds: correct(0) },
        { questionId: full[1].id, optionIds: [...correct(1), 999999] },
        { questionId: full[2].id, text: 'Миний хариулт' },
        { questionId: 999999, optionIds: [1] },
      ] });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ earned: 3, max: 3, score: 100, passed: true, late: false });
      expect((await api.post(`${base}/submit`).set(s).send({ answers: [] })).status).toBe(409);
      expect((await api.get(base).set(s)).body).toMatchObject({ questions: [], attempt: { score: 100 } });

      // Хугацаа хэтэрсэн оролдлого 0 оноо
      await api.get(`/api/v1/me/applications/${seeker2App}/assessment`).set(auth(seeker2.token));
      await db.query(`UPDATE assessment_attempts SET started_at = now() - interval '1 hour'
                       WHERE application_id = $1`, [seeker2App]);
      const late = await api.post(`/api/v1/me/applications/${seeker2App}/assessment/submit`).set(auth(seeker2.token))
        .send({ answers: [{ questionId: full[0].id, optionIds: correct(0) }] });
      expect(late.body).toMatchObject({ late: true, score: 0, passed: false });
    });

    test('шалгалт өгсөн бол асуултыг өөрчлөхгүй', async () => {
      const e = auth(employer.token);
      expect((await api.put(`/api/v1/employer/jobs/${jobId}/assessment`).set(e).send({ title: 'X', questions: [{ body: 'Q', type: 'TEXT' }] })).status).toBe(409);
      expect((await api.delete(`/api/v1/employer/jobs/${jobId}/assessment`).set(e)).status).toBe(409);
    });

    test('горилогчдын жагсаалт, харьцуулалт, CV (US-15)', async () => {
      const res = await api.get(`/api/v1/employer/jobs/${jobId}/applicants`).set(auth(employer.token));
      expect(res.status).toBe(200);
      expect(res.body.assessment.passScore).toBe(50);
      const [first, second] = res.body.applicants;
      expect(first).toMatchObject({ fullName: 'Тест Горилогч', score: 100, passed: true, eligible: true });
      expect(first.match.percent).toBe(100);
      expect(first.educations[0].school).toBe('ШУТИС');
      expect(first.skills).toHaveLength(3);
      expect(second).toMatchObject({ score: 0, passed: false });
      expect((await api.get(`/api/v1/cvs/${first.cvId}/pdf`).set(auth(employer.token))).status).toBe(200);
      expect((await api.get(`/api/v1/cvs/${first.cvId}`).set(auth(employer2.token))).status).toBe(404);
      expect((await api.get(`/api/v1/employer/jobs/${jobId}/applicants`).set(auth(employer2.token))).status).toBe(404);
      const noAssessment = await api.get(`/api/v1/employer/jobs/${draftJobId}/applicants`).set(auth(employer.token));
      expect(noAssessment.body).toEqual({ assessment: null, applicants: [] });
    });

    test('төлөв солих ба түүх (US-10)', async () => {
      const e = auth(employer.token);
      const p = `/api/v1/employer/applications/${applicationId}/status`;
      expect((await api.patch(p).set(e).send({ status: 'SUBMITTED' })).status).toBe(400);
      expect((await api.patch(p).set(auth(employer2.token)).send({ status: 'REVIEWING' })).status).toBe(404);
      expect((await api.patch(p).set(e).send({ status: 'REVIEWING' })).body.status).toBe('REVIEWING');
      expect((await api.patch(p).set(e).send({ status: 'REVIEWING' })).status).toBe(400);
      expect((await api.patch(p).set(e).send({ status: 'INTERVIEW' })).status).toBe(200);

      const mine = (await api.get('/api/v1/me/applications').set(auth(seeker.token))).body.find((a) => a.id === applicationId);
      expect(mine.status).toBe('INTERVIEW');
      expect(mine.history.map((h) => h.newStatus)).toEqual(['SUBMITTED', 'REVIEWING', 'INTERVIEW']);
      expect(mine.assessment).toMatchObject({ score: 100 });
      expect(mine.job.title).toContain('Junior Backend');

      expect((await api.patch(p).set(e).send({ status: 'ACCEPTED' })).status).toBe(200);
      expect((await api.post(`/api/v1/me/applications/${applicationId}/withdraw`).set(auth(seeker.token))).status).toBe(400);
    });

    test('хүсэлтээ буцаах', async () => {
      const s2 = auth(seeker2.token);
      const id = (await api.get('/api/v1/me/applications').set(s2)).body[0].id;
      expect((await api.post(`/api/v1/me/applications/${id}/withdraw`).set(s2)).body.status).toBe('WITHDRAWN');
      expect((await api.post(`/api/v1/me/applications/${id}/withdraw`).set(s2)).status).toBe(400);
      expect((await api.get(`/api/v1/me/applications/${id}/assessment`).set(s2)).status).toBe(400);
      expect((await api.post(`/api/v1/me/applications/${id}/withdraw`).set(auth(seeker.token))).status).toBe(404);
    });
  });

  describe('Ажлын байр хаах, устгах; лавлах', () => {
    test('хаах, устгах дүрэм', async () => {
      const e = auth(employer.token);
      expect((await api.post(`/api/v1/employer/jobs/${draftJobId}/close`).set(e)).status).toBe(400);
      expect((await api.delete(`/api/v1/employer/jobs/${jobId}`).set(e)).status).toBe(400);
      expect((await api.post(`/api/v1/employer/jobs/${jobId}/close`).set(e)).body.status).toBe('CLOSED');
      expect((await api.put(`/api/v1/employer/jobs/${jobId}`).set(e).send({})).status).toBe(400);
      expect((await api.get('/api/v1/jobs').query({ q: `${uid}` })).body.jobs).toEqual([]);
      expect((await api.delete(`/api/v1/employer/jobs/${draftJobId}`).set(e)).status).toBe(204);
    });

    test('ур чадвар, мэргэжил, статистик', async () => {
      const skills = await api.get('/api/v1/skills').query({ q: `node.js-${uid}` });
      expect(skills.body[0].name).toBe(`Node.js-${uid}`);
      expect((await api.get('/api/v1/skills')).body.length).toBeGreaterThan(0);
      expect(Array.isArray((await api.get('/api/v1/professions')).body)).toBe(true);
      expect((await api.get('/api/v1/stats')).body).toEqual(expect.objectContaining({ jobs: expect.any(Number), companies: expect.any(Number) }));
    });

    test('байгууллагагүй EMPLOYER эрхтэй token 404, DB алдаа 400', async () => {
      const ghost = await register({ role: 'EMPLOYER', companyName: 'Устгах', email: mail('ghost') });
      await db.query('DELETE FROM companies WHERE owner_user_id = $1', [ghost.user.id]);
      expect((await api.get('/api/v1/employer/company').set(auth(ghost.token))).status).toBe(404);
      expect((await api.get('/api/v1/auth/me').set(auth(ghost.token))).body.user.companyId).toBeNull();
      expect((await api.put('/api/v1/me/educations/1').set(auth(seeker.token)).send({ school: 'A', degree: 'MASTER', major: 'B', graduationDate: '2024-02-31' })).status).toBe(400);
    });
  });
});
