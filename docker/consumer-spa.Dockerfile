# syntax=docker/dockerfile:1
#
# Generic production image for a sibling PWA that depends on
# `@songara/pwa-base` via `file:../PWA-Base`.
#
# Build context MUST be the parent directory that contains both checkouts, e.g.
#   ~/projects/PWA-Base + ~/projects/Recipe-PWA
#
# Prefer the helper (writes a scoped parent .dockerignore for the build):
#   node PWA-Base/scripts/docker-build-consumer.mjs --app-dir Recipe-PWA -t recipe-pwa:local
#
# Manual equivalent (from that parent directory):
#   docker build -f PWA-Base/docker/consumer-spa.Dockerfile \
#     --build-arg APP_DIR=Recipe-PWA \
#     --build-arg PLATFORM_RUNTIME_MODE=production \
#     -t recipe-pwa:local .

ARG APP_DIR
ARG PWA_BASE_DIR=PWA-Base

FROM node:22-alpine AS build

ARG APP_DIR
ARG PWA_BASE_DIR=PWA-Base

WORKDIR /src

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# --- Foundation (locked pnpm workspace) --------------------------------------
COPY ${PWA_BASE_DIR}/package.json ${PWA_BASE_DIR}/pnpm-lock.yaml \
     ${PWA_BASE_DIR}/pnpm-workspace.yaml ${PWA_BASE_DIR}/.npmrc ${PWA_BASE_DIR}/
COPY ${PWA_BASE_DIR}/VERSION ${PWA_BASE_DIR}/VERSION
COPY ${PWA_BASE_DIR}/packages ${PWA_BASE_DIR}/packages
COPY ${PWA_BASE_DIR}/apps ${PWA_BASE_DIR}/apps
COPY ${PWA_BASE_DIR}/src ${PWA_BASE_DIR}/src
COPY ${PWA_BASE_DIR}/tsconfig.base.json ${PWA_BASE_DIR}/tsconfig.base.json
COPY ${PWA_BASE_DIR}/eslint.config.js ${PWA_BASE_DIR}/eslint.config.js
COPY ${PWA_BASE_DIR}/prettier.config.js ${PWA_BASE_DIR}/prettier.config.js

WORKDIR /src/${PWA_BASE_DIR}
RUN pnpm install --frozen-lockfile

# --- Application (npm lockfile; file:../PWA-Base resolves to sibling) --------
WORKDIR /src
COPY ${APP_DIR}/package.json ${APP_DIR}/package-lock.json ${APP_DIR}/
WORKDIR /src/${APP_DIR}
RUN npm ci

WORKDIR /src
COPY ${APP_DIR} ${APP_DIR}/

ARG PLATFORM_APP_VERSION=
ENV PLATFORM_APP_VERSION=$PLATFORM_APP_VERSION
ARG PLATFORM_RUNTIME_MODE=production
ENV PLATFORM_RUNTIME_MODE=$PLATFORM_RUNTIME_MODE

WORKDIR /src/${APP_DIR}
ENV CI=true
# Override only when an app's default script is temporarily blocked (document why).
ARG APP_BUILD_CMD="npm run build"
RUN sh -c "$APP_BUILD_CMD"

# --- Runtime: static assets only --------------------------------------------
FROM nginx:1.27-alpine AS runtime

ARG APP_DIR
ARG NGINX_CONF=PWA-Base/docker/nginx-spa.conf

COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf
COPY --from=build /src/${APP_DIR}/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1
