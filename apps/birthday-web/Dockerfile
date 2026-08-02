# syntax=docker/dockerfile:1
# Solo Birthday packaging proof (ADR-004). Enable via:
#   docker compose --profile solo up -d --build birthday-web

FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY VERSION ./VERSION
COPY apps/birthday-web/package.json apps/birthday-web/
COPY packages/config/package.json packages/config/
COPY packages/site-registry/package.json packages/site-registry/
COPY packages/ui/package.json packages/ui/
COPY packages/controls/package.json packages/controls/
COPY packages/runtime/package.json packages/runtime/
COPY packages/experiences/package.json packages/experiences/
COPY packages/site-memories/package.json packages/site-memories/
COPY packages/site-birthday/package.json packages/site-birthday/

RUN pnpm install --frozen-lockfile --filter @platform/birthday-web...

COPY apps/birthday-web apps/birthday-web
COPY packages/config packages/config
COPY packages/site-registry packages/site-registry
COPY packages/ui packages/ui
COPY packages/controls packages/controls
COPY packages/runtime packages/runtime
COPY packages/experiences packages/experiences
COPY packages/site-memories packages/site-memories
COPY packages/site-birthday packages/site-birthday

ARG PLATFORM_APP_VERSION=
ENV PLATFORM_APP_VERSION=$PLATFORM_APP_VERSION
ARG PLATFORM_RUNTIME_MODE=development
ENV PLATFORM_RUNTIME_MODE=$PLATFORM_RUNTIME_MODE

RUN pnpm --filter @platform/birthday-web... build

FROM nginx:1.27-alpine AS runtime

COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/birthday-web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1
