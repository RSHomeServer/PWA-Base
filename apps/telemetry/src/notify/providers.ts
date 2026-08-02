import type { PromptRecord, RunRecord, SettingsRecord } from "../types.js";

export interface NotificationPayload {
  title: string;
  runtime: string;
  status: string;
  summary: string;
  promptTitle: string;
}

export interface NotificationProvider {
  readonly id: string;
  send(
    payload: NotificationPayload,
    settings: SettingsRecord,
  ): Promise<{ ok: boolean; detail: string }>;
}

export function formatRuntime(durationMs: number | null): string {
  if (durationMs == null || durationMs < 0) return "—";
  const totalSec = Math.round(durationMs / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function buildNotificationPayload(
  run: RunRecord,
  prompt: PromptRecord | null,
): NotificationPayload {
  return {
    title: `Run ${run.status}`,
    promptTitle: prompt?.title ?? "Untitled prompt",
    runtime: formatRuntime(run.durationMs),
    status: run.status,
    summary: run.summary?.slice(0, 280) ?? "No summary captured.",
  };
}

export class NtfyProvider implements NotificationProvider {
  readonly id = "ntfy";

  async send(
    payload: NotificationPayload,
    settings: SettingsRecord,
  ): Promise<{ ok: boolean; detail: string }> {
    const topic = settings.ntfyTopic.trim();
    if (!topic) {
      return { ok: false, detail: "ntfy topic is empty" };
    }
    const base = settings.ntfyServer.replace(/\/$/, "");
    const url = `${base}/${encodeURIComponent(topic)}`;
    const body = [
      payload.promptTitle,
      `Status: ${payload.status}`,
      `Runtime: ${payload.runtime}`,
      "",
      payload.summary,
    ].join("\n");

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Title: payload.title,
          Priority: payload.status === "completed" ? "default" : "high",
          Tags: "robot,computer",
          "Content-Type": "text/plain; charset=utf-8",
        },
        body,
      });
      if (!res.ok) {
        return { ok: false, detail: `ntfy HTTP ${res.status}` };
      }
      return { ok: true, detail: `sent to ${url}` };
    } catch (err) {
      return { ok: false, detail: err instanceof Error ? err.message : String(err) };
    }
  }
}

export class NoopProvider implements NotificationProvider {
  readonly id = "none";

  async send(): Promise<{ ok: boolean; detail: string }> {
    return { ok: true, detail: "notifications disabled" };
  }
}

export function resolveProvider(settings: SettingsRecord): NotificationProvider {
  if (settings.notificationProvider === "ntfy") {
    return new NtfyProvider();
  }
  return new NoopProvider();
}
