/**
 * Completion-report contract: section registry + validation.
 *
 * Canonical field shapes live on `RunCompletionSummary` in `./types.ts`.
 * This module must not redefine those shapes — it describes section presence,
 * order, and validation rules so agents and APIs share one registry.
 *
 * To change the report structure:
 * 1. Update `RunCompletionSummary` in `types.ts` (bump `schemaVersion` when breaking).
 * 2. Update `COMPLETION_REPORT_SECTIONS` / validators here.
 * 3. Update normalise/merge in `completion-summary.ts` if needed.
 * 4. Refresh `docs/guides/run-report-standard.md` (human guide only).
 * Do not embed a duplicate schema in CURSOR.md or Cursor rules.
 */

import type { RunCompletionSummary } from "./types.js";
import { COMPLETION_SUMMARY_SCHEMA_VERSION } from "./completion-summary.js";
import { overviewLooksThin } from "./lifecycle/tasks.js";

/** How strongly a persisted section is expected on a finished Task report. */
export type ReportSectionPresence = "required" | "recommended" | "optional";

/** Where the section content lives. */
export type ReportSectionStorage =
  /** Field on `RunCompletionSummary`. */
  | "summary"
  /** Derived in the dashboard (e.g. Actions Required from paths). */
  | "derived"
  /** Artifacts / gallery; not a summary JSON field. */
  | "artifacts";

export interface CompletionReportSectionDefinition {
  /** Stable id used in validation results. */
  id: string;
  /** Human / markdown heading. */
  title: string;
  /** Display order in chat + dashboard (0 = Overview). */
  order: number;
  presence: ReportSectionPresence;
  storage: ReportSectionStorage;
  /** Key on `RunCompletionSummary` when `storage === "summary"`. */
  field?: keyof RunCompletionSummary;
}

/**
 * Canonical section registry — single place for order and presence rules.
 * Persisted fields must stay aligned with `RunCompletionSummary`.
 */
export const COMPLETION_REPORT_SECTIONS: readonly CompletionReportSectionDefinition[] = [
  {
    id: "overview",
    title: "Overview",
    order: 0,
    presence: "required",
    storage: "summary",
    field: "overview",
  },
  {
    id: "executiveSummary",
    title: "Executive Summary",
    order: 1,
    presence: "required",
    storage: "summary",
    field: "executiveSummary",
  },
  {
    id: "userVisibleChanges",
    title: "User Visible Changes",
    order: 2,
    presence: "recommended",
    storage: "summary",
    field: "userVisibleChanges",
  },
  {
    id: "architectureChanges",
    title: "Architecture Changes",
    order: 3,
    presence: "recommended",
    storage: "summary",
    field: "architectureChanges",
  },
  {
    id: "filesModified",
    title: "Files Modified",
    order: 4,
    presence: "recommended",
    storage: "summary",
    field: "filesModified",
  },
  {
    id: "configurationChanges",
    title: "Configuration Changes",
    order: 5,
    presence: "optional",
    storage: "summary",
    field: "configurationChanges",
  },
  {
    id: "testingPerformed",
    title: "Testing Performed",
    order: 6,
    presence: "required",
    storage: "summary",
    field: "testingPerformed",
  },
  {
    id: "visualValidation",
    title: "Visual Validation",
    order: 7,
    presence: "optional",
    storage: "artifacts",
  },
  {
    id: "actionsRequired",
    title: "Actions Required",
    order: 8,
    presence: "recommended",
    storage: "derived",
  },
  {
    id: "knownLimitations",
    title: "Known Limitations",
    order: 9,
    presence: "optional",
    storage: "summary",
    field: "knownLimitations",
  },
  {
    id: "recommendedNextMilestone",
    title: "Recommended Next Milestone",
    order: 10,
    presence: "recommended",
    storage: "summary",
    field: "recommendedNextMilestone",
  },
] as const;

/** Known top-level keys on a v2 summary (plus accepted aliases handled at normalise time). */
const KNOWN_SUMMARY_KEYS = new Set<string>([
  "schemaVersion",
  "overview",
  "executiveSummary",
  "userVisibleChanges",
  "architectureChanges",
  "filesModified",
  "configurationChanges",
  "testingPerformed",
  "knownLimitations",
  "recommendedNextMilestone",
  "filesChanged",
  "testsPassed",
  "gitCommit",
  "source",
  // snake_case / legacy aliases accepted by normaliseCompletionSummary
  "executive_summary",
  "user_visible_changes",
  "architecture_changes",
  "files_modified",
  "configuration_changes",
  "tests_performed",
  "testsPerformed",
  "known_limitations",
  "known_issues",
  "knownIssues",
  "recommended_next_milestone",
  "files_changed",
  "tests_passed",
  "git_commit",
  "commit",
  "overview_text",
  "longFormOverview",
]);

export interface CompletionReportValidationIssue {
  code: string;
  message: string;
  sectionId?: string;
}

export interface CompletionReportValidationResult {
  /** Matches `COMPLETION_SUMMARY_SCHEMA_VERSION` when recognised. */
  schemaVersion: number | null;
  /** False only for structural / hard errors (not missing recommended sections). */
  ok: boolean;
  errors: CompletionReportValidationIssue[];
  warnings: CompletionReportValidationIssue[];
  /** Missing required or recommended *persisted* sections. */
  missingSections: string[];
}

