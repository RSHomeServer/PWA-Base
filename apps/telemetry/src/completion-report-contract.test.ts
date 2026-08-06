import { describe, expect, it } from "vitest";
import {
  COMPLETION_REPORT_SECTIONS,
  validateCompletionSummary,
} from "./completion-report-contract.js";
import { normaliseCompletionSummary } from "./completion-summary.js";

describe("telemetry completion-report re-exports", () => {
  it("re-exports the shared contract from @platform/completion-report", () => {
    expect(COMPLETION_REPORT_SECTIONS[0]?.id).toBe("overview");
    const result = validateCompletionSummary(
      normaliseCompletionSummary({ executiveSummary: "Only summary" }),
    );
    expect(result.missingSections).toContain("overview");
  });
});
