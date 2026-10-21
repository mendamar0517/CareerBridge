# CareerBridge — төслийн мэдээллийн файл

> F.CSA316 «Программ хангамж хөгжүүлэлтийн процесс» (багш Ж.Алимаа), ШУТИС-МХТС.
> Сүүлд шинэчилсэн: 2026-10-21 (8-р долоо хоног).
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

Эх сурвалж: GitHub Issues #1–#15.

| US-ID | Нэр | Feature | Story Point |
|---|---|---|---|
| US-01 | Ажил горилогчийн бүртгэл | User Management | [мэдээлэл хэрэгтэй] |
| US-02 | Төгсөлтийн мэдээлэл бүртгэх (2 жилийн шалгуур) | Candidate Profile | [мэдээлэл хэрэгтэй] |
| US-03 | Ажил горилогчийн профайл (боловсрол, туршлага) | Candidate Profile | [мэдээлэл хэрэгтэй] |
| US-04 | Ур чадвар бүртгэх | Candidate Profile | [мэдээлэл хэрэгтэй] |
| US-05 | CV үүсгэх (харах, татах) | Candidate Profile | [мэдээлэл хэрэгтэй] |
| US-06 | Ажлын байр хайх (мэргэжил, ур чадвар) | Job Search | [мэдээлэл хэрэгтэй] |
| US-07 | Ажлын байрны мэдээлэл харах | Job Search | [мэдээлэл хэрэгтэй] |
| US-08 | Ур чадварын тохироо харах | Job Matching | [мэдээлэл хэрэгтэй] |
| US-09 | Ажлын байранд хүсэлт гаргах (давхар хүсэлтгүй) | Job Application | [мэдээлэл хэрэгтэй] |
| US-10 | Хүсэлтийн төлөв харах | Job Application | [мэдээлэл хэрэгтэй] |
| US-11 | Байгууллагын бүртгэл | Employer Management | [мэдээлэл хэрэгтэй] |
| US-12 | Ажлын байр нийтлэх | Job Management | [мэдээлэл хэрэгтэй] |
| US-13 | Ажлын байрны шаардлага (ур чадвар) тодорхойлох | Job Management | [мэдээлэл хэрэгтэй] |
| US-14 | Онлайн шалгалт авах | Online Assessment | [мэдээлэл хэрэгтэй] |
| US-15 | Ажил горилогчдын мэдээлэл харах (харьцуулах) | Employer Management | [мэдээлэл хэрэгтэй] |

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

Sprint 1-ийн SP, Velocity, Cycle Time: [мэдээлэл хэрэгтэй].

**Анхааруулга:** K05 болон K06 хаагдсан боловч repo-д US-03-ийн код, тест байхгүй (2026-10-21-ний байдлаар). Одоогийн `src/` дотор зөвхөн дараах цэвэр логик функцууд байна:
- `registration.js` (US-01)
- `graduation.js` (US-02, 2 жилийн шалгуур)
- `skills.js` (US-04)

Өгөгдлийн сан, API болон UI давхарга хараахан байхгүй.

## 5. Өмнөх лабораторийн үр дүн

| Лаб | Сэдэв | Үр дүн |
|---|---|---|
| Лаб 01 | Хөгжүүлэлтийн орчин, Git | Repo, README, Scrum үүрэг, Git workflow |
| Лаб 02–06 | [мэдээлэл хэрэгтэй] | [мэдээлэл хэрэгтэй] |
| Лаб 07 | CI | GitHub Actions (`ci.yml`) тохируулсан. Алхмууд: checkout → Node 20 → `npm ci` → `npm test` (Jest). Тестийг санаатайгаар унагаж CI-ийн амжилтгүй үр дүнг шалгасан, дараа нь засварласан |

## 6. Хуваарь

- Одоо: **8-р долоо хоног** (2026-10-19 – 10-25).
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

Эрсдэл: Sprint 4-т ачаалал их (US-14 бол хамгийн том US). Velocity хүрэлцэхгүй бол US-15-ийн «харьцуулах» шалгуурыг 15-р долоо хоногийн эхэнд шилжүүлэх. SP тооцоо хийгдсэний дараа энэ хуваарийг дахин шалгана.

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

