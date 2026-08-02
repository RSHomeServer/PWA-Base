import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  formatCompletionSummaryMarkdown,
  isStructuredCompletionSummary,
  mergeCompletionSummary,
  normaliseCompletionSummary,
  parseCompletionSummaryFromMarkdown,
} from "./completion-summary.js";
import { openStore } from "./db/store.js";
import { TelemetryService } from "./service.js";

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

  it("persists structured summary via payload and retains completed live run", async () => {
    const dir = mkdtempSync(join(tmpdir(), "sum2-"));
    const store = openStore(join(dir, "t.sqlite"));
    const service = new TelemetryService(store, () => undefined);

    const start = await service.ingest({
      hook_event_name: "beforeSubmitPrompt",
      conversation_id: "c-sum2",
      prompt: "Ship v2 summary",
    });

    await service.ingest({
      hook_event_name: "afterAgentResponse",
      conversation_id: "c-sum2",
      text: "Ignore this markdown ## Files Modified\n- should-not-parse.ts",
      completion_summary: {
        executiveSummary: "Structured only",
        filesModified: [{ area: "Backend", files: ["service.ts"] }],
        testingPerformed: [{ check: "unit", status: "pass", detail: "" }],
      },
    });

    await service.ingest({
      hook_event_name: "stop",
      conversation_id: "c-sum2",
      status: "completed",
    });

    const live = service.getLiveRun();
    expect(live.run?.status).toBe("completed");
    expect(live.run?.completionSummary?.executiveSummary).toBe("Structured only");
    expect(live.run?.completionSummary?.filesModified[0]?.files).toEqual(["service.ts"]);
    // Markdown body must not be parsed for new runs
    expect(
      live.run?.completionSummary?.filesModified.some((g) =>
        g.files.includes("should-not-parse.ts"),
      ),
    ).toBe(false);
    expect(isStructuredCompletionSummary(live.run?.completionSummary)).toBe(true);

    const updated = service.updateCompletionSummary(start.runId!, {
      gitCommit: "abc1234",
      recommendedNextMilestone: "Rebuild image",
    });
    expect(updated?.run.completionSummary?.gitCommit).toBe("abc1234");
    expect(updated?.reportValidation.ok).toBe(true);

    store.close();
    rmSync(dir, { recursive: true, force: true });
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
});
