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
npm start                          # http://localhost:3000/health

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

