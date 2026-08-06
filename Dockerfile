# syntax=docker/dockerfile:1
# Reference app image (hello-web). Catalogue host removed in T0.4 B9.

FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY VERSION ./VERSION
COPY apps/hello-web/package.json apps/hello-web/
COPY packages/config/package.json packages/config/
COPY packages/site-registry/package.json packages/site-registry/
COPY packages/ui/package.json packages/ui/
COPY packages/controls/package.json packages/controls/
COPY packages/export/package.json packages/export/
COPY packages/math/package.json packages/math/
COPY packages/physics/package.json packages/physics/
COPY packages/markdown/package.json packages/markdown/
COPY packages/runtime/package.json packages/runtime/
COPY packages/site-hello/package.json packages/site-hello/
COPY packages/animation/package.json packages/animation/
COPY packages/audio/package.json packages/audio/
COPY packages/browser/package.json packages/browser/
COPY packages/render/package.json packages/render/
COPY packages/completion-report/package.json packages/completion-report/

RUN pnpm install --frozen-lockfile

COPY apps/hello-web apps/hello-web
COPY packages packages
COPY src src

ARG PLATFORM_APP_VERSION=
ENV PLATFORM_APP_VERSION=$PLATFORM_APP_VERSION
ARG PLATFORM_RUNTIME_MODE=development
ENV PLATFORM_RUNTIME_MODE=$PLATFORM_RUNTIME_MODE

RUN pnpm --filter @platform/hello-web build

FROM nginx:1.27-alpine AS runtime

COPY docker/nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/hello-web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1
