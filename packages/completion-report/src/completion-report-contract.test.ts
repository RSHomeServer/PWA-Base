import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COMPLETION_REPORT_SECTIONS,
  listPersistedReportSectionTitles,
  validateCompletionReportPipeline,
  validateCompletionSummary,
  validateCompletionSummaryInput,
} from "./completion-report-contract.js";
import { normaliseCompletionSummary } from "./completion-summary.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("completion report contract", () => {
  it("orders sections with Overview first and Actions Required before Known Limitations", () => {
    const byOrder = [...COMPLETION_REPORT_SECTIONS].sort((a, b) => a.order - b.order);
    expect(byOrder[0]?.id).toBe("overview");
    expect(byOrder.map((s) => s.id)).toContain("actionsRequired");
    expect(byOrder.map((s) => s.id)).toContain("visualValidation");
    const actions = byOrder.find((s) => s.id === "actionsRequired")!;
    const known = byOrder.find((s) => s.id === "knownLimitations")!;
    expect(actions.order).toBeLessThan(known.order);
  });

  it("warns on missing required/recommended persisted sections", () => {
    const summary = normaliseCompletionSummary({
      executiveSummary: "Only summary",
    });
    const result = validateCompletionSummary(summary);
    expect(result.ok).toBe(true);
    expect(result.missingSections).toContain("overview");
    expect(result.missingSections).toContain("testingPerformed");
    expect(result.warnings.some((w) => w.code === "section_required_missing")).toBe(true);
  });

  it("accepts a complete structured report without required-section warnings", () => {
    const summary = normaliseCompletionSummary({
      overview:
        "Established the project engineering contract so Cursor follows shared behaviour without repeating milestone boilerplate. Reporting stays on the existing RunCompletionSummary type with registry validation.",
      executiveSummary: "CURSOR.md + report contract validation",
      userVisibleChanges: ["CURSOR.md at repo root"],
      architectureChanges: ["Completion report section registry in telemetry"],
      filesModified: [{ area: "Contract", files: ["CURSOR.md"] }],
      configurationChanges: [],
      testingPerformed: [{ check: "Unit", status: "pass", detail: "" }],
      knownLimitations: [],
      recommendedNextMilestone: "Apply contract on next milestone",
    });
    const result = validateCompletionSummary(summary);
    expect(result.ok).toBe(true);
    expect(result.missingSections).toEqual([]);
    expect(result.warnings.filter((w) => w.code.startsWith("section_"))).toEqual([]);
  });

  it("warns on unknown input fields for schema evolution", () => {
    const result = validateCompletionSummaryInput({
      schemaVersion: 2,
      executiveSummary: "x",
      brandNewFutureField: true,
    });
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.code === "unknown_field")).toBe(true);
  });

  it("rejects non-object input", () => {
    const result = validateCompletionSummaryInput("not-json-object");
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("invalid_payload");
  });

  it("pipeline combines input + summary validation", () => {
    const input = { executiveSummary: "Hi", extraThing: 1 };
    const normalised = normaliseCompletionSummary(input);
    const result = validateCompletionReportPipeline(input, normalised);
    expect(result.warnings.some((w) => w.code === "unknown_field")).toBe(true);
    expect(result.missingSections.length).toBeGreaterThan(0);
  });

  it("lists persisted section titles for docs/export alignment", () => {
    const titles = listPersistedReportSectionTitles();
    expect(titles[0]).toBe("Overview");
    expect(titles).toContain("Executive Summary");
    expect(titles).not.toContain("Actions Required");
  });
});

describe("CURSOR.md engineering contract", () => {
  it("exists at repo root and points at the report source of truth", () => {
    const path = join(repoRoot, "CURSOR.md");
    expect(existsSync(path)).toBe(true);
    const md = readFileSync(path, "utf8");
    expect(md).toMatch(/Execution Philosophy/i);
    expect(md).toMatch(/Definition of Done/i);
    expect(md).toContain("RunCompletionSummary");
    expect(
      md.includes("packages/completion-report") ||
        md.includes("completion-report-contract.ts") ||
        md.includes("@platform/completion-report"),
    ).toBe(true);
  });
});
