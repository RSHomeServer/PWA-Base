import { useCallback, useEffect, useState } from "react";
import { Button } from "@platform/ui";
import styles from "./InstallExperience.module.css";

const DISMISS_KEY = "dashboard:pwaInstallDismissed:v1";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIosInstallable(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIos && isSafari;
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function persistDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // ignore storage failures
  }
}

/**
 * Surfaces install guidance when the browser supports PWA install or on iOS Safari.
 */
export function InstallExperience() {
  const [dismissed, setDismissed] = useState(readDismissed);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (dismissed || isStandaloneDisplay()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if (isIosInstallable()) {
      setIosHint(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, [dismissed]);

  const dismiss = useCallback(() => {
    persistDismissed();
    setDismissed(true);
    setInstallPrompt(null);
    setIosHint(false);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") dismiss();
  }, [dismiss, installPrompt]);

  if (dismissed || isStandaloneDisplay()) return null;
  if (!installPrompt && !iosHint) return null;

  return (
    <section className={styles.installBanner} aria-labelledby="pwa-install-title">
      <h2 id="pwa-install-title" className={styles.title}>
        Install the dashboard
      </h2>
      <p className={styles.body}>
        Add the AI Development Dashboard to your home screen for quick access. Offline mode
        keeps the app shell available; live run data still needs the telemetry service. Push
        notifications are planned for a later release.
      </p>
      <ul className={styles.list}>
        <li>Launch from your dock or home screen like a native app</li>
        <li>Reopen recent runs when telemetry is temporarily offline</li>
        <li>Future: browser notifications for run completion</li>
      </ul>

      {iosHint && !installPrompt ? (
        <ol className={styles.iosSteps}>
          <li>Tap the Share button in Safari</li>
          <li>Choose <strong>Add to Home Screen</strong></li>
          <li>Open Dashboard from your home screen</li>
        </ol>
      ) : null}

      <div className={styles.actions}>
        {installPrompt ? (
          <Button type="button" size="sm" onClick={() => void handleInstall()}>
            Install app
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="secondary" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </section>
  );
}
