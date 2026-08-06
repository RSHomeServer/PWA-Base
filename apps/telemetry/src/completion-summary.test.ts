import { describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FileAreaGroup } from "@platform/completion-report";
import {
  isStructuredCompletionSummary,
  mergeCompletionSummary,
  normaliseCompletionSummary,
} from "./completion-summary.js";
import { openStore } from "./db/store.js";
import { TelemetryService } from "./service.js";

describe("completion summary telemetry integration", () => {
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
    expect(
      live.run?.completionSummary?.filesModified.some((g: FileAreaGroup) =>
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

  it("re-exports completion-report package helpers", () => {
    const merged = mergeCompletionSummary(
      normaliseCompletionSummary({ executiveSummary: "Base" }),
      { gitCommit: "abc" },
    );
    expect(merged.gitCommit).toBe("abc");
  });
});
