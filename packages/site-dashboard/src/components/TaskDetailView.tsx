import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Panel, Select, Spinner, TextField } from "@platform/ui";
import type {
  EventRecord,
  LifecycleDiagnosticEntry,
  LifecycleDiagnosticsReport,
  ManualCompletionReason,
  RunArtifact,
  RunRecord,
  TaskChecklist,
  TaskRecord,
} from "../api/types.js";
import {
  formatDuration,
  formatRunStatusLabel,
  formatTaskStatusLabel,
  formatTimestamp,
  statusTone,
  taskStatusTone,
} from "../lib/format.js";
import styles from "../pages/pages.module.css";
import { ActionsRequiredPanel } from "./ActionsRequiredPanel.js";
import { ConversationView } from "./ConversationView.js";
import { DevDiagnosticsPanel } from "./DevDiagnosticsPanel.js";
import { LifecycleDiagnosticsPanel } from "./LifecycleDiagnosticsPanel.js";
import { RunDetailView } from "./RunDetailView.js";
import { TaskSummaryCard } from "./TaskSummaryCard.js";
import { VisualValidationGallery } from "./VisualValidationGallery.js";

export type TaskTab = "overview" | "conversation" | "runs" | "visual" | "actions" | "telemetry";

const TASK_TABS: TaskTab[] = ["overview", "conversation", "runs", "visual", "actions", "telemetry"];

function taskTabLabel(tab: TaskTab): string {
  switch (tab) {
    case "overview":
      return "Overview";
    case "conversation":
      return "Conversation";
    case "runs":
      return "Runs";
    case "visual":
      return "Visual Validation";
    case "actions":
      return "Developer Actions";
    case "telemetry":
      return "Telemetry";
  }
}

function runElapsedMs(run: RunRecord, now: number): number | null {
  if (run.status === "running" || run.status === "waiting") {
    return Math.max(0, now - Date.parse(run.startedAt));
  }
  return run.durationMs;
}

export interface TaskDetailViewProps {
  task: TaskRecord;
  runs: RunRecord[];
  events: EventRecord[];
  artifacts: RunArtifact[];
  checklist: TaskChecklist;
  diagnostics: LifecycleDiagnosticEntry[];
  /** Elapsed ms to display (live tick or final duration). */
  elapsedMs: number | null;
  live?: boolean;
  connected?: boolean;
  taskTab?: TaskTab;
  onTaskTabChange?: (tab: TaskTab) => void;
  /** Run currently expanded inline within the Runs tab (drives ?run= deep links). */
  expandedRunId?: string | null;
  onToggleRun?: (runId: string) => void;
  onManualComplete?: (reason: ManualCompletionReason, note?: string) => Promise<void>;
  /** System-wide lifecycle snapshot — fetched lazily when the Telemetry tab opens. */
  systemDiagnostics?: LifecycleDiagnosticsReport | null;
  systemDiagnosticsLoading?: boolean;
  onOpenTelemetryTab?: () => void;
}

/**
 * Task-centric report surface — the primary detail pane of the History page.
 * A Task aggregates one or more Runs from the same conversation into a
 * single unit of work, tracked through to a deterministic completion.
 */
