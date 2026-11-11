-- =====================================================================
-- CareerBridge — демо өгөгдөл (зөвхөн локал/демо орчинд)
-- Бүх байгууллага, хүн, ажлын байр зохиомол. Нууц үг бүгд: Demo1234
--   Ажил горилогч:  seeker@careerbridge.test   (Бат-Эрдэнэ, 2025 онд төгссөн)
--                   nomin@careerbridge.test    (Номин, хүсэлт гаргасан)
--   Ажил олгогч:    employer@careerbridge.test (Алтан Код ХХК)
-- Огноонуудыг now()/CURRENT_DATE-ээс хамааруулсан тул "Шинэ", "Яаралтай" шошго үргэлж харагдана.
-- =====================================================================
DO $$
DECLARE
  pwd   CONSTANT TEXT := '$2b$12$qmC1dSwmaL5Tayxd1ZHV9uspnGZKq2QN0QhYIMm/rNquI89FoejBK';
  u_seeker BIGINT; u_nomin BIGINT; u_emp1 BIGINT; u_emp2 BIGINT; u_emp3 BIGINT; u_emp4 BIGINT;
  c1 BIGINT; c2 BIGINT; c3 BIGINT; c4 BIGINT;
  j1 BIGINT; j2 BIGINT; j3 BIGINT; j4 BIGINT; j5 BIGINT; j6 BIGINT; j7 BIGINT;
  a1 BIGINT; q1 BIGINT; q2 BIGINT; q3 BIGINT; q4 BIGINT;
  cv_nomin BIGINT; app_nomin BIGINT;
