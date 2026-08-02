import type { Workbox } from "workbox-window";
import { loadPlatformPreferences } from "../preferences/store.js";
import type { PlatformUpdatePreferences } from "../preferences/types.js";

export interface ServiceWorkerUpdateController {
  /** True when a waiting worker is ready to activate. */
  readonly updateAvailable: boolean;
  register: () => Promise<void>;
  /** Ask the SW to check for updates now. */
  checkForUpdate: () => Promise<void>;
  /**
   * Activate waiting worker (skipWaiting). Reloads when
   * `updates.autoReloadOnActivate` is true (or `forceReload`).
   */
  applyUpdate: (opts?: { forceReload?: boolean }) => void;
  /** Dismiss the update prompt without applying (defer). */
  deferUpdate: () => void;
  subscribe: (listener: (updateAvailable: boolean) => void) => () => void;
  dispose: () => void;
}

export interface CreateServiceWorkerUpdateControllerOptions {
  /** Absolute or base-relative SW script URL. Default: `${base}sw.js`. */
  scriptUrl?: string;
  /** When true, do not register (e.g. Vite DEV HMR — no production SW). */
  disabled?: boolean;
  /**
   * Override update preferences. When omitted, reads platform preferences
   * (and re-reads on each waiting/poll decision).
   */
  updatePreferences?: Partial<PlatformUpdatePreferences>;
  /** @deprecated Prefer platform preferences `updateCheckIntervalMs`. */
  pollIntervalMs?: number;
}

/**
 * Resolve the default service-worker script path.
 *
 * `new URL(path, base)` requires an *absolute* base. A bare `"/"` (common
 * `<base href>` / Vite `BASE_URL`) is invalid and throws
 * `TypeError: Failed to construct 'URL': Invalid base URL`. Resolve the
 * document base against a page URL first.
 */
export function resolveServiceWorkerScriptUrl(
  baseHref: string,
  pageUrl: string,
): string {
  const base = new URL(baseHref || "/", pageUrl);
  return new URL("sw.js", base).pathname;
}

function hardReload(): void {
  const { pathname, hash } = window.location;
  window.location.href = `${pathname}?_=${Date.now()}${hash}`;
}

function resolveUpdatePrefs(
  options: CreateServiceWorkerUpdateControllerOptions,
): PlatformUpdatePreferences {
  const stored = loadPlatformPreferences().updates;
  return {
    ...stored,
    ...options.updatePreferences,
    updateCheckIntervalMs:
      options.pollIntervalMs ??
      options.updatePreferences?.updateCheckIntervalMs ??
      stored.updateCheckIntervalMs,
  };
}

/**
 * UI-agnostic service worker registration + deferred update control (ADR-004).
 * Update behaviour is driven by platform preferences unless overridden.
 */
export function createServiceWorkerUpdateController(
  options: CreateServiceWorkerUpdateControllerOptions = {},
): ServiceWorkerUpdateController {
  let updateAvailable = false;
  let wb: Workbox | null = null;
  const listeners = new Set<(value: boolean) => void>();
  let disposed = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let onVisible: (() => void) | null = null;
  let applying = false;

  const notify = () => {
    for (const listener of listeners) listener(updateAvailable);
  };

  const setUpdateAvailable = (value: boolean) => {
    updateAvailable = value;
    notify();
  };

  const clearPoll = () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (onVisible && typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", onVisible);
      onVisible = null;
    }
  };

  const applyUpdate = (opts?: { forceReload?: boolean }) => {
    const prefs = resolveUpdatePrefs(options);
    const shouldReload = opts?.forceReload ?? prefs.autoReloadOnActivate;

    let reloaded = false;
    const reloadOnce = () => {
      if (!shouldReload || reloaded) return;
      reloaded = true;
      hardReload();
    };

    if (!wb) {
      reloadOnce();
      return;
    }

    if (applying) {
      if (shouldReload) reloadOnce();
      return;
    }
    applying = true;

    wb.addEventListener("controlling", () => {
      setUpdateAvailable(false);
      reloadOnce();
    });
    void wb.messageSkipWaiting();
    if (shouldReload) {
      window.setTimeout(reloadOnce, 600);
    } else {
      applying = false;
      setUpdateAvailable(false);
    }
  };

  const onWaiting = () => {
    setUpdateAvailable(true);
    const prefs = resolveUpdatePrefs(options);
    if (prefs.autoApplyUpdates) {
      applyUpdate();
    }
  };

  return {
    get updateAvailable() {
      return updateAvailable;
    },
    async register() {
      if (disposed || options.disabled) return;
      if (!("serviceWorker" in navigator)) return;

      const { Workbox } = await import("workbox-window");
      if (disposed) return;

      const baseHref =
        typeof document !== "undefined"
          ? document.querySelector("base")?.getAttribute("href") ?? "/"
          : "/";
      const scriptUrl =
        options.scriptUrl ??
        resolveServiceWorkerScriptUrl(baseHref, window.location.href);

      wb = new Workbox(scriptUrl);
      wb.addEventListener("waiting", onWaiting);
      wb.addEventListener("externalwaiting" as "waiting", onWaiting);
      wb.addEventListener("controlling", () => setUpdateAvailable(false));
      await wb.register();

      const prefs = resolveUpdatePrefs(options);
      if (!prefs.autoCheckUpdates) return;

      const pollMs = prefs.updateCheckIntervalMs;
      const runCheck = () => {
        void wb?.update();
      };
      pollTimer = setInterval(runCheck, pollMs);
      onVisible = () => {
        if (document.visibilityState === "visible") runCheck();
      };
      document.addEventListener("visibilitychange", onVisible);
      window.setTimeout(runCheck, 2500);
    },
    async checkForUpdate() {
      if (!wb) return;
      await wb.update();
    },
    applyUpdate,
    deferUpdate() {
      setUpdateAvailable(false);
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(updateAvailable);
      return () => listeners.delete(listener);
    },
    dispose() {
      disposed = true;
      clearPoll();
      wb = null;
      listeners.clear();
    },
  };
}
