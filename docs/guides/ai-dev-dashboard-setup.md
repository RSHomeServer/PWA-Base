# AI Development Dashboard — single Docker telemetry backend

There is **one** telemetry backend: the Docker Compose `telemetry` service.
It owns a persistent SQLite volume. Both local Vite and production share it.

```
Cursor Hook  --TELEMETRY_ENDPOINT-->  Docker Telemetry (:4310)
                                         ├── volume telemetry_data → /data/telemetry.sqlite
                                         ├── REST /api/*
                                         ├── WS /ws
                                         └── ntfy

localhost:5180 (dashboard-web)  --Vite proxy /telemetry-->  127.0.0.1:4310  ─┐
https://dashboard.songara.uk    --nginx /telemetry/--> telemetry:4310         ─┴─ same SQLite
```

Do **not** run `pnpm --filter @platform/telemetry start` for day-to-day use.
That creates a second process and a second SQLite file under `./data/`, which is why
local and production histories used to diverge.

---

## Quick start (canonical)

```bash
# 1. Start the single telemetry backend
pnpm telemetry:up
# equivalent: docker compose up -d telemetry

# 2. Confirm health (host-published port)
curl -sS http://127.0.0.1:4310/health | jq .

# 3. Local dashboard (proxies /telemetry → Docker :4310)
pnpm --filter @platform/dashboard-web dev
# → http://127.0.0.1:5180/
# → http://127.0.0.1:5180/ops   (Operations / Diagnostics)
```

Production dashboard at `https://dashboard.songara.uk` talks to the **same**
container via the dashboard nginx `/telemetry/` reverse-proxy (Docker network).
Local Vite proxies `/telemetry` → host-published `:4310`.

Helper scripts:

| Script | Purpose |
| ------ | ------- |
| `pnpm telemetry:up` | `docker compose up -d telemetry` (does **not** rebuild the image) |
| `pnpm telemetry:down` | Stop the service |
| `pnpm telemetry:logs` | Follow container logs |
| `pnpm telemetry:rebuild` | Rebuild image and recreate — **required after telemetry API/schema changes** (Task model, lifecycle fields, etc.) |

### Dashboard workflow (v0.2.6)

- **Engineering contract:** root [`CURSOR.md`](../../CURSOR.md) — [engineering-contract.md](./engineering-contract.md).
- **History** (nav) lists **Tasks** — one user conversation/work unit with one or more Runs.
- Selecting a Task shows Overview, Conversation, nested Runs, Visual Validation, Developer Actions, and Lifecycle Diagnostics.
- **Mark Task Complete** is exceptional; prefer automatic completion when the summary is written and all runs are terminal.
- **Actions Required** lives inside the Task completion report (never a second Task). Empty: “No developer action required.”
- Completion `PUT` responses include `reportValidation` (see [run-report-standard.md](./run-report-standard.md)).
- Deep links: `?task=` (preferred), `?run=` still opens nested run context.
- **PWA / OS notifications** unchanged — see [pwa-installation.md](./pwa-installation.md) and [notification-architecture.md](./notification-architecture.md).

---

## Environment variables

| Variable | Where | Purpose | Canonical value |
| -------- | ----- | ------- | --------------- |
| `TELEMETRY_HOST` | Docker compose | Bind address | `0.0.0.0` |
| `TELEMETRY_PORT` | Docker compose | Listen port | `4310` |
| `TELEMETRY_DB` | Docker compose | SQLite path in container | `/data/telemetry.sqlite` |
| `TELEMETRY_IDLE_TIMEOUT_MS` | Docker / telemetry | Idle → timed_out | `1800000` (30m) |
| `TELEMETRY_IDLE_SOFT_MS` | Docker / telemetry | Soft idle → waiting | half of timeout |
| `TELEMETRY_SUPERVISOR_INTERVAL_MS` | Docker / telemetry | Lifecycle tick | `30000` |
| `TELEMETRY_TASK_COMPLETION_GRACE_MS` | Docker / telemetry | Grace before Task auto-complete | `60000` |
| `TELEMETRY_ENDPOINT` | Cursor client | Hook POST base URL | `http://127.0.0.1:4310` (same host) or `http://<docker-host-lan>:4310` |
| `TELEMETRY_PROXY_TARGET` | Vite host (optional) | Dev/preview proxy target | `http://127.0.0.1:4310` |

