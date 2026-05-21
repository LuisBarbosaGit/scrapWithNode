# =============================================================================
# Stage 1: deps — instala dependências (inclui devDeps para build e Prisma)
# =============================================================================
FROM node:22-alpine AS deps

WORKDIR /app

# Copia apenas manifests para aproveitar cache de camadas do Docker
COPY package.json package-lock.json ./

# Ignora postinstall (prisma generate) — schema ainda não foi copiado neste stage
RUN npm ci --ignore-scripts

# =============================================================================
# Stage 2: builder — gera Prisma Client, compila TypeScript e instala Chromium
# =============================================================================
FROM node:22-slim AS builder

WORKDIR /app

# Dependências do SO exigidas pelo Playwright (Chromium headless)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Cliente Prisma + artefatos compilados
ENV PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright

RUN npx prisma generate \
  && npm run build \
  && mkdir -p /app/.cache/ms-playwright \
  && npx playwright install chromium

# =============================================================================
# Stage 3: runner — imagem final enxuta, usuário não-root, porta exposta
# =============================================================================
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
  PORT=3000 \
  PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright

# Mesmas libs de runtime do Chromium (sem toolchain de build)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libgbm1 \
    libasound2 \
  && rm -rf /var/lib/apt/lists/*

# Usuário dedicado (não executa como root)
RUN groupadd --system app \
  && useradd --system --gid app --home-dir /app --no-create-home app

COPY --from=builder --chown=app:app /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/src/infra/db/prisma ./src/infra/db/prisma
COPY --from=builder --chown=app:app /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=app:app /app/.cache/ms-playwright ./.cache/ms-playwright
COPY --from=builder --chown=app:app /app/docker/entrypoint.sh ./docker/entrypoint.sh

RUN chmod +x /app/docker/entrypoint.sh \
  && mkdir -p /app/output \
  && chown -R app:app /app/output

USER app

EXPOSE 3000

ENTRYPOINT ["/app/docker/entrypoint.sh"]
