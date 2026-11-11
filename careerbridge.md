# CareerBridge — төслийн мэдээллийн файл

> F.CSA316 «Программ хангамж хөгжүүлэлтийн процесс» (багш Ж.Алимаа), ШУТИС-МХТС.
> Сүүлд шинэчилсэн: 2026-11-11 (11-р долоо хоног, Лаб 14-ийн дараа).
> Тэмдэглэгээ: **[мэдээлэл хэрэгтэй]** гэсэн хэсгийг өмнөх лабораторийн бодит өгөгдлөөр нөхөнө.
> «Санал / төлөвлөгөө» гэж тэмдэглэсэн өгөгдөл нь бодит хэмжилт биш.

---

## 1. Төслийн тодорхойлолт

CareerBridge нь сүүлийн 2 жилийн дотор төгссөн залуучуудыг ажилд ороход нь бэлтгэх веб платформ юм. Платформ нь ажил горилогч болон ажил олгогч байгууллагыг холбоно. Үндсэн боломжууд: профайл болон CV бүрдүүлэх, ажлын байр хайх, ур чадварын тохироо харах, хүсэлт гаргах, онлайн шалгалт өгөх.

- Хэрэглэгчийн үүрэг: Ажил горилогч (Seeker), Ажил олгогч (Employer), Админ.
- Процессын арга: Scrum (Sprint), Kanban (K01… картууд).
- Repository: https://github.com/mendamar0517/CareerBridge

## 2. Баг ба Scrum үүрэг

| Нэр | Оюутны код | Scrum үүрэг |
|---|---|---|
| О.Мэнд-Амар | B232270001 | Scrum Master |
| С.Чингэрэл | B232270010 | Product Owner |
| Б.Энхжин | B232270026 | Developer |

Development Team нь багийн бүх гишүүдээс бүрдэнэ.

## 3. Product Backlog

Эх сурвалж: GitHub Issues #1–#15. Story Point: Лаб 03-ын Planning Poker (Fibonacci). US-02, 04, 13, 14, 15 дээр үнэлгээ зөрсөн тул хэлэлцэж Final SP тогтоосон.

| US-ID | Нэр | Feature | Story Point |
|---|---|---|---|
| US-01 | Ажил горилогчийн бүртгэл | User Management | 3 |
| US-02 | Төгсөлтийн мэдээлэл бүртгэх (2 жилийн шалгуур) | Candidate Profile | 2 |
| US-03 | Ажил горилогчийн профайл (боловсрол, туршлага) | Candidate Profile | 5 |
| US-04 | Ур чадвар бүртгэх | Candidate Profile | 3 |
| US-05 | CV үүсгэх (харах, татах) | Candidate Profile | 8 |
| US-06 | Ажлын байр хайх (мэргэжил, ур чадвар) | Job Search | 5 |
| US-07 | Ажлын байрны мэдээлэл харах | Job Search | 3 |
| US-08 | Ур чадварын тохироо харах | Job Matching | 8 |
| US-09 | Ажлын байранд хүсэлт гаргах (давхар хүсэлтгүй) | Job Application | 5 |
| US-10 | Хүсэлтийн төлөв харах | Job Application | 3 |
| US-11 | Байгууллагын бүртгэл | Employer Management | 3 |
| US-12 | Ажлын байр нийтлэх | Job Management | 5 |
| US-13 | Ажлын байрны шаардлага (ур чадвар) тодорхойлох | Job Management | 5 |
| US-14 | Онлайн шалгалт авах | Online Assessment | 13 |
| US-15 | Ажил горилогчдын мэдээлэл харах (харьцуулах) | Employer Management | 8 |

**Нийт: 3+2+5+3+8+5+3+8+5+3+3+5+5+13+8 = 79 SP.**

Acceptance Criteria-г тухайн Issue бүрээс харна.

## 4. Kanban картууд (Sprint 1)

