import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Panel, Select, Spinner, Stack, TextField } from "@platform/ui";
import type {
  EventRecord,
  ManualCompletionReason,
  PromptRecord,
  RunArtifact,
  RunRecord,
} from "../api/types.js";
import { eventBodyFromPayload, eventDisplayText } from "../lib/event-detail.js";
import { formatDuration, formatRunStatusLabel, formatTimestamp, statusTone } from "../lib/format.js";
import styles from "../pages/pages.module.css";
import { ConversationView } from "./ConversationView.js";
import { RunSummaryCard } from "./RunSummaryCard.js";
import { VisualValidationGallery } from "./VisualValidationGallery.js";

export type EventTab = "conversation" | "files" | "shell" | "all";

const EVENT_TABS: EventTab[] = ["conversation", "files", "shell", "all"];
const EVENT_TAB_STORAGE_KEY = "dashboard:eventTab:v1";

export interface RunDetailViewProps {
  run: RunRecord;
  prompt: PromptRecord | null;
  events: EventRecord[];
  artifacts?: RunArtifact[];
  /** Elapsed ms to display (live tick or final duration). */
  elapsedMs: number | null;
  /** When true, show a small spinner in the feed header (live WS mode). */
  live?: boolean;
  connected?: boolean;
  /** Show the executive summary card (default true). */
  showSummaryCard?: boolean;
  stickySummary?: boolean;
  /** Active event tab — when omitted, falls back to localStorage. */
  eventTab?: EventTab;
  onEventTabChange?: (tab: EventTab) => void;
  onManualComplete?: (reason: ManualCompletionReason, note?: string) => Promise<void>;
  /** Permanently delete this run (and its artifacts). */
  onDeleteRun?: () => Promise<void>;
}

function parseEventTab(raw: string | null | undefined): EventTab {
  if (raw && EVENT_TABS.includes(raw as EventTab)) return raw as EventTab;
  return "conversation";
}

function readStoredEventTab(): EventTab {
  try {
    const raw = window.localStorage.getItem(EVENT_TAB_STORAGE_KEY);
    return parseEventTab(raw);
  } catch {
    return "conversation";
  }
}

/**
 * Shared rich run surface used by the unified Runs page.
 * Shows summary, visual validation, telemetry timeline.
 */
