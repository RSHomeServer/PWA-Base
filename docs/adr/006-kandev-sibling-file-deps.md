# ADR-006: Local sibling packages under KanDev worktrees

## Status

Accepted

## Context

Songara application repositories consume the foundation as:

```json
"@songara/pwa-base": "file:../PWA-Base"
```

That matches a primary side-by-side checkout (`~/projects/PWA-Base` next to each
app). KanDev isolates each task in a git worktree under
`~/.kandev/tasks/<task>/<App>/`, so `../PWA-Base` is absent and installs/builds
fail.

Constraints for the platform:

- Do not publish `@songara/pwa-base` yet
- Do not replace `file:../PWA-Base` with a registry dependency
- Do not modify application repositories only to paper over worktree paths
- Preserve primary-checkout DX
- Scale to many future Songara PWAs with one approach

## Decision

1. **Keep `file:../PWA-Base`** as the canonical consumer contract.
2. **Mirror sibling layout in KanDev** when useful: attach `PWA-Base` to the
   task (multi-repo / `add_branch_to_task`) so the task directory can contain
   both trees. KanDev may name branch worktrees `PWA-Base-<branch>`.
3. **Generic linker** `scripts/ensure-sibling-file-deps.mjs` creates the
   missing `../<Sibling>` symlink(s) for any `file:../` dependency by resolving
   (in order) env overrides, task-local worktrees, then
   `$SONGARA_PROJECTS_ROOT` (default `~/projects`). Invoke it from the consumer
   via the primary checkout path so there is no chicken-and-egg.
4. **Agents** follow `.cursor/rules/sibling-file-deps.mdc` and run the linker
   before install/build in isolated checkouts.

## Consequences

- Application repos need no worktree-specific dependency changes.
- New PWAs using the same `file:../` pattern inherit the workflow automatically.
- Consuming a bare KanDev `PWA-Base-<branch>` worktree without `node_modules`
  can break TypeScript until deps are installed there; the linker prefers
  checkouts that already have `node_modules` (typically the primary tree).
- Fully automatic attach at KanDev task-create time remains a product
  enhancement; until then agents/scripts perform attach + link.
