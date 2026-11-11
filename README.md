# Программ хангамжийн инженерчлэл - Лабораторийн ажил №1

## Лабораторийн ажлын сэдэв

Хөгжүүлэлтийн орчин байгуулах ба Git-ашиглах

## Багийн гишүүд

| Нэр         | Scrum үүрэг   |
| ----------- | ------------- |
| О.Мэнд-Амар | Scrum Master  |
| С.Чингэрэл  | Product Owner |
| Б.Энхжин    | Developer     |

## Development Team

Манай Development Team нь багийн бүх гишүүдээс бүрдэнэ.

- О.Мэнд-Амар B232270001
- С.Чингэрэл B232270010
- Б.Энхжин B232270026

## Лабораторийн ажлын зорилго

Энэхүү лабораторийн ажлын хүрээнд Scrum багийн үүргийг ойлгох,
хөгжүүлэлтийн орчинг тохируулах, Git болон GitHub-тай ажиллах
суурь чадвар эзэмших зорилготой.

Мөн анхны repository үүсгэх, repository-г локаль компьютерт
clone хийх, README.md файл үүсгэх, өөрчлөлтүүдийг stage хийх,
commit үүсгэх болон GitHub руу push хийх үйлдлүүдийг дадлагажуулна.

## Product Owner-ийн үүрэг

- Төслийн шаардлагыг тодорхойлох
- Төслийн зорилгыг тодорхойлох
- Багийн хөгжүүлэлтийн чиглэлийг тодорхойлоход оролцох
- Багийн гишүүдтэй шаардлагуудыг хэлэлцэж баталгаажуулах

## Хөгжүүлэлтийн орчин

Манай баг дараах хөгжүүлэлтийн хэрэгслүүдийг ашиглана:

- Visual Studio Code
- Git
- GitHub
- GitLens
- Prettier

## Git workflow

Манай баг Git ашиглан дараах дарааллаар ажиллана:

1. Repository-г clone хийх
2. Файл үүсгэх эсвэл өөрчлөх
3. git status ашиглан өөрчлөлтийг шалгах
4. git add ашиглан өөрчлөлтийг stage хийх
5. git commit ашиглан өөрчлөлтийг commit хийх
6. git push ашиглан GitHub repository руу илгээх

## Хүлээгдэж буй үр дүн

Лабораторийн ажлын төгсгөлд GitHub repository дотор
README.md файл байрлаж, багийн гишүүдийн хийсэн өөрчлөлтүүд commit history хэсэгт харагдана.
## Веб апп — CareerBridge (US-01 … US-15)

React frontend болон REST API нь Product Backlog-ийн 15 User Story-г бүгдийг хэрэгжүүлнэ.

| Хэрэглэгч | Боломж | US |
| --- | --- | --- |
| Ажил горилогч | Бүртгүүлэх, нэвтрэх (JWT) | US-01 |
| | Төгсөлтийн мэдээлэл, 2 жилийн шалгуур | US-02 |
| | Профайл: боловсрол, ажлын туршлага | US-03 |
| | Ур чадвар (түвшинтэй), нэмэх/засах/устгах | US-04 |
| | Профайлаас CV үүсгэх, харах, PDF татах | US-05 |
| | Мэргэжил, ур чадвар, төрөл, байршлаар хайх | US-06 |
| | Ажлын байрны дэлгэрэнгүй | US-07 |
| | Ур чадварын тохирооны хувь, тохирсон/дутуу ур чадвар | US-08 |
| | CV-тэй хүсэлт гаргах (давхар хүсэлтгүй) | US-09 |
| | Хүсэлтийн төлөв, явц, түүх; хүсэлт буцаах | US-10 |
| | Онлайн шалгалт өгөх (цаг хэмжигч, автомат оноо) | US-14 |
| Ажил олгогч | Байгууллагын бүртгэл, мэдээлэл | US-11 |
| | Ажлын байр: ноорог → нийтлэх → хаах | US-12 |
| | Шаардлагатай ур чадвар (заавал / давуу тал, доод түвшин) | US-13 |
| | Онлайн шалгалт үүсгэх (нэг/олон сонголттой, текст асуулт) | US-14 |
| | Горилогчдын профайл, CV, шалгалтын дүн, харьцуулалт, төлөв солих | US-15 |