- Байршуулсан, ажиллаж буй веб хувилбар (demo URL).
- REST API ба OpenAPI (Swagger) баримт бичиг.
- Migration болон seed-тэй PostgreSQL өгөгдлийн сан.
- Unit + integration тест. CI ногоон төлөвтэй.
- Docker Compose-оор нэг командаар ажиллуулах боломжтой.

### 7.3. Процессын артефакт

- Product Backlog (SP-тэй), Sprint бүрийн Sprint Backlog.
- Burndown, Velocity.
- Kanban самбар.
- Sprint Review болон Retrospective-ийн тэмдэглэл.

### 7.4. Definition of Done

1. Pull Request review хийгдэж, `main` руу merge хийгдсэн.
2. Тест бичигдсэн, CI ногоон.
3. Acceptance Criteria бүгд биелсэн.
4. Staging орчинд байршсан.

## 8. Технологийн стек (батлагдсан, 2026-10-21)

Багш технологийн шаардлага тавиагүй тул сонголтыг багийн одоогийн суурь (Node.js 20, Jest, GitHub Actions), 3 хүний бүрэлдэхүүн болон 7 долоо хоногийн хугацаанд тохируулж хийсэн.

| Давхарга | Технологи | Үндэслэл |
|---|---|---|
| Хэл | JavaScript (Node.js 20 LTS) | Repo, CI-д ашиглагдаж байгаа. Нэг хэлээр frontend ба backend хоёуланг бичнэ |
| Backend | Express.js 4, REST API | Энгийн, сурахад хурдан. `src/` дахь validation функцуудыг дахин ашиглана |
| Оролтын шалгалт | Zod | Request body-г шалгах, алдааны мэдээлэл буцаах (US-01) |
| ORM / migration | Prisma | Migration, seed, төрлийн аюулгүй query. View болон функционал индексийг custom SQL migration-аар нэмнэ |
| Өгөгдлийн сан | PostgreSQL 16 | 9-р хэсгийг үзнэ үү |
| Нэвтрэлт | JWT (access token) + bcrypt | Үүргээр эрх хязгаарлах, нууц үгийг hash хэлбэрээр хадгалах |
| Frontend | React 18 + Vite, React Router, Tailwind CSS | Компонентод суурилсан SPA, хурдан build хийнэ |
| CV PDF | PDFKit | Сервер талд PDF үүсгэнэ (US-05) |
| Тест | Jest (байгаа) + Supertest | Unit болон API integration тест |
| CI | GitHub Actions (байгаа) + PostgreSQL service container | Integration тестийг бодит DB дээр ажиллуулна |
| Орчин | Docker Compose (api + db) | Багийн гишүүн бүрд ижил орчин бүрдүүлнэ |
| Байршуулалт | Frontend → Vercel, API → Render, DB → Neon (PostgreSQL) | Үнэгүй багцтай. Хязгаарыг байршуулахын өмнө дахин шалгана |
| Процесс | GitHub Issues + Projects (Kanban) | Одоо ашиглаж буй хэрэгсэл |

## 9. Өгөгдлийн сан

**Систем: PostgreSQL 16.** Сонгосон үндэслэл:
- Харьцааны өгөгдөлтэй: seeker↔skill, job↔skill гэсэн M:N холбоосууд US-06/08-ийг JOIN-оор шууд гаргана.
- Бизнесийн дүрмийг DB түвшинд баталгаажуулна: `UNIQUE(job_id, seeker_id)` (US-09), `lower(email)` unique (US-01).
- JSONB: CV-ийн үүсгэсэн үеийн хувилбарыг хадгална.
- Нээлттэй эх, CI-д service container хэлбэрээр ажилладаг.

**Бүтэц: 18 хүснэгт, 2 view.** Бүтэн DDL нь `claude/careerbridge_schema.sql` файлд байгаа. PostgreSQL 16 дээр туршсан.

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

- Sprint 1-ийн SP, Velocity, Лаб 02–06-ийн үр дүнг энэ файлд нөхөх.
- Product Backlog-ийн SP-г тогтоож, Release plan (6.1) багтах эсэхийг capacity-аар шалгах.
- K05/K06 (US-03): картын төлөв болон repo-ийн бодит кодын зөрүүг тодруулах.
