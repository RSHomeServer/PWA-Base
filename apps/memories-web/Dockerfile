# syntax=docker/dockerfile:1

FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY VERSION ./VERSION
COPY apps/memories-web/package.json apps/memories-web/
COPY packages/config/package.json packages/config/
COPY packages/site-registry/package.json packages/site-registry/
COPY packages/ui/package.json packages/ui/
COPY packages/runtime/package.json packages/runtime/
COPY packages/controls/package.json packages/controls/
COPY packages/experiences/package.json packages/experiences/
COPY packages/site-memories/package.json packages/site-memories/

RUN pnpm install --frozen-lockfile --filter @platform/memories-web...

COPY apps/memories-web apps/memories-web
COPY packages packages

ARG PLATFORM_APP_VERSION=
ENV PLATFORM_APP_VERSION=$PLATFORM_APP_VERSION
ARG PLATFORM_RUNTIME_MODE=development
ENV PLATFORM_RUNTIME_MODE=$PLATFORM_RUNTIME_MODE

RUN pnpm --filter @platform/memories-web... build

FROM nginx:1.27-alpine AS runtime

COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/memories-web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1
