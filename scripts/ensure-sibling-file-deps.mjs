#!/usr/bin/env node
/**
 * Ensure `file:../Sibling` dependencies resolve in isolated checkouts
 * (KanDev worktrees, CI sandboxes, etc.).
 *
 * Songara PWAs declare local foundation packages as relative file deps, e.g.
 *   "@songara/pwa-base": "file:../PWA-Base"
 * That works from a primary side-by-side checkout (`~/projects/Physics-PWA` +
 * `~/projects/PWA-Base`) but fails when the app lives alone under
 * `~/.kandev/tasks/<task>/<App>/`.
 *
 * This script creates the missing sibling path(s) as symlinks. It does **not**
 * modify package.json. Safe to run from any consumer; no-op when siblings
 * already exist.
 *
 * Usage (from the consumer app directory):
 *   node /path/to/PWA-Base/scripts/ensure-sibling-file-deps.mjs
 *   node /path/to/PWA-Base/scripts/ensure-sibling-file-deps.mjs --check
 *   node /path/to/PWA-Base/scripts/ensure-sibling-file-deps.mjs --dry-run
 *
 * Environment:
 *   SONGARA_PROJECTS_ROOT  Primary checkout root (default: ~/projects)
 *   SONGARA_SIBLING_<NAME> Absolute override for a sibling (e.g.
 *                          SONGARA_SIBLING_PWA_BASE=/path/to/PWA-Base)
 *
 * Resolution order per `file:../Name` dependency:
 *   1. Env override SONGARA_SIBLING_<NAME>
 *   2. KanDev task-local worktree with node_modules (Name or Name-*)
 *   3. $SONGARA_PROJECTS_ROOT/Name with node_modules
 *   4. KanDev task-local worktree without node_modules
 *   5. $SONGARA_PROJECTS_ROOT/Name without node_modules
 */
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check");
const DRY_RUN = args.has("--dry-run");
const QUIET = args.has("--quiet");

if (args.has("--help") || args.has("-h")) {
  printHelp();
  process.exit(0);
}

const appRoot = resolve(process.cwd());
const packageJsonPath = join(appRoot, "package.json");
if (!existsSync(packageJsonPath)) {
  fail(`No package.json in ${appRoot}. Run from the consumer app root.`);
}

const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const siblings = collectFileSiblingDeps(pkg);
if (siblings.length === 0) {
  log("No file:../ sibling dependencies found — nothing to do.");
  process.exit(0);
}

const projectsRoot = resolve(
  process.env.SONGARA_PROJECTS_ROOT || join(homedir(), "projects"),
);
const taskRoot = detectTaskRoot(appRoot);
let missing = 0;
let linked = 0;

for (const name of siblings) {
  const linkPath = join(appRoot, "..", name);
  const result = ensureSibling(name, linkPath);
  if (result === "missing") missing += 1;
  if (result === "linked") linked += 1;
}

if (CHECK_ONLY && missing > 0) {
  fail(
    `${missing} sibling path(s) missing. Run without --check to create symlinks.`,
  );
}

if (missing > 0) {
  fail(
    `${missing} sibling path(s) could not be resolved. Set SONGARA_PROJECTS_ROOT or attach the repo to the KanDev task.`,
  );
}

if (!QUIET) {
  const summary =
    linked > 0
      ? `Sibling file deps OK (${linked} link(s) created).`
      : "Sibling file deps OK.";
  log(summary);
}

process.exit(0);

/**
 * @param {Record<string, unknown>} pkg
 * @returns {string[]}
 */
