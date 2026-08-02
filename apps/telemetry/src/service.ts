import { randomUUID } from "node:crypto";
import type { TelemetryStore } from "./db/store.js";
import { ArtifactFsStore, buildArtifactRecord } from "./artifacts/fs-store.js";
import type { CreateArtifactInput, RunArtifact } from "./artifacts/types.js";
import {
  validateCompletionReportPipeline,
  type CompletionReportValidationResult,
} from "./completion-report-contract.js";
import {
  completionSummaryFromPayload,
  mergeCompletionSummary,
  normaliseCompletionSummary,
} from "./completion-summary.js";
import {
  extractFilePath,
  extractPromptText,
  extractResponseText,
  extractShellCommand,
  normaliseHookPayload,
  phaseForEventType,
} from "./events/normalise.js";
import {
  decideOrphanAttach,
  evaluateIdle,
  openRunMatchesIds,
  ORPHAN_HIGH_LOOKBACK_MS,
  ORPHAN_MEDIUM_LOOKBACK_MS,
} from "./lifecycle/rules.js";
import {
  canAutoCompleteTask,
  decideTaskPlacement,
  isHeavyShellCommand,
  overviewLooksThin,
  TASK_COMPLETION_GRACE_MS,
  type LifecycleDiagnosticEntry,
} from "./lifecycle/tasks.js";
import { lastActivityFromEvents } from "./lifecycle/types.js";
import { NotificationService } from "./notify/inbox-service.js";
import { buildNotificationPayload, formatRuntime, resolveProvider } from "./notify/providers.js";
import type {
  CursorHookPayload,
  EventRecord,
  LiveRunView,
  ManualCompletionReason,
  PromptRecord,
  RunCompletionSummary,
  RunRecord,
  SettingsRecord,
  TaskRecord,
  WsMessage,
} from "./types.js";
import { calculateDurationMs, titleFromPrompt } from "./types.js";

export type BroadcastFn = (message: WsMessage) => void;

export interface IngestMeta {
  sourceIp?: string;
  userAgent?: string | null;
}

export type { ManualCompletionReason };

export interface LifecycleIdleConfig {
  idleTimeoutMs: number;
  idleSoftMs: number;
  taskCompletionGraceMs?: number;
}

const DEFAULT_IDLE: LifecycleIdleConfig = {
  idleTimeoutMs: 1_800_000,
  idleSoftMs: 900_000,
  taskCompletionGraceMs: TASK_COMPLETION_GRACE_MS,
};

const DIAGNOSTICS_CAP = 200;

export class TelemetryService {
  private readonly notifications: NotificationService;
  private idleConfig: LifecycleIdleConfig = { ...DEFAULT_IDLE };
  private readonly diagnosticsLog: LifecycleDiagnosticEntry[] = [];

  constructor(
    private readonly store: TelemetryStore,
    private readonly broadcast: BroadcastFn,
    private readonly onBroadcast?: () => void,
    private readonly artifactsFs?: ArtifactFsStore,
  ) {
    this.notifications = new NotificationService(store, (msg) => this.emit(msg));
  }

  /** Configure idle soft/full thresholds (from runtime env). */
  setLifecycleIdleConfig(config: LifecycleIdleConfig): void {
    this.idleConfig = { ...DEFAULT_IDLE, ...config };
  }

  private logDiagnostic(
    entry: Omit<LifecycleDiagnosticEntry, "id" | "at"> & { at?: string },
  ): void {
    const full: LifecycleDiagnosticEntry = {
      id: randomUUID(),
      at: entry.at ?? new Date().toISOString(),
      kind: entry.kind,
      confidence: entry.confidence,
      conversationId: entry.conversationId,
      taskId: entry.taskId,
      runId: entry.runId,
      detail: entry.detail,
    };
    this.diagnosticsLog.unshift(full);
    if (this.diagnosticsLog.length > DIAGNOSTICS_CAP) {
      this.diagnosticsLog.length = DIAGNOSTICS_CAP;
    }
  }

  getLifecycleDiagnostics(limit = 50) {
    const openTasks = this.store
      .listTasks()
      .filter((t) => t.status === "open" || t.status === "waiting");
    const activeRuns = this.store.listOpenRuns();
    return {
      currentTasks: openTasks,
      activeRuns,
      recentDecisions: this.diagnosticsLog.slice(0, limit),
    };
  }

  getSettings(): SettingsRecord {
    return this.store.getSettings();
  }

  getStore(): TelemetryStore {
    return this.store;
  }

  /** In-app Notification Centre (inbox) — separate from outbound ntfy delivery. */
  getNotifications(): NotificationService {
    return this.notifications;
  }

  getArtifactsFs(): ArtifactFsStore | undefined {
    return this.artifactsFs;
  }

  private emit(message: WsMessage): void {
    this.broadcast(message);
    this.onBroadcast?.();
  }

  updateSettings(patch: Partial<SettingsRecord>): SettingsRecord {
    const settings = this.store.updateSettings(patch);
    this.emit({ kind: "settings.updated", settings });
    return settings;
  }

  /**
   * Active run if any; otherwise the most recently started run (completed stays
   * visible on Live Run until the next prompt begins).
   */
  getLiveRun(now = Date.now()): LiveRunView {
    const run = this.store.getActiveRun() ?? this.store.getLatestRun();
    if (!run) {
      return { run: null, prompt: null, events: [], elapsedMs: null };
    }
    const prompt = this.store.getPrompt(run.promptId);
    const events = this.store.listEvents(run.id);
    const elapsedMs =
      run.status === "running" || run.status === "waiting"
        ? Math.max(0, now - Date.parse(run.startedAt))
        : (run.durationMs ?? Math.max(0, now - Date.parse(run.startedAt)));
    return { run, prompt, events, elapsedMs };
  }

