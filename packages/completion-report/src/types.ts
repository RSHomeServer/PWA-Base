/** Group of files under a logical area (e.g. Schema/API, UI). */
export interface FileAreaGroup {
  area: string;
  files: string[];
}

export type TestResultStatus = "pass" | "fail" | "skip";

export interface TestResultItem {
  check: string;
  status: TestResultStatus;
  detail: string;
}

/**
 * Canonical persisted completion report (v2) — **source of truth** for report fields.
 * Section order / presence / validation: `completion-report-contract.ts`.
 * Normalise + markdown export: `completion-summary.ts`.
 * Human guide: `docs/guides/run-report-standard.md`. Agent behaviour: root `CURSOR.md`.
 * Markdown is an export format only — never parsed for new-run ingest.
 */
export interface RunCompletionSummary {
  schemaVersion: 2;
  /** Long-form prose overview — the primary narrative shown first in the report UI. */
  overview: string | null;
  executiveSummary: string | null;
  userVisibleChanges: string[];
  architectureChanges: string[];
  filesModified: FileAreaGroup[];
  configurationChanges: string[];
  testingPerformed: TestResultItem[];
  knownLimitations: string[];
  recommendedNextMilestone: string | null;
  /** Derived card metrics */
  filesChanged: number | null;
  testsPassed: boolean | null;
  gitCommit: string | null;
  /** How this summary was produced. */
  source: "structured" | "markdown" | "legacy" | null;
}

/** @deprecated v1 shape — normalised into FileAreaGroup on read */
export interface FileChangeItem {
  path: string;
  change?: string;
}