BEGIN
  -- ---------- Ур чадварын лавлах ----------
  INSERT INTO skills (name) VALUES
    ('JavaScript'), ('TypeScript'), ('Node.js'), ('React'), ('SQL'), ('PostgreSQL'), ('Git'), ('Docker'),
    ('Python'), ('Jest'), ('Selenium'), ('Power BI'), ('Excel'), ('Figma'), ('Java'), ('Linux'), ('REST API'), ('Англи хэл');

  INSERT INTO schools (name) VALUES ('ШУТИС'), ('МУИС'), ('СЭЗИС'), ('ХААИС'), ('Монгол-Германы хамтарсан МТИС');

  -- ---------- Хэрэглэгчид ----------
  INSERT INTO users (email, password_hash, role) VALUES ('seeker@careerbridge.test', pwd, 'SEEKER') RETURNING id INTO u_seeker;
  INSERT INTO users (email, password_hash, role) VALUES ('nomin@careerbridge.test', pwd, 'SEEKER') RETURNING id INTO u_nomin;
  INSERT INTO users (email, password_hash, role) VALUES ('employer@careerbridge.test', pwd, 'EMPLOYER') RETURNING id INTO u_emp1;
  INSERT INTO users (email, password_hash, role) VALUES ('hangai@careerbridge.test', pwd, 'EMPLOYER') RETURNING id INTO u_emp2;
  INSERT INTO users (email, password_hash, role) VALUES ('tenger@careerbridge.test', pwd, 'EMPLOYER') RETURNING id INTO u_emp3;
  INSERT INTO users (email, password_hash, role) VALUES ('suld@careerbridge.test', pwd, 'EMPLOYER') RETURNING id INTO u_emp4;

  -- ---------- Ажил горилогчид ----------
  INSERT INTO seeker_profiles (user_id, full_name, phone, profession, summary) VALUES
    (u_seeker, 'Бат-Эрдэнэ Дорж', '99112233', 'Программ хангамжийн инженер',
     'Backend хөгжүүлэлт, өгөгдлийн сангийн чиглэлээр ажиллах сонирхолтой. Node.js, PostgreSQL дээр курсын төсөл хийсэн.'),
    (u_nomin, 'Номин Ганбаатар', '88001122', 'Мэдээллийн технологи',
     'Frontend болон чанарын баталгаажуулалтын чиглэлээр туршлага хуримтлуулж буй.');

  INSERT INTO educations (seeker_id, school_id, degree, major, start_date, graduation_date) VALUES
    (u_seeker, (SELECT id FROM schools WHERE name = 'ШУТИС'), 'BACHELOR', 'Программ хангамжийн инженерчлэл', '2021-09-01', '2025-06-15'),
    (u_nomin, (SELECT id FROM schools WHERE name = 'МУИС'), 'BACHELOR', 'Мэдээллийн технологи', '2021-02-01', '2025-01-20');

  INSERT INTO work_experiences (seeker_id, company_name, position, start_date, end_date, description) VALUES
    (u_seeker, 'Номад Софт ХХК', 'Backend дадлагажигч', '2024-06-01', '2024-08-31', 'REST API хөгжүүлж, Jest-ээр unit тест бичсэн.'),
    (u_nomin, 'Вэб Студио ХХК', 'Frontend хөгжүүлэгч', '2024-08-01', NULL, 'React дээр вэб апп хөгжүүлж байна.');

  INSERT INTO seeker_skills (seeker_id, skill_id, level)
  SELECT u_seeker, id, lvl FROM (VALUES ('JavaScript', 4), ('Node.js', 4), ('SQL', 3), ('Git', 4), ('React', 3)) v(n, lvl) JOIN skills s ON s.name = v.n;
  INSERT INTO seeker_skills (seeker_id, skill_id, level)
  SELECT u_nomin, id, lvl FROM (VALUES ('JavaScript', 4), ('React', 4), ('Git', 3), ('Jest', 3), ('Figma', 3)) v(n, lvl) JOIN skills s ON s.name = v.n;

  -- ---------- Байгууллагууд ----------
  INSERT INTO companies (owner_user_id, name, register_no, industry, description, address, website) VALUES
    (u_emp1, 'Алтан Код ХХК', '6123456', 'Программ хангамж', 'Санхүүгийн байгууллагуудад зориулсан программ хангамж хөгжүүлдэг.', 'Улаанбаатар, Сүхбаатар дүүрэг', 'https://example.com')
    RETURNING id INTO c1;
  INSERT INTO companies (owner_user_id, name, industry, description, address) VALUES
    (u_emp2, 'Хангай Дата ХХК', 'Өгөгдөл, аналитик', 'Өгөгдлийн платформ, BI шийдэл нийлүүлдэг.', 'Улаанбаатар, Хан-Уул дүүрэг') RETURNING id INTO c2;
  INSERT INTO companies (owner_user_id, name, industry, description, address) VALUES
    (u_emp3, 'Тэнгэр Финтек ХХК', 'Финтек', 'Мобайл төлбөрийн шийдэл хөгжүүлдэг.', 'Улаанбаатар, Чингэлтэй дүүрэг') RETURNING id INTO c3;
  INSERT INTO companies (owner_user_id, name, industry, description, address) VALUES
    (u_emp4, 'Сүлд Аналитикс ХХК', 'Судалгаа, зөвлөгөө', 'Зах зээлийн судалгаа, өгөгдлийн шинжилгээ.', 'Улаанбаатар, Баянзүрх дүүрэг') RETURNING id INTO c4;

  -- ---------- Ажлын байр ----------
  INSERT INTO jobs (company_id, title, description, profession, location, employment_type, salary_min, salary_max, status, published_at, deadline) VALUES
    (c1, 'Junior Backend хөгжүүлэгч', E'Манай баг санхүүгийн системийн REST API хөгжүүлэх Junior хөгжүүлэгч хайж байна.\n\nҮүрэг:\n• Node.js дээр API хөгжүүлэх\n• PostgreSQL query бичих, оновчлох\n• Код review-д оролцох\n\nБид санал болгох нь: ментор, сургалт, уян хатан цаг.',
     'Программ хангамжийн инженер', 'Улаанбаатар', 'FULL_TIME', 2500000, 3500000, 'PUBLISHED', now() - interval '6 hours', CURRENT_DATE + 5) RETURNING id INTO j1;
  INSERT INTO jobs (company_id, title, description, profession, location, employment_type, salary_min, salary_max, status, published_at, deadline) VALUES
    (c2, 'Full-stack дадлагажигч', E'3 сарын төлбөртэй дадлага. Амжилттай дуусгасан тохиолдолд үндсэн ажилтнаар авна.\n\n• React, Node.js ашиглан дотоод систем хөгжүүлэх\n• Docker орчинд ажиллах',
     'Программ хангамжийн инженер', 'Улаанбаатар · Hybrid', 'INTERNSHIP', 1200000, 1200000, 'PUBLISHED', now() - interval '1 day', CURRENT_DATE + 20) RETURNING id INTO j2;
  INSERT INTO jobs (company_id, title, description, profession, location, employment_type, salary_min, salary_max, status, published_at, deadline) VALUES
    (c3, 'QA инженер', E'Мобайл болон вэб аппликейшний чанарыг баталгаажуулах инженер.\n\n• Тест кейс боловсруулах\n• Jest, Selenium-оор автомат тест бичих',
     'Чанарын баталгаажуулалт', 'Улаанбаатар', 'FULL_TIME', 2000000, 2800000, 'PUBLISHED', now() - interval '5 days', CURRENT_DATE + 3) RETURNING id INTO j3;
  INSERT INTO jobs (company_id, title, description, profession, location, employment_type, salary_min, salary_max, status, published_at, deadline) VALUES
    (c4, 'Data analyst (Junior)', E'Судалгааны өгөгдөлд шинжилгээ хийж, тайлан бэлтгэнэ.\n\n• SQL, Python-оор өгөгдөл боловсруулах\n• Power BI dashboard хийх',
     'Өгөгдлийн шинжээч', 'Улаанбаатар', 'CONTRACT', 2200000, NULL, 'PUBLISHED', now() - interval '7 days', NULL) RETURNING id INTO j4;
  INSERT INTO jobs (company_id, title, description, profession, location, employment_type, salary_min, salary_max, status, published_at, deadline) VALUES
    (c1, 'Frontend хөгжүүлэгч (React)', E'Харилцагчийн вэб аппын интерфейс хөгжүүлнэ.\n\n• React, TypeScript\n• Дизайнертай хамтран ажиллах',
     'Программ хангамжийн инженер', 'Улаанбаатар', 'FULL_TIME', 2800000, 3800000, 'PUBLISHED', now() - interval '2 days', CURRENT_DATE + 14) RETURNING id INTO j5;
  INSERT INTO jobs (company_id, title, description, profession, location, employment_type, salary_min, salary_max, status, published_at, deadline) VALUES
    (c2, 'Өгөгдлийн сангийн туслах (цагийн)', E'Оюутан болон шинэ төгсөгчдөд тохиромжтой, долоо хоногт 20 цаг.\n\n• PostgreSQL нөөцлөлт, хяналт\n• Linux орчин',
     'Өгөгдлийн сангийн администратор', 'Зайнаас', 'PART_TIME', 900000, 1300000, 'PUBLISHED', now() - interval '10 days', CURRENT_DATE + 30) RETURNING id INTO j6;
  INSERT INTO jobs (company_id, title, description, profession, location, employment_type, salary_min, salary_max, status) VALUES
    (c1, 'DevOps дадлагажигч', 'Ноорог — шаардлагыг боловсруулж байна.', 'DevOps инженер', 'Улаанбаатар', 'INTERNSHIP', NULL, NULL, 'DRAFT') RETURNING id INTO j7;

  INSERT INTO job_skills (job_id, skill_id, is_required, min_level)
  SELECT j, s.id, req, lvl FROM (VALUES
    (j1, 'Node.js', TRUE, 3), (j1, 'SQL', TRUE, 3), (j1, 'Git', TRUE, 2), (j1, 'JavaScript', TRUE, 3), (j1, 'Docker', FALSE, NULL),
    (j2, 'React', TRUE, 2), (j2, 'Node.js', TRUE, 2), (j2, 'Git', TRUE, 2), (j2, 'Docker', TRUE, 1),
    (j3, 'JavaScript', TRUE, 2), (j3, 'SQL', TRUE, 2), (j3, 'Jest', TRUE, 2), (j3, 'Selenium', TRUE, 2),
    (j4, 'SQL', TRUE, 3), (j4, 'Python', TRUE, 2), (j4, 'Power BI', TRUE, 2), (j4, 'Excel', TRUE, 3),
    (j5, 'React', TRUE, 3), (j5, 'TypeScript', TRUE, 2), (j5, 'JavaScript', TRUE, 3), (j5, 'Figma', FALSE, NULL),
    (j6, 'PostgreSQL', TRUE, 2), (j6, 'Linux', TRUE, 2), (j6, 'SQL', TRUE, 2),
    (j7, 'Docker', TRUE, 2), (j7, 'Linux', TRUE, 2)
  ) v(j, n, req, lvl) JOIN skills s ON s.name = v.n;

  -- ---------- Онлайн шалгалт (Junior Backend) ----------
  INSERT INTO assessments (job_id, title, time_limit_minutes, pass_score) VALUES (j1, 'Backend суурь мэдлэгийн шалгалт', 15, 60) RETURNING id INTO a1;
  INSERT INTO questions (assessment_id, body, type, points, order_no) VALUES (a1, 'HTTP-ийн аль арга (method) нь шинэ нөөц үүсгэхэд ихэвчлэн хэрэглэгддэг вэ?', 'SINGLE_CHOICE', 1, 1) RETURNING id INTO q1;
  INSERT INTO question_options (question_id, body, is_correct) VALUES (q1, 'GET', FALSE), (q1, 'POST', TRUE), (q1, 'DELETE', FALSE), (q1, 'HEAD', FALSE);
  INSERT INTO questions (assessment_id, body, type, points, order_no) VALUES (a1, 'SQL-ийн аль түлхүүр үгс өгөгдлийг шүүх, бүлэглэхэд хэрэглэгддэг вэ? (олон хариулттай)', 'MULTIPLE_CHOICE', 2, 2) RETURNING id INTO q2;
  INSERT INTO question_options (question_id, body, is_correct) VALUES (q2, 'WHERE', TRUE), (q2, 'GROUP BY', TRUE), (q2, 'DROP', FALSE), (q2, 'HAVING', TRUE);
  INSERT INTO questions (assessment_id, body, type, points, order_no) VALUES (a1, 'Нууц үгийг өгөгдлийн санд хэрхэн хадгалах нь зөв бэ?', 'SINGLE_CHOICE', 1, 3) RETURNING id INTO q3;
  INSERT INTO question_options (question_id, body, is_correct) VALUES (q3, 'Энгийн текстээр', FALSE), (q3, 'Base64-ээр кодлоод', FALSE), (q3, 'bcrypt зэрэг давстай hash-аар', TRUE);
  INSERT INTO questions (assessment_id, body, type, points, order_no) VALUES (a1, 'Өөрийн хийсэн нэг төслийн архитектурыг товч тайлбарлана уу.', 'TEXT', 2, 4) RETURNING id INTO q4;

  -- ---------- Номины хүсэлт (US-15 харьцуулалтад) ----------
  INSERT INTO cvs (seeker_id, title, snapshot) VALUES (u_nomin, 'Миний CV', jsonb_build_object(
    'profile', jsonb_build_object('fullName', 'Номин Ганбаатар', 'email', 'nomin@careerbridge.test', 'phone', '88001122',
                                  'profession', 'Мэдээллийн технологи', 'summary', 'Frontend болон чанарын баталгаажуулалтын чиглэлээр туршлага хуримтлуулж буй.'),
    'educations', jsonb_build_array(jsonb_build_object('school', 'МУИС', 'degree', 'BACHELOR', 'major', 'Мэдээллийн технологи', 'startDate', '2021-02-01', 'graduationDate', '2025-01-20')),
    'experiences', jsonb_build_array(jsonb_build_object('companyName', 'Вэб Студио ХХК', 'position', 'Frontend хөгжүүлэгч', 'startDate', '2024-08-01', 'endDate', NULL, 'description', 'React дээр вэб апп хөгжүүлж байна.')),
    'skills', jsonb_build_array(jsonb_build_object('name', 'JavaScript', 'level', 4), jsonb_build_object('name', 'React', 'level', 4),
                                jsonb_build_object('name', 'Git', 'level', 3), jsonb_build_object('name', 'Jest', 'level', 3), jsonb_build_object('name', 'Figma', 'level', 3)),
    'eligible', TRUE, 'generatedAt', now()))
  RETURNING id INTO cv_nomin;
  INSERT INTO applications (job_id, seeker_id, cv_id, status, applied_at) VALUES (j1, u_nomin, cv_nomin, 'REVIEWING', now() - interval '3 hours') RETURNING id INTO app_nomin;
  INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, changed_at) VALUES
    (app_nomin, NULL, 'SUBMITTED', u_nomin, now() - interval '3 hours'),
    (app_nomin, 'SUBMITTED', 'REVIEWING', u_emp1, now() - interval '1 hour');
  INSERT INTO applications (job_id, seeker_id, cv_id, status, applied_at) VALUES (j5, u_nomin, cv_nomin, 'SUBMITTED', now() - interval '1 day') RETURNING id INTO app_nomin;
  INSERT INTO application_status_history (application_id, old_status, new_status, changed_by, changed_at) VALUES
    (app_nomin, NULL, 'SUBMITTED', u_nomin, now() - interval '1 day');
END $$;