  listRuns(opts?: { sort?: "started_at" | "duration_ms" | "status"; dir?: "asc" | "desc" }) {
    return this.store.listRuns(opts).map((run) => ({
      run,
      prompt: this.store.getPrompt(run.promptId),
      eventCount: this.store.countEvents(run.id),
    }));
  }

  listTasks() {
    return this.store.listTasks().map((task) => {
      const runs = this.store.listRunsForTask(task.id);
      const latest = runs[0] ?? null;
      const filesChanged =
        task.completionSummary?.filesChanged ??
        latest?.completionSummary?.filesChanged ??
        null;
      const testsPassed =
        task.completionSummary?.testsPassed ?? latest?.completionSummary?.testsPassed ?? null;
      const actions = detectActionsSummary(
        task.completionSummary?.filesModified ?? latest?.completionSummary?.filesModified,
      );
      return {
        task,
        runCount: runs.length,
        openRunCount: runs.filter((r) => r.status === "running" || r.status === "waiting").length,
        filesChanged,
        testsPassed,
        actionsRequiredSummary: actions,
      };
    });
  }

  getTaskDetail(taskId: string) {
    const task = this.store.getTask(taskId);
    if (!task) return null;
    const runs = this.store.listRunsForTask(taskId);
    const events = runs.flatMap((r) => this.store.listEvents(r.id));
    events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const artifacts = runs.flatMap((r) => this.store.listArtifacts(r.id));
    const checklist = this.buildTaskChecklist(task, runs);
    const diagnostics = this.diagnosticsLog.filter((d) => d.taskId === taskId).slice(0, 40);
    return { task, runs, events, artifacts, checklist, diagnostics };
  }

  private buildTaskChecklist(task: TaskRecord, runs: RunRecord[]) {
    const openRunCount = runs.filter((r) => r.status === "running" || r.status === "waiting")
      .length;
    const hasSummary = Boolean(task.completionSummary?.overview || task.completionSummary?.executiveSummary);
    const validationDone = Boolean(
      task.completionSummary?.testingPerformed?.length ||
        task.completionSummary?.testsPassed != null,
    );
    const actionsEvaluated = Boolean(task.completionSummary?.filesModified);
    return {
      allRunsTerminal: openRunCount === 0 && runs.length > 0,
      summaryWritten: hasSummary,
      validationComplete: validationDone,
      actionsEvaluated,
      openRunCount,
    };
  }

  getRunDetail(runId: string) {
    const run = this.store.getRun(runId);
    if (!run) return null;
    return {
      run,
      prompt: this.store.getPrompt(run.promptId),
      events: this.store.listEvents(runId),
      notifications: this.store.listNotifications(runId),
      artifacts: this.store.listArtifacts(runId),
    };
  }

  listArtifacts(runId: string): RunArtifact[] {
    return this.store.listArtifacts(runId);
  }

  getArtifact(id: string): RunArtifact | null {
    return this.store.getArtifact(id);
  }

  /**
   * Persist an artifact to disk + SQLite.
   * Refuses to overwrite existing successful screenshots unless `overwrite` is true.
   */
  addArtifact(
    runId: string,
    input: CreateArtifactInput,
    opts?: { overwrite?: boolean },
  ): RunArtifact | null {
    if (!this.artifactsFs) {
      throw new Error("Artifact storage is not configured");
    }
    const run = this.store.getRun(runId);
    if (!run) return null;

    // Never replace a successful after-screenshot when overwrite is false.
    if (
      input.kind === "screenshot" &&
      input.phase === "after" &&
      input.pageKey &&
      !opts?.overwrite
    ) {
      const existing = this.store.findArtifactByPagePhase(runId, input.pageKey, "after");
      if (existing) {
        throw new Error(
          `After screenshot already exists for page "${input.pageKey}" — refusing overwrite`,
        );
      }
    }

    const written = this.artifactsFs.writeFile(
      runId,
      input.filename,
      input.bytes,
      opts?.overwrite ?? false,
    );
    const artifact = buildArtifactRecord(runId, input, written.relativePath, written.byteSize);
    this.store.insertArtifact(artifact);

    if (artifact.kind === "screenshot" && artifact.phase === "after") {
      this.notifications.notify({
        category: "screenshot_capture",
        title: "Screenshot captured",
        body: `${artifact.pageLabel ?? artifact.pageKey ?? "Page"} — after screenshot captured`,
        href: `/dashboard?run=${runId}`,
        runId,
        metadata: { pageKey: artifact.pageKey, filename: artifact.filename },
      });
    }

    return artifact;
  }

  deleteArtifact(artifactId: string): boolean {
    const artifact = this.store.getArtifact(artifactId);
    if (!artifact) return false;
    if (this.artifactsFs?.fileExists(artifact.relativePath)) {
      this.artifactsFs.deleteFile(artifact.relativePath);
    }
    return this.store.deleteArtifact(artifactId);
  }

  /**
   * Permanently remove a run (and on-disk artifacts). Used to clean up near-empty
   * split runs created when a session ends mid-test.
   */
  deleteRun(runId: string): boolean {
    if (!this.store.getRun(runId)) return false;
    const artifacts = this.store.listArtifacts(runId);
    for (const artifact of artifacts) {
      if (this.artifactsFs?.fileExists(artifact.relativePath)) {
        this.artifactsFs.deleteFile(artifact.relativePath);
      }
    }
    this.artifactsFs?.deleteRunDir(runId);
    const ok = this.store.deleteRun(runId);
    if (ok) this.emit({ kind: "run.deleted", runId });
    return ok;
  }

