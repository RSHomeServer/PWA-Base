import type {
  FileAreaGroup,
  RunCompletionSummary,
  TestResultItem,
  TestResultStatus,
} from "./types.js";

export const COMPLETION_SUMMARY_SCHEMA_VERSION = 2 as const;

const EMPTY: RunCompletionSummary = {
  schemaVersion: 2,
  overview: null,
  executiveSummary: null,
  userVisibleChanges: [],
  architectureChanges: [],
  filesModified: [],
  configurationChanges: [],
  testingPerformed: [],
  knownLimitations: [],
  recommendedNextMilestone: null,
  filesChanged: null,
  testsPassed: null,
  gitCommit: null,
  source: null,
};

/** Normalize a partial/unknown payload into a complete RunCompletionSummary (v2). */
export function normaliseCompletionSummary(
  input: unknown,
  source: RunCompletionSummary["source"] = "structured",
): RunCompletionSummary {
  if (input == null || typeof input !== "object" || Array.isArray(input)) {
    return { ...EMPTY, source };
  }
  const raw = input as Record<string, unknown>;

  const filesModified = asFileAreaGroups(
    raw.filesModified ?? raw.files_modified ?? raw["Files Modified"],
  );
  const testingPerformed = asTestResults(
    raw.testingPerformed ??
      raw.testsPerformed ??
      raw.tests_performed ??
      raw["Testing Performed"] ??
      raw["Tests Performed"],
  );
  const knownLimitations = asStringList(
    raw.knownLimitations ??
      raw.known_limitations ??
      raw.knownIssues ??
      raw.known_issues ??
      raw["Known Limitations"] ??
      raw["Known Issues"],
  );
  const recommendedNextMilestone = asNullableString(
    raw.recommendedNextMilestone ??
      raw.recommended_next_milestone ??
      raw["Recommended Next Milestone"] ??
      firstOfList(raw.recommendations),
  );

  const fileCount = countFiles(filesModified);
  const testsPassed =
    asNullableBoolean(raw.testsPassed ?? raw.tests_passed) ??
    deriveTestsPassed(testingPerformed);

  return {
    schemaVersion: 2,
    overview: asNullableString(
      raw.overview ?? raw.overview_text ?? raw.longFormOverview ?? raw["Overview"],
    ),
    executiveSummary: asNullableString(
      raw.executiveSummary ?? raw.executive_summary ?? raw["Executive Summary"],
    ),
    userVisibleChanges: asStringList(
      raw.userVisibleChanges ?? raw.user_visible_changes ?? raw["User Visible Changes"],
    ),
    architectureChanges: asStringList(
      raw.architectureChanges ?? raw.architecture_changes ?? raw["Architecture Changes"],
    ),
    filesModified,
    configurationChanges: asStringList(
      raw.configurationChanges ?? raw.configuration_changes ?? raw["Configuration Changes"],
    ),
    testingPerformed,
    knownLimitations,
    recommendedNextMilestone,
    filesChanged: asNullableNumber(raw.filesChanged ?? raw.files_changed ?? (fileCount || null)),
    testsPassed,
    gitCommit: asNullableString(raw.gitCommit ?? raw.git_commit ?? raw.commit),
    source: (raw.source as RunCompletionSummary["source"]) ?? source,
  };
}

/**
 * Legacy helper: parse agent markdown into a structured summary.
 * Kept for unit tests and reading old behaviour — **not** used for new-run ingest.
 */
export function parseCompletionSummaryFromMarkdown(text: string): RunCompletionSummary | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const sections = splitMarkdownSections(trimmed);
  if (Object.keys(sections).length === 0) {
    if (trimmed.length > 0 && trimmed.length <= 2000) {
      return {
        ...EMPTY,
        executiveSummary: firstParagraph(stripMarkdownDecor(trimmed)),
        source: "legacy",
      };
    }
    return null;
  }

  const files = bulletLines(sections["files modified"] ?? sections["files changed"]);
  const tests = bulletLines(
    sections["testing performed"] ?? sections["tests performed"] ?? sections["testing"],
  );
  const summary = normaliseCompletionSummary(
    {
      overview: sections["overview"] ? stripMarkdownDecor(sections["overview"]) : undefined,
      executiveSummary: firstParagraph(
        stripMarkdownDecor(
          sections["executive summary"] ?? sections["summary"] ?? firstParagraph(trimmed),
        ),
      ),
      userVisibleChanges: bulletLines(sections["user visible changes"]),
      architectureChanges: bulletLines(sections["architecture changes"]),
      filesModified: files.length ? [{ area: "Files", files }] : [],
      configurationChanges: bulletLines(sections["configuration changes"]),
      testingPerformed: tests.map((line) => parseTestLine(line)).filter(Boolean),
      knownLimitations: bulletLines(
        sections["known limitations"] ?? sections["known issues"] ?? sections["limitations"],
      ),
      recommendedNextMilestone: asNullableString(
        firstParagraph(
          sections["recommended next milestone"] ??
            sections["follow-up recommendations"] ??
            sections["recommendations"] ??
            "",
        ).replace(/^[-*•]\s+/, ""),
      ),
    },
    "markdown",
  );

  if (!summary.executiveSummary && summary.filesModified.length === 0) return null;
  return summary;
}

