import { describe, expect, it } from "vitest";
import {
  formatCompletionSummaryMarkdown,
  isStructuredCompletionSummary,
  mergeCompletionSummary,
  normaliseCompletionSummary,
  parseCompletionSummaryFromMarkdown,
} from "./completion-summary.js";

describe("completion summary v2", () => {
  it("normalises area/file groups and test checks", () => {
    const summary = normaliseCompletionSummary({
      executiveSummary: "Polished History UX",
      filesModified: [
        { area: "Schema/API", files: ["types.ts", "completion-summary.ts"] },
        { area: "UI", files: ["HistoryPage.tsx"] },
      ],
      testingPerformed: [
        { check: "Unit/integration (33)", status: "pass", detail: "" },
        { check: "Typecheck", status: "pass" },
      ],
      configurationChanges: ["Telemetry runs in Docker"],
      knownLimitations: ["Legacy fallback only"],
      recommendedNextMilestone: "Auto git SHA",
    });
    expect(summary.schemaVersion).toBe(2);
    expect(summary.filesModified[0]?.area).toBe("Schema/API");
    expect(summary.filesModified[0]?.files).toContain("types.ts");
    expect(summary.testingPerformed[0]?.check).toBe("Unit/integration (33)");
    expect(summary.testingPerformed[0]?.status).toBe("pass");
    expect(summary.filesChanged).toBe(3);
    expect(summary.testsPassed).toBe(true);
  });

  it("upgrades legacy v1 path/change items into area groups", () => {
    const summary = normaliseCompletionSummary({
      filesModified: [
        { path: "a.ts", change: "modified" },
        { path: "b.ts", change: "unknown" },
      ],
    });
    expect(summary.filesModified).toEqual([{ area: "Files", files: ["a.ts", "b.ts"] }]);
  });

  it("exports markdown from structured object", () => {
    const md = formatCompletionSummaryMarkdown({
      schemaVersion: 2,
      overview: null,
      executiveSummary: "Hello",
      userVisibleChanges: ["UI card"],
      architectureChanges: [],
      filesModified: [{ area: "UI", files: ["a.ts"] }],
      configurationChanges: [],
      testingPerformed: [{ check: "unit", status: "pass", detail: "" }],
      knownLimitations: [],
      recommendedNextMilestone: "Next thing",
      filesChanged: 1,
      testsPassed: true,
      gitCommit: null,
      source: "structured",
    });
    expect(md).toContain("## Files Modified");
    expect(md).toContain("### UI");
    expect(md).toContain("- a.ts");
    expect(md).toContain("unit — pass");
  });

  it("merges patches without wiping existing fields", () => {
    const merged = mergeCompletionSummary(
      {
        schemaVersion: 2,
        overview: null,
        executiveSummary: "Keep me",
        userVisibleChanges: [],
        architectureChanges: [],
        filesModified: [{ area: "Core", files: ["a.ts"] }],
        configurationChanges: [],
        testingPerformed: [],
        knownLimitations: [],
        recommendedNextMilestone: null,
        filesChanged: 1,
        testsPassed: null,
        gitCommit: null,
        source: "structured",
      },
      { gitCommit: "deadbeef", recommendedNextMilestone: "Ship it" },
    );
    expect(merged.executiveSummary).toBe("Keep me");
    expect(merged.filesModified[0]?.files).toEqual(["a.ts"]);
    expect(merged.gitCommit).toBe("deadbeef");
  });

  it("keeps legacy markdown parser for old tooling only", () => {
    const parsed = parseCompletionSummaryFromMarkdown(`
## Executive Summary
Legacy parse path.
## Files Modified
- old.ts
`);
    expect(parsed?.source).toBe("markdown");
    expect(parsed?.filesModified[0]?.files).toContain("old.ts");
  });

  it("detects structured summaries", () => {
    const summary = normaliseCompletionSummary({ executiveSummary: "Done" });
    expect(isStructuredCompletionSummary(summary)).toBe(true);
    expect(isStructuredCompletionSummary(null)).toBe(false);
  });
});
