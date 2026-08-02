import { useState, type ReactNode } from "react";
import { Badge, Button, Panel } from "@platform/ui";
import type { TaskRecord } from "../api/types.js";
import { countFiles, isNativeReport } from "../lib/completion-report.js";
import { formatDuration, formatTaskStatusLabel, taskStatusTone } from "../lib/format.js";
import styles from "../pages/pages.module.css";
import { BulletSection, FilesByArea, TestsTable, WarningSection } from "./CompletionReportSections.js";

export interface TaskSummaryCardProps {
  task: TaskRecord;
  elapsedMs: number | null;
  /** Rendered after User Visible Changes (e.g. Visual Validation). */
  afterUserVisible?: ReactNode;
}

/**
 * Task-level completion report — the Overview tab of Task Detail.
 * Mirrors `RunSummaryCard`'s structure (via shared `CompletionReportSections`)
 * but reads from the Task's own completion summary, which is promoted from
 * whichever constituent Run last wrote a structured report.
 */
export function TaskSummaryCard({ task, elapsedMs, afterUserVisible }: TaskSummaryCardProps) {
  const cs = task.completionSummary;
  const structured = isNativeReport(cs);
  const [copied, setCopied] = useState(false);

  const executiveLead =
    cs?.executiveSummary?.trim() ||
    (task.status === "open" || task.status === "waiting" ? "Task in progress…" : null) ||
    (!structured ? "No executive summary captured yet." : null);

  const overviewText = cs?.overview?.trim() || null;
  const showOverview = Boolean(
    overviewText && overviewText !== (cs?.executiveSummary?.trim() || ""),
  );

  const filesChanged = cs?.filesChanged ?? countFiles(cs?.filesModified);
  const statusLabel = formatTaskStatusLabel(task.status, task.completionKind);

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
      {task.needsReview ? (
        <Panel title="Needs Review" className={styles.needsReviewPanel}>
          <p className={styles.summaryLead}>
            This task was flagged for operator review — a constituent run had a low-confidence
            attach or was left unattached.
          </p>
        </Panel>
      ) : null}

      {showOverview ? (
        <Panel title="Overview" className={styles.overviewCard}>
          <pre className={styles.overviewBody}>{overviewText}</pre>
        </Panel>
      ) : null}

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
            <Badge variant={taskStatusTone(task.status)}>{statusLabel}</Badge>
          </div>
          {task.completionKind ? (
            <div>
              <span className={styles.statLabel}>Completion</span>
              <Badge variant={task.completionKind === "manual" ? "warning" : "success"}>
                {task.completionKind === "manual" ? "Manually completed" : "Automatically completed"}
              </Badge>
            </div>
          ) : null}
          {task.completionKind === "manual" && task.manualCompletionReason ? (
            <div>
              <span className={styles.statLabel}>Manual reason</span>
              <strong>{task.manualCompletionReason.replace(/_/g, " ")}</strong>
            </div>
          ) : null}
          <div>
            <span className={styles.statLabel}>Duration</span>
            <strong>{formatDuration(elapsedMs ?? task.durationMs)}</strong>
          </div>
          <div>
            <span className={styles.statLabel}>Files Changed</span>
            <strong>{filesChanged == null ? "—" : filesChanged}</strong>
          </div>
          <div>
            <span className={styles.statLabel}>Tests Passed</span>
            <strong>{cs?.testsPassed == null ? "—" : cs.testsPassed ? "Yes" : "No"}</strong>
          </div>
          {cs?.gitCommit ? (
            <div>
              <span className={styles.statLabel}>Git Commit</span>
              <strong>
                <code>{cs.gitCommit}</code>
              </strong>
            </div>
          ) : null}
          <div className={styles.summaryPrompt}>
            <span className={styles.statLabel}>Title</span>
            <strong>{task.title}</strong>
          </div>
        </div>
      </Panel>

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
