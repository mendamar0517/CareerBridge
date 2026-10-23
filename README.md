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
docker run -p 3000:3000 ghcr.io/mendamar0517/careerbridge:latest
```

> GHCR дээр анх үүссэн package нь **private** байдаг. Нэвтрэлтгүй pull хийх бол
> GitHub → Packages → careerbridge → Package settings → *Change visibility* → Public болгоно.

