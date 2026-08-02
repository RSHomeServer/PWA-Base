# syntax=docker/dockerfile:1

FROM node:22-alpine AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/telemetry/package.json apps/telemetry/
COPY packages/config/package.json packages/config/

RUN pnpm install --frozen-lockfile --filter @platform/telemetry...

COPY apps/telemetry apps/telemetry
COPY packages/config packages/config

ENV TELEMETRY_HOST=0.0.0.0
ENV TELEMETRY_PORT=4310
ENV TELEMETRY_DB=/data/telemetry.sqlite
ENV TELEMETRY_ARTIFACTS=/data/run-artifacts

EXPOSE 4310

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4310/health >/dev/null || exit 1

CMD ["pnpm", "--filter", "@platform/telemetry", "start"]
