# syntax=docker/dockerfile:1

FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY VERSION ./VERSION
COPY apps/platform/package.json apps/platform/
COPY packages/config/package.json packages/config/
COPY packages/site-registry/package.json packages/site-registry/
COPY packages/ui/package.json packages/ui/
COPY packages/catalog/package.json packages/catalog/
COPY packages/controls/package.json packages/controls/
COPY packages/export/package.json packages/export/
COPY packages/math/package.json packages/math/
COPY packages/physics/package.json packages/physics/
COPY packages/site-browser-lab/package.json packages/site-browser-lab/
COPY packages/site-components/package.json packages/site-components/
COPY packages/site-stats/package.json packages/site-stats/
COPY packages/site-viz/package.json packages/site-viz/
COPY packages/site-dashboard/package.json packages/site-dashboard/
COPY packages/site-docs/package.json packages/site-docs/
COPY packages/markdown/package.json packages/markdown/
COPY packages/runtime/package.json packages/runtime/
COPY apps/telemetry/package.json apps/telemetry/
COPY apps/docs-api/package.json apps/docs-api/
COPY apps/components-web/package.json apps/components-web/
COPY apps/docs-web/package.json apps/docs-web/
COPY apps/stats-web/package.json apps/stats-web/
COPY apps/viz-web/package.json apps/viz-web/
COPY apps/browser-lab-web/package.json apps/browser-lab-web/
COPY apps/dashboard-web/package.json apps/dashboard-web/

RUN pnpm install --frozen-lockfile

COPY apps/platform apps/platform
COPY packages packages

ARG PLATFORM_APP_VERSION=
ENV PLATFORM_APP_VERSION=$PLATFORM_APP_VERSION
ARG PLATFORM_RUNTIME_MODE=development
ENV PLATFORM_RUNTIME_MODE=$PLATFORM_RUNTIME_MODE

RUN pnpm --filter @platform/host build

FROM nginx:1.27-alpine AS runtime

COPY docker/nginx-catalogue.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/platform/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1
