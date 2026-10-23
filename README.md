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
| `build-and-test` | push, PR → `main` | checkout → Node.js 20 → `npm ci` → `npm test` |
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
| `GET` | `/health` | Төлөв шалгах (Docker HEALTHCHECK, CI smoke test) |
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