  readArtifactBytes(artifactId: string): { artifact: RunArtifact; bytes: Buffer } | null {
    const artifact = this.store.getArtifact(artifactId);
    if (!artifact || !this.artifactsFs) return null;
    if (!this.artifactsFs.fileExists(artifact.relativePath)) return null;
    return { artifact, bytes: this.artifactsFs.readFile(artifact.relativePath) };
  }

  getPromptDetail(promptId: string) {
    const prompt = this.store.getPrompt(promptId);
    if (!prompt) return null;
    const runs = this.store.listRunsForPrompt(promptId);
    return { prompt, runs };
  }

  listPrompts() {
    return this.store.listPrompts();
  }

  manualCompleteRun(
    runId: string,
    reason: ManualCompletionReason,
    note: string | null = null,
    now = new Date().toISOString(),
  ): { run: RunRecord; event: EventRecord } | null {
    const run = this.store.getRun(runId);
    if (!run || (run.status !== "running" && run.status !== "waiting")) return null;
    const prompt = this.store.getPrompt(run.promptId);
    const finished: RunRecord = {
      ...run,
      finishedAt: now,
      durationMs: calculateDurationMs(run.startedAt, now),
      status: "completed",
      phase: "finished",
      summary: run.summary ?? "Run manually marked complete",
      completionKind: "manual",
      manualCompletionReason: reason,
      manualCompletionNote: note && note.trim().length > 0 ? note.trim() : null,
    };
    this.store.updateRun(finished);
    const event: EventRecord = {
      id: randomUUID(),
      runId: run.id,
      timestamp: now,
      type: "manual_completion",
      summary: `Manual completion: ${reason.replace(/_/g, " ")}`,
      payloadJson: JSON.stringify({
        reason,
        note: finished.manualCompletionNote,
      }),
    };
    this.store.insertEvent(event);
    this.emit({ kind: "event.appended", event, run: finished });
    this.emit({ kind: "run.finished", run: finished, prompt });
    this.notifyInboxForRunStop(finished, prompt);
    this.evaluateTaskCompletion(finished.taskId, now);
    return { run: finished, event };
  }

  /**
   * Operator Mark Complete for a Task — finishes open runs and closes the Task.
   */
  manualCompleteTask(
    taskId: string,
    reason: ManualCompletionReason,
    note: string | null = null,
    now = new Date().toISOString(),
  ): { task: TaskRecord; runs: RunRecord[] } | null {
    const task = this.store.getTask(taskId);
    if (!task || (task.status !== "open" && task.status !== "waiting")) return null;
    const runs = this.store.listRunsForTask(taskId);
    const finishedRuns: RunRecord[] = [];
    for (const run of runs) {
      if (run.status !== "running" && run.status !== "waiting") {
        finishedRuns.push(run);
        continue;
      }
      const out = this.manualCompleteRun(run.id, reason, note, now);
      if (out) finishedRuns.push(out.run);
    }
    const next: TaskRecord = {
      ...task,
      finishedAt: now,
      durationMs: calculateDurationMs(task.startedAt, now),
      status: "completed",
      completionKind: "manual",
      manualCompletionReason: reason,
      manualCompletionNote: note && note.trim().length > 0 ? note.trim() : null,
      completionReason: "manual",
      completionSummary:
        task.completionSummary ??
        finishedRuns.find((r) => r.completionSummary)?.completionSummary ??
        null,
    };
    this.store.updateTask(next);
    this.logDiagnostic({
      kind: "task_manual_complete",
      confidence: "high",
      conversationId: next.conversationId,
      taskId: next.id,
      runId: null,
      detail: `Manual task completion: ${reason}`,
    });
    this.emit({ kind: "task.finished", task: next });
    return { task: next, runs: this.store.listRunsForTask(taskId) };
  }

  /** Persist a structured completion summary for a run (does not invent from events). */
  updateCompletionSummary(
    runId: string,
    patch: Partial<RunCompletionSummary>,
  ): { run: RunRecord; reportValidation: CompletionReportValidationResult } | null {
    const run = this.store.getRun(runId);
    if (!run) return null;
    const normalised = normaliseCompletionSummary(patch);
    const completionSummary = mergeCompletionSummary(run.completionSummary, normalised);
    const reportValidation = validateCompletionReportPipeline(patch, completionSummary);
    this.logReportValidation(reportValidation, {
      conversationId: run.conversationId,
      taskId: run.taskId,
      runId: run.id,
    });
    const next: RunRecord = {
      ...run,
      completionSummary,
      summary: completionSummary.executiveSummary ?? run.summary,
    };
    this.store.updateRun(next);
    const prompt = this.store.getPrompt(next.promptId);
    this.emit({ kind: "run.updated", run: next, prompt });
    this.promoteSummaryToTask(next.taskId, completionSummary);
    this.evaluateTaskCompletion(next.taskId);
    return { run: next, reportValidation };
  }