export function TaskDetailView({
  task,
  runs,
  events,
  artifacts,
  checklist,
  diagnostics,
  elapsedMs,
  live = false,
  connected = true,
  taskTab: taskTabProp,
  onTaskTabChange,
  expandedRunId = null,
  onToggleRun,
  onManualComplete,
  systemDiagnostics = null,
  systemDiagnosticsLoading = false,
  onOpenTelemetryTab,
}: TaskDetailViewProps) {
  const [storedTab, setStoredTab] = useState<TaskTab>("overview");
  const [manualReason, setManualReason] = useState<ManualCompletionReason>("cursor_completed");
  const [manualNote, setManualNote] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [showManualConfirm, setShowManualConfirm] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const taskTab = taskTabProp ?? storedTab;
  const isOpen = task.status === "open" || task.status === "waiting";

  useEffect(() => {
    setShowManualConfirm(false);
  }, [task.id]);

  useEffect(() => {
    if (!isOpen) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isOpen]);

  function setTaskTab(tab: TaskTab) {
    if (tab === "telemetry") onOpenTelemetryTab?.();
    if (onTaskTabChange) {
      onTaskTabChange(tab);
      return;
    }
    setStoredTab(tab);
  }

  const latestRun = runs[0] ?? null;
  const filesModified = task.completionSummary?.filesModified ?? latestRun?.completionSummary?.filesModified;
  const livePaths = useMemo(() => {
    const paths: string[] = [];
    for (const ev of events) {
      if (ev.type !== "file_edit") continue;
      try {
        const payload = JSON.parse(ev.payloadJson) as { file_path?: string; path?: string };
        const p = payload.file_path ?? payload.path;
        if (typeof p === "string" && p.trim()) paths.push(p.trim());
      } catch {
        // ignore
      }
    }
    for (const run of runs) {
      if (run.latestFile) paths.push(run.latestFile);
    }
    return [...new Set(paths)];
  }, [events, runs]);

  async function confirmManualComplete() {
    if (!onManualComplete) return;
    setManualBusy(true);
    try {
      await onManualComplete(manualReason, manualNote);
      setShowManualConfirm(false);
      setManualNote("");
      setManualReason("cursor_completed");
    } finally {
      setManualBusy(false);
    }
  }

  return (
    <div className={styles.detailStack}>
      <div className={styles.liveGrid}>
        <Panel className={styles.statCard}>
          <span className={styles.statLabel}>Status</span>
          <Badge variant={taskStatusTone(task.status)}>
            {formatTaskStatusLabel(task.status, task.completionKind)}
          </Badge>
        </Panel>
        <Panel className={styles.statCard}>
          <span className={styles.statLabel}>Runs</span>
          <strong className={styles.statValue}>{runs.length}</strong>
        </Panel>
        <Panel className={styles.statCard}>
          <span className={styles.statLabel}>{live ? "Elapsed" : "Duration"}</span>
          <strong className={styles.statValue}>{formatDuration(elapsedMs)}</strong>
        </Panel>
        <Panel className={styles.statCardWide}>
          <div className={styles.promptCardHead}>
            <span className={styles.statLabel}>Task</span>
            {isOpen && onManualComplete ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => setShowManualConfirm(true)}>
                Mark Task Complete
              </Button>
            ) : null}
          </div>
          <strong className={styles.statValue}>{task.title}</strong>
          <p className={styles.muted}>
            Started {formatTimestamp(task.startedAt)}
            {task.finishedAt ? ` · Finished ${formatTimestamp(task.finishedAt)}` : ""}
            {live && !connected ? " · reconnecting…" : null}
          </p>
        </Panel>

        {showManualConfirm ? (
          <Panel className={styles.statCardWide}>
            <div className={styles.manualCompleteBox}>
              <p className={styles.muted}>
                Mark this task complete — finishes any open runs and records why the task ended.
              </p>
              <div className={styles.feedFilters}>
                <Select
                  value={manualReason}
                  onChange={(ev) => setManualReason(ev.currentTarget.value as ManualCompletionReason)}
                >
                  <option value="cursor_completed">Cursor completed normally</option>
                  <option value="cursor_crashed">Cursor crashed</option>
                  <option value="terminal_closed">Terminal closed</option>
                  <option value="other">Other</option>
                </Select>
                {manualReason === "other" ? (
                  <TextField
                    value={manualNote}
                    onChange={(ev) => setManualNote(ev.currentTarget.value)}
                    placeholder="Add detail"
                  />
                ) : null}
              </div>
              <div className={styles.historyNavActions}>
                <Button type="button" size="sm" variant="secondary" onClick={() => setShowManualConfirm(false)}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={() => void confirmManualComplete()} disabled={manualBusy}>
                  {manualBusy ? "Completing…" : "Confirm Complete"}
                </Button>
              </div>
            </div>
          </Panel>
        ) : null}

        <Panel className={styles.statCardWide} title="Completion Checklist">
          <ul className={styles.checklistList}>
            <ChecklistItem ok={checklist.allRunsTerminal} label="All runs terminal" />
            <ChecklistItem ok={checklist.summaryWritten} label="Summary written" />
            <ChecklistItem ok={checklist.validationComplete} label="Validation complete" />
            <ChecklistItem ok={checklist.actionsEvaluated} label="Actions evaluated" />
          </ul>
          {checklist.openRunCount > 0 ? (
            <p className={styles.muted}>{checklist.openRunCount} run(s) still open.</p>
          ) : null}
        </Panel>
      </div>

      <div className={styles.eventTabs} role="tablist" aria-label="Task sections">
        {TASK_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`task-tab-${tab}`}
            aria-selected={taskTab === tab}
            aria-controls={`task-panel-${tab}`}
            className={[styles.eventTab, taskTab === tab ? styles.eventTabActive : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setTaskTab(tab)}
          >
            {taskTabLabel(tab)}
          </button>
        ))}
      </div>

      {taskTab === "overview" ? (
        <div id="task-panel-overview" role="tabpanel" aria-labelledby="task-tab-overview">
          <TaskSummaryCard task={task} elapsedMs={elapsedMs} />
        </div>
      ) : null}

      {taskTab === "conversation" ? (
        <div id="task-panel-conversation" role="tabpanel" aria-labelledby="task-tab-conversation">
          <Panel title="Conversation">
            <ConversationView events={events} live={live} />
          </Panel>
        </div>
      ) : null}

      {taskTab === "runs" ? (
        <div
          id="task-panel-runs"
          role="tabpanel"
          aria-labelledby="task-tab-runs"
          className={styles.detailStack}
        >
          <Panel title={`Runs (${runs.length})`}>
            {runs.length === 0 ? (
              <p className={styles.muted}>No runs recorded for this task.</p>
            ) : (
              <ul className={styles.runList}>
                {runs.map((run) => {
                  const expanded = expandedRunId === run.id;
                  return (
                    <li key={run.id}>
                      <button
                        type="button"
                        className={styles.historyListItem}
                        onClick={() => onToggleRun?.(run.id)}
                        aria-expanded={expanded}
                      >
                        <div className={styles.historyListMeta}>
                          <Badge variant={statusTone(run.status)}>
                            {run.status === "running"
                              ? "live"
                              : formatRunStatusLabel(run.status, run.completionKind)}
                          </Badge>
                          <span>{formatDuration(runElapsedMs(run, now))}</span>
                          <span>{formatTimestamp(run.startedAt)}</span>
                          <span className={styles.muted}>{expanded ? "Hide details ▲" : "Show details ▼"}</span>
                        </div>
                      </button>
                      {expanded ? (
                        <RunNestedDetail run={run} events={events} artifacts={artifacts} now={now} />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      ) : null}

      {taskTab === "visual" ? (
        <div id="task-panel-visual" role="tabpanel" aria-labelledby="task-tab-visual">
          <VisualValidationGallery artifacts={artifacts} completionSummary={task.completionSummary} />
        </div>
      ) : null}

      {taskTab === "actions" ? (
        <div id="task-panel-actions" role="tabpanel" aria-labelledby="task-tab-actions" className={styles.detailStack}>
          <ActionsRequiredPanel filesModified={filesModified} livePaths={livePaths} />
          <DevDiagnosticsPanel filesModified={filesModified} livePaths={livePaths} />
        </div>
      ) : null}

      {taskTab === "telemetry" ? (
        <div id="task-panel-telemetry" role="tabpanel" aria-labelledby="task-tab-telemetry">
          <LifecycleDiagnosticsPanel
            diagnostics={diagnostics}
            system={systemDiagnostics}
            systemLoading={systemDiagnosticsLoading}
          />
        </div>
      ) : null}
    </div>
  );
}

function ChecklistItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={styles.checklistItem}>
      <Badge variant={ok ? "success" : "default"}>{ok ? "✓" : "—"}</Badge>
      <span>{label}</span>
    </li>
  );
}

/** Nested read-only per-run report, using events/artifacts already merged onto the task. */
function RunNestedDetail({
  run,
  events,
  artifacts,
  now,
}: {
  run: RunRecord;
  events: EventRecord[];
  artifacts: RunArtifact[];
  now: number;
}) {
  const runEvents = useMemo(() => events.filter((ev) => ev.runId === run.id), [events, run.id]);
  const runArtifacts = useMemo(() => artifacts.filter((a) => a.runId === run.id), [artifacts, run.id]);
  const live = run.status === "running" || run.status === "waiting";

  return (
    <div className={styles.nestedRunDetail}>
      {live ? (
        <div className={styles.feedHeaderActions}>
          <Spinner size="sm" />
          <span className={styles.muted}>Live</span>
        </div>
      ) : null}
      <RunDetailView
        run={run}
        prompt={null}
        events={runEvents}
        artifacts={runArtifacts}
        elapsedMs={runElapsedMs(run, now)}
        live={live}
      />
    </div>
  );
}
