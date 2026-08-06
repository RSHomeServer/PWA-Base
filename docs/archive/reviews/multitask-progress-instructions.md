# Monitoring multitask agents in Cursor

Instructions for reviewers and leads who are new to Cursor’s parallel-agent workflow. This matches how the Website Hosting foundation was built (parent agent + `/multitask` subagents). Official overview: [Multi-agent coding](https://cursor.com/help/ai-features/multi-agent).

## Concepts (30 seconds)

| Term                       | Meaning                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| **Agents Window**          | Cursor’s agent-first UI for running and managing agents                                      |
| **Parent / Lead agent**    | The chat that plans phases and spawns subagents                                              |
| **Subagent**               | A child agent with its own context; returns a summary to the parent                          |
| **`/multitask`**           | Run async subagents **in parallel** instead of queuing prompts                               |
| **Worktree**               | Separate git checkout/branch for an agent (filesystem isolation)                             |
| **Path lease / ownership** | Plan rule: each agent may edit only listed paths (used in this project instead of worktrees) |

This foundation run used **one shared branch** (`feat/platform-foundation`) + exclusive ownership. It did **not** use per-agent worktrees.

## Where to view running agents

1. Open the **Agents Window** (Cursor’s agent workspace — not only the classic chat sidebar).
2. Use the **sidebar list** of agents/chats. Running multitask workers appear as separate entries with a short task title and status.
3. **Pin** long-running parent chats so they stay at the top.
4. From a **Plan**, use **Build in Parallel** when independent steps should run together (dependent steps stay ordered).
5. Type **`/multitask`** in chat when you want Cursor to fan work out to async subagents instead of serial queueing.

You can keep prompting the parent while background subagents run; completions notify the parent conversation.

## How to inspect individual agent logs

1. Click the subagent / worker entry in the Agents Window sidebar.
2. Read its **transcript**: tool calls, file edits, terminal output, and final summary.
3. Prefer the agent’s **closing summary** (20–40 lines in this project’s convention) for “what changed / what was validated.”
4. If the parent linked a subagent in chat (Cursor may show a clickable agent label), open that link from the parent conversation to jump to the child run.
5. For shell-heavy agents, open the linked **terminal** / output from the agent turn when present.

## Worktrees and branches

### If agents used worktrees (not this foundation run)

1. Each agent works in an isolated checkout / branch.
2. In the Agents Window, use **move to local / foreground** (wording varies by Cursor version) when you want to test that branch in your main editor.
3. Review `git log` / diff **inside that worktree** before merging to the integration branch.
4. Discard a bad worktree/branch without touching others.

### What this project did instead

- Single branch: `feat/platform-foundation`
- Base: `main`
- Parallel agents edited **disjoint paths** defined in the plan
- Lead integrated sequentially between phases

To inspect:

```bash
git fetch
git checkout feat/platform-foundation
git log --oneline main..HEAD
git diff main...HEAD --stat
```

## How to identify which files each agent modified

1. **Plan ownership table** — start here; each agent had exclusive paths (see [agent-retrospective](./agent-retrospective.md)).
2. **Subagent summary** — lists files created/touched.
3. **Git archaeology** on the integration branch:
   ```bash
   git log --oneline -- apps/platform packages/ui Dockerfile docs/
   git log -p --follow -- path/to/file
   ```
4. **Parent chat timeline** — Phase 1→5 messages show which wave introduced which tree.
5. Expect **Lead commits** for cross-cutting P0/P1 fixes (lockfile, `/contract`, docs alignment).

## Comparing agent outputs before merging

1. Prefer **phase gates**: do not merge to `main` until Phase 5 review + human checklist pass.
2. Diff against base:
   ```bash
   git diff main...HEAD
   ```
3. Review by ownership slice, e.g.:
   ```bash
   git diff main...HEAD -- packages/site-registry docs/adr
   git diff main...HEAD -- apps/platform packages/config
   git diff main...HEAD -- packages/ui docs/design-system
   git diff main...HEAD -- Dockerfile docker-compose.yml docker
   git diff main...HEAD -- e2e playwright.config.ts
   git diff main...HEAD -- README.md CONTRIBUTING.md docs/architecture.md docs/guides
   ```
4. Read Agent 7’s report: [platform-foundation-review.md](./platform-foundation-review.md).
5. Confirm P0/P1 items are marked fixed before approving.

If you had used worktrees: compare each branch to `main`, then merge one lease-group at a time into the integration branch.

## How to review validation results

1. Ask the parent agent for the **latest validation table** (build/lint/typecheck/format/test/docker).
2. Re-run yourself from the branch tip (source of truth):
   ```bash
   pnpm install --frozen-lockfile
   pnpm build && pnpm lint && pnpm typecheck && pnpm format:check
   pnpm test:unit
   pnpm exec playwright install chromium   # once
   pnpm test:e2e
   docker compose build                    # recommended
   ```
3. Check agent summaries for **claimed** vs **actual** results — especially after parallel waves that touch the lockfile.
4. Playwright failures: confirm browsers installed; e2e uses Vite preview, not Docker, by default.
5. Docker failures: confirm lockfile committed and Dockerfile uses `--frozen-lockfile`.

## Stopping or intervening

- Use **Stop** / **Stop all** in the Agents Window if a worker is stuck or editing the wrong paths.
- Prefer telling the **parent** to cancel a phase rather than manually half-applying a subagent diff.
- After stop: `git status` and discard unintended files before spawning replacements.

## Tips that helped this repo

- Write **exclusive ownership** into the plan before `/multitask`.
- Sequence agents that share `pnpm-lock.yaml`.
- Keep the Reviewer **read-only**.
- End each agent with a short, structured summary the Lead can trust.

## Related Cursor docs

- [What is multi-agent coding?](https://cursor.com/help/ai-features/multi-agent)
- Changelog: Multitask, Worktrees, Multi-root (April 2026) — [cursor.com/changelog](https://cursor.com/changelog/04-24-26)
