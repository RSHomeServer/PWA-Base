import type { CapturePageTarget } from "./types.js";

const RUNS: CapturePageTarget = {
  pageKey: "runs",
  pageLabel: "Runs",
  path: "/dashboard",
};

const SETTINGS: CapturePageTarget = {
  pageKey: "settings",
  pageLabel: "Settings",
  path: "/dashboard/settings",
};

const OPS: CapturePageTarget = {
  pageKey: "ops",
  pageLabel: "Operations",
  path: "/dashboard/ops",
};

interface Rule {
  test: RegExp;
  pages: CapturePageTarget[];
}

const RULES: Rule[] = [
  {
    test: /RunsPage|HistoryPage|LiveRunPage|historySplit|runsSplit|RunSummaryCard|RunDetailView|VisualValidation/i,
    pages: [RUNS],
  },
  { test: /SettingsPage/i, pages: [SETTINGS] },
  { test: /OperationsPage|ops\.|\/ops/i, pages: [OPS] },
  {
    test: /DashboardNav|DashboardLayout|site-dashboard\/src\/index/i,
    pages: [RUNS],
  },
];

/**
 * Infer dashboard pages to screenshot from modified file paths.
 * Deduplicates by pageKey; falls back to Runs when nothing matches.
 */
export function detectCapturePages(files: string[]): CapturePageTarget[] {
  const byKey = new Map<string, CapturePageTarget>();

  for (const file of files) {
    const normalised = file.replace(/\\/g, "/");
    for (const rule of RULES) {
      if (!rule.test.test(normalised)) continue;
      for (const page of rule.pages) {
        byKey.set(page.pageKey, page);
      }
    }
  }

  if (byKey.size === 0) {
    byKey.set(RUNS.pageKey, RUNS);
  }

  return [...byKey.values()];
}
