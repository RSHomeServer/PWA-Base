# Run & Task Lifecycle (v0.2.5)

Deterministic lifecycle for the telemetry service — **not** AI-driven.

## Hierarchy

```
Task (user work unit)
  ├── Run (Cursor execution / generation)
  ├── Run
  └── Completion Report (on Task)
```

Users primarily interact with **Tasks**. Runs are implementation detail (inspectable under a Task).

## Locked consolidation rules

- At most one **open/waiting** Task per `conversation_id`.
- Each `beforeSubmitPrompt` creates a **Run**.
- If an open Task exists for that conversation, the Run joins that Task (explore / synthesis / follow-ups do **not** start a new Task).
- A new Task is created only when there is no open Task for the conversation (or conversation is null → solo Task).
- Sibling open Runs under the same Task are **not** cancelled when a new prompt arrives; only the same `generation_id` is superseded.

## Orphan attachment

When a mid-flight event has no open Run:

1. Attach to a recent **finished** run (conversation+generation within 15m, or conversation within 5m).
2. Else continue under an **open Task** as a new Run.
3. Else create an orphan Task+Run with `needsReview` and log confidence.

## Task completion

A Task auto-completes when:

1. All Runs are terminal (`running`/`waiting` count = 0)
2. Structured `completionSummary` exists on the Task (or is promoted from a Run)
3. No recent heavy shell activity (`playwright`, `vite build`, `pnpm test/build`, …) within `TELEMETRY_TASK_COMPLETION_GRACE_MS` (default 60s)

Manual Mark Complete remains for low-confidence / unexpected termination.

Task statuses: `open` | `waiting` | `completed` | `failed` | `cancelled` | `timed_out`.

`completionReason`: `all_runs_terminal_with_summary` | `automatic_timeout` | `manual` | `superseded`.

## Run statuses (unchanged from v0.2.4)

| Stored | UI label |
| ------ | -------- |
| running | Running |
| waiting | Waiting |
| completed + manual | Manual Completion |
| completed | Completed |
| failed | Failed |
| timed_out | Timed Out |
| abandoned | Abandoned |
| cancelled | Cancelled |

## Actions Required

Belongs **inside** the Task completion report. Never creates another Task. Empty state: “No developer action required.”

## Diagnostics

`GET /api/lifecycle/diagnostics` and the History Task detail panel show current tasks, active runs, and recent consolidation / orphan / completion decisions.

## Env

| Variable | Default |
| -------- | ------- |
| `TELEMETRY_IDLE_TIMEOUT_MS` | 1800000 |
| `TELEMETRY_IDLE_SOFT_MS` | half of timeout |
| `TELEMETRY_SUPERVISOR_INTERVAL_MS` | 30000 |
| `TELEMETRY_TASK_COMPLETION_GRACE_MS` | 60000 |

After schema changes: `pnpm telemetry:rebuild`.
