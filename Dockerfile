# CareerBridge API — production image (Лаб 08)
# Build:  docker build -t careerbridge:1.0 .
# Run:    docker run -p 3000:3000 careerbridge:1.0
#
# Layer caching: Docker заавар бүрийг нэг layer болгон кэшилнэ. Аль нэг layer-ийн
# оролт өөрчлөгдвөл тэр layer болон түүнээс ХОЙШХИ бүх layer дахин build хийгдэнэ.
# Тиймээс ховор өөрчлөгддөг зүйлийг (package*.json → npm ci) эхэнд, байнга
# өөрчлөгддөг кодыг (src/) хамгийн сүүлд хуулна. Код л өөрчлөгдвөл npm ci кэшнээс авна.

# ---------- 1. deps: зөвхөн production хамаарлыг суулгана ----------
FROM node:20-alpine AS deps
WORKDIR /app
# (1) Зөвхөн хамаарлын жагсаалт — package*.json өөрчлөгдөөгүй бол дараагийн RUN кэшнээс
COPY package.json package-lock.json ./
# (2) Хамгийн удаан алхам — ихэнх build-д CACHED болно
RUN npm ci --omit=dev && npm cache clean --force

# ---------- 2. runtime: жижиг, root бус хэрэглэгчтэй image ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
# (3) Аппын код хамгийн сүүлд — код өөрчлөгдөхөд зөвхөн энэ layer дахин build хийгдэнэ
COPY --chown=node:node src ./src
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" > /dev/null || exit 1
CMD ["node", "src/server.js"]