function collectFileSiblingDeps(pkg) {
  /** @type {string[]} */
  const names = [];
  const seen = new Set();
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "peerDependencies",
  ]) {
    const block = pkg[field];
    if (!block || typeof block !== "object") continue;
    for (const spec of Object.values(block)) {
      if (typeof spec !== "string") continue;
      const name = parseFileSiblingName(spec);
      if (!name || seen.has(name)) continue;
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

/**
 * @param {string} spec
 * @returns {string | null}
 */
function parseFileSiblingName(spec) {
  // file:../PWA-Base  |  file:../PWA-Base/  |  file:..\\PWA-Base
  const match = /^file:(\.\.\/|\.\.\\)([^/\\]+)\/?$/.exec(spec.trim());
  if (!match) return null;
  const name = match[2];
  if (!name || name === "." || name === "..") return null;
  return name;
}

/**
 * @param {string} name
 * @param {string} linkPath
 * @returns {"ok" | "linked" | "missing"}
 */
function ensureSibling(name, linkPath) {
  if (pathExists(linkPath)) {
    log(`  ✓ ${name} → ${describe(linkPath)}`);
    return "ok";
  }

  const target = resolveSiblingTarget(name);
  if (!target) {
    log(`  ✗ ${name} — no candidate under ${projectsRoot} or task worktrees`);
    return "missing";
  }

  if (CHECK_ONLY || DRY_RUN) {
    log(`  ${CHECK_ONLY ? "✗" : "→"} ${name} would link to ${target}`);
    return CHECK_ONLY ? "missing" : "ok";
  }

  try {
    if (existsSync(linkPath) || isSymlink(linkPath)) {
      unlinkSync(linkPath);
    }
    const linkDir = dirname(linkPath);
    // Prefer relative symlinks when the target is inside the same task tree.
    const useRelative =
      taskRoot && resolve(target).startsWith(resolve(taskRoot) + "/");
    symlinkSync(
      useRelative ? relative(linkDir, target) || target : target,
      linkPath,
    );
    log(`  + ${name} → ${describe(linkPath)} (→ ${target})`);
    if (!existsSync(join(target, "node_modules"))) {
      log(
        `    ⚠ ${name} has no node_modules; consumer typecheck may fail until dependencies are installed there.`,
      );
    }
    return "linked";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(`  ✗ ${name} — failed to symlink: ${message}`);
    return "missing";
  }
}

/**
 * @param {string} name
 * @returns {string | null}
 */
function resolveSiblingTarget(name) {
  const envKey = `SONGARA_SIBLING_${envName(name)}`;
  const envOverride = process.env[envKey];
  if (envOverride) {
    const resolved = resolve(envOverride);
    if (pathExists(resolved)) return resolved;
    log(`  ⚠ ${envKey}=${envOverride} does not exist`);
  }

  /** @type {{ path: string, score: number }[]} */
  const candidates = [];

  if (taskRoot) {
    for (const entry of listTaskSiblingCandidates(taskRoot, name)) {
      candidates.push({
        path: entry,
        score: scoreCandidate(entry, name, /*taskLocal*/ true),
      });
    }
  }

  const primary = join(projectsRoot, name);
  if (pathExists(primary)) {
    candidates.push({
      path: primary,
      score: scoreCandidate(primary, name, /*taskLocal*/ false),
    });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.path ?? null;
}

/**
 * Prefer trees that already have node_modules, then task-local worktrees,
 * then exact folder names over KanDev `Name-<branch>` suffixes.
 * @param {string} candidate
 * @param {string} siblingName
 * @param {boolean} taskLocal
 */
function scoreCandidate(candidate, siblingName, taskLocal) {
  let score = 0;
  if (existsSync(join(candidate, "package.json"))) score += 10;
  if (existsSync(join(candidate, "node_modules"))) score += 100;
  if (taskLocal) score += 25;
  if (nameFromPath(candidate) === siblingName) score += 5;
  return score;
}

/**
 * @param {string} taskRoot
 * @param {string} name
 * @returns {string[]}
 */
function listTaskSiblingCandidates(taskRoot, name) {
  /** @type {string[]} */
  const out = [];
  const exact = join(taskRoot, name);
  if (pathExists(exact)) out.push(exact);

  let entries = [];
  try {
    entries = readdirSync(taskRoot, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const ent of entries) {
    if (!ent.isDirectory() && !ent.isSymbolicLink()) continue;
    if (ent.name === name) continue;
    // KanDev names extra branch worktrees as "<repo>-<branch>" (e.g. PWA-Base-main).
    if (ent.name === name || ent.name.startsWith(`${name}-`)) {
      out.push(join(taskRoot, ent.name));
    }
  }
  return out;
}

/**
 * Walk up looking for `.kandev-workspace.json` (KanDev task directory).
 * @param {string} start
 * @returns {string | null}
 */
function detectTaskRoot(start) {
  let dir = start;
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(join(dir, ".kandev-workspace.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** @param {string} name */
function envName(name) {
  return name.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();
}

/** @param {string} p */
function nameFromPath(p) {
  return p.split(/[/\\]/).filter(Boolean).at(-1) ?? p;
}

/** @param {string} p */
function pathExists(p) {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

/** @param {string} p */
function isSymlink(p) {
  try {
    return lstatSync(p).isSymbolicLink();
  } catch {
    return false;
  }
}

/** @param {string} p */
function describe(p) {
  try {
    if (isSymlink(p)) return `${p} -> ${realpathSync(p)}`;
  } catch {
    /* broken symlink */
  }
  return p;
}

/** @param {string} message */
function log(message) {
  if (!QUIET) console.log(message);
}

/** @param {string} message */
function fail(message) {
  console.error(message);
  process.exit(1);
}

function printHelp() {
  console.log(`ensure-sibling-file-deps — link file:../Sibling deps for KanDev/worktrees

Usage:
  node scripts/ensure-sibling-file-deps.mjs [options]

Options:
  --check     Exit 1 if any sibling is missing (no changes)
  --dry-run   Print links that would be created
  --quiet     Suppress non-error output
  -h, --help  Show help

Run from the consumer application root (the package.json with file:../ deps).
Invoke via an absolute path to this script from the primary PWA-Base checkout
when the sibling is not linked yet:
  node "$HOME/projects/PWA-Base/scripts/ensure-sibling-file-deps.mjs"
`);
}
