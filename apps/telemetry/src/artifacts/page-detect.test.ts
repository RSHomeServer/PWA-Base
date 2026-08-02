import { describe, expect, it } from "vitest";
import { detectCapturePages } from "./page-detect.js";

describe("detectCapturePages", () => {
  it("maps RunsPage to Runs", () => {
    const pages = detectCapturePages(["packages/site-dashboard/src/pages/RunsPage.tsx"]);
    expect(pages.map((p) => p.pageKey)).toEqual(["runs"]);
  });

  it("maps RunSummaryCard to Runs", () => {
    const pages = detectCapturePages([
      "packages/site-dashboard/src/components/RunSummaryCard.tsx",
    ]);
    expect(pages.map((p) => p.pageKey)).toEqual(["runs"]);
  });

  it("maps SettingsPage to Settings", () => {
    const pages = detectCapturePages(["packages/site-dashboard/src/pages/SettingsPage.tsx"]);
    expect(pages.map((p) => p.pageKey)).toEqual(["settings"]);
  });

  it("falls back to Runs when nothing matches", () => {
    const pages = detectCapturePages(["apps/telemetry/src/service.ts"]);
    expect(pages.map((p) => p.pageKey)).toEqual(["runs"]);
  });

  it("deduplicates across multiple UI files", () => {
    const pages = detectCapturePages([
      "HistoryPage.tsx",
      "RunSummaryCard.tsx",
      "pages.module.css",
    ]);
    expect(pages.map((p) => p.pageKey)).toEqual(["runs"]);
  });
});
