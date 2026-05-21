# =============================================================================
# Stage 1: builder — compila, instala Chromium e prepara artefatos de produção
# =============================================================================
FROM node:22-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./

RUN npm ci --ignore-scripts

COPY . .

ENV PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright

RUN npx prisma generate \
  && npm run build \
  && mkdir -p /app/.cache/ms-playwright \
  && npx playwright install chromium \
  && npm prune --omit=dev \
  && npm cache clean --force

# =============================================================================
# Stage 2: runner — imagem final (copia somente do builder)
# =============================================================================
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
  PORT=3000 \
  PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright

RUN groupadd --system app \
  && useradd --system --gid app --home-dir /app --no-create-home app

COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/src/infra/db/prisma ./src/infra/db/prisma
COPY --from=builder --chown=app:app /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=app:app /app/.cache/ms-playwright ./.cache/ms-playwright
COPY --from=builder --chown=app:app /app/docker/entrypoint.sh ./docker/entrypoint.sh

RUN npx playwright install-deps chromium

RUN chmod +x /app/docker/entrypoint.sh \
  && mkdir -p /app/output \
  && chown -R app:app /app/output

USER app

EXPOSE 3000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
