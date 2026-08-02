/**
 * Platform-wide preferences (runtime-owned). Persist in localStorage.
 * Apps should use this API — not browser update APIs directly.
 */

export const PLATFORM_PREFERENCES_KEY = "songara-platform-prefs:v1";

export type PlatformUpdatePreferences = {
  /** Poll / check for a newer service worker on launch and on an interval. */
  autoCheckUpdates: boolean;
  /** When a waiting worker appears, activate it without prompting. */
  autoApplyUpdates: boolean;
  /** After activation, navigate/reload so the new build takes effect. */
  autoReloadOnActivate: boolean;
  /** When autoApply is false, surface a prompt (chrome / toast) before applying. */
  promptBeforeUpdate: boolean;
  /** SW update poll interval in ms (ignored when autoCheckUpdates is false). */
  updateCheckIntervalMs: number;
};

export type PlatformPreferences = {
  schemaVersion: 1;
  updates: PlatformUpdatePreferences;
};

export type PlatformRuntimeMode = "development" | "production";

type RuntimeModeEnv = {
  DEV?: boolean;
  /** Explicit override from build (`PLATFORM_RUNTIME_MODE` → Vite define). */
  VITE_PLATFORM_RUNTIME_MODE?: string;
};

/**
 * Resolve update-preference defaults mode.
 * Priority: `VITE_PLATFORM_RUNTIME_MODE` → Vite `DEV` → production.
 * Docker/compose sets `PLATFORM_RUNTIME_MODE=development` so container builds
 * get fast iteration defaults even though `import.meta.env.DEV` is false.
 */
export function detectPlatformRuntimeMode(
  env: RuntimeModeEnv = typeof import.meta !== "undefined"
    ? ((import.meta as { env?: RuntimeModeEnv }).env ?? {})
    : {},
): PlatformRuntimeMode {
  const explicit = env.VITE_PLATFORM_RUNTIME_MODE?.trim().toLowerCase();
  if (explicit === "development" || explicit === "production") {
    return explicit;
  }
  return env.DEV ? "development" : "production";
}

/** Sensible defaults — DEV optimises speed; PROD prioritises stability / choice. */
export function defaultPlatformPreferences(
  mode: PlatformRuntimeMode = detectPlatformRuntimeMode(),
): PlatformPreferences {
  if (mode === "development") {
    return {
      schemaVersion: 1,
      updates: {
        autoCheckUpdates: true,
        autoApplyUpdates: true,
        autoReloadOnActivate: true,
        promptBeforeUpdate: false,
        updateCheckIntervalMs: 15_000,
      },
    };
  }
  return {
    schemaVersion: 1,
    updates: {
      autoCheckUpdates: true,
      autoApplyUpdates: false,
      autoReloadOnActivate: false,
      promptBeforeUpdate: true,
      updateCheckIntervalMs: 5 * 60 * 1000,
    },
  };
}
