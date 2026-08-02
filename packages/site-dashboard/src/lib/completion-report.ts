import type { FileAreaGroup, RunCompletionSummary, TestResultItem } from "../api/types.js";

/** Pure helpers shared by `RunSummaryCard` and `TaskSummaryCard` (kept out of the
 * component file so React Fast Refresh can still statically analyse it). */

export function countFiles(groups: FileAreaGroup[] | undefined): number | null {
  if (!groups?.length) return null;
  const n = groups.reduce((sum, g) => sum + (g.files?.length ?? 0), 0);
  return n > 0 ? n : null;
}

export function isNativeReport(cs: RunCompletionSummary | null | undefined): boolean {
  if (!cs) return false;
  return Boolean(
    cs.overview ||
      cs.executiveSummary ||
      cs.userVisibleChanges?.length ||
      cs.architectureChanges?.length ||
      cs.filesModified?.length ||
      cs.configurationChanges?.length ||
      cs.testingPerformed?.length ||
      cs.knownLimitations?.length ||
      cs.recommendedNextMilestone,
  );
}

export function stripMd(text: string | null | undefined): string | null {
  if (!text) return null;
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s*/gm, "")
    .trim();
}

export function testBadge(status: TestResultItem["status"]): "success" | "warning" | "error" {
  switch (status) {
    case "pass":
      return "success";
    case "fail":
      return "error";
    case "skip":
      return "warning";
  }
}