  updateTaskCompletionSummary(
    taskId: string,
    patch: Partial<RunCompletionSummary>,
  ): { task: TaskRecord; reportValidation: CompletionReportValidationResult } | null {
    const task = this.store.getTask(taskId);
    if (!task) return null;
    const normalised = normaliseCompletionSummary(patch);
    const completionSummary = mergeCompletionSummary(task.completionSummary, normalised);
    const reportValidation = validateCompletionReportPipeline(patch, completionSummary);
    this.logReportValidation(reportValidation, {
      conversationId: task.conversationId,
      taskId,
      runId: null,
    });
    if (overviewLooksThin(completionSummary.overview)) {
      this.logDiagnostic({
        kind: "overview_quality_warn",
        confidence: "low",
        conversationId: task.conversationId,
        taskId,
        runId: null,
        detail: "Overview looks thin (<40 chars or fixture-like); prefer a fuller narrative.",
      });
    }
    const next: TaskRecord = {
      ...task,
      completionSummary,
    };
    this.store.updateTask(next);
    this.emit({ kind: "task.updated", task: next });
    this.evaluateTaskCompletion(taskId);
    return { task: next, reportValidation };
  }

  private logReportValidation(
    reportValidation: CompletionReportValidationResult,
    ctx: { conversationId: string | null; taskId: string | null; runId: string | null },
  ): void {
    for (const err of reportValidation.errors) {
      this.logDiagnostic({
        kind: "report_validation_error",
        confidence: "high",
        conversationId: ctx.conversationId,
        taskId: ctx.taskId,
        runId: ctx.runId,
        detail: `${err.code}: ${err.message}`,
      });
    }
    for (const warn of reportValidation.warnings) {
      if (warn.code === "overview_thin") continue; // already logged via overview_quality_warn
      this.logDiagnostic({
        kind: "report_validation_warn",
        confidence: "low",
        conversationId: ctx.conversationId,
        taskId: ctx.taskId,
        runId: ctx.runId,
        detail: `${warn.code}: ${warn.message}`,
      });
    }
  }

  private promoteSummaryToTask(taskId: string, summary: RunCompletionSummary): void {
    const task = this.store.getTask(taskId);
    if (!task) return;
    const merged = mergeCompletionSummary(task.completionSummary, summary);
    const next: TaskRecord = { ...task, completionSummary: merged };
    this.store.updateTask(next);
    this.emit({ kind: "task.updated", task: next });
  }

  /** Ingest a raw Cursor hook payload (already parsed JSON). */
  async ingest(
    raw: unknown,
    meta: IngestMeta = {},
  ): Promise<{ ok: true; runId: string | null; eventType: string }> {
    const event = normaliseHookPayload(raw);
    const payload = event.payload as CursorHookPayload;
    const enrichedPayload = {
      ...event.payload,
      _telemetry: {
        sourceIp: meta.sourceIp ?? null,
        userAgent: meta.userAgent ?? null,
        receivedAt: event.timestamp,
      },
    };

    if (event.type === "prompt_submitted") {
      return this.startRun(event.timestamp, payload, enrichedPayload);
    }

    let run = this.findRun(event.conversationId, event.generationId);
    if (!run) {
      run = this.resolveOrphanRun(event.timestamp, event, payload, enrichedPayload);
    }
    if (!run) {
      return { ok: true, runId: null, eventType: event.type };
    }

    const eventRecord: EventRecord = {
      id: randomUUID(),
      runId: run.id,
      timestamp: event.timestamp,
      type: event.type,
      summary: event.summary,
      payloadJson: JSON.stringify(enrichedPayload),
    };
    this.store.insertEvent(eventRecord);

    const next: RunRecord = { ...run, phase: phaseForEventType(event.type) };
    // Resume from soft-idle waiting when activity arrives.
    if (next.status === "waiting") {
      next.status = "running";
    }
    if (event.type === "shell_execution") {
      next.latestShell = extractShellCommand(payload) ?? next.latestShell;
    }
    if (event.type === "file_edit") {
      next.latestFile = extractFilePath(payload) ?? next.latestFile;
    }
    if (event.type === "agent_response") {
      const responseText = extractResponseText(payload);
      next.summary = responseText ?? next.summary;
      next.completionSummary = resolveCompletionSummary(
        next.completionSummary,
        payload as Record<string, unknown>,
      );
    }

    if (event.type === "run_stop") {
      // Late stop attached to an already-finished run — append only, do not re-finish.
      if (run.finishedAt) {
        this.emit({
          kind: "event.appended",
          event: eventRecord,
          run: next,
        });
        return { ok: true, runId: next.id, eventType: event.type };
      }
      const finishedAt = event.timestamp;
      next.finishedAt = finishedAt;
      next.durationMs = calculateDurationMs(run.startedAt, finishedAt);
      // Unattached orphans close as abandoned; normal stops map from payload.
      next.status =
        run.lifecycleReason === "orphan_unattached" && run.needsReview
          ? "abandoned"
          : mapStopStatus(payload);
      next.phase = "finished";
      next.completionKind = "automatic";
      next.manualCompletionReason = null;
      next.manualCompletionNote = null;
      // Structured summary only — do not invent from response Markdown.
      next.completionSummary = resolveCompletionSummary(
        next.completionSummary,
        payload as Record<string, unknown>,
      );
      this.store.updateRun(next);
      this.emit({
        kind: "event.appended",
        event: eventRecord,
        run: next,
      });
      const prompt = this.store.getPrompt(next.promptId);
      this.emit({ kind: "run.finished", run: next, prompt });
      await this.notify(next, prompt);
      this.notifyInboxForRunStop(next, prompt);
      this.evaluateTaskCompletion(next.taskId, finishedAt);
      return { ok: true, runId: next.id, eventType: event.type };
    }

    this.store.updateRun(next);
    this.emit({ kind: "event.appended", event: eventRecord, run: next });
    this.emit({
      kind: "run.updated",
      run: next,
      prompt: this.store.getPrompt(next.promptId),
    });
    return { ok: true, runId: next.id, eventType: event.type };
  }

