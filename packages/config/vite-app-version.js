import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

/**
 * Vite plugin: injects semantic app version + emits `/version.json`.
 * Version source (first match):
 * 1. `PLATFORM_APP_VERSION` env
 * 2. repo-root `VERSION` file (semver, e.g. `0.1.0`)
 * 3. fallback `0.0.0`
 *
 * @param {{ root?: string }} [options]
 * @returns {import('vite').Plugin}
 */
export function appVersionPlugin(options = {}) {
  const cwd = options.root ?? process.cwd();
  const repoRoot = findRepoRoot(cwd);
  const builtAt = new Date().toISOString();
  const version = resolveBuildVersion(repoRoot);
  const runtimeMode = resolveRuntimeMode();

  return {
    name: "platform-app-version",
    config() {
      return {
        define: {
          "import.meta.env.VITE_APP_VERSION": JSON.stringify(version),
          "import.meta.env.VITE_APP_BUILT_AT": JSON.stringify(builtAt),
          "import.meta.env.VITE_PLATFORM_RUNTIME_MODE": JSON.stringify(runtimeMode),
        },
      };
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: `${JSON.stringify({ version, builtAt }, null, 2)}\n`,
      });
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] === "/version.json") {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.end(JSON.stringify({ version, builtAt }));
          return;
        }
        next();
      });
    },
  };
}

function findRepoRoot(start) {
  let dir = resolve(start);
  while (true) {
    if (existsSync(join(dir, "pnpm-workspace.yaml")) || existsSync(join(dir, "VERSION"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) return resolve(start);
    dir = parent;
  }
}

/**
 * Build-time platform prefs mode (`development` | `production`).
 * Defaults to development so Docker/preview stacks iterate quickly;
 * set `PLATFORM_RUNTIME_MODE=production` for stability-first defaults.
 */
function resolveRuntimeMode() {
  const raw = process.env.PLATFORM_RUNTIME_MODE?.trim().toLowerCase();
  if (raw === "development" || raw === "production") return raw;
  return "development";
}

function resolveBuildVersion(repoRoot) {
  if (process.env.PLATFORM_APP_VERSION?.trim()) {
    return process.env.PLATFORM_APP_VERSION.trim();
  }
  const versionFile = join(repoRoot, "VERSION");
  if (existsSync(versionFile)) {
    const raw = readFileSync(versionFile, "utf8").trim();
    if (/^\d+\.\d+\.\d+([-.][0-9A-Za-z.-]+)?$/.test(raw)) return raw;
  }
  try {
    const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
    if (pkg.version) return String(pkg.version);
  } catch {
    // ignore
  }
  return `0.0.0+${createHash("sha1").update(String(Date.now())).digest("hex").slice(0, 7)}`;
}