function sectionFilled(summary: RunCompletionSummary, field: keyof RunCompletionSummary): boolean {
  const value = summary[field];
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean" || typeof value === "number") return true;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate a normalised `RunCompletionSummary` against the section registry.
 * Missing required/recommended summary fields become warnings (so evolution and
 * partial drafts can still persist); structural problems are errors.
 */
export function validateCompletionSummary(
  summary: RunCompletionSummary | null | undefined,
  options: { expectComplete?: boolean } = {},
): CompletionReportValidationResult {
  const expectComplete = options.expectComplete ?? true;
  const errors: CompletionReportValidationIssue[] = [];
  const warnings: CompletionReportValidationIssue[] = [];
  const missingSections: string[] = [];

  if (summary == null) {
    return {
      schemaVersion: null,
      ok: false,
      errors: [
        {
          code: "summary_missing",
          message: "Completion summary is null or undefined.",
        },
      ],
      warnings: [],
      missingSections: COMPLETION_REPORT_SECTIONS.filter((s) => s.storage === "summary").map(
        (s) => s.id,
      ),
    };
  }

  const schemaVersion =
    typeof summary.schemaVersion === "number" ? summary.schemaVersion : null;

  if (schemaVersion == null) {
    errors.push({
      code: "schema_version_missing",
      message: "schemaVersion is required on RunCompletionSummary.",
    });
  } else if (schemaVersion < COMPLETION_SUMMARY_SCHEMA_VERSION) {
    warnings.push({
      code: "schema_version_legacy",
      message: `schemaVersion ${schemaVersion} is older than supported ${COMPLETION_SUMMARY_SCHEMA_VERSION}; normalise before persist.`,
    });
  } else if (schemaVersion > COMPLETION_SUMMARY_SCHEMA_VERSION) {
    warnings.push({
      code: "schema_version_newer",
      message: `schemaVersion ${schemaVersion} is newer than this service (${COMPLETION_SUMMARY_SCHEMA_VERSION}); unknown fields may be ignored until the contract is upgraded.`,
    });
  }

  if (expectComplete) {
    for (const section of COMPLETION_REPORT_SECTIONS) {
      if (section.storage !== "summary" || !section.field) continue;
      if (section.presence === "optional") continue;
      if (!sectionFilled(summary, section.field)) {
        missingSections.push(section.id);
        const issue: CompletionReportValidationIssue = {
          code:
            section.presence === "required" ? "section_required_missing" : "section_recommended_missing",
          message: `Missing ${section.presence} section: ${section.title}.`,
          sectionId: section.id,
        };
        warnings.push(issue);
      }
    }

    if (summary.overview && overviewLooksThin(summary.overview)) {
      warnings.push({
        code: "overview_thin",
        sectionId: "overview",
        message:
          "Overview looks thin (<40 chars or fixture-like); prefer a fuller sprint-review narrative.",
      });
    }
  }

  return {
    schemaVersion,
    ok: errors.length === 0,
    errors,
    warnings,
    missingSections,
  };
}

/**
 * Validate a raw PUT body before/alongside normalisation.
 * Warns on unknown keys to support schema evolution without hard-coded parsers elsewhere.
 */
export function validateCompletionSummaryInput(input: unknown): CompletionReportValidationResult {
  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    return {
      schemaVersion: null,
      ok: false,
      errors: [
        {
          code: "invalid_payload",
          message: "Completion summary payload must be a JSON object.",
        },
      ],
      warnings: [],
      missingSections: [],
    };
  }

  const raw = input as Record<string, unknown>;
  const schemaVersion =
    typeof raw.schemaVersion === "number"
      ? raw.schemaVersion
      : typeof raw.schema_version === "number"
        ? raw.schema_version
        : null;

  const errors: CompletionReportValidationIssue[] = [];
  const warnings: CompletionReportValidationIssue[] = [];

  for (const key of Object.keys(raw)) {
    if (!KNOWN_SUMMARY_KEYS.has(key) && key !== "schema_version") {
      warnings.push({
        code: "unknown_field",
        message: `Unknown field "${key}" will be ignored by the current schema (v${COMPLETION_SUMMARY_SCHEMA_VERSION}). Update types.ts + this contract to adopt it.`,
      });
    }
  }

  if (schemaVersion != null && schemaVersion > COMPLETION_SUMMARY_SCHEMA_VERSION) {
    warnings.push({
      code: "schema_version_newer",
      message: `Payload schemaVersion ${schemaVersion} is newer than this service (${COMPLETION_SUMMARY_SCHEMA_VERSION}).`,
    });
  }

  return {
    schemaVersion,
    ok: errors.length === 0,
    errors,
    warnings,
    missingSections: [],
  };
}

/** Merge input + normalised summary validation (additive warnings). */
export function validateCompletionReportPipeline(
  input: unknown,
  normalised: RunCompletionSummary,
  options?: { expectComplete?: boolean },
): CompletionReportValidationResult {
  const fromInput = validateCompletionSummaryInput(input);
  const fromSummary = validateCompletionSummary(normalised, options);
  return {
    schemaVersion: fromSummary.schemaVersion ?? fromInput.schemaVersion,
    ok: fromInput.ok && fromSummary.ok,
    errors: [...fromInput.errors, ...fromSummary.errors],
    warnings: [...fromInput.warnings, ...fromSummary.warnings],
    missingSections: fromSummary.missingSections,
  };
}

export function listPersistedReportSectionTitles(): string[] {
  return COMPLETION_REPORT_SECTIONS.filter((s) => s.storage === "summary")
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => s.title);
}
