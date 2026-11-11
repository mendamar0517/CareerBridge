# CareerBridge API — production image (Лаб 08)
# Build:  docker build -t careerbridge:1.0 .
# Run:    docker run -p 3000:3000 careerbridge:1.0
#
# Layer caching: Docker заавар бүрийг нэг layer болгон кэшилнэ. Аль нэг layer-ийн
# оролт өөрчлөгдвөл тэр layer болон түүнээс ХОЙШХИ бүх layer дахин build хийгдэнэ.
# Тиймээс ховор өөрчлөгддөг зүйлийг (package*.json → npm ci) эхэнд, байнга
# өөрчлөгддөг кодыг (src/) хамгийн сүүлд хуулна. Код л өөрчлөгдвөл npm ci кэшнээс авна.

# ---------- 1. deps: зөвхөн production хамаарлыг суулгана ----------
FROM node:26-alpine AS deps
WORKDIR /app
# (1) Зөвхөн хамаарлын жагсаалт — package*.json өөрчлөгдөөгүй бол дараагийн RUN кэшнээс
COPY package.json package-lock.json ./
# (2) Хамгийн удаан алхам — ихэнх build-д CACHED болно
RUN npm ci --omit=dev && npm cache clean --force

# ---------- 2. web: React frontend-ийг build хийнэ (зөвхөн dist/ нь runtime-д орно) ----------
# Статик файл (dist/) нь CPU архитектураас үл хамаарах тул build хийх машины платформ дээр нэг удаа build хийнэ
# (arm64-ийг QEMU-ээр удаан build хийхээс зайлсхийнэ)
FROM --platform=$BUILDPLATFORM node:26-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci && npm cache clean --force
COPY web/ ./
RUN npm run build

# ---------- 3. runtime: жижиг, root бус хэрэглэгчтэй image ----------
FROM node:26-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
# CV PDF-ийн кирилл фонт (US-05), frontend build
COPY --chown=node:node assets ./assets
COPY --from=web --chown=node:node /web/dist ./web/dist
# (3) Аппын код хамгийн сүүлд — код өөрчлөгдөхөд зөвхөн энэ layer дахин build хийгдэнэ
COPY --chown=node:node src ./src
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" > /dev/null || exit 1
CMD ["node", "src/server.js"]
