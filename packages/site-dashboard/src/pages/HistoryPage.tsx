import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge, Button, EmptyState, Panel, Skeleton } from "@platform/ui";
import {
  fetchLifecycleDiagnostics,
  fetchRun,
  fetchTask,
  fetchTasks,
  markTaskComplete,
} from "../api/client.js";
import type {
  ActionsRequiredSummary,
  LifecycleDiagnosticsReport,
  ManualCompletionReason,
  TaskDetail,
  TaskListItem,
  WsMessage,
} from "../api/types.js";
import { DashboardLayout } from "../components/DashboardLayout.js";
import { TaskDetailView, type TaskTab } from "../components/TaskDetailView.js";
import { useTelemetrySocket } from "../hooks/useTelemetrySocket.js";
import {
  firstLine,
  formatDuration,
  formatTaskStatusLabel,
  formatTimestamp,
  taskStatusTone,
} from "../lib/format.js";
import styles from "./pages.module.css";

type SortKey = "started_at" | "duration_ms" | "status";

const TASK_TABS: TaskTab[] = ["overview", "conversation", "runs", "visual", "actions", "telemetry"];

function parseTaskTab(raw: string | null): TaskTab {
  if (raw && TASK_TABS.includes(raw as TaskTab)) return raw as TaskTab;
  return "overview";
}

function actionsSummaryTone(summary: ActionsRequiredSummary): "success" | "warning" | "error" | "default" {
  switch (summary) {
    case "required":
      return "error";
    case "recommended":
      return "warning";
    case "none":
    default:
      return "success";
  }
}

function actionsSummaryLabel(summary: ActionsRequiredSummary): string {
  switch (summary) {
    case "required":
      return "Restart required";
    case "recommended":
      return "Refresh recommended";
    case "none":
    default:
      return "No action";
  }
}

/**
 * Task-centric History surface — lists Tasks (the primary lifecycle unit) with
 * live updates while work is in progress. Selecting a task opens its full
 * report, conversation, runs, visual validation, developer actions, and
 * lifecycle diagnostics in `TaskDetailView`.
 */