| Карт | US | Ажил | Төлөв (GitHub) |
|---|---|---|---|
| K01 | US-01 | Бүртгэлийн form боловсруулах | Closed (#16) |
| K02 | US-01 | Бүртгэлийн validation хийх | Closed (#17) |
| K03 | US-02 | Төгсөлтийн мэдээлэл оруулах | Closed (#18) |
| K04 | US-02 | Төгсөлтийн мэдээлэл хадгалах | Closed (#19) |
| K05 | US-03 | Профайлын мэдээлэл оруулах | Closed (#20) |
| K06 | US-03 | Профайлын мэдээлэл шинэчлэх | Closed (#21) |
| K07 | US-04 | Ур чадвар нэмэх | Closed (#22) |
| K08 | US-04 | Ур чадварыг профайлтай холбох | Closed (#23) |

Sprint 1 (Лаб 03):
- Sprint = 5 ажлын өдөр.
- Capacity = (1.5 цаг × 3 хүн) × 5 өдөр × 0.6 = 4.5 × 5 × 0.6 = **13.5 SP**.
- Төлөвлөсөн: US-01 + US-02 + US-03 + US-04 = 3 + 2 + 5 + 3 = **13 SP** (нөөц 0.5 SP).
- Sprint Goal: ажил горилогч бүртгүүлж, төгсөлт, боловсрол, ажлын туршлага, ур чадварын мэдээллээ бүртгэн үндсэн профайлаа бүрдүүлэх.
- Velocity, Cycle Time: [мэдээлэл хэрэгтэй].

**Анхааруулга:** K05 болон K06 хаагдсан боловч repo-д US-03-ийн код, тест байхгүй (2026-11-11-ний байдлаар).

Одоогийн `src/` (2026-11-11):

| Файл | Агуулга | Лаб |
|---|---|---|
| `registration.js` | US-01 бүртгэлийн validation (ReDoS-гүй имэйл regex, `MAX_EMAIL_LENGTH = 254`) | 07, 11 |
| `graduation.js` | US-02 2 жилийн шалгуур `isEligibleGraduate()` | 07 |
| `skills.js` | US-04 ур чадвар | 07 |
| `eligibility.js` | US-02 `getSeekerEligibility(repo, …)` (repository-г гаднаас дамжуулна) | 10 |
| `auth.js` | US-01 нэвтрэлт `authenticate(credentials, userRepo, hasher)` | 12 |
| `app.js`, `server.js` | Express 5: `GET /health`, `GET /health/db`, `GET /metrics`, `POST /api/v1/registrations/validate` | 07, 08, 13 |
| `metrics.js` | Prometheus metrics (prom-client) | 13 |
| `db.js` | PostgreSQL холболт (`pg` Pool) | 08 |

UI давхарга болон бизнесийн API endpoint-ууд (профайл, ажлын байр, хүсэлт гэх мэт) хараахан байхгүй.

## 5. Өмнөх лабораторийн үр дүн

| Лаб | Сэдэв | Үр дүн |
|---|---|---|
| Лаб 01 | Хөгжүүлэлтийн орчин, Git | Repo, README, Scrum үүрэг, Git workflow |
| Лаб 02 | [мэдээлэл хэрэгтэй] | [мэдээлэл хэрэгтэй] |
| Лаб 03 | User Story үнэлгээ, Sprint 1 | Planning Poker: Backlog 79 SP. Capacity 13.5 SP, Sprint 1 = 13 SP (US-01–04). GitHub Projects дээр Backlog, Sprint Board |
| Лаб 04–06 | [мэдээлэл хэрэгтэй] | [мэдээлэл хэрэгтэй] |
| Лаб 07 | CI | GitHub Actions (`ci.yml`): checkout → Node 20 → `npm ci` → `npm test` (Jest). Тестийг санаатайгаар унагаж (`8eab14c`) CI улаан болохыг шалгаад засварласан (`feb9089`) |
| Лаб 07 (нэмэлт, 10-23) | CD | `docker` job: build → smoke test (`/health`) → зөвхөн `main` дээр GHCR руу push (PR #29). amd64 + arm64 multi-arch (PR #30). Image `ghcr.io/mendamar0517/careerbridge` public. Mac дээр pull хийж ажиллуулахад `healthy` |
| Лаб 08 (11-01, PR #31) | Dockerfile, Image, Compose | Multi-stage Dockerfile (root бус, HEALTHCHECK). Compose: api + db, `/health/db` → 18 хүснэгт, 2 view. Layer caching: зөвхөн код өөрчлөгдөхөд `npm ci` CACHED; `package.json` өөрчлөгдөхөд дахин ажилласан. Build 4.6 с → 1.4 с (бүх layer CACHED) |
| Лаб 09 (11-01, PR #32) | Kubernetes (Minikube) | `k8s/deployment.yaml` (3 replica, probe, resource limit, uid 1000), `k8s/service.yaml` (NodePort 30080). Minikube: 3/3 Ready. Self-healing: `6vr7m` устгахад `sbcff` 8 с-д `1/1`. CI `k8s` job (kind) |
| Лаб 10 (11-01, PR #33) | Автомат тест | `tests/lab10.eligibility.test.js`: хэвийн 2, хилийн 8, `jest.fn()` mock 5. Coverage босго 80%. PR дээр ✅ → ❌ (`>=` → `>`, docker/k8s skipped) → ✅. Хуучин 20 тест хилийн алдааг илрүүлээгүй, шинэ тест илрүүлсэн |
| Лаб 11 (11-01, PR #34) | Статик шинжилгээ | ESLint 9 (recommended + security + sonarjs + n + jest): 14 → 0. ReDoS (имэйлийн regex, 80 KB оролтод 4.4 с → 0.7 мс). npm audit: 31 (Moderate 27, Low 4), бүгд dev, production 0. CI-д lint + audit gate, Dependabot |
| Лаб 12 (11-11, PR #47) | AI ашиглан код бичих, review | `src/auth.js` `authenticate()` (US-01). AI-ийн анхны код `f0ce8eb`, review-ийн засвар `d05b4d1`. Ерөнхий prompt → Python (буруу), тодорхой prompt → шаардлагын 7 зүйл бүгд. Review: 4 асуудал ([High] fail-open `isActive` → `!== true`; [Medium] lint; [Low] давхардал, тестийн өгөгдөл). `auth.test.js` 46 тест |
| Лаб 13 (11-11, PR #48) | Prometheus, Grafana | `src/metrics.js` (prom-client): `http_requests_total`, `http_request_duration_seconds`, Node.js metrics; `GET /metrics`. Compose-д Prometheus (9090), Grafana (3001), provisioning-оор data source + 8 panel-тай dashboard. Alert: `HighRequestRate` (> 5 req/s), `HighLatencyP95`, `ApiDown`. Ачааллын үед: 8.35 req/s, 494 хүсэлт, p95 4.76 мс, `HighRequestRate` firing. CI `monitoring` job. CI-ийн Node 20 → 26 |
| Лаб 14 (11-11) | DORA, Retrospective | Бодит өгөгдөл (deploy = main дээр GHCR руу push), 2026-10-23 – 11-11, 19.37 хоног. DF: 22 deploy, 1.14/өдөр, 4 өдөр → **High**. Lead time median 19 мин (багийн 8 мин, Dependabot 28 цаг) → **Elite**. CFR 1/22 = 4.5% (PR #29, arm64) → **Elite**. Time to restore 11 мин 20 с (PR #30) → **Elite**. Retrospective-ийн төсөл, 5 action item (багаар батлах) |

## 6. Хуваарь

- Одоо: **11-р долоо хоног** (2026-11-09 – 11-15).
- **15-р долоо хоног (2026-12-07 – 12-13): эцсийн демо болон хамгаалалт.**
- Хүрээ: **US-01 … US-15 бүгдийг хэрэгжүүлнэ.**
- Долоо хоногийн огноог 8-р долоо хоног 2026-10-19 (Даваа)-нд эхэлнэ гэж тооцож гаргасан.

### 6.1. Release plan (санал, багаар батална)

Sprint-ийн урт 2 долоо хоног. Үлдсэн 15 US-ийг 3 Sprint-д 5–5-аар, хамаарлын дарааллаар хуваав.

| Sprint | Долоо хоног | Огноо | User Story | Sprint Goal |
|---|---|---|---|---|
| Sprint 2-ын бэлтгэл | 8 | 10-21 – 10-25 | — | Express + Prisma + PostgreSQL + Docker Compose суурь, CI-д DB service нэмэх |
| Sprint 2 | 9–10 | 10-26 – 11-08 | US-01, US-02, US-03, US-04, US-11 | Бүртгэл/нэвтрэлт (JWT). Ажил горилогчийн профайл бүрэн. Байгууллагын бүртгэл |
| Sprint 3 | 11–12 | 11-09 – 11-22 | US-12, US-13, US-06, US-07, US-05 | Ажлын байр нийтлэх, шаардлага тодорхойлох → хайх, харах. CV PDF |
| Sprint 4 | 13–14 | 11-23 – 12-06 | US-08, US-09, US-10, US-14, US-15 | Тохироо, хүсэлт ба төлөв, онлайн шалгалт, ажил олгогчийн харьцуулалт |
| Хамгаалалт | 15 | 12-07 – 12-13 | — | Шинэ функц нэмэхгүй. Алдаа засах, байршуулах, демо, эцсийн тайлан |

Хамаарлын шалтгаан:
- US-12 болон US-13 бэлэн болсны дараа л US-06, US-07, US-08-ийг турших өгөгдөл үүснэ.
- US-09-д US-05 (CV) шаардлагатай.
- US-15-д US-14 шаардлагатай.

Sprint бүрийн SP (Лаб 03-ын үнэлгээгээр):
- Sprint 2 = 3 + 2 + 5 + 3 + 3 = 16 SP
- Sprint 3 = 5 + 5 + 5 + 3 + 8 = 26 SP
- Sprint 4 = 8 + 5 + 3 + 13 + 8 = 37 SP
- Нийт 16 + 26 + 37 = 79 SP

2 долоо хоногийн Sprint-ийн capacity (Лаб 03-ын томьёогоор, тооцоо): (1.5 × 3) × 10 × 0.6 = 27 SP.

Эрсдэл: Sprint 4 (37 SP) нь 27 SP-ийн capacity-аас 10 SP-ээр давна. US-14 бол хамгийн том US (13 SP). Velocity хүрэлцэхгүй бол US-15-ийн «харьцуулах» шалгуурыг 15-р долоо хоногийн эхэнд шилжүүлэх эсвэл Story-г хуваах.

**Бодит явц (2026-11-11):** Sprint 2-ын (9–10-р долоо хоног) User Story-уудаас зөвхөн US-01-ийн логик (бүртгэлийн validation, `authenticate()`) бэлэн болсон. Endpoint, JWT, US-03, US-11 хэрэгжээгүй. 9–12-р долоо хоногт хичээлийн лабораторийн дагуу CI/CD, Docker, Kubernetes, тест, статик шинжилгээнд анхаарсан. Release plan-ийг дахин хянах шаардлагатай (10-р хэсэг).

## 7. 15-р долоо хоногт хүлээгдэж буй үр дүн

### 7.1. Функционал үр дүн

| Feature | US | Ажиллаж байх функц |
|---|---|---|
| User Management | US-01 | Бүртгэл, нэвтрэлт, үүргээр эрх ялгах |
| Candidate Profile | US-02–05 | Төгсөлт (2 жилийн шалгуур), боловсрол, туршлага, ур чадвар. Профайлаас CV үүсгэж PDF татах |
| Job Search | US-06, 07 | Мэргэжил/ур чадвараар хайх, дэлгэрэнгүй харах |
| Job Matching | US-08 | Тохирооны хувь, тохирсон болон дутуу ур чадвар |
| Job Application | US-09, 10 | Хүсэлт илгээх (давхар илгээх боломжгүй), төлөв ба түүх |
| Employer Management | US-11, 15 | Байгууллагын бүртгэл. Хүсэлт гаргагчдын профайл, CV, шалгалтын дүнг харьцуулах |
| Job Management | US-12, 13 | Ажлын байр DRAFT → PUBLISHED, шаардлагатай ур чадвар |
| Online Assessment | US-14 | Шалгалт ба асуулт үүсгэх, шалгалт өгөх, автоматаар оноо тооцох |

### 7.2. Техникийн үр дүн

| Үр дүн | Төлөв (2026-11-11) |
|---|---|
| Docker image → GHCR (amd64 + arm64), CI/CD | **Бэлэн** (Лаб 07–08) |
| Docker Compose: API + PostgreSQL нэг командаар | **Бэлэн** (Лаб 08) |
| Kubernetes manifest (Deployment, Service) | **Бэлэн** (Лаб 09) |
| Unit + integration тест, CI ногоон, coverage ≥ 80% | **Бэлэн** (Лаб 10). CI дээр lines 97.29%, branches 89.79% (Лаб 11-ийн үед) |
| Статик шинжилгээ, dependency scan | **Бэлэн** (Лаб 11) |
| Хяналт: Prometheus metrics, Grafana dashboard, alert | **Бэлэн** (Лаб 13) |
| Байршуулсан демо хувилбар (Render, URL) | Төлөвлөсөн |
| REST API ба OpenAPI (Swagger) баримт бичиг | Төлөвлөсөн |
| Migration болон seed-тэй өгөгдлийн сан (Prisma) | Төлөвлөсөн. Одоо `db/init/01_schema.sql` + `pg` |

### 7.3. Процессын артефакт

Артефакт = багийн төлөвлөгөө, явц, үр дүнг харагдахуйц болгож баримтжуулсан зүйл. Scrum Guide (2020)-ийн 3 үндсэн артефакт: Product Backlog, Sprint Backlog, Increment (жишээ нь GHCR дээрх ажилладаг image). Бусад нь явцыг хэмжих туслах хэрэгсэл.

- Product Backlog (SP-тэй), Sprint бүрийн Sprint Backlog.
- Increment: Sprint бүрийн ажилладаг хувилбар (GHCR image, демо URL).
- Burndown, Velocity.
- Kanban самбар.
- Sprint Review болон Retrospective-ийн тэмдэглэл.

### 7.4. Definition of Done

1. Pull Request review хийгдэж, `main` руу merge хийгдсэн.
2. Тест бичигдсэн, CI ногоон.
3. Acceptance Criteria бүгд биелсэн.
4. Staging орчинд байршсан.

## 8. Технологийн стек (батлагдсан 2026-10-21, бодит төлөв 2026-11-11)

Багш технологийн шаардлага тавиагүй тул сонголтыг багийн одоогийн суурь (Node.js 20, Jest, GitHub Actions), 3 хүний бүрэлдэхүүн болон 7 долоо хоногийн хугацаанд тохируулж хийсэн.

| Давхарга | Технологи | Үндэслэл |
|---|---|---|
| Хэл | JavaScript (Node.js 26) | Нэг хэлээр frontend ба backend хоёуланг бичнэ. Docker image `node:26-alpine`, CI Node 26 (PR #48-аар нийцүүлсэн), `engines >=22` |
| Backend | Express.js 4, REST API | Энгийн, сурахад хурдан. `src/` дахь validation функцуудыг дахин ашиглана |
| Оролтын шалгалт | Zod | Request body-г шалгах, алдааны мэдээлэл буцаах (US-01) |
| ORM / migration | Prisma | Migration, seed, төрлийн аюулгүй query. View болон функционал индексийг custom SQL migration-аар нэмнэ. **Одоо:** `pg` Pool + `db/init/01_schema.sql` (Prisma хараахан нэвтрээгүй) |
| Өгөгдлийн сан | PostgreSQL 16 | 9-р хэсгийг үзнэ үү |
| Нэвтрэлт | JWT (access token) + bcrypt | Үүргээр эрх хязгаарлах, нууц үгийг hash хэлбэрээр хадгалах |
| Frontend | React 18 + Vite, React Router, Tailwind CSS | Компонентод суурилсан SPA, хурдан build хийнэ |
| CV PDF | PDFKit | Сервер талд PDF үүсгэнэ (US-05) |
| Тест | Jest 30 + Supertest | Unit, API, mock, PostgreSQL integration тест. Coverage босго 80% |
| CI/CD | GitHub Actions: `build-and-test` (lint, audit, PostgreSQL service, coverage) → `docker` (GHCR push) + `k8s` (kind) | Лаб 07–11-д бэлэн болсон |
| Статик шинжилгээ | ESLint 10 (security, sonarjs, n, jest), `npm audit`, Dependabot | Лаб 11 |
| Контейнер оркестраци | Kubernetes (Minikube локал, CI дээр kind) | Лаб 09 |
| Хяналт | Prometheus v3.4, Grafana 12.0, prom-client | Лаб 13 |
| Орчин | Docker Compose (api + db) | Багийн гишүүн бүрд ижил орчин бүрдүүлнэ |
| Байршуулалт | Frontend → Vercel, API → Render, DB → Neon (PostgreSQL) | Үнэгүй багцтай. Хязгаарыг байршуулахын өмнө дахин шалгана |
| Процесс | GitHub Issues + Projects (Kanban) | Одоо ашиглаж буй хэрэгсэл |

## 9. Өгөгдлийн сан

**Систем: PostgreSQL 16.** Сонгосон үндэслэл:
- Харьцааны өгөгдөлтэй: seeker↔skill, job↔skill гэсэн M:N холбоосууд US-06/08-ийг JOIN-оор шууд гаргана.
- Бизнесийн дүрмийг DB түвшинд баталгаажуулна: `UNIQUE(job_id, seeker_id)` (US-09), `lower(email)` unique (US-01).
- JSONB: CV-ийн үүсгэсэн үеийн хувилбарыг хадгална.
- Нээлттэй эх, CI-д service container хэлбэрээр ажилладаг.

**Бүтэц: 18 хүснэгт, 2 view.** Бүтэн DDL нь `claude/careerbridge_schema.sql` (repo-д `db/init/01_schema.sql`) файлд байгаа. PostgreSQL 16 дээр туршсан. Foreign key: 24.

| Хүснэгт | Үндсэн баганууд | US |
|---|---|---|
| users | email (unique), password_hash, role | US-01 |
| seeker_profiles | user_id (PK/FK), full_name, profession | US-03 |
| schools | name | US-02 |
| educations | seeker_id, school_id, degree, major, graduation_date | US-02, 03 |
| work_experiences | seeker_id, company_name, position, start/end_date | US-03 |
| skills | name (unique, том/жижиг үсэг ялгахгүй) | US-04, 13 |
| seeker_skills | (seeker_id, skill_id), level | US-04 |
| cvs | seeker_id, snapshot JSONB, file_path | US-05 |
| companies | owner_user_id, name, register_no | US-11 |
| jobs | company_id, title, profession, status, published_at | US-06, 07, 12 |
| job_skills | (job_id, skill_id), is_required, min_level | US-13 |
| applications | job_id, seeker_id, cv_id, status; UNIQUE(job_id, seeker_id) | US-09 |
| application_status_history | application_id, old/new_status, changed_at | US-10 |
| assessments | job_id, title, time_limit, pass_score | US-14 |
| questions | assessment_id, body, type, points | US-14 |
| question_options | question_id, body, is_correct | US-14 |
| assessment_attempts | assessment_id, application_id, score | US-14, 15 |
| attempt_answers | attempt_id, question_id, option/text | US-14 |
| view v_seeker_eligibility | 2 жилийн шалгуур | US-02 |
| view v_job_match | тохирсон ур чадварын тоо, хувь | US-08 |

**Холбоосууд:**
- users 1–1 seeker_profiles.
- users 1–1 companies.
- companies 1–N jobs.
- seekers M–N skills (seeker_skills-ээр), jobs M–N skills (job_skills-ээр).
- jobs 1–N applications, seekers 1–N applications.
- applications 1–N assessment_attempts.

**Дизайны шийдвэр:** 2 жилийн шалгуур болон тохирооны хувь цаг хугацаа, өгөгдлөөс хамаарч өөрчлөгддөг. Тиймээс тэдгээрийг хадгалахгүй, view эсвэл `isEligibleGraduate()` функцээр тооцно.

## 10. Нээлттэй асуудал

- Sprint 1-ийн Velocity, Cycle Time, Лаб 02, 04–06-ийн үр дүнг энэ файлд нөхөх.
- K05/K06 (US-03): картын төлөв болон repo-ийн бодит кодын зөрүүг тодруулах.
- Release plan (6.1): Sprint 2-ын ихэнх US хэрэгжээгүй, Sprint 4 нь capacity-аас 10 SP давсан → хуваарийг дахин хянах.
- **Dummy hash-ийн cost:** `src/auth.js`-ийн `DUMMY_PASSWORD_HASH` cost 12. Бүртгэлийн bcrypt cost-той ижил байх ёстой (timing хамгаалалт).
- **Retrospective-ийн action item (санал, багаар батлах):** (1) Release plan / MVP хүрээг дахин тогтоох (PO, 11-13); (2) branch protection, 1 approval, PR template-д AI ашигласан эсэх (SM, 11-12); (3) гишүүн бүр Sprint бүрт ≥ 1 US-ийн PR; (4) Render-т байршуулж DORA-г production-оор дахин хэмжих (11-20); (5) Velocity/Burndown хөтлөх, Dependabot-ийн PR-ыг 24 цагт шийдэх.
- npm audit: minimatch (Moderate), deepmerge (Low) нь dev хамааралд байгаа. Эрсдлийг хүлээн зөвшөөрсөн, Dependabot-оор хянана.
- CI-ийн анхааруулга: `ubuntu-latest` Ubuntu 26 руу шилжиж байгаа.
