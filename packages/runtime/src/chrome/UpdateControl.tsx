import { useCallback, useEffect, useState } from "react";
import { usePlatformPreferences } from "../preferences/usePlatformPreferences.js";
import { useServiceWorkerUpdate } from "../pwa/useServiceWorkerUpdate.js";
import {
  fetchLatestAppVersion,
  formatDdMmHhMm,
  getEmbeddedAppBuild,
  type AppVersionInfo,
} from "../pwa/version.js";
import styles from "./UpdateControl.module.css";

function ReloadIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path
        d="M3.5 8a4.5 4.5 0 0 1 7.6-3.25M12.5 8A4.5 4.5 0 0 1 4.9 11.25"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
      <path
        d="M11.25 2.75v2.5h-2.5M4.75 13.25v-2.5h2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Top-bar update control — version stamp + platform update preferences.
 * Colour is semver vs `/version.json`; SW waiting is an optional hint.
 */
export function UpdateControl() {
  const current = getEmbeddedAppBuild();
  const { prefs, setUpdatePreference } = usePlatformPreferences();
  const { updateAvailable, applyUpdate, checkForUpdate } = useServiceWorkerUpdate({
    // Vite HMR has no production SW; preview/docker builds register normally.
    disabled: import.meta.env.DEV,
  });
  const [latest, setLatest] = useState<AppVersionInfo | null>(current);
  const [checking, setChecking] = useState(false);

  const refreshLatest = useCallback(async (signal?: AbortSignal) => {
    const info = await fetchLatestAppVersion(signal);
    if (!signal?.aborted && info) setLatest(info);
  }, []);

  useEffect(() => {
    if (!prefs.updates.autoCheckUpdates) return;
    const ac = new AbortController();
    void refreshLatest(ac.signal);
    const id = window.setInterval(
      () => void refreshLatest(),
      Math.min(prefs.updates.updateCheckIntervalMs, 60_000),
    );
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshLatest();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      ac.abort();
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [prefs.updates.autoCheckUpdates, prefs.updates.updateCheckIntervalMs, refreshLatest]);

  const newest = latest ?? current;
  const outdated = newest.version !== current.version;

  useEffect(() => {
    if (!outdated || !updateAvailable) return;
    if (!prefs.updates.autoApplyUpdates) return;
    applyUpdate();
  }, [outdated, updateAvailable, prefs.updates.autoApplyUpdates, applyUpdate]);

  const onRefresh = useCallback(() => {
    if (checking) return;
    setChecking(true);
    void (async () => {
      try {
        await checkForUpdate();
      } catch {
        // ignore — still reload
      } finally {
        applyUpdate({ forceReload: true });
      }
    })();
  }, [applyUpdate, checkForUpdate, checking]);

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={[styles.trigger, outdated ? styles.triggerStale : styles.triggerFresh]
          .filter(Boolean)
          .join(" ")}
        aria-haspopup="true"
        aria-label={outdated ? "Update available" : "App version — up to date"}
        title={outdated ? "Update available" : "Up to date"}
      >
        <ReloadIcon />
      </button>
      <div className={styles.panel} role="dialog" aria-label="Application version">
        <dl className={styles.meta}>
          <div className={styles.row}>
            <dt>Last updated</dt>
            <dd>{formatDdMmHhMm(current.builtAt)}</dd>
          </div>
          <div className={styles.row}>
            <dt>Current version</dt>
            <dd>
              <code>{current.version}</code>
            </dd>
          </div>
          <div className={styles.row}>
            <dt>Newest release</dt>
            <dd>{formatDdMmHhMm(newest.builtAt)}</dd>
          </div>
          <div className={styles.row}>
            <dt>Newest version</dt>
            <dd>
              <code>{newest.version}</code>
            </dd>
          </div>
        </dl>
        {updateAvailable && outdated ? (
          <p className={styles.hint}>A service worker update is waiting to activate.</p>
        ) : null}

        <fieldset className={styles.prefs}>
          <legend className={styles.prefsLegend}>Update preferences</legend>
          {(
            [
              ["autoCheckUpdates", "Check for updates automatically"],
              ["autoApplyUpdates", "Install updates automatically"],
              ["autoReloadOnActivate", "Reload when an update activates"],
              ["promptBeforeUpdate", "Prompt before updating"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className={styles.prefRow}>
              <input
                type="checkbox"
                checked={prefs.updates[key]}
                onChange={(event) => setUpdatePreference(key, event.target.checked)}
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>

        <button
          type="button"
          className={[styles.refresh, outdated ? styles.refreshStale : styles.refreshFresh]
            .filter(Boolean)
            .join(" ")}
          onClick={onRefresh}
          disabled={checking}
        >
          {outdated ? "Refresh to update" : "Refresh"}
        </button>
      </div>
    </div>
  );
}
