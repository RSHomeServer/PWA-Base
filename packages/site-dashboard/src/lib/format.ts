import type { NotificationCategory, RunStatus, TaskStatus } from "../api/types.js";

export function formatDuration(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function statusTone(status: RunStatus): "success" | "warning" | "error" | "default" {
  switch (status) {
    case "completed":
      return "success";
    case "running":
    case "waiting":
      return "warning";
    case "failed":
    case "timed_out":
    case "abandoned":
      return "error";
    case "cancelled":
    default:
      return "default";
  }
}

/** Authoritative UI label for run status (+ manual completion). */
export function formatRunStatusLabel(
  status: RunStatus,
  completionKind?: "automatic" | "manual" | null,
): string {
  if (status === "completed" && completionKind === "manual") return "Manual Completion";
  switch (status) {
    case "running":
      return "Running";
    case "waiting":
      return "Waiting";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "timed_out":
      return "Timed Out";
    case "abandoned":
      return "Abandoned";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export function taskStatusTone(status: TaskStatus): "success" | "warning" | "error" | "default" {
  switch (status) {
    case "completed":
      return "success";
    case "open":
    case "waiting":
      return "warning";
    case "failed":
    case "timed_out":
      return "error";
    case "cancelled":
    default:
      return "default";
  }
}

/** Authoritative UI label for Task status (+ manual completion). */
export function formatTaskStatusLabel(
  status: TaskStatus,
  completionKind?: "automatic" | "manual" | null,
): string {
  if (status === "completed" && completionKind === "manual") return "Manual Completion";
  switch (status) {
    case "open":
      return "Open";
    case "waiting":
      return "Waiting";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "timed_out":
      return "Timed Out";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  run_completed: "Run Completed",
  run_failed: "Run Failed",
  build_failed: "Build Failed",
  tests_failed: "Tests Failed",
  deployment_completed: "Deployment Completed",
  deployment_failed: "Deployment Failed",
  telemetry_warning: "Telemetry Warning",
  system_health: "System Health",
  screenshot_capture: "Screenshot Capture",
  artifacts_generated: "Artifacts Generated",
  validation_failed: "Validation Failed",
};

export function humanizeNotificationCategory(category: NotificationCategory): string {
  return (
    NOTIFICATION_CATEGORY_LABELS[category] ??
    category
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "run_completed",
  "run_failed",
  "build_failed",
  "tests_failed",
  "deployment_completed",
  "deployment_failed",
  "telemetry_warning",
  "system_health",
  "screenshot_capture",
  "artifacts_generated",
  "validation_failed",
];

export function notificationCategoryTone(
  category: NotificationCategory,
): "success" | "warning" | "error" | "default" {
  switch (category) {
    case "run_completed":
    case "deployment_completed":
    case "artifacts_generated":
    case "screenshot_capture":
      return "success";
    case "run_failed":
    case "build_failed":
    case "tests_failed":
    case "deployment_failed":
    case "validation_failed":
      return "error";
    case "telemetry_warning":
    case "system_health":
      return "warning";
    default:
      return "default";
  }
}

/** Relative time like "3m ago", "2h ago" — falls back to formatted timestamp beyond a day. */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const ts = d.getTime();
  if (!Number.isFinite(ts)) return iso;
  const diffMs = Date.now() - ts;
  if (diffMs < 0) return formatTimestamp(iso);
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  return formatTimestamp(iso);
}

/** First non-empty line of free-form text, trimmed and stripped of markdown decor. */
export function firstLine(text: string | null | undefined): string | null {
  if (!text) return null;
  const line = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!line) return null;
  return line
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s*/, "")
    .trim();
}
