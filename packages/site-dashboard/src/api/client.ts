import type {
  LiveRunView,
  PromptRecord,
  RunListItem,
  RunRecord,
  SettingsRecord,
  EventRecord,
  NotificationRecord,
  HealthReport,
  OpsReport,
  OpsEventRow,
  ConnectivityTestResult,
  ManualCompletionReason,
  RunArtifact,
  RunCompletionSummary,
  InboxNotification,
  NotificationCategory,
  NotificationPreference,
  TaskDetail,
  TaskListItem,
  TaskRecord,
  LifecycleDiagnosticsReport,
} from "./types.js";

/** Same-origin via Vite/nginx proxy — keeps the UI decoupled from SQLite. */
const API_BASE = "/telemetry";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const cloned = res.clone();
      const body = (await cloned.json()) as { message?: string; error?: string };
      detail = body.message ?? body.error ?? detail;
    } catch {
      try {
        detail = (await res.text()) || detail;
      } catch {
        // ignore
      }
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function fetchLive(): Promise<LiveRunView> {
  return request<LiveRunView>("/api/live");
}

export function fetchRuns(sort = "started_at", dir = "desc"): Promise<{ items: RunListItem[] }> {
  return request(`/api/runs?sort=${encodeURIComponent(sort)}&dir=${encodeURIComponent(dir)}`);
}

export function fetchRun(id: string): Promise<{
  run: RunRecord;
  prompt: PromptRecord | null;
  events: EventRecord[];
  notifications: NotificationRecord[];
  artifacts: RunArtifact[];
}> {
  return request(`/api/runs/${encodeURIComponent(id)}`);
}

export function fetchArtifacts(runId: string): Promise<{ items: RunArtifact[] }> {
  return request(`/api/runs/${encodeURIComponent(runId)}/artifacts`);
}

export function fetchTasks(): Promise<{ items: TaskListItem[] }> {
  return request("/api/tasks");
}

export function fetchTask(id: string): Promise<TaskDetail> {
  return request(`/api/tasks/${encodeURIComponent(id)}`);
}

export function saveTaskCompletionSummary(
  taskId: string,
  patch: Partial<RunCompletionSummary>,
): Promise<{ task: TaskRecord }> {
  return request(`/api/tasks/${encodeURIComponent(taskId)}/completion-summary`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function markTaskComplete(
  taskId: string,
  reason: ManualCompletionReason,
  note?: string,
): Promise<{ task: TaskRecord; runs: RunRecord[] }> {
  return request(`/api/tasks/${encodeURIComponent(taskId)}/complete`, {
    method: "POST",
    body: JSON.stringify({ reason, note }),
  });
}

export function fetchLifecycleDiagnostics(): Promise<LifecycleDiagnosticsReport> {
  return request("/api/lifecycle/diagnostics");
}

export function artifactContentUrl(runId: string, artifactId: string): string {
  return `${API_BASE}/api/runs/${encodeURIComponent(runId)}/artifacts/${encodeURIComponent(artifactId)}/content`;
}

export function fetchPrompt(id: string): Promise<{
  prompt: PromptRecord;
  runs: RunRecord[];
}> {
  return request(`/api/prompts/${encodeURIComponent(id)}`);
}

export function fetchSettings(): Promise<SettingsRecord> {
  return request("/api/settings");
}

export function saveSettings(patch: Partial<SettingsRecord>): Promise<SettingsRecord> {
  return request("/api/settings", { method: "PUT", body: JSON.stringify(patch) });
}

export function fetchHealth(): Promise<HealthReport> {
  return request<HealthReport>("/health");
}

export function fetchDiagnostics(): Promise<HealthReport> {
  return request<HealthReport>("/api/diagnostics");
}

export function fetchOps(): Promise<OpsReport> {
  return request<OpsReport>("/api/ops");
}

export function fetchOpsEvents(type = "", limit = 100): Promise<{ items: OpsEventRow[] }> {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  params.set("limit", String(limit));
  return request(`/api/ops/events?${params.toString()}`);
}

export function testApi(): Promise<ConnectivityTestResult> {
  return request("/api/ops/test/api", { method: "POST", body: "{}" });
}

export function testSqlite(): Promise<ConnectivityTestResult> {
  return request("/api/ops/test/sqlite", { method: "POST", body: "{}" });
}

export function testWebsocket(): Promise<ConnectivityTestResult> {
  return request("/api/ops/test/websocket", { method: "POST", body: "{}" });
}

export function generateTestEvent(): Promise<ConnectivityTestResult> {
  return request("/api/ops/test/event", { method: "POST", body: "{}" });
}

export function saveCompletionSummary(
  runId: string,
  patch: Partial<RunCompletionSummary>,
): Promise<{ run: RunRecord }> {
  return request(`/api/runs/${encodeURIComponent(runId)}/completion-summary`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });
}

export function markRunComplete(
  runId: string,
  reason: ManualCompletionReason,
  note?: string,
): Promise<{ run: RunRecord; event: EventRecord }> {
  return request(`/api/runs/${encodeURIComponent(runId)}/manual-complete`, {
    method: "POST",
    body: JSON.stringify({ reason, note }),
  });
}

export function deleteRun(runId: string): Promise<{ ok: boolean; runId: string }> {
  return request(`/api/runs/${encodeURIComponent(runId)}`, { method: "DELETE" });
}

export interface FetchInboxParams {
  category?: NotificationCategory | "";
  unread?: boolean;
  q?: string;
  limit?: number;
}

export function fetchInbox(params: FetchInboxParams = {}): Promise<{ items: InboxNotification[] }> {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.unread) search.set("unread", "1");
  if (params.q) search.set("q", params.q);
  if (params.limit) search.set("limit", String(params.limit));
  const qs = search.toString();
  return request(`/api/inbox${qs ? `?${qs}` : ""}`);
}

export function fetchUnreadCount(): Promise<{ count: number }> {
  return request("/api/inbox/unread-count");
}

export function markInboxRead(id: string, read: boolean): Promise<InboxNotification> {
  return request(`/api/inbox/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ read }),
  });
}

export function markAllInboxRead(): Promise<{ updated: number }> {
  return request("/api/inbox/mark-all-read", { method: "POST", body: "{}" });
}

export function deleteInboxItem(id: string): Promise<{ ok: boolean }> {
  return request(`/api/inbox/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function clearInbox(): Promise<{ ok: boolean }> {
  return request("/api/inbox", { method: "DELETE" });
}

export function fetchNotificationPreferences(): Promise<{ items: NotificationPreference[] }> {
  return request("/api/notification-preferences");
}

export function saveNotificationPreferences(
  preferences: NotificationPreference[],
): Promise<{ items: NotificationPreference[] }> {
  return request("/api/notification-preferences", {
    method: "PUT",
    body: JSON.stringify({ preferences }),
  });
}

export function telemetryWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/telemetry/ws`;
}
