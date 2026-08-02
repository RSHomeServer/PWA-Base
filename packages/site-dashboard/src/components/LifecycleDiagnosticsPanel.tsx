import { Badge, Panel } from "@platform/ui";
import type { LifecycleDiagnosticEntry, LifecycleDiagnosticsReport } from "../api/types.js";
import { formatTimestamp } from "../lib/format.js";
import styles from "../pages/pages.module.css";

export interface LifecycleDiagnosticsPanelProps {
  /** Decisions the lifecycle supervisor logged for this task's runs, newest first. */
  diagnostics: LifecycleDiagnosticEntry[];
  /** Optional system-wide snapshot (fetched lazily when this tab is opened). */
  system?: LifecycleDiagnosticsReport | null;
  systemLoading?: boolean;
}

function confidenceTone(
  confidence: LifecycleDiagnosticEntry["confidence"],
): "success" | "warning" | "error" | "default" {
  switch (confidence) {
    case "high":
      return "success";
    case "medium":
      return "warning";
    case "low":
      return "error";
    default:
      return "default";
  }
}

function kindLabel(kind: LifecycleDiagnosticEntry["kind"]): string {
  return kind
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Task Detail "Telemetry" tab — the lifecycle supervisor's consolidation
 * decisions for this task's runs (task placement, auto-complete, orphan
 * attach, etc.), plus an optional system-wide snapshot for context.
 */
export function LifecycleDiagnosticsPanel({
  diagnostics,
  system,
  systemLoading = false,
}: LifecycleDiagnosticsPanelProps) {
  return (
    <div className={styles.detailStack}>
      <Panel title="System Snapshot" className={styles.metaCard}>
        {systemLoading && !system ? (
          <p className={styles.muted}>Loading lifecycle diagnostics…</p>
        ) : system ? (
          <div className={styles.devDiagnosticsGrid}>
            <div>
              <span className={styles.statLabel}>Open / waiting tasks</span>
              <strong>{system.currentTasks.length}</strong>
            </div>
            <div>
              <span className={styles.statLabel}>Active runs</span>
              <strong>{system.activeRuns.length}</strong>
            </div>
            <div>
              <span className={styles.statLabel}>Recent decisions (all tasks)</span>
              <strong>{system.recentDecisions.length}</strong>
            </div>
          </div>
        ) : (
          <p className={styles.muted}>Lifecycle diagnostics unavailable.</p>
        )}
      </Panel>

      <Panel title="Task Decision Timeline">
        {diagnostics.length === 0 ? (
          <p className={styles.muted}>
            No lifecycle supervisor decisions recorded for this task yet.
          </p>
        ) : (
          <ol className={styles.feed}>
            {diagnostics.map((entry) => (
              <li key={entry.id} className={styles.feedItemRich}>
                <div className={styles.feedItemMeta}>
                  <time dateTime={entry.at}>{formatTimestamp(entry.at)}</time>
                  <Badge variant="default">{kindLabel(entry.kind)}</Badge>
                  <Badge variant={confidenceTone(entry.confidence)}>{entry.confidence}</Badge>
                  {entry.runId ? <span className={styles.muted}>run {entry.runId.slice(0, 8)}</span> : null}
                </div>
                <p className={styles.muted}>{entry.detail}</p>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