  /**
   * Idle watchdog tick — soft → waiting, full → timed_out for runs, then task completion.
   */
  evaluateActiveRunsLifecycle(now = new Date()): void {
    const nowMs = now.getTime();
    const nowIso = now.toISOString();
    for (const run of this.store.listOpenRuns()) {
      const events = this.store.listEvents(run.id);
      const lastActivityAt = lastActivityFromEvents(run, events);
      const decision = evaluateIdle({
        run,
        lastActivityAt,
        nowMs,
        idleSoftMs: this.idleConfig.idleSoftMs,
        idleTimeoutMs: this.idleConfig.idleTimeoutMs,
      });
      if (decision.action === "none") continue;

      if (decision.action === "mark_waiting") {
        const next: RunRecord = {
          ...run,
          status: "waiting",
          idleMs: decision.idleMs,
          phase: run.phase ?? "waiting",
        };
        this.store.updateRun(next);
        this.emit({
          kind: "run.updated",
          run: next,
          prompt: this.store.getPrompt(next.promptId),
        });
        const task = this.store.getTask(next.taskId);
        if (task && task.status === "open") {
          const waitingTask: TaskRecord = { ...task, status: "waiting" };
          this.store.updateTask(waitingTask);
          this.emit({ kind: "task.updated", task: waitingTask });
          this.logDiagnostic({
            kind: "task_waiting",
            confidence: "high",
            conversationId: task.conversationId,
            taskId: task.id,
            runId: next.id,
            detail: `Task soft-idle via run ${next.id}`,
          });
        }
        continue;
      }

      const finished: RunRecord = {
        ...run,
        finishedAt: nowIso,
        durationMs: calculateDurationMs(run.startedAt, nowIso),
        status: "timed_out",
        phase: "finished",
        completionKind: "automatic",
        manualCompletionReason: null,
        manualCompletionNote: null,
        lifecycleReason: "automatic_timeout",
        idleMs: decision.idleMs,
      };
      this.store.updateRun(finished);
      const prompt = this.store.getPrompt(finished.promptId);
      this.emit({ kind: "run.finished", run: finished, prompt });
      this.notifications.notify({
        category: "telemetry_warning",
        title: "Run timed out",
        body: `${prompt?.title ?? "Untitled"} idle for ${formatRuntime(decision.idleMs)}`,
        href: `/dashboard?task=${finished.taskId}`,
        runId: finished.id,
        metadata: { idleMs: decision.idleMs, reason: "automatic_timeout" },
      });
      this.evaluateTaskCompletion(finished.taskId, nowIso);
    }

    // Task-level idle when all runs already terminal but task still open without summary
    for (const task of this.store.listTasks()) {
      if (task.status !== "open" && task.status !== "waiting") continue;
      this.evaluateTaskCompletion(task.id, nowIso);
      const refreshed = this.store.getTask(task.id);
      if (!refreshed || (refreshed.status !== "open" && refreshed.status !== "waiting")) continue;
      const runs = this.store.listRunsForTask(task.id);
      const open = runs.filter((r) => r.status === "running" || r.status === "waiting");
      if (open.length > 0) continue;
      const last = this.lastTaskActivityIso(task.id, runs);
      const lastMs = Date.parse(last);
      if (!Number.isFinite(lastMs)) continue;
      const idleMs = Math.max(0, nowMs - lastMs);
      if (idleMs >= this.idleConfig.idleTimeoutMs) {
        const timed: TaskRecord = {
          ...refreshed,
          finishedAt: nowIso,
          durationMs: calculateDurationMs(refreshed.startedAt, nowIso),
          status: "timed_out",
          completionKind: "automatic",
          completionReason: "automatic_timeout",
          needsReview: true,
        };
        this.store.updateTask(timed);
        this.logDiagnostic({
          kind: "task_timed_out",
          confidence: "medium",
          conversationId: timed.conversationId,
          taskId: timed.id,
          runId: null,
          detail: `Task timed out after ${idleMs}ms idle without auto-complete evidence`,
        });
        this.emit({ kind: "task.finished", task: timed });
      }
    }
  }

