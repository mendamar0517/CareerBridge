# Лаборатори 08 — Dockerfile бичих, Image бүтээх, ажиллуулах

F.CSA316 · 9-р долоо хоног · CLO4 · Баг 11

## Зорилго

1. Dockerfile бие даан бичиж, layer caching-ийн зарчмыг ашиглах
2. Docker image бүтээж, container ажиллуулах
3. Docker Compose ашиглан олон сервис (API + PostgreSQL) зэрэг ажиллуулах

## Алхам ба командууд

Бүх командыг repo-гийн үндсэн хавтсанд ажиллуулна.

| № | Алхам | Команд | Хүлээгдэх үр дүн |
| --- | --- | --- | --- |
| 1 | Docker шалгах | `docker --version` | `Docker version 2x.x.x` |
| 2 | Апп бэлдэх | `git pull` | CareerBridge API (Express) |
| 3 | Dockerfile | [`Dockerfile`](../Dockerfile) | `package*.json` → `npm ci` → `src/` дараалал |
| 4 | Image бүтээх | `docker build -t careerbridge:1.0 .` | `naming to docker.io/library/careerbridge:1.0` |
| 5 | Container ажиллуулах | `docker run -d --name cb -p 3000:3000 careerbridge:1.0` | http://localhost:3000/health → `"status":"ok"` |
| 6 | Лог харах | `docker logs cb` | `CareerBridge API http://localhost:3000 дээр ажиллаж байна` |
| 7 | Docker Compose | `docker compose up -d --build` | http://localhost:3000/health/db → `"tables":18,"views":2` |
| 8 | Layer caching | доорх хэсгийг үзнэ үү | `npm ci` layer `CACHED` |

### 5–6. Container ажиллуулах ба лог

```bash
docker run -d --name cb -p 3000:3000 careerbridge:1.0
until curl -fsS localhost:3000/health; do sleep 1; done   # сервер асах хүртэл хүлээнэ
docker ps --filter name=cb          # STATUS: Up … (healthy)
docker logs cb
docker rm -f cb
```

Энэ горимд `DATABASE_URL` өгөөгүй тул `/health/db` нь `503` буцаана. Энэ нь хэвийн үзэгдэл.

### 7. Docker Compose (API + PostgreSQL 16)

```bash
docker compose up -d --build
docker compose ps                   # api, db хоёулаа (healthy)
curl localhost:3000/health/db
# {"status":"ok","database":"postgresql","version":"16.x","tables":18,"views":2}
docker compose logs api
docker compose down                 # өгөгдөл cb-pgdata volume-д хадгалагдана
```

`api` service нь `db`-г `service_healthy` болсны дараа асна. DB-д контейнерийн дотоод сүлжээгээр `db:5432` хаягаар холбогдоно.

### 8. Layer caching ажиглах

```bash
# (а) Анхны build — бүх layer шинээр
docker build -t careerbridge:1.0 .

# (б) Кодонд жижиг өөрчлөлт хийнэ (жишээ нь src/app.js-ийн service нэрийг өөрчлөх)
#     Жич: package.json өөрчлөхгүй

# (в) Дахин build хийнэ
docker build --progress=plain -t careerbridge:1.1 . 2>&1 | grep -E "CACHED|DONE|\[(deps|runtime)"
```

Хүлээгдэх үр дүн:

| Layer | 2 дахь build |
| --- | --- |
| `FROM node:20-alpine` | `CACHED` |
| `COPY package.json package-lock.json ./` | `CACHED` |
| `RUN npm ci --omit=dev` (хамгийн удаан) | `CACHED` |
| `COPY --from=deps … node_modules` | `CACHED` |
| `COPY src ./src` | **дахин build хийгдэнэ** (код өөрчлөгдсөн) |

Хэрэв `COPY . .`-ийг `npm ci`-ээс өмнө бичсэн бол код өөрчлөгдөх бүрт `npm ci` дахин ажиллана. Энэ нь буруу дараалал юм.

## Хүлээлгэж өгөх зүйл (deliverable)

- [x] `Dockerfile`: зөв дараалал, multi-stage, root бус хэрэглэгч, HEALTHCHECK
- [ ] Screenshot 1: ажиллаж буй апп (`/health` эсвэл `/health/db` + `docker ps`)
- [ ] Screenshot 2: build output, 2 дахь build-д `CACHED` мөрүүд