export function RunDetailView({
  run,
  prompt,
  events,
  artifacts = [],
  elapsedMs,
  live = false,
  connected = true,
  showSummaryCard = true,
  stickySummary = false,
  eventTab: eventTabProp,
  onEventTabChange,
  onManualComplete,
  onDeleteRun,
}: RunDetailViewProps) {
  const [storedTab, setStoredTab] = useState<EventTab>(() => readStoredEventTab());
  const [query, setQuery] = useState("");
  const [manualReason, setManualReason] = useState<ManualCompletionReason>("cursor_completed");
  const [manualNote, setManualNote] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  const [showManualConfirm, setShowManualConfirm] = useState(false);
  const [promptExpanded, setPromptExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const eventTab = eventTabProp ?? storedTab;

  useEffect(() => {
    setPromptExpanded(false);
    setShowDeleteConfirm(false);
  }, [run.id]);

  useEffect(() => {
    if (eventTabProp !== undefined) return;
    window.localStorage.setItem(EVENT_TAB_STORAGE_KEY, eventTab);
  }, [eventTab, eventTabProp]);

  function setEventTab(tab: EventTab) {
    if (onEventTabChange) {
      onEventTabChange(tab);
      return;
    }
    setStoredTab(tab);
  }

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((ev) => {
      if (q.length === 0) return true;
      const hay = `${ev.type}\n${ev.summary}\n${eventBodyFromPayload(ev) ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [events, query]);

  const fileEvents = useMemo(
    () => events.filter((ev) => ev.type === "file_edit"),
    [events],
  );
  const shellEvents = useMemo(
    () => events.filter((ev) => ev.type === "shell_execution"),
    [events],
  );

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

  async function confirmDelete() {
    if (!onDeleteRun) return;
    setDeleteBusy(true);
    try {
      await onDeleteRun();
      setShowDeleteConfirm(false);
    } finally {
      setDeleteBusy(false);
    }
  }

  const fullPrompt = prompt?.prompt?.trim() || "";
  const promptPreview = prompt?.title?.trim() || "Untitled";
  const promptNeedsExpand =
    fullPrompt.length > 0 &&
    (fullPrompt !== promptPreview || fullPrompt.includes("\n") || fullPrompt.length > 90);
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
    if (run.latestFile) paths.push(run.latestFile);
    return [...new Set(paths)];
  }, [events, run.latestFile]);
  const isOpen = run.status === "running" || run.status === "waiting";

  return (
    <div className={styles.detailStack}>
      {showSummaryCard ? (
        <div className={stickySummary ? styles.stickySummary : undefined}>
          <RunSummaryCard
            run={run}
            prompt={prompt}
            elapsedMs={elapsedMs}
            livePaths={livePaths}
            afterUserVisible={
              <VisualValidationGallery artifacts={artifacts} completionSummary={run.completionSummary} />
            }
          />
        </div>
      ) : (
        <VisualValidationGallery artifacts={artifacts} completionSummary={run.completionSummary} />
      )}

      <div className={styles.liveGrid}>
        <Panel className={styles.statCard}>
          <span className={styles.statLabel}>Status</span>
          <Badge variant={statusTone(run.status)}>
            {formatRunStatusLabel(run.status, run.completionKind)}
          </Badge>
        </Panel>
        <Panel className={styles.statCard}>
          <span className={styles.statLabel}>Phase</span>
          <strong className={styles.statValue}>{run.phase ?? "—"}</strong>
        </Panel>
        <Panel className={styles.statCard}>
          <span className={styles.statLabel}>{live ? "Elapsed" : "Duration"}</span>
          <strong className={styles.statValue}>{formatDuration(elapsedMs)}</strong>
        </Panel>
        <Panel className={styles.statCardWide}>
          <div className={styles.promptCardHead}>
            <span className={styles.statLabel}>Prompt</span>
            {promptNeedsExpand ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setPromptExpanded((v) => !v)}
              >
                {promptExpanded ? "Collapse" : "Expand"}
              </Button>
            ) : null}
          </div>
          {promptExpanded && fullPrompt ? (
            <pre className={styles.promptExpandBody}>{fullPrompt}</pre>
          ) : (
            <strong className={styles.statValue}>{promptPreview}</strong>
          )}
          <p className={styles.muted}>
            Started {formatTimestamp(run.startedAt)}
            {run.finishedAt ? ` · Finished ${formatTimestamp(run.finishedAt)}` : ""}
          </p>
        </Panel>

        <Panel className={styles.metaCard}>
          <Stack gap="md">
            <div>
              <span className={styles.statLabel}>Latest shell</span>
              <pre className={styles.codeBlock}>{run.latestShell ?? "—"}</pre>
            </div>
            <div>
              <span className={styles.statLabel}>Latest file edit</span>
              <pre className={styles.codeBlock}>{run.latestFile ?? "—"}</pre>
            </div>
          </Stack>
        </Panel>

        <Panel className={styles.feedCard}>
          <div className={styles.feedHeader}>
            <h2 className={styles.sectionTitle}>Events</h2>
            <div className={styles.feedHeaderActions}>
              {live && !connected ? <Spinner size="sm" /> : null}
              {isOpen && onManualComplete ? (
                <Button type="button" size="sm" variant="secondary" onClick={() => setShowManualConfirm(true)}>
                  Mark Run Complete
                </Button>
              ) : null}
              {onDeleteRun ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Run
                </Button>
              ) : null}
            </div>
          </div>
          {showDeleteConfirm ? (
            <div className={styles.manualCompleteBox}>
              <p className={styles.errorTitle}>Delete run?</p>
              <p>
                <strong>{prompt?.title ?? "Untitled"}</strong>
              </p>
              <p className={styles.muted}>
                This permanently removes the run from history, including {events.length} event
                {events.length === 1 ? "" : "s"}, {artifacts.length} artifact
                {artifacts.length === 1 ? "" : "s"}
                {artifacts.some((a) => a.kind === "screenshot" || a.kind === "image_diff")
                  ? " (screenshots)"
                  : ""}
                , and any related notification links. This cannot be undone.
              </p>
              <div className={styles.historyNavActions}>
                <Button type="button" size="sm" variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={() => void confirmDelete()} disabled={deleteBusy}>
                  {deleteBusy ? "Deleting…" : "Confirm Delete"}
                </Button>
              </div>
            </div>
          ) : null}
          {showManualConfirm ? (
            <div className={styles.manualCompleteBox}>
              <p className={styles.muted}>
                Mark this run complete and record why it ended. Stored as{" "}
                <strong>Manually completed</strong> telemetry metadata (distinct from Cursor’s automatic stop).
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
                <Button type="button" size="sm" onClick={confirmManualComplete} disabled={manualBusy}>
                  {manualBusy ? "Completing…" : "Confirm Complete"}
                </Button>
              </div>
            </div>
          ) : null}

          <div
            className={styles.eventTabs}
            role="tablist"
            aria-label="Event views"
          >
            {EVENT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                id={`event-tab-${tab}`}
                aria-selected={eventTab === tab}
                aria-controls={`event-panel-${tab}`}
                className={[styles.eventTab, eventTab === tab ? styles.eventTabActive : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setEventTab(tab)}
              >
                {eventTabLabel(tab)}
              </button>
            ))}
          </div>

          {eventTab === "conversation" ? (
            <div
              id="event-panel-conversation"
              role="tabpanel"
              aria-labelledby="event-tab-conversation"
              className={styles.eventTabPanel}
            >
              <ConversationView events={events} live={live} />
            </div>
          ) : null}

          {eventTab === "files" ? (
            <div
              id="event-panel-files"
              role="tabpanel"
              aria-labelledby="event-tab-files"
              className={styles.eventTabPanel}
            >
              {fileEvents.length === 0 ? (
                <p className={styles.muted}>No file edits recorded for this run.</p>
              ) : (
                <EventFeed events={[...fileEvents].reverse()} />
              )}
            </div>
          ) : null}

          {eventTab === "shell" ? (
            <div
              id="event-panel-shell"
              role="tabpanel"
              aria-labelledby="event-tab-shell"
              className={styles.eventTabPanel}
            >
              {shellEvents.length === 0 ? (
                <p className={styles.muted}>No shell commands recorded for this run.</p>
              ) : (
                <EventFeed events={[...shellEvents].reverse()} />
              )}
            </div>
          ) : null}

          {eventTab === "all" ? (
            <div
              id="event-panel-all"
              role="tabpanel"
              aria-labelledby="event-tab-all"
              className={styles.eventTabPanel}
            >
              <div className={styles.eventTabSearch}>
                <TextField
                  value={query}
                  onChange={(ev) => setQuery(ev.currentTarget.value)}
                  placeholder="Search events"
                />
              </div>
              {events.length === 0 ? (
                <p className={styles.muted}>No events recorded for this run.</p>
              ) : filteredEvents.length === 0 ? (
                <p className={styles.muted}>No events match your search.</p>
              ) : (
                <EventFeed events={[...filteredEvents].reverse()} />
              )}
            </div>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}

function eventTabLabel(tab: EventTab): string {
  switch (tab) {
    case "conversation":
      return "Conversation";
    case "files":
      return "Files";
    case "shell":
      return "Shell";
    case "all":
      return "All Events";
  }
}

function EventFeed({ events }: { events: EventRecord[] }) {
  return (
    <ol className={styles.feed}>
      {events.map((ev) => (
        <li key={ev.id} className={styles.feedItemRich}>
          <div className={styles.feedItemMeta}>
            <time dateTime={ev.timestamp}>{formatTimestamp(ev.timestamp)}</time>
            <Badge variant={eventBadgeVariant(ev.type)}>{ev.type}</Badge>
          </div>
          <pre className={styles.feedBody}>{eventDisplayText(ev)}</pre>
        </li>
      ))}
    </ol>
  );
}

function eventBadgeVariant(
  type: string,
): "default" | "accent" | "success" | "warning" | "error" {
  switch (type) {
    case "agent_thought":
      return "accent";
    case "shell_execution":
      return "warning";
    case "file_edit":
      return "default";
    case "agent_response":
      return "success";
    case "run_stop":
      return "default";
    case "prompt_submitted":
      return "accent";
    default:
      return "default";
  }
}