Samples: `apps/telemetry/.env.example` (server notes), `apps/telemetry/.env.client.example` (hooks).

---

## Cursor hooks

1. Ensure Docker telemetry is up (`pnpm telemetry:up`).
2. Export endpoint on the machine where Cursor runs hooks:

```bash
# Cursor on the Docker host
export TELEMETRY_ENDPOINT=http://127.0.0.1:4310

# Cursor on a VM / laptop
export TELEMETRY_ENDPOINT=http://<docker-host-lan-ip>:4310

# Optional: same backend via Traefik
# export TELEMETRY_ENDPOINT=https://apps.songara.uk/telemetry
```

3. Point `~/.cursor/hooks.json` at `scripts/telemetry-hook.sh` (absolute path) for:
   `beforeSubmitPrompt`, `afterAgentThought`, `afterFileEdit`, `afterShellExecution`, `afterAgentResponse`, `stop`.

4. Smoke-test:

```bash
curl -sS "$TELEMETRY_ENDPOINT/health"
echo '{"hook_event_name":"beforeSubmitPrompt","prompt":"docker smoke"}' \
  | curl -sS -X POST "$TELEMETRY_ENDPOINT/hooks" -H 'Content-Type: application/json' --data-binary @-
```

---

## Vite proxy

`apps/platform/vite.config.ts` proxies `/telemetry` (HTTP + WebSocket) to
`TELEMETRY_PROXY_TARGET` (default `http://127.0.0.1:4310`) and strips the `/telemetry`
prefix — the same shape Traefik uses in production.

Compose **publishes** `4310:4310` so the host proxy and hooks can reach the container
without a second SQLite.

---

## Operations / Diagnostics

Open `/ops` for:

- Connected telemetry endpoint (browser `/telemetry` path)
- Database path, run/event counts, last hook time
- WebSocket connected, API reachable, SQLite writable
- Network table, pipeline stages, event stream, connectivity tests

Settings (`/settings`) remains for notification provider configuration.

---

## Health & ops API

| Method | Path | Purpose |
| ------ | ---- | ------- |
| `GET` | `/health` | Version, uptime, SQLite, WS, last hook |
| `GET` | `/api/ops` | Full ops report |
| `GET` | `/api/ops/events` | Enriched event stream |
| `POST` | `/api/ops/test/*` | Connectivity / synthetic event |
| `PUT` | `/api/tasks/:id/completion-summary` | Persist Task completion summary (+ `reportValidation`) |
| `PUT` | `/api/runs/:id/completion-summary` | Persist structured run completion summary (+ `reportValidation`) |

Completed runs stay on Live Run until the next prompt. Summaries are stored on the run
(`completion_summary_json`) as a structured `RunCompletionSummary` object. Markdown is
parsed **only on ingest** (or accepted via `completion_summary` / `PUT …/completion-summary`)
and exported from the object — the dashboard never renders Markdown for reports.

See `docs/guides/run-report-standard.md` for the project reporting standard.

---

## Persistence

SQLite lives in the Docker volume `telemetry_data` → `/data/telemetry.sqlite`.
Restarting the container keeps history. Do not point a host `pnpm start` at a different
`TELEMETRY_DB` while developing — that is the old split-brain failure mode.

---

## Troubleshooting

| Symptom | Check |
| ------- | ----- |
| Local and prod show different history | A host `pnpm … telemetry start` is still running — stop it; use only Docker |
| Hooks silent from VM | `TELEMETRY_ENDPOINT` must be the Docker **host** LAN IP (or Traefik URL), not the VM’s `127.0.0.1` |
| Connection refused on :4310 | `pnpm telemetry:up`; `docker compose ps`; `ss -tlnp \| grep 4310` |
| Dashboard unreachable | `pnpm --filter @platform/dashboard-web dev` + Docker telemetry up; open `/ops` |
| EADDRINUSE on 4310 | Another process (often a leftover host telemetry) still owns the port |
| Auth / public exposure | Prefer LAN/VPN for `:4310`; Traefik path is CrowdSec-protected — public auth is a later milestone |

---

## Unit / integration tests only

`pnpm --filter @platform/telemetry test:unit` boots ephemeral servers on random ports.
That is fine. For interactive dashboard work, always use Docker.
