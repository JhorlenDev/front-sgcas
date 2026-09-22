FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# A latencia ate o registry e alta na VPS: poucas conexoes e retentativa
# terminam antes do que 15 conexoes que o link derruba no meio.
RUN npm_config_maxsockets=5 npm ci --fetch-retries=5 --fetch-retry-mintimeout=20000
COPY . .
# SGCAS_API_URL entra nos rewrites do next.config.ts, que sao resolvidos no build.
ARG SGCAS_API_URL
ENV SGCAS_API_URL=$SGCAS_API_URL
ENV NODE_ENV=production
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
# 127.0.0.1 e nao localhost: no Alpine localhost resolve primeiro para ::1, e o
# servidor escuta so em IPv4 — o check falharia com a app no ar.
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/login/ || exit 1
CMD ["node", "server.js"]