  /**
   * Auto-complete a Task when all runs are terminal, a structured summary exists,
   * and there is no recent heavy shell/build/playwright activity.
   */
  evaluateTaskCompletion(taskId: string, nowIso = new Date().toISOString()): void {
    const task = this.store.getTask(taskId);
    if (!task || (task.status !== "open" && task.status !== "waiting")) return;

    const runs = this.store.listRunsForTask(taskId);
    if (runs.length === 0) return;

    const openRuns = runs.filter((r) => r.status === "running" || r.status === "waiting");
    let summary = task.completionSummary;
    let summarySource: "task" | "run" | "none" = summary ? "task" : "none";
    if (!summary) {
      const fromRun = [...runs]
        .reverse()
        .find((r) => r.completionSummary)?.completionSummary;
      if (fromRun) {
        summary = fromRun;
        summarySource = "run";
        this.promoteSummaryToTask(taskId, fromRun);
      }
    }

    const grace = this.idleConfig.taskCompletionGraceMs ?? TASK_COMPLETION_GRACE_MS;
    const nowMs = Date.parse(nowIso);
    const lastHeavy = this.lastHeavyActivityIso(taskId, runs);
    const heavyMs = lastHeavy ? Date.parse(lastHeavy) : 0;
    const noRecentHeavyActivity =
      !Number.isFinite(heavyMs) || heavyMs <= 0 || nowMs - heavyMs >= grace;

    const evidence = {
      allRunsTerminal: openRuns.length === 0,
      hasStructuredSummary: Boolean(
        summary?.overview || summary?.executiveSummary || summary?.userVisibleChanges?.length,
      ),
      noRecentHeavyActivity,
      openRunCount: openRuns.length,
      summarySource,
    };

    if (!canAutoCompleteTask(evidence)) return;

    const refreshed = this.store.getTask(taskId) ?? task;
    const finished: TaskRecord = {
      ...refreshed,
      finishedAt: nowIso,
      durationMs: calculateDurationMs(refreshed.startedAt, nowIso),
      status: deriveTaskStatusFromRuns(runs),
      completionKind: "automatic",
      completionReason: "all_runs_terminal_with_summary",
      completionSummary: refreshed.completionSummary ?? summary,
      needsReview: refreshed.needsReview || runs.some((r) => r.needsReview),
    };
    this.store.updateTask(finished);
    this.logDiagnostic({
      kind: "task_auto_complete",
      confidence: "high",
      conversationId: finished.conversationId,
      taskId: finished.id,
      runId: null,
      detail: `Auto-completed (${summarySource} summary, ${runs.length} runs)`,
      at: nowIso,
    });
    this.emit({ kind: "task.finished", task: finished });
  }

  private lastTaskActivityIso(taskId: string, runs: RunRecord[]): string {
    let latest = this.store.getTask(taskId)?.startedAt ?? new Date(0).toISOString();
    for (const run of runs) {
      const events = this.store.listEvents(run.id);
      const at = lastActivityFromEvents(run, events);
      if (at > latest) latest = at;
    }
    return latest;
  }

  private lastHeavyActivityIso(_taskId: string, runs: RunRecord[]): string | null {
    let latest: string | null = null;
    for (const run of runs) {
      for (const ev of this.store.listEvents(run.id)) {
        if (ev.type !== "shell_execution") continue;
        let cmd: string | null = run.latestShell;
        try {
          const payload = JSON.parse(ev.payloadJson) as { command?: string };
          if (typeof payload.command === "string") cmd = payload.command;
        } catch {
          // ignore
        }
        if (!isHeavyShellCommand(cmd)) continue;
        if (!latest || ev.timestamp > latest) latest = ev.timestamp;
      }
    }
    return latest;
  }

  /**
   * Late / mid-flight event with no open run: attach to open Task / recent finished
   * Task run, or create needs_review orphan Task+Run.
   */
  private resolveOrphanRun(
    timestamp: string,
    event: { type: string; summary: string; conversationId: string | null; generationId: string | null },
    payload: CursorHookPayload,
    enrichedPayload: Record<string, unknown>,
  ): RunRecord | null {
    // 1) Prefer attaching to a recent finished run (late hooks after stop).
    const decision = decideOrphanAttach({
      conversationId: event.conversationId,
      generationId: event.generationId,
      nowIso: timestamp,
      highLookbackMs: ORPHAN_HIGH_LOOKBACK_MS,
      mediumLookbackMs: ORPHAN_MEDIUM_LOOKBACK_MS,
      findFinished: (opts) => this.store.findRecentFinishedRun(opts),
    });

    if (decision.run && (decision.confidence === "high" || decision.confidence === "medium")) {
      let attached = decision.run;
      if (decision.needsReview && !attached.needsReview) {
        attached = {
          ...attached,
          needsReview: true,
          lifecycleReason: attached.lifecycleReason ?? "orphan_attached_review",
        };
        this.store.updateRun(attached);
        this.emit({
          kind: "run.updated",
          run: attached,
          prompt: this.store.getPrompt(attached.promptId),
        });
        const task = this.store.getTask(attached.taskId);
        if (task && !task.needsReview) {
          const t: TaskRecord = { ...task, needsReview: true };
          this.store.updateTask(t);
          this.emit({ kind: "task.updated", task: t });
        }
      }
      this.logDiagnostic({
        kind: "orphan_attach_finished_task",
        confidence: decision.confidence === "high" ? "high" : "medium",
        conversationId: event.conversationId,
        taskId: attached.taskId,
        runId: attached.id,
        detail: `Attached late ${event.type} to finished run`,
        at: timestamp,
      });
      return attached;
    }

    // 2) Open Task with no attachable finished run — continue work as a new Run.
    if (event.conversationId) {
      const openTask = this.store.getOpenTaskByConversation(event.conversationId);
      if (openTask) {
        this.logDiagnostic({
          kind: "orphan_attach_open_task",
          confidence: "high",
          conversationId: event.conversationId,
          taskId: openTask.id,
          runId: null,
          detail: `Late ${event.type} → new run under open task`,
          at: timestamp,
        });
        void this.startRun(
          timestamp,
          {
            ...payload,
            prompt: payload.prompt ?? `[follow-up] ${event.summary}`,
            conversation_id: event.conversationId,
          },
          enrichedPayload,
          { needsReview: false, lifecycleReason: null, status: "running", taskId: openTask.id },
        );
        return (
          this.store.listOpenRuns().find((r) => r.taskId === openTask.id) ??
          this.store.getActiveRun()
        );
      }
    }

    // 3) True orphan — new Task + Run flagged for review.
    void this.startRun(
      timestamp,
      {
        ...payload,
        prompt: payload.prompt ?? `[orphan] ${event.summary}`,
      },
      enrichedPayload,
      {
        needsReview: true,
        lifecycleReason: "orphan_unattached",
        status: "running",
      },
    );
    const orphan = this.store.getActiveRun();
    if (orphan) {
      const task = this.store.getTask(orphan.taskId);
      if (task) {
        const flagged: TaskRecord = { ...task, needsReview: true };
        this.store.updateTask(flagged);
        this.emit({ kind: "task.updated", task: flagged });
      }
      this.store.insertEvent({
        id: randomUUID(),
        runId: orphan.id,
        timestamp,
        type: "orphan_flagged",
        summary: "Orphan run — no matching conversation to attach",
        payloadJson: JSON.stringify({
          conversationId: event.conversationId,
          generationId: event.generationId,
          triggeringType: event.type,
        }),
      });
      this.logDiagnostic({
        kind: "orphan_create_task",
        confidence: "none",
        conversationId: event.conversationId,
        taskId: orphan.taskId,
        runId: orphan.id,
        detail: `Created orphan task+run for ${event.type}`,
        at: timestamp,
      });
      this.notifications.notify({
        category: "telemetry_warning",
        title: "Orphan run flagged",
        body: orphan.summary ?? `[orphan] ${event.summary}`,
        href: `/dashboard?task=${orphan.taskId}`,
        runId: orphan.id,
        metadata: { reason: "orphan_unattached" },
      });
    }
    return orphan;
  }

