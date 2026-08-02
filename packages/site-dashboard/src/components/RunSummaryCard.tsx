import { useState, type ReactNode } from "react";
import { Badge, Button, Panel } from "@platform/ui";
import type { PromptRecord, RunRecord } from "../api/types.js";
import { formatDuration, formatRunStatusLabel, statusTone } from "../lib/format.js";
import styles from "../pages/pages.module.css";
import { countFiles, isNativeReport, stripMd } from "../lib/completion-report.js";
import { ActionsRequiredPanel } from "./ActionsRequiredPanel.js";
import { BulletSection, FilesByArea, TestsTable, WarningSection } from "./CompletionReportSections.js";
import { DevDiagnosticsPanel } from "./DevDiagnosticsPanel.js";

export interface RunSummaryCardProps {
  run: RunRecord;
  prompt: PromptRecord | null;
  elapsedMs: number | null;
  /** Rendered after User Visible Changes (e.g. Visual Validation). */
  afterUserVisible?: ReactNode;
  /** Optional live file paths from file_edit events. */
  livePaths?: string[] | null;
}

/**
 * Native structured run report. Markdown is export-only.
 * Legacy runs without structured summary show plain-text fallback.
 */
export function RunSummaryCard({
  run,
  prompt,
  elapsedMs,
  afterUserVisible,
  livePaths,
}: RunSummaryCardProps) {
  const cs = run.completionSummary;
  const structured = isNativeReport(cs);
  const [copied, setCopied] = useState(false);

  // Prefer the Legacy summary panel for plain-text `run.summary` — do not also
  // paste that prose into Executive (metrics stay in Executive either way).
  const legacyText = !structured ? stripMd(run.summary) : null;
  const showLegacy = Boolean(legacyText);

  const executiveLead =
    cs?.executiveSummary?.trim() ||
    (!showLegacy && (run.status === "running" || run.status === "waiting")
      ? "Run in progress…"
      : null) ||
    (!showLegacy && !structured ? "No executive summary captured yet." : null);

  // Overview is only shown when a distinct long-form overview exists —
  // never fall back to the executive summary (that duplicated the same text).
  const overviewText = cs?.overview?.trim() || null;
  const showOverview = Boolean(
    overviewText && overviewText !== (cs?.executiveSummary?.trim() || ""),
  );

  const filesChanged = cs?.filesChanged ?? countFiles(cs?.filesModified);
  const statusLabel = formatRunStatusLabel(run.status, run.completionKind);

  const onExport = async () => {
    if (!cs || !structured) return;
    const { formatCompletionSummaryMarkdown } = await import("../lib/completion-export.js");
    const md = formatCompletionSummaryMarkdown(cs);
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className={styles.reportStack}>
      <DevDiagnosticsPanel filesModified={cs?.filesModified} livePaths={livePaths} />

      {run.needsReview ? (
        <Panel title="Needs Review" className={styles.needsReviewPanel}>
          <p className={styles.summaryLead}>
            This run was flagged for operator review
            {run.lifecycleReason ? ` (${run.lifecycleReason.replace(/_/g, " ")})` : ""}.
          </p>
        </Panel>
      ) : null}

      {showOverview ? (
        <Panel title="Overview" className={styles.overviewCard}>
          <pre className={styles.overviewBody}>{overviewText}</pre>
        </Panel>
      ) : null}

      <ActionsRequiredPanel filesModified={cs?.filesModified} livePaths={livePaths} />

      <Panel className={[styles.summaryCard, styles.summarySuccess].join(" ")}>
        <div className={styles.summaryCardHead}>
          <h2 className={styles.sectionTitle}>Executive Summary</h2>
          {structured ? (
            <Button type="button" size="sm" variant="secondary" onClick={() => void onExport()}>
              {copied ? "Copied" : "Export Markdown"}
            </Button>
          ) : null}
        </div>
        {executiveLead ? <p className={styles.summaryLead}>{executiveLead}</p> : null}
        <div className={styles.summaryMetrics}>
          <div>
            <span className={styles.statLabel}>Status</span>
            <Badge variant={statusTone(run.status)}>{statusLabel}</Badge>
          </div>
          {run.completionKind ? (
            <div>
              <span className={styles.statLabel}>Completion</span>
              <Badge variant={run.completionKind === "manual" ? "warning" : "success"}>
                {run.completionKind === "manual" ? "Manually completed" : "Automatically completed"}
              </Badge>
            </div>
          ) : null}
          {run.completionKind === "manual" && run.manualCompletionReason ? (
            <div>
              <span className={styles.statLabel}>Manual reason</span>
              <strong>{run.manualCompletionReason.replace(/_/g, " ")}</strong>
            </div>
          ) : null}
          <div>
            <span className={styles.statLabel}>Duration</span>
            <strong>{formatDuration(elapsedMs ?? run.durationMs)}</strong>
          </div>
          <div>
            <span className={styles.statLabel}>Files Changed</span>
            <strong>{filesChanged == null ? "—" : filesChanged}</strong>
          </div>
          <div>
            <span className={styles.statLabel}>Tests Passed</span>
            <strong>
              {cs?.testsPassed == null ? "—" : cs.testsPassed ? "Yes" : "No"}
            </strong>
          </div>
          {cs?.gitCommit ? (
            <div>
              <span className={styles.statLabel}>Git Commit</span>
              <strong>
                <code>{cs.gitCommit}</code>
              </strong>
            </div>
          ) : null}
          {prompt ? (
            <div className={styles.summaryPrompt}>
              <span className={styles.statLabel}>Title</span>
              <strong>{prompt.title}</strong>
            </div>
          ) : null}
        </div>
      </Panel>

      {showLegacy ? (
        <Panel className={styles.legacyCard} title="Legacy summary">
          <p className={styles.muted}>
            This run predates the structured report model. Showing stored plain text.
          </p>
          <pre className={styles.legacyBody}>{legacyText}</pre>
        </Panel>
      ) : null}

      {structured && cs ? (
        <>
          <BulletSection title="User Visible Changes" items={cs.userVisibleChanges} />
          {afterUserVisible}
          <BulletSection title="Architecture Changes" items={cs.architectureChanges} />
          <FilesByArea groups={cs.filesModified} />
          <BulletSection title="Configuration Changes" items={cs.configurationChanges} />
          <TestsTable tests={cs.testingPerformed} />
          <WarningSection items={cs.knownLimitations} />
          {cs.recommendedNextMilestone ? (
            <Panel className={styles.nextMilestoneCard} title="Recommended Next Milestone">
              <p className={styles.nextMilestoneText}>{cs.recommendedNextMilestone}</p>
            </Panel>
          ) : null}
        </>
      ) : (
        afterUserVisible
      )}
    </div>
  );
}

