import {
  PLATFORM_PREFERENCES_KEY,
  defaultPlatformPreferences,
  detectPlatformRuntimeMode,
  type PlatformPreferences,
  type PlatformUpdatePreferences,
} from "./types.js";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function mergeUpdates(
  partial: unknown,
  fallback: PlatformUpdatePreferences,
): PlatformUpdatePreferences {
  if (!isObject(partial)) return fallback;
  return {
    autoCheckUpdates:
      typeof partial.autoCheckUpdates === "boolean"
        ? partial.autoCheckUpdates
        : fallback.autoCheckUpdates,
    autoApplyUpdates:
      typeof partial.autoApplyUpdates === "boolean"
        ? partial.autoApplyUpdates
        : fallback.autoApplyUpdates,
    autoReloadOnActivate:
      typeof partial.autoReloadOnActivate === "boolean"
        ? partial.autoReloadOnActivate
        : fallback.autoReloadOnActivate,
    promptBeforeUpdate:
      typeof partial.promptBeforeUpdate === "boolean"
        ? partial.promptBeforeUpdate
        : fallback.promptBeforeUpdate,
    updateCheckIntervalMs:
      typeof partial.updateCheckIntervalMs === "number" && partial.updateCheckIntervalMs > 0
        ? partial.updateCheckIntervalMs
        : fallback.updateCheckIntervalMs,
  };
}

export function normalisePlatformPreferences(
  raw: unknown,
  mode = detectPlatformRuntimeMode(),
): PlatformPreferences {
  const defaults = defaultPlatformPreferences(mode);
  if (!isObject(raw)) return defaults;
  return {
    schemaVersion: 1,
    updates: mergeUpdates(raw.updates, defaults.updates),
  };
}

export function loadPlatformPreferences(
  mode = detectPlatformRuntimeMode(),
): PlatformPreferences {
  if (typeof window === "undefined") return defaultPlatformPreferences(mode);
  try {
    const raw = window.localStorage.getItem(PLATFORM_PREFERENCES_KEY);
    if (!raw) return defaultPlatformPreferences(mode);
    return normalisePlatformPreferences(JSON.parse(raw) as unknown, mode);
  } catch {
    return defaultPlatformPreferences(mode);
  }
}

export function savePlatformPreferences(
  prefs: PlatformPreferences,
  mode = detectPlatformRuntimeMode(),
): PlatformPreferences {
  const normalised = normalisePlatformPreferences(prefs, mode);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PLATFORM_PREFERENCES_KEY, JSON.stringify(normalised));
      window.dispatchEvent(
        new CustomEvent("songara:platform-prefs", { detail: normalised }),
      );
    } catch {
      /* private mode */
    }
  }
  return normalised;
}

export function patchPlatformPreferences(
  patch: { updates?: Partial<PlatformUpdatePreferences> },
  mode = detectPlatformRuntimeMode(),
): PlatformPreferences {
  const current = loadPlatformPreferences(mode);
  return savePlatformPreferences(
    {
      schemaVersion: 1,
      updates: { ...current.updates, ...patch.updates },
    },
    mode,
  );
}

export function subscribePlatformPreferences(
  listener: (prefs: PlatformPreferences) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<PlatformPreferences>).detail;
    listener(normalisePlatformPreferences(detail));
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PLATFORM_PREFERENCES_KEY) return;
    listener(loadPlatformPreferences());
  };

  window.addEventListener("songara:platform-prefs", onCustom);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("songara:platform-prefs", onCustom);
    window.removeEventListener("storage", onStorage);
  };
}