  private async startRun(
    timestamp: string,
    payload: CursorHookPayload,
    storedPayload: Record<string, unknown> = payload as Record<string, unknown>,
    opts: {
      needsReview?: boolean;
      lifecycleReason?: RunRecord["lifecycleReason"];
      status?: RunRecord["status"];
      taskId?: string;
    } = {},
  ): Promise<{ ok: true; runId: string; eventType: string }> {
    const generationId =
      typeof payload.generation_id === "string" ? payload.generation_id : null;

    // Only supersede open runs with the same generation_id — do not cancel
    // sibling explore/follow-up runs under the same Task.
    if (generationId) {
      for (const open of this.store.listOpenRuns()) {
        if (open.generationId !== generationId) continue;
        const closed: RunRecord = {
          ...open,
          finishedAt: timestamp,
          durationMs: calculateDurationMs(open.startedAt, timestamp),
          status: "cancelled",
          phase: "finished",
          completionKind: "automatic",
          manualCompletionReason: null,
          manualCompletionNote: null,
        };
        this.store.updateRun(closed);
        this.emit({
          kind: "run.finished",
          run: closed,
          prompt: this.store.getPrompt(closed.promptId),
        });
        this.logDiagnostic({
          kind: "supersede_generation",
          confidence: "high",
          conversationId: closed.conversationId,
          taskId: closed.taskId,
          runId: closed.id,
          detail: `Superseded generation ${generationId}`,
          at: timestamp,
        });
      }
    }

    const promptText = extractPromptText(payload);
    const prompt: PromptRecord = {
      id: randomUUID(),
      prompt: promptText,
      title: titleFromPrompt(promptText),
      createdAt: timestamp,
      conversationId: typeof payload.conversation_id === "string" ? payload.conversation_id : null,
      model: typeof payload.model === "string" ? payload.model : null,
    };
    this.store.insertPrompt(prompt);

    const taskId =
      opts.taskId ??
      this.resolveTaskForRun(prompt.conversationId, timestamp, promptText, prompt.title);

    const run: RunRecord = {
      id: randomUUID(),
      promptId: prompt.id,
      taskId,
      startedAt: timestamp,
      finishedAt: null,
      durationMs: null,
      status: opts.status ?? "running",
      summary: null,
      completionSummary: null,
      conversationId: prompt.conversationId,
      generationId,
      phase: "starting",
      latestShell: null,
      latestFile: null,
      completionKind: null,
      manualCompletionReason: null,
      manualCompletionNote: null,
      lifecycleReason: opts.lifecycleReason ?? null,
      idleMs: null,
      needsReview: opts.needsReview ?? false,
    };
    this.store.insertRun(run);

    const eventRecord: EventRecord = {
      id: randomUUID(),
      runId: run.id,
      timestamp,
      type: "prompt_submitted",
      summary: prompt.title,
      payloadJson: JSON.stringify(storedPayload),
    };
    this.store.insertEvent(eventRecord);

    const task = this.store.getTask(taskId);
    if (task) this.emit({ kind: "task.updated", task });

    this.emit({ kind: "run.updated", run, prompt });
    this.emit({ kind: "event.appended", event: eventRecord, run });
    return { ok: true, runId: run.id, eventType: "prompt_submitted" };
  }

  /**
   * Find-or-create the Task a new run belongs to. Conversations reuse their
   * still-open/waiting Task; otherwise a new Task is created.
   */
  private resolveTaskForRun(
    conversationId: string | null,
    timestamp: string,
    promptText: string,
    title: string,
  ): string {
    const open = conversationId
      ? this.store.getOpenTaskByConversation(conversationId)
      : null;
    const placement = decideTaskPlacement(conversationId, open);
    if (placement.action === "reuse_open_task" && open) {
      this.logDiagnostic({
        kind: "reuse_open_task",
        confidence: placement.confidence,
        conversationId,
        taskId: open.id,
        runId: null,
        detail: "Consolidated new prompt into open task",
        at: timestamp,
      });
      if (open.status === "waiting") {
        const resumed: TaskRecord = { ...open, status: "open" };
        this.store.updateTask(resumed);
        this.emit({ kind: "task.updated", task: resumed });
      }
      return open.id;
    }
    const task: TaskRecord = {
      id: randomUUID(),
      title,
      promptText,
      conversationId,
      createdAt: timestamp,
      startedAt: timestamp,
      finishedAt: null,
      durationMs: null,
      status: "open",
      completionSummary: null,
      completionKind: null,
      manualCompletionReason: null,
      manualCompletionNote: null,
      completionReason: null,
      needsReview: false,
    };
    this.store.insertTask(task);
    this.logDiagnostic({
      kind: "create_task",
      confidence: "high",
      conversationId,
      taskId: task.id,
      runId: null,
      detail: "Created new task for prompt",
      at: timestamp,
    });
    this.emit({ kind: "task.updated", task });
    return task.id;
  }

