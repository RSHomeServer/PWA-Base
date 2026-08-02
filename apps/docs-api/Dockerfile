# syntax=docker/dockerfile:1

FROM node:22-alpine AS runtime

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/docs-api/package.json apps/docs-api/
COPY packages/config/package.json packages/config/

RUN pnpm install --frozen-lockfile --filter @platform/docs-api...

COPY apps/docs-api apps/docs-api
COPY packages/config packages/config
COPY config/docs-explorer.roots.json config/docs-explorer.roots.json
COPY docs docs
COPY packages packages
COPY README.md CURSOR.md CONTRIBUTING.md ./

ENV DOCS_API_HOST=0.0.0.0
ENV DOCS_API_PORT=4320
ENV DOCS_API_WORKSPACE=/app
ENV DOCS_API_CONFIG=/app/config/docs-explorer.roots.json

EXPOSE 4320

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4320/health >/dev/null || exit 1

CMD ["pnpm", "--filter", "@platform/docs-api", "start"]
