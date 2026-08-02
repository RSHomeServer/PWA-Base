import { useCallback } from "react";
import { usePlatformPreferences } from "../preferences/usePlatformPreferences.js";
import { useServiceWorkerUpdate } from "../pwa/useServiceWorkerUpdate.js";
import styles from "./PwaUpdateToast.module.css";

export type PwaUpdateToastProps = {
  /** Product name in the toast copy. */
  appLabel?: string;
};

/**
 * Optional toast when an update is waiting and preferences ask to prompt.
 * Hidden when auto-apply is on or prompting is disabled.
 */
export function PwaUpdateToast({ appLabel = "this app" }: PwaUpdateToastProps) {
  const { prefs } = usePlatformPreferences();
  const { updateAvailable, applyUpdate, deferUpdate } = useServiceWorkerUpdate({
    disabled: import.meta.env.DEV,
  });

  const onReload = useCallback(() => applyUpdate({ forceReload: true }), [applyUpdate]);

  const shouldPrompt =
    prefs.updates.promptBeforeUpdate &&
    !prefs.updates.autoApplyUpdates &&
    updateAvailable;

  if (!shouldPrompt) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <p className={styles.message}>A new version of {appLabel} is available.</p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={onReload}>
          Reload
        </button>
        <button type="button" className={styles.secondary} onClick={deferUpdate}>
          Later
        </button>
      </div>
    </div>
  );
}