  private findRun(conversationId: string | null, generationId: string | null): RunRecord | null {
    const open = this.store.listOpenRuns();
    if (open.length === 0) return null;

    if (generationId) {
      const byGen = open.find((r) => r.generationId === generationId);
      if (byGen) return byGen;
    }
    if (conversationId) {
      const byConv = open.find(
        (r) => r.conversationId === conversationId && openRunMatchesIds(r, conversationId, generationId),
      );
      if (byConv) return byConv;
    }

    // Event carries explicit IDs — do not attach to an arbitrary open run that disagrees.
    if (conversationId || generationId) {
      const candidate = open[0];
      if (candidate && openRunMatchesIds(candidate, conversationId, generationId)) {
        // Only fall back when the open run has no conflicting IDs (both null on run).
        if (!candidate.conversationId && !candidate.generationId) {
          return candidate;
        }
      }
      return null;
    }

    return open[0] ?? null;
  }

  /** Inbox notifications for run completion/failure — not raised for cancelled/superseded runs. */
  private notifyInboxForRunStop(run: RunRecord, prompt: PromptRecord | null): void {
    const promptTitle = prompt?.title ?? "Untitled prompt";
    const href = `/dashboard?run=${run.id}`;
    const metadata = { promptTitle, durationMs: run.durationMs };

    if (run.status === "completed") {
      this.notifications.notify({
        category: "run_completed",
        title: "Run completed",
        body: `${promptTitle} finished in ${formatRuntime(run.durationMs)}`,
        href,
        runId: run.id,
        metadata,
      });
      return;
    }

    if (run.status === "failed") {
      this.notifications.notify({
        category: "run_failed",
        title: "Run failed",
        body: `${promptTitle} failed after ${formatRuntime(run.durationMs)}`,
        href,
        runId: run.id,
        metadata,
      });
    }
  }

  private async notify(run: RunRecord, prompt: PromptRecord | null): Promise<void> {
    if (run.status !== "completed") return;

    const settings = this.store.getSettings();
    const provider = resolveProvider(settings);
    if (provider.id === "none") return;

    const payload = buildNotificationPayload(run, prompt);
    try {
      const result = await provider.send(payload, settings);
      this.store.insertNotification({
        id: randomUUID(),
        runId: run.id,
        provider: provider.id,
        sentAt: new Date().toISOString(),
        success: result.ok,
        detail: result.detail,
      });
      if (!result.ok) {
        console.error(`[telemetry] notification failed (${provider.id}): ${result.detail}`);
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error(`[telemetry] notification provider threw (${provider.id}): ${detail}`);
      this.store.insertNotification({
        id: randomUUID(),
        runId: run.id,
        provider: provider.id,
        sentAt: new Date().toISOString(),
        success: false,
        detail,
      });
    }
  }
}

function mapStopStatus(payload: CursorHookPayload): RunRecord["status"] {
  const status = typeof payload.status === "string" ? payload.status.toLowerCase() : "";
  if (status.includes("fail") || status.includes("error")) return "failed";
  if (status.includes("cancel") || status.includes("abort")) return "cancelled";
  return "completed";
}

function deriveTaskStatusFromRuns(runs: RunRecord[]): TaskRecord["status"] {
  if (runs.some((r) => r.status === "failed")) return "failed";
  if (runs.every((r) => r.status === "cancelled" || r.status === "abandoned")) return "cancelled";
  if (runs.some((r) => r.status === "timed_out") && !runs.some((r) => r.status === "completed")) {
    return "timed_out";
  }
  return "completed";
}

function detectActionsSummary(
  filesModified: RunCompletionSummary["filesModified"] | null | undefined,
): "required" | "recommended" | "none" {
  if (!filesModified?.length) return "none";
  const paths = filesModified.flatMap((g) => g.files ?? []);
  const required = paths.some(
    (p) =>
      /vite\.config/i.test(p) ||
      /\.env/i.test(p) ||
      /package\.json$/i.test(p) ||
      /Dockerfile/i.test(p) ||
      /pnpm-lock\.yaml$/i.test(p) ||
      /cli\.ts$/i.test(p),
  );
  if (required) return "required";
  if (paths.every((p) => /packages\/site-|(\.tsx|\.css)$/i.test(p))) return "none";
  return "recommended";
}

/**
 * Prefer an explicit completion_summary object on the hook payload.
 * New runs do not parse Markdown — Markdown is export-only.
 */
function resolveCompletionSummary(
  current: RunCompletionSummary | null,
  payload: Record<string, unknown>,
): RunCompletionSummary | null {
  const fromPayload = completionSummaryFromPayload(payload);
  if (fromPayload) {
    return mergeCompletionSummary(current, fromPayload);
  }
  return current;
}