export function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTaskId = searchParams.get("task");
  const selectedRunId = searchParams.get("run");
  const taskTab = parseTaskTab(searchParams.get("tab"));

  const [items, setItems] = useState<TaskListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>("started_at");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const selectedItemRef = useRef<HTMLButtonElement | null>(null);

  const [systemDiagnostics, setSystemDiagnostics] = useState<LifecycleDiagnosticsReport | null>(null);
  const [systemDiagnosticsLoading, setSystemDiagnosticsLoading] = useState(false);
  const systemDiagnosticsRequested = useRef(false);

  const loadList = useCallback(async () => {
    try {
      const res = await fetchTasks();
      setItems(res.items);
      setError(null);
      return res.items;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (taskId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetchTask(taskId);
      setDetail(res);
      setDetailError(null);
      return res;
    } catch (err) {
      setDetail(null);
      setDetailError(err instanceof Error ? err.message : String(err));
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    setListLoading(true);
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (!selectedTaskId) {
      setDetail(null);
      setDetailError(null);
      setDetailLoading(false);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetail((prev) => (prev?.task.id === selectedTaskId ? prev : null));
    void fetchTask(selectedTaskId)
      .then((res) => {
        if (cancelled) return;
        setDetail(res);
        setDetailError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setDetail(null);
        setDetailError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTaskId]);

  // Resolve ?run= into its parent ?task= when no task is explicitly selected
  // (e.g. notification/OS-notification deep links that only know the run).
  useEffect(() => {
    if (selectedTaskId || !selectedRunId) return;
    let cancelled = false;
    void fetchRun(selectedRunId)
      .then((res) => {
        if (cancelled) return;
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (next.get("task")) return prev;
            next.set("task", res.run.taskId);
            if (!next.get("tab")) next.set("tab", "runs");
            return next;
          },
          { replace: true },
        );
      })
      .catch(() => {
        if (cancelled) return;
        // Run no longer exists — drop it so default task selection can proceed.
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete("run");
            return next;
          },
          { replace: true },
        );
      });
    return () => {
      cancelled = true;
    };
  }, [selectedRunId, selectedTaskId, setSearchParams]);

  useEffect(() => {
    if (!selectedTaskId) return;
    document.getElementById("history-detail-pane")?.scrollTo({ top: 0, behavior: "smooth" });
    selectedItemRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedTaskId]);

  useEffect(() => {
    if (!actionFeedback) return;
    const id = window.setTimeout(() => setActionFeedback(null), 4000);
    return () => window.clearTimeout(id);
  }, [actionFeedback]);

  const sortedItems = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sort === "started_at") {
        cmp = Date.parse(a.task.startedAt) - Date.parse(b.task.startedAt);
      } else if (sort === "duration_ms") {
        cmp = (a.task.durationMs ?? 0) - (b.task.durationMs ?? 0);
      } else {
        cmp = a.task.status.localeCompare(b.task.status);
      }
      return dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [items, sort, dir]);

  const selectedIndex = useMemo(
    () => sortedItems.findIndex((item) => item.task.id === selectedTaskId),
    [sortedItems, selectedTaskId],
  );

  const selectTask = useCallback(
    (taskId: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("task", taskId);
          next.delete("run");
          return next;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const setTaskTab = useCallback(
    (tab: TaskTab) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "overview") next.delete("tab");
          else next.set("tab", tab);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const toggleRun = useCallback(
    (runId: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (next.get("run") === runId) next.delete("run");
          else next.set("run", runId);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (selectedTaskId || selectedRunId || sortedItems.length === 0) return;
    const active = sortedItems.find(
      (it) => it.task.status === "open" || it.task.status === "waiting",
    );
    const id = active?.task.id ?? sortedItems[0]!.task.id;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (next.get("task")) return prev;
        next.set("task", id);
        return next;
      },
      { replace: true },
    );
  }, [sortedItems, selectedTaskId, selectedRunId, setSearchParams]);

  const goRelative = useCallback(
    (delta: number) => {
      if (sortedItems.length === 0) return;
      const base = selectedIndex >= 0 ? selectedIndex : 0;
      const next = Math.min(sortedItems.length - 1, Math.max(0, base + delta));
      const id = sortedItems[next]?.task.id;
      if (id) selectTask(id);
    },
    [sortedItems, selectedIndex, selectTask],
  );

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const target = ev.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (ev.key === "ArrowDown" || ev.key === "j" || ev.key === "ArrowRight" || ev.key === "n") {
        ev.preventDefault();
        goRelative(1);
      } else if (ev.key === "ArrowUp" || ev.key === "k" || ev.key === "ArrowLeft" || ev.key === "p") {
        ev.preventDefault();
        goRelative(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goRelative]);

  const isLiveSelected = detail?.task.status === "open" || detail?.task.status === "waiting";

  useEffect(() => {
    if (!isLiveSelected) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [isLiveSelected]);

  const onMessage = useCallback(
    (msg: WsMessage) => {
      if (msg.kind === "hello" || msg.kind === "settings.updated" || msg.kind === "notification.created") {
        return;
      }
      if (msg.kind === "run.deleted") {
        void loadList();
        if (selectedTaskId) void loadDetail(selectedTaskId);
        if (selectedRunId === msg.runId) {
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete("run");
              return next;
            },
            { replace: true },
          );
        }
        return;
      }
      void loadList();
      if (selectedTaskId) void loadDetail(selectedTaskId);
    },
    [loadList, loadDetail, selectedTaskId, selectedRunId, setSearchParams],
  );

  const { connected } = useTelemetrySocket(onMessage);

  const elapsedMs = useMemo(() => {
    if (!detail?.task) return null;
    if (detail.task.status === "open" || detail.task.status === "waiting") {
      return Math.max(0, Date.now() - Date.parse(detail.task.startedAt));
    }
    return detail.task.durationMs;
  }, [detail?.task, tick]);

  const manualComplete = useCallback(
    async (reason: ManualCompletionReason, note?: string) => {
      if (!detail?.task) return;
      try {
        await markTaskComplete(detail.task.id, reason, note);
        await loadList();
        await loadDetail(detail.task.id);
        setActionFeedback({ tone: "success", message: "Task marked complete." });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setActionFeedback({
          tone: "error",
          message:
            message.includes("404") || message.includes("not_found")
              ? `Mark Complete failed (${message}). Rebuild telemetry with pnpm telemetry:rebuild.`
              : `Mark Complete failed: ${message}`,
        });
        throw err;
      }
    },
    [detail?.task, loadList, loadDetail],
  );

  const loadSystemDiagnostics = useCallback(() => {
    if (systemDiagnosticsRequested.current) return;
    systemDiagnosticsRequested.current = true;
    setSystemDiagnosticsLoading(true);
    void fetchLifecycleDiagnostics()
      .then(setSystemDiagnostics)
      .catch(() => {
        systemDiagnosticsRequested.current = false;
      })
      .finally(() => setSystemDiagnosticsLoading(false));
  }, []);

  const toggleSort = (key: SortKey) => {
    if (sort === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSort(key);
      setDir(key === "started_at" ? "desc" : "asc");
    }
  };

  const arrow = useMemo(() => (dir === "asc" ? "↑" : "↓"), [dir]);
  const canPrev = selectedIndex > 0;
  const canNext = selectedIndex >= 0 && selectedIndex < sortedItems.length - 1;
  const activeCount = items.filter(
    (it) => it.task.status === "open" || it.task.status === "waiting",
  ).length;

  return (
    <DashboardLayout
      fullBleed
      title="History"
      subtitle="Tasks and the runs behind them — live updates while work is in progress."
      actions={
        <div className={styles.historyNavActions}>
          <Badge variant={connected ? "success" : "warning"}>
            {connected ? "Live" : "Offline"}
          </Badge>
          {activeCount > 0 ? <Badge variant="accent">{activeCount} active</Badge> : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!canPrev}
            onClick={() => goRelative(-1)}
          >
            Previous
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!canNext}
            onClick={() => goRelative(1)}
          >
            Next
          </Button>
        </div>
      }
    >
      {actionFeedback ? (
        <Panel
          className={
            actionFeedback.tone === "error" ? styles.errorPanel : styles.feedbackSuccess
          }
        >
          <p className={actionFeedback.tone === "error" ? styles.errorTitle : undefined}>
            {actionFeedback.message}
          </p>
        </Panel>
      ) : null}

      {error ? (
        <Panel className={styles.errorPanel}>
          <p className={styles.errorTitle}>Telemetry service unreachable</p>
          <p className={styles.muted}>
            Start Docker telemetry with <code>pnpm telemetry:rebuild</code> (or{" "}
            <code>telemetry:up</code> if the image is current), then retry. ({error})
          </p>
          <Button type="button" size="sm" onClick={() => void loadList()}>
            Retry
          </Button>
        </Panel>
      ) : null}

      {listLoading && items.length === 0 && !error ? (
        <div className={styles.runsSplit}>
          <aside className={styles.historyListPane} aria-busy="true" aria-label="Loading tasks">
            <Skeleton className={styles.skelBlock} />
            <Skeleton className={styles.skelBlock} />
            <Skeleton className={styles.skelBlock} />
          </aside>
          <section className={styles.historyDetailPane} aria-busy="true">
            <Skeleton className={styles.skelBlockTall} />
            <Skeleton className={styles.skelBlockTall} />
          </section>
        </div>
      ) : items.length === 0 && !error ? (
        <EmptyState
          title="No tasks yet"
          description="Submit a prompt in Cursor with hooks wired to Docker telemetry. Tasks and their runs will appear here."
        />
      ) : (
        <div className={styles.runsSplit}>
          <aside className={styles.historyListPane} aria-label="Task list">
            <div className={styles.historyListToolbar}>
              <button type="button" className={styles.sortBtn} onClick={() => toggleSort("started_at")}>
                Start {sort === "started_at" ? arrow : ""}
              </button>
              <button
                type="button"
                className={styles.sortBtn}
                onClick={() => toggleSort("duration_ms")}
              >
                Duration {sort === "duration_ms" ? arrow : ""}
              </button>
              <button type="button" className={styles.sortBtn} onClick={() => toggleSort("status")}>
                Status {sort === "status" ? arrow : ""}
              </button>
            </div>
            <ul className={styles.historyList}>
              {sortedItems.map(({ task, runCount, openRunCount, filesChanged, testsPassed, actionsRequiredSummary }) => {
                const selected = task.id === selectedTaskId;
                const executive =
                  firstLine(task.completionSummary?.overview) ??
                  task.completionSummary?.executiveSummary ??
                  firstLine(task.promptText) ??
                  "—";
                const isOpenTask = task.status === "open" || task.status === "waiting";
                const listDuration =
                  isOpenTask && selected && detail?.task.id === task.id
                    ? elapsedMs
                    : isOpenTask
                      ? Math.max(0, Date.now() - Date.parse(task.startedAt))
                      : task.durationMs;
                return (
                  <li key={task.id}>
                    <button
                      type="button"
                      ref={selected ? selectedItemRef : undefined}
                      className={[
                        styles.historyListItem,
                        selected ? styles.historyListItemSelected : "",
                        isOpenTask ? styles.historyListItemLive : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => selectTask(task.id)}
                      aria-current={selected ? "true" : undefined}
                    >
                      <div className={styles.historyListTitle}>{task.title}</div>
                      <div className={styles.historyListMeta}>
                        <Badge variant={taskStatusTone(task.status)}>
                          {task.status === "open"
                            ? "live"
                            : formatTaskStatusLabel(task.status, task.completionKind)}
                        </Badge>
                        {task.completionKind === "manual" ? (
                          <Badge variant="warning">manual</Badge>
                        ) : null}
                        <span>{formatDuration(listDuration)}</span>
                        <span>{formatTimestamp(task.startedAt)}</span>
                      </div>
                      <div className={styles.historyListMeta}>
                        <span>
                          {runCount} run{runCount === 1 ? "" : "s"}
                          {openRunCount > 0 ? ` (${openRunCount} open)` : ""}
                        </span>
                        <span>{filesChanged == null ? "files —" : `${filesChanged} files`}</span>
                        <span>
                          tests {testsPassed == null ? "—" : testsPassed ? "passed" : "failed"}
                        </span>
                        <Badge variant={actionsSummaryTone(actionsRequiredSummary)}>
                          {actionsSummaryLabel(actionsRequiredSummary)}
                        </Badge>
                      </div>
                      <p className={styles.historyListSummary}>{executive}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section id="history-detail-pane" className={styles.historyDetailPane} aria-label="Selected task">
            {detailLoading && !detail ? (
              <div className={styles.detailSkeleton} aria-busy="true">
                <Skeleton className={styles.skelBlockTall} />
                <Skeleton className={styles.skelBlockTall} />
              </div>
            ) : null}
            {detailError ? <p className={styles.errorTitle}>{detailError}</p> : null}
            {detail && detail.task.id === selectedTaskId ? (
              <TaskDetailView
                task={detail.task}
                runs={detail.runs}
                events={detail.events}
                artifacts={detail.artifacts ?? []}
                checklist={detail.checklist}
                diagnostics={detail.diagnostics ?? []}
                elapsedMs={elapsedMs}
                live={isLiveSelected}
                connected={connected}
                taskTab={taskTab}
                onTaskTabChange={setTaskTab}
                expandedRunId={selectedRunId}
                onToggleRun={toggleRun}
                onManualComplete={isLiveSelected ? manualComplete : undefined}
                systemDiagnostics={systemDiagnostics}
                systemDiagnosticsLoading={systemDiagnosticsLoading}
                onOpenTelemetryTab={loadSystemDiagnostics}
              />
            ) : !selectedTaskId ? (
              <EmptyState
                title="Select a task"
                description="Choose a task from the list, or use Previous / Next (j / k)."
              />
            ) : detailLoading ? null : (
              <EmptyState
                title="Task not found"
                description="This task was deleted or is no longer available. Pick another from the list."
              />
            )}
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
