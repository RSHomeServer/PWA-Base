import type { RunCompletionSummary } from "../api/types.js";

/** Client-side Markdown export (display never parses Markdown). */
export function formatCompletionSummaryMarkdown(summary: RunCompletionSummary): string {
  const lines: string[] = [];
  const pushSection = (title: string, body: string[]) => {
    if (!body?.length) return;
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

  pushSection("User Visible Changes", summary.userVisibleChanges ?? []);
  pushSection("Architecture Changes", summary.architectureChanges ?? []);

  if (summary.filesModified?.length) {
    lines.push("## Files Modified");
    for (const group of summary.filesModified) {
      lines.push(`### ${group.area}`);
      for (const file of group.files) lines.push(`- ${file}`);
    }
    lines.push("");
  }

  pushSection("Configuration Changes", summary.configurationChanges ?? []);

  if (summary.testingPerformed?.length) {
    lines.push("## Testing Performed");
    for (const t of summary.testingPerformed) {
      const detail = t.detail?.trim() ? `: ${t.detail}` : "";
      lines.push(`- ${t.check} — ${t.status}${detail}`);
    }
    lines.push("");
  }

  pushSection("Known Limitations", summary.knownLimitations ?? []);

  if (summary.recommendedNextMilestone) {
    lines.push("## Recommended Next Milestone");
    lines.push(summary.recommendedNextMilestone);
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}