**Өнгөний сэдэв:** толгой хэсгийн өнгөт товчоор 5 бэлэн зохицол (Ногоон, Индиго, Teal, Терракота, Монохром) эсвэл өөрийн өнгийг сонгоно. Сонголт тухайн браузерт хадгалагдана.

### Нэг командаар ажиллуулах (Docker)

```bash
docker compose up -d --build
# Веб + API: http://localhost:3000
```

Анх асаахад `db/init/02_seed.sql` демо өгөгдлийг ачаална. Нууц үг бүгд `Demo1234`:

| Үүрэг | Имэйл |
| --- | --- |
| Ажил горилогч | `seeker@careerbridge.test` |
| Ажил олгогч | `employer@careerbridge.test` |

Өгөгдлийн сангийн volume өмнө үүссэн бол seed ачаалагдахгүй. Шинээр эхлүүлэх: `docker compose down -v && docker compose up -d --build`.

### Хөгжүүлэлтийн горим (hot reload)

```bash
docker compose up -d db                       # зөвхөн PostgreSQL
DATABASE_URL=postgresql://careerbridge:careerbridge@localhost:5432/careerbridge npm run dev   # API :3000
cd web && npm install && npm run dev          # React :5173 (/api → :3000 proxy)
```

### Бүтэц

```
src/                 Express API
  api/               /api/v1 router-ууд (auth, me, jobs, employer, applications)
  matching.js        US-08 тохирооны тооцоо
  scoring.js         US-14 автомат оноо
  cvPdf.js           US-05 PDF (PDFKit, DejaVu Sans фонт)
web/                 React 18 + Vite + Tailwind CSS
  src/pages/         Хуудсууд (горилогч, ажил олгогч)
  src/theme.jsx      Өнгөний сэдэв
db/init/             01_schema.sql (18 хүснэгт, 2 view), 02_seed.sql (демо)
```

Production image-д (`Dockerfile`) frontend-ийг тусдаа stage-д build хийж, Express `web/dist`-ийг ижил домэйноос түгээнэ. Ингэснээр CORS тохиргоо шаардлагагүй.

## CI (Лаборатори 07)

Төсөлд GitHub Actions ашигласан CI pipeline тохируулсан (`.github/workflows/ci.yml`).
`main` салбар руу push хийх болон Pull Request нээх бүрт дараах алхмууд автоматаар ажиллана:

1. Checkout – кодыг татах
2. Setup – Node.js 20 орчин тохируулах
3. Install – `npm ci`
4. Test – `npm test` (Jest)

## CI/CD (Docker + GitHub Container Registry)

`.github/workflows/ci.yml` нь 2 job-оос бүрдэнэ:

| Job | Хэзээ ажиллах | Алхмууд |
| --- | --- | --- |
| `build-and-test` | push, PR → `main` | PostgreSQL 16 service → checkout → Node.js 20 → `npm ci` → схем ачаалах → `npm test` |
| `docker` | `build-and-test` амжилттай болсны дараа | image build → `/health` smoke test → **зөвхөн `main` руу push хийхэд** GHCR руу push |

Image: `ghcr.io/mendamar0517/careerbridge:latest` болон `:sha-<commit>`.
Image нь multi-arch: `linux/amd64` (сервер, Render) болон `linux/arm64` (Apple Silicon Mac).

### Локалд ажиллуулах

```bash
npm install
npm start                          # http://localhost:3000/health  (frontend: доорх «Веб апп» хэсэг)

# эсвэл Docker-оор (API + PostgreSQL)
docker compose up -d --build
```

### Registry-ээс татаж ажиллуулах

```bash
docker pull ghcr.io/mendamar0517/careerbridge:latest
docker run -d --name careerbridge -p 3000:3000 ghcr.io/mendamar0517/careerbridge:latest

# Сервер асах хүртэл хүлээгээд шалгах (асаж амжаагүй үед "Connection reset by peer" гарна)
until curl -fsS localhost:3000/health; do sleep 1; done

docker rm -f careerbridge          # дууссаны дараа
```

Package нь **public** тул нэвтрэлтгүй pull хийнэ.

### API endpoint-ууд