/** Generate Markdown export from the canonical summary object. */
export function formatCompletionSummaryMarkdown(summary: RunCompletionSummary): string {
  const lines: string[] = [];
  const pushSection = (title: string, body: string[]) => {
    if (body.length === 0) return;
    lines.push(`## ${title}`);
    for (const item of body) lines.push(`- ${item}`);
    lines.push("");
  };

  if (summary.overview) {
    lines.push("## Overview");
    lines.push(summary.overview);
    lines.push("");
  }

  lines.push("## Executive Summary");
  lines.push(summary.executiveSummary ?? "—");
  lines.push("");

  pushSection("User Visible Changes", summary.userVisibleChanges);
  pushSection("Architecture Changes", summary.architectureChanges);

  if (summary.filesModified.length > 0) {
    lines.push("## Files Modified");
    for (const group of summary.filesModified) {
      lines.push(`### ${group.area}`);
      for (const file of group.files) lines.push(`- ${file}`);
    }
    lines.push("");
  }

  pushSection("Configuration Changes", summary.configurationChanges);

  if (summary.testingPerformed.length > 0) {
    lines.push("## Testing Performed");
    for (const t of summary.testingPerformed) {
      const detail = t.detail ? `: ${t.detail}` : "";
      lines.push(`- ${t.check} — ${t.status}${detail}`);
    }
    lines.push("");
  }

  pushSection("Known Limitations", summary.knownLimitations);

  if (summary.recommendedNextMilestone) {
    lines.push("## Recommended Next Milestone");
    lines.push(summary.recommendedNextMilestone);
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

export function isStructuredCompletionSummary(
  summary: RunCompletionSummary | null | undefined,
): boolean {
  if (!summary) return false;
  return Boolean(
    summary.overview ||
      summary.executiveSummary ||
      summary.userVisibleChanges.length ||
      summary.architectureChanges.length ||
      summary.filesModified.length ||
      summary.configurationChanges.length ||
      summary.testingPerformed.length ||
      summary.knownLimitations.length ||
      summary.recommendedNextMilestone,
  );
}

export function mergeCompletionSummary(
  current: RunCompletionSummary | null,
  patch: Partial<RunCompletionSummary> | null | undefined,
): RunCompletionSummary {
  const base = current ?? { ...EMPTY };
  if (!patch) return base;
  const filesModified =
    patch.filesModified && patch.filesModified.length > 0
      ? patch.filesModified
      : base.filesModified;
  const testingPerformed =
    patch.testingPerformed && patch.testingPerformed.length > 0
      ? patch.testingPerformed
      : base.testingPerformed;
  return {
    schemaVersion: 2,
    overview: patch.overview ?? base.overview,
    executiveSummary: patch.executiveSummary ?? base.executiveSummary,
    userVisibleChanges:
      patch.userVisibleChanges && patch.userVisibleChanges.length > 0
        ? patch.userVisibleChanges
        : base.userVisibleChanges,
    architectureChanges:
      patch.architectureChanges && patch.architectureChanges.length > 0
        ? patch.architectureChanges
        : base.architectureChanges,
    filesModified,
    configurationChanges:
      patch.configurationChanges && patch.configurationChanges.length > 0
        ? patch.configurationChanges
        : base.configurationChanges,
    testingPerformed,
    knownLimitations:
      patch.knownLimitations && patch.knownLimitations.length > 0
        ? patch.knownLimitations
        : base.knownLimitations,
    recommendedNextMilestone:
      patch.recommendedNextMilestone ?? base.recommendedNextMilestone,
    filesChanged:
      patch.filesChanged ?? base.filesChanged ?? (countFiles(filesModified) || null),
    testsPassed: patch.testsPassed ?? base.testsPassed ?? deriveTestsPassed(testingPerformed),
    gitCommit: patch.gitCommit ?? base.gitCommit,
    source: patch.source ?? base.source ?? "structured",
  };
}

export function completionSummaryFromPayload(
  payload: Record<string, unknown>,
): RunCompletionSummary | null {
  const direct =
    payload.completion_summary ??
    payload.completionSummary ??
    payload.run_summary ??
    payload.runSummary;
  if (direct != null && typeof direct === "object") {
    return normaliseCompletionSummary(direct, "structured");
  }
  return null;
}

function countFiles(groups: FileAreaGroup[]): number {
  return groups.reduce((n, g) => n + g.files.length, 0);
}

function asFileAreaGroups(value: unknown): FileAreaGroup[] {
  if (!Array.isArray(value)) {
    if (typeof value === "string") {
      const files = bulletLines(value);
      return files.length ? [{ area: "Files", files }] : [];
    }
    return [];
  }

  const groups: FileAreaGroup[] = [];
  const looseFiles: string[] = [];

  for (const item of value) {
    if (typeof item === "string") {
      const path = stripMarkdownDecor(item).replace(/^`(.+)`$/, "$1").trim();
      if (path) looseFiles.push(path);
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;

    // v2: { area, files: string[] }
    if (typeof o.area === "string" && Array.isArray(o.files)) {
      const files = o.files
        .map((f) => stripMarkdownDecor(String(f)).trim())
        .filter(Boolean);
      if (files.length) groups.push({ area: o.area.trim() || "Files", files });
      continue;
    }

    // v1: { path, change? }
    const path = asNullableString(o.path ?? o.file ?? o.name);
    if (path) {
      looseFiles.push(path);
    }
  }

  if (looseFiles.length) {
    groups.push({ area: "Files", files: looseFiles });
  }
  return groups;
}

function asTestResults(value: unknown): TestResultItem[] {
  if (Array.isArray(value)) {
    return value
      .map((item): TestResultItem | null => {
        if (typeof item === "string") return parseTestLine(item);
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          const check = asNullableString(o.check ?? o.name ?? o.test ?? o.title);
          if (!check) return null;
          const status = parseTestStatus(o.status ?? o.result);
          return {
            check,
            status: status ?? "pass",
            detail: asNullableString(o.detail ?? o.message ?? o.notes) ?? "",
          };
        }
        return null;
      })
      .filter((x): x is TestResultItem => x != null);
  }
  if (typeof value === "string") {
    return bulletLines(value)
      .map(parseTestLine)
      .filter((x): x is TestResultItem => x != null);
  }
  return [];
}

function parseTestLine(line: string): TestResultItem | null {
  const cleaned = stripMarkdownDecor(line).trim();
  if (!cleaned) return null;
  const m = cleaned.match(
    /^(.+?)(?:\s*[—:-]\s*(pass|passed|fail|failed|skip|skipped|ok)\b)?(?:\s*[—:-]\s*(.+))?$/i,
  );
  if (!m) return { check: cleaned, status: "pass", detail: "" };
  const check = (m[1] ?? cleaned).trim();
  const status = parseTestStatus(m[2] ?? inferStatusFromName(cleaned)) ?? "pass";
  const detail = asNullableString(m[3]) ?? "";
  return { check: check.replace(/\s+[—:-]\s*$/, "").trim() || cleaned, status, detail };
}

function inferStatusFromName(text: string): TestResultStatus | null {
  const lower = text.toLowerCase();
  if (/\b(fail|failed|error)\b/.test(lower)) return "fail";
  if (/\b(pass|passed|ok)\b/.test(lower)) return "pass";
  if (/\b(skip|skipped)\b/.test(lower)) return "skip";
  return null;
}

function parseTestStatus(value: unknown): TestResultStatus | null {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!v || v === "unknown") return null;
  if (["pass", "passed", "ok", "success"].includes(v)) return "pass";
  if (["fail", "failed", "error"].includes(v)) return "fail";
  if (["skip", "skipped"].includes(v)) return "skip";
  return null;
}

function deriveTestsPassed(tests: TestResultItem[]): boolean | null {
  if (tests.length === 0) return null;
  if (tests.some((t) => t.status === "fail")) return false;
  if (tests.some((t) => t.status === "pass")) return true;
  return null;
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

function asNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asNullableBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "yes", "pass", "passed", "ok"].includes(v)) return true;
    if (["false", "no", "fail", "failed"].includes(v)) return false;
  }
  return null;
}

