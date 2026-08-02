/**
 * Client-only OS notification category toggles (localStorage stub).
 * Server-side inbox preferences live in telemetry — do not duplicate that store here.
 */

export const OS_NOTIFY_PREFS_KEY = "dashboard:osNotifyPrefs:v1";

/** Categories exposed in Settings for native OS alerts (Workstream E stub). */
export type OsNotifyCategory =
  | "run_completed"
  | "run_failed"
  | "validation_failed"
  | "deployment_completed"
  | "telemetry_unavailable";

export const OS_NOTIFY_CATEGORIES: OsNotifyCategory[] = [
  "run_completed",
  "run_failed",
  "validation_failed",
  "deployment_completed",
  "telemetry_unavailable",
];

export type OsNotifyPrefs = Record<OsNotifyCategory, boolean>;

const OS_NOTIFY_LABELS: Record<OsNotifyCategory, string> = {
  run_completed: "Run completed",
  run_failed: "Run failed",
  validation_failed: "Validation failed",
  deployment_completed: "Deployment complete",
  telemetry_unavailable: "Telemetry unavailable",
};

export function humanizeOsNotifyCategory(category: OsNotifyCategory): string {
  return OS_NOTIFY_LABELS[category];
}

/** All categories default OFF until the user opts in on Settings. */
export function defaultOsNotifyPrefs(): OsNotifyPrefs {
  return {
    run_completed: false,
    run_failed: false,
    validation_failed: false,
    deployment_completed: false,
    telemetry_unavailable: false,
  };
}

export function loadOsNotifyPrefs(): OsNotifyPrefs {
  const defaults = defaultOsNotifyPrefs();
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(OS_NOTIFY_PREFS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<OsNotifyPrefs>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function saveOsNotifyPrefs(prefs: OsNotifyPrefs): void {
  window.localStorage.setItem(OS_NOTIFY_PREFS_KEY, JSON.stringify(prefs));
}

export function isOsNotifyEnabled(category: OsNotifyCategory): boolean {
  return loadOsNotifyPrefs()[category] === true;
}
