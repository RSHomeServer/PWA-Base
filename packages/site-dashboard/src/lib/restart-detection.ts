export type RestartPriority = "required" | "recommended" | "optional" | "none";

export interface RestartActionItem {
  action: string;
  priority: RestartPriority;
  reason: string;
  expectedOutcome: string;
}

export interface RestartDetectionResult {
  restartRequired: boolean;
  priority: RestartPriority;
  items: RestartActionItem[];
  /** Paths that triggered a required restart. */
  triggeringPaths: string[];
}

const REQUIRED_PATTERNS: Array<{ test: (p: string) => boolean; label: string }> = [
  { test: (p) => /(^|\/)vite\.config\.[^/]+$/i.test(p), label: "Vite config" },
  { test: (p) => /(^|\/)\.env(\.|$)/i.test(p) || /(^|\/)\.env$/i.test(p), label: "Env file" },
  { test: (p) => /(^|\/)package\.json$/i.test(p), label: "package.json" },
  { test: (p) => /(^|\/)pnpm-workspace\.yaml$/i.test(p), label: "pnpm workspace" },
  { test: (p) => /(^|\/)pnpm-lock\.yaml$/i.test(p), label: "pnpm lockfile" },
  { test: (p) => /(^|\/)Dockerfile[^/]*$/i.test(p), label: "Dockerfile" },
  { test: (p) => /(^|\/)docker-compose[^/]*$/i.test(p), label: "docker-compose" },
  {
    test: (p) => /(^|\/)apps\/telemetry\/src\/cli\.ts$/i.test(p),
    label: "Telemetry CLI entry",
  },
  {
    test: (p) => /(^|\/)apps\/platform\/src\/main\.tsx$/i.test(p),
    label: "Host entry",
  },
];

function isHmrOnlyPath(path: string): boolean {
  const p = path.replace(/\\/g, "/");
  if (/(^|\/)packages\/site-[^/]+\//i.test(p)) return true;
  if (/\.(tsx|css|module\.css)$/i.test(p)) return true;
  return false;
}

function isDependencyOrWorkspaceConfig(path: string): boolean {
  const p = path.replace(/\\/g, "/");
  return (
    /(^|\/)package\.json$/i.test(p) ||
    /(^|\/)pnpm-workspace\.yaml$/i.test(p) ||
    /(^|\/)pnpm-lock\.yaml$/i.test(p) ||
    /(^|\/)tsconfig(\.[^/]+)?\.json$/i.test(p)
  );
}

function flattenPaths(
  filesModified: Array<{ area?: string; files?: string[] }> | string[] | null | undefined,
  extraPaths?: string[] | null,
): string[] {
  const out: string[] = [];
  if (Array.isArray(filesModified)) {
    for (const entry of filesModified) {
      if (typeof entry === "string") {
        out.push(entry);
        continue;
      }
      if (entry?.files) out.push(...entry.files);
    }
  }
  if (extraPaths) out.push(...extraPaths);
  return [...new Set(out.map((p) => p.replace(/\\/g, "/")).filter(Boolean))];
}

/**
 * Deterministic restart / Actions Required rules from modified paths.
 */
export function detectRestartActions(
  filesModified: Array<{ area?: string; files?: string[] }> | string[] | null | undefined,
  extraPaths?: string[] | null,
): RestartDetectionResult {
  const paths = flattenPaths(filesModified, extraPaths);
  if (paths.length === 0) {
    return {
      restartRequired: false,
      priority: "none",
      items: [
        {
          action: "No developer action required.",
          priority: "none",
          reason: "No files modified in this run.",
          expectedOutcome: "Continue using the current dashboard session.",
        },
      ],
      triggeringPaths: [],
    };
  }

  const triggering: string[] = [];
  const labels: string[] = [];
  for (const path of paths) {
    for (const rule of REQUIRED_PATTERNS) {
      if (rule.test(path)) {
        triggering.push(path);
        labels.push(rule.label);
        break;
      }
    }
  }

  if (triggering.length > 0) {
    const uniqueLabels = [...new Set(labels)];
    return {
      restartRequired: true,
      priority: "required",
      items: [
        {
          action: "Restart Required",
          priority: "required",
          reason: `Changed ${uniqueLabels.join(", ")}: ${triggering.slice(0, 5).join(", ")}${
            triggering.length > 5 ? ` (+${triggering.length - 5} more)` : ""
          }`,
          expectedOutcome:
            "Restart the Vite host and/or rebuild telemetry (`pnpm telemetry:rebuild`) so config and entrypoints reload.",
        },
      ],
      triggeringPaths: triggering,
    };
  }

  if (paths.every(isHmrOnlyPath)) {
    return {
      restartRequired: false,
      priority: "none",
      items: [
        {
          action: "No developer action required.",
          priority: "none",
          reason: "Only site package / TSX / CSS files changed — Vite HMR should apply updates.",
          expectedOutcome: "Refresh is optional; the running dashboard should pick up changes via HMR.",
        },
      ],
      triggeringPaths: [],
    };
  }

  if (paths.some(isDependencyOrWorkspaceConfig)) {
    return {
      restartRequired: true,
      priority: "required",
      items: [
        {
          action: "Restart Required",
          priority: "required",
          reason: "Dependency or workspace TypeScript config changed.",
          expectedOutcome: "Reinstall if needed, then restart the Vite host to pick up the new graph.",
        },
      ],
      triggeringPaths: paths.filter(isDependencyOrWorkspaceConfig),
    };
  }

  return {
    restartRequired: false,
    priority: "recommended",
    items: [
      {
        action: "Soft refresh recommended",
        priority: "recommended",
        reason: "Modified files are outside the pure HMR path set but do not match hard restart rules.",
        expectedOutcome: "Reload the browser tab if UI looks stale; full process restart is optional.",
      },
      {
        action: "Optional: rebuild telemetry",
        priority: "optional",
        reason: "If apps/telemetry sources changed without matching cli.ts, Docker rebuild may still help.",
        expectedOutcome: "`pnpm telemetry:rebuild` when ingest behaviour looks wrong.",
      },
    ],
    triggeringPaths: [],
  };
}
