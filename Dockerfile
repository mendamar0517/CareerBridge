# CareerBridge API — production image
# Build:  docker build -t careerbridge-api .
# Run:    docker run -p 3000:3000 careerbridge-api

# ---------- 1. deps: зөвхөн production хамаарлыг суулгана ----------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- 2. runtime: жижиг, root бус хэрэглэгчтэй image ----------
FROM node:20-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/health" > /dev/null || exit 1
CMD ["node", "src/server.js"]