function firstOfList(value: unknown): string | null {
  const list = asStringList(value);
  return list[0] ?? null;
}

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => stripMarkdownDecor(typeof v === "string" ? v : String(v)).trim())
      .filter((v) => v.length > 0);
  }
  if (typeof value === "string") return bulletLines(value).map(stripMarkdownDecor);
  return [];
}

function splitMarkdownSections(text: string): Record<string, string> {
  const lines = text.split(/\r?\n/);
  const sections: Record<string, string[]> = {};
  let current: string | null = null;
  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+?)\s*$/);
    if (heading) {
      current = heading[1]!.replace(/^\d+\.\s*/, "").trim().toLowerCase();
      sections[current] = [];
      continue;
    }
    if (current) sections[current]!.push(line);
  }
  const out: Record<string, string> = {};
  for (const [key, body] of Object.entries(sections)) {
    const joined = body.join("\n").trim();
    if (joined) out[key] = joined;
  }
  return out;
}

function bulletLines(block: string | undefined): string[] {
  if (!block) return [];
  return block
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*•]\s+/, "").replace(/^\d+\.\s+/, "").trim())
    .filter((line) => line.length > 0 && !/^#{1,3}\s/.test(line));
}

function firstParagraph(text: string): string {
  const para = text
    .split(/\n\s*\n/)
    .map((p) => stripMarkdownDecor(p.trim()))
    .find((p) => p.length > 0 && !p.startsWith("#"));
  if (!para) return stripMarkdownDecor(text.trim()).slice(0, 500);
  return para.length <= 800 ? para : `${para.slice(0, 797)}…`;
}

function stripMarkdownDecor(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s*/, "")
    .trim();
}
