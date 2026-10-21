-- =====================================================================
-- CareerBridge — өгөгдлийн сангийн бүтэц (PostgreSQL 16)
-- Эх сурвалж: GitHub Issues US-01 … US-15 (mendamar0517/CareerBridge)
-- Хувилбар: 0.1 (санал болгож буй загвар, багаар хэлэлцэж батална)
-- =====================================================================

-- ---------- ENUM төрлүүд ----------
CREATE TYPE user_role          AS ENUM ('SEEKER', 'EMPLOYER', 'ADMIN');
CREATE TYPE job_status         AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');
CREATE TYPE employment_type    AS ENUM ('FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT');
CREATE TYPE application_status AS ENUM ('SUBMITTED', 'REVIEWING', 'ASSESSMENT', 'INTERVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');
CREATE TYPE question_type      AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT');

-- =====================================================================
-- 1. User Management  (US-01)
-- =====================================================================
CREATE TABLE users (
    id             BIGSERIAL    PRIMARY KEY,
    email          VARCHAR(255) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,              -- bcrypt hash; нууц үгийг шууд хадгалахгүй
    role           user_role    NOT NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ux_users_email ON users (lower(email)); -- нэг имэйлээр давхар бүртгэлгүй

-- =====================================================================
-- 2. Candidate Profile  (US-02, US-03, US-04, US-05)
-- =====================================================================
CREATE TABLE seeker_profiles (
    user_id     BIGINT       PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name   VARCHAR(150) NOT NULL,
    phone       VARCHAR(20),
    profession  VARCHAR(120),                         -- US-06 мэргэжлээр хайлтад ашиглана
    summary     TEXT,
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- US-02: "Сургууль сонгох буюу оруулах"
CREATE TABLE schools (
    id    SERIAL       PRIMARY KEY,
    name  VARCHAR(200) NOT NULL
);
CREATE UNIQUE INDEX ux_schools_name ON schools (lower(name));

-- US-02, US-03: боловсрол / төгсөлтийн мэдээлэл
CREATE TABLE educations (
    id               BIGSERIAL    PRIMARY KEY,
    seeker_id        BIGINT       NOT NULL REFERENCES seeker_profiles(user_id) ON DELETE CASCADE,
    school_id        INT          NOT NULL REFERENCES schools(id),
    degree           VARCHAR(50)  NOT NULL,           -- бакалавр, магистр …
    major            VARCHAR(150) NOT NULL,
    start_date       DATE,
    graduation_date  DATE,
    CONSTRAINT ck_edu_dates CHECK (graduation_date IS NULL OR start_date IS NULL OR graduation_date > start_date)
);
-- 2 жилийн шалгуур (US-02)-ыг багана болгон хадгалахгүй: цаг хугацаанаас хамаарч өөрчлөгддөг тул
-- src/graduation.js-ийн isEligibleGraduate() эсвэл доорх v_seeker_eligibility view-ээр тооцно.

-- US-03: ажлын туршлага
CREATE TABLE work_experiences (
    id            BIGSERIAL    PRIMARY KEY,
    seeker_id     BIGINT       NOT NULL REFERENCES seeker_profiles(user_id) ON DELETE CASCADE,
    company_name  VARCHAR(200) NOT NULL,
    position      VARCHAR(150) NOT NULL,
    start_date    DATE         NOT NULL,
    end_date      DATE,                               -- NULL = одоо ажиллаж байгаа
    description   TEXT,
    CONSTRAINT ck_exp_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- US-04, US-13: нийтлэг ур чадварын лавлах
CREATE TABLE skills (
    id    SERIAL       PRIMARY KEY,
    name  VARCHAR(100) NOT NULL
);
CREATE UNIQUE INDEX ux_skills_name ON skills (lower(name)); -- src/skills.js addSkill()-ийн том/жижиг үсэг үл харгалзах дүрэмтэй нийцнэ

-- US-04: ажил горилогч ↔ ур чадвар (M:N)
CREATE TABLE seeker_skills (
    seeker_id  BIGINT    NOT NULL REFERENCES seeker_profiles(user_id) ON DELETE CASCADE,
    skill_id   INT       NOT NULL REFERENCES skills(id),
    level      SMALLINT  CHECK (level BETWEEN 1 AND 5),
    PRIMARY KEY (seeker_id, skill_id)
);

-- US-05: профайлаас үүсгэсэн CV
CREATE TABLE cvs (
    id          BIGSERIAL    PRIMARY KEY,
    seeker_id   BIGINT       NOT NULL REFERENCES seeker_profiles(user_id) ON DELETE CASCADE,
    title       VARCHAR(150) NOT NULL DEFAULT 'Миний CV',
    snapshot    JSONB        NOT NULL,                -- үүсгэх үеийн боловсрол/туршлага/ур чадварын хуулбар
    file_path   VARCHAR(500),                         -- татаж авах PDF файлын зам
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- =====================================================================
-- 3. Employer Management  (US-11)
-- =====================================================================
CREATE TABLE companies (
    id             BIGSERIAL    PRIMARY KEY,
    owner_user_id  BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(200) NOT NULL,
    register_no    VARCHAR(20)  UNIQUE,              -- байгууллагын регистрийн дугаар
    industry       VARCHAR(120),
    description    TEXT,
    address        VARCHAR(300),
    website        VARCHAR(255),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- =====================================================================
-- 4. Job Management  (US-12, US-13)
-- =====================================================================
CREATE TABLE jobs (
    id               BIGSERIAL       PRIMARY KEY,
    company_id       BIGINT          NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title            VARCHAR(200)    NOT NULL,
    description      TEXT            NOT NULL,
    profession       VARCHAR(120)    NOT NULL,       -- US-06 мэргэжлээр хайх
    location         VARCHAR(150),
    employment_type  employment_type NOT NULL DEFAULT 'FULL_TIME',
    salary_min       INT,
    salary_max       INT,
    status           job_status      NOT NULL DEFAULT 'DRAFT',
    published_at     TIMESTAMPTZ,
    deadline         DATE,
    created_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),
    CONSTRAINT ck_salary  CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min),
    CONSTRAINT ck_publish CHECK (status = 'DRAFT' OR published_at IS NOT NULL)
);
CREATE INDEX ix_jobs_status_profession ON jobs (status, profession);

-- US-13: ажлын байрны шаардлагатай ур чадвар (M:N)
CREATE TABLE job_skills (
    job_id       BIGINT   NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_id     INT      NOT NULL REFERENCES skills(id),
    is_required  BOOLEAN  NOT NULL DEFAULT TRUE,     -- заавал / давуу тал
    min_level    SMALLINT CHECK (min_level BETWEEN 1 AND 5),
    PRIMARY KEY (job_id, skill_id)
);
CREATE INDEX ix_job_skills_skill ON job_skills (skill_id); -- US-06 ур чадвараар хайх

-- =====================================================================
-- 5. Job Application  (US-09, US-10)
-- =====================================================================
CREATE TABLE applications (
    id          BIGSERIAL          PRIMARY KEY,
    job_id      BIGINT             NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    seeker_id   BIGINT             NOT NULL REFERENCES seeker_profiles(user_id) ON DELETE CASCADE,
    cv_id       BIGINT             NOT NULL REFERENCES cvs(id),
    status      application_status NOT NULL DEFAULT 'SUBMITTED',
    applied_at  TIMESTAMPTZ        NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ        NOT NULL DEFAULT now(),
    CONSTRAINT ux_application_once UNIQUE (job_id, seeker_id)   -- US-09: давхар хүсэлтгүй
);

-- US-10: төлөв өөрчлөгдсөн түүх
CREATE TABLE application_status_history (
    id              BIGSERIAL          PRIMARY KEY,
    application_id  BIGINT             NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    old_status      application_status,
    new_status      application_status NOT NULL,
    changed_by      BIGINT             REFERENCES users(id),
    changed_at      TIMESTAMPTZ        NOT NULL DEFAULT now()
);

-- =====================================================================
-- 6. Online Assessment  (US-14, US-15)
-- =====================================================================
CREATE TABLE assessments (
    id                  BIGSERIAL    PRIMARY KEY,
    job_id              BIGINT       NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    title               VARCHAR(200) NOT NULL,
    time_limit_minutes  SMALLINT     CHECK (time_limit_minutes > 0),
    pass_score          NUMERIC(5,2),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE questions (
    id             BIGSERIAL     PRIMARY KEY,
    assessment_id  BIGINT        NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    body           TEXT          NOT NULL,
    type           question_type NOT NULL,
    points         NUMERIC(5,2)  NOT NULL DEFAULT 1 CHECK (points > 0),
    order_no       SMALLINT      NOT NULL,
    UNIQUE (assessment_id, order_no)
);

CREATE TABLE question_options (
    id           BIGSERIAL PRIMARY KEY,
    question_id  BIGINT    NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    body         TEXT      NOT NULL,
    is_correct   BOOLEAN   NOT NULL DEFAULT FALSE
);

-- Шалгалт өгсөн оролдлого: хүсэлт (application)-тэй холбогдоно → US-15 дээр ажил олгогч харна
CREATE TABLE assessment_attempts (
    id              BIGSERIAL    PRIMARY KEY,
    assessment_id   BIGINT       NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    application_id  BIGINT       NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ  NOT NULL DEFAULT now(),
    submitted_at    TIMESTAMPTZ,
    score           NUMERIC(6,2),
    UNIQUE (assessment_id, application_id)          -- нэг хүсэлтэд нэг удаа
);

CREATE TABLE attempt_answers (
    id                  BIGSERIAL    PRIMARY KEY,
    attempt_id          BIGINT       NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
    question_id         BIGINT       NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_id  BIGINT       REFERENCES question_options(id),
    text_answer         TEXT,
    points_awarded      NUMERIC(5,2),
    CONSTRAINT ck_answer_present CHECK (selected_option_id IS NOT NULL OR text_answer IS NOT NULL)
);
-- MULTIPLE_CHOICE асуултад нэг attempt_id+question_id-д олон мөр (сонгосон хувилбар бүрд нэг) байж болно.
CREATE UNIQUE INDEX ux_answer_option ON attempt_answers (attempt_id, question_id, selected_option_id)
    WHERE selected_option_id IS NOT NULL;

-- =====================================================================
-- 7. Тооцоолдог view-үүд (хадгалахгүй, query-ээр гаргана)
-- =====================================================================

-- US-02: сүүлийн 2 жилд төгссөн эсэх (src/graduation.js-тэй ижил дүрэм)
CREATE VIEW v_seeker_eligibility AS
SELECT s.user_id AS seeker_id,
       max(e.graduation_date) AS last_graduation_date,
       COALESCE(bool_or(e.graduation_date <= CURRENT_DATE
                        AND e.graduation_date >= (CURRENT_DATE - INTERVAL '2 years')), FALSE) AS is_eligible
FROM seeker_profiles s
LEFT JOIN educations e ON e.seeker_id = s.user_id
GROUP BY s.user_id;

-- US-08: ур чадварын тохироо (хувь)
CREATE VIEW v_job_match AS
SELECT sp.user_id AS seeker_id,
       j.id       AS job_id,
       count(js.skill_id)                       AS required_count,
       count(ss.skill_id)                       AS matched_count,
       CASE WHEN count(js.skill_id) = 0 THEN 100
            ELSE round(100.0 * count(ss.skill_id) / count(js.skill_id), 1) END AS match_percent
FROM seeker_profiles sp
CROSS JOIN jobs j
LEFT JOIN job_skills js   ON js.job_id = j.id AND js.is_required
LEFT JOIN seeker_skills ss ON ss.seeker_id = sp.user_id AND ss.skill_id = js.skill_id
WHERE j.status = 'PUBLISHED'
GROUP BY sp.user_id, j.id;