| Method | Зам | Тайлбар |
| --- | --- | --- |
| `GET` | `/health` | Төлөв шалгах (Docker HEALTHCHECK, k8s probe). `instance` = контейнер/Pod-ийн нэр |
| `GET` | `/health/db` | PostgreSQL холболт: хүснэгт, view-ийн тоо (DB байхгүй бол 503) |
| `GET` | `/metrics` | Prometheus metrics: хүсэлтийн тоо, хариу өгөх хугацаа, Node.js процесс (Лаб 13) |
| `POST` | `/api/v1/registrations/validate` | US-01 бүртгэлийн өгөгдлийг шалгах: 200 эсвэл 400 + `errors` |
| `POST` | `/api/v1/auth/register`, `/auth/login`, `GET /auth/me` | US-01, US-11 бүртгэл, нэвтрэлт (JWT) |
| `GET/PUT` | `/api/v1/me/profile`, `/me/educations`, `/me/experiences`, `/me/skills`, `/me/eligibility` | US-02 … US-04 профайл (ажил горилогч) |
| `GET/POST` | `/api/v1/me/cvs`, `GET /cvs/:id/pdf` | US-05 CV, PDF |
| `GET` | `/api/v1/jobs?q=&profession=&skill=&type=&location=&sort=match` | US-06, US-08 хайлт, тохироо |
| `GET` | `/api/v1/jobs/:id`, `POST /jobs/:id/apply` | US-07, US-09 |
| `GET/POST` | `/api/v1/me/applications`, `/:id/withdraw`, `/:id/assessment`, `/:id/assessment/submit` | US-10, US-14 |
| `GET/POST/PUT` | `/api/v1/employer/company`, `/employer/jobs`, `/jobs/:id/publish`, `/jobs/:id/skills`, `/jobs/:id/assessment` | US-11 … US-14 |
| `GET/PATCH` | `/api/v1/employer/jobs/:id/applicants`, `/employer/applications/:id/status` | US-15, US-10 |

### Pipeline-ийн баталгаажуулалт (2026-10-23)

| Шат | Үр дүн |
| --- | --- |
| Build + тест | PR #29, #30 дээр `build-and-test`, `docker` job ногоон (15/15 тест) |
| Registry руу push | `main` (`64d1d7f`) дээр GHCR руу amd64 + arm64 image push хийгдсэн |
| Pull хийж ажиллуулах | Apple Silicon Mac дээр `docker pull` → контейнер `Up (healthy)` |
| Ажиллагаа | `GET /health` → `{"status":"ok","service":"careerbridge-api","version":"0.1.0",…}` |

Илэрсэн асуудал ба засвар:

- **`no matching manifest for linux/arm64/v8`**: image зөвхөн amd64 байсан → QEMU + `platforms: linux/amd64,linux/arm64` нэмэв (PR #30).
- **`curl: (56) Connection reset by peer`**: `docker run -d`-ийн дараа шууд хандахад Node сервер асаж амжаагүй → дээрх `until curl …` хүлээлтээр шийднэ.

### Дараагийн алхам

- Production (Render) руу байршуулах: GHCR image + deploy hook (`secrets.RENDER_DEPLOY_HOOK`).
- PostgreSQL (Neon) холболт: `DATABASE_URL` environment variable.

## Лаборатори 08 — Docker

Dockerfile, image бүтээх, ажиллуулах, Docker Compose болон layer caching-ийн алхмууд: [docs/lab08.md](docs/lab08.md).

## Лаборатори 09 — Kubernetes (Minikube)

Deployment (3 replica), Service (NodePort 30080), self-healing: [docs/lab09.md](docs/lab09.md). Manifest-ууд: [`k8s/`](k8s/).

## Лаборатори 10 — Автомат тест

AAA бүтэцтэй unit тест, хилийн тохиолдол, `jest.fn()` mock, CI дээрх coverage: [docs/lab10.md](docs/lab10.md).

## Лаборатори 11 — Статик шинжилгээ, эмзэг байдал

ESLint (security, sonarjs, n), `npm audit`, Dependabot, CI gate: [docs/lab11.md](docs/lab11.md).

## Лаборатори 12 — AI ашиглан код бичих, review

Prompt харьцуулалт, AI-ийн кодын review, ашиглалтын тэмдэглэл: [docs/lab12.md](docs/lab12.md).

## Лаборатори 13 — Prometheus, Grafana

`docker compose up -d --build` → Prometheus http://localhost:9090, Grafana http://localhost:3001. Дэлгэрэнгүй: [docs/lab13.md](docs/lab13.md).

