/**
 * Thin wrapper around the browser Notification API for OS-level alerts.
 *
 * This module is intentionally separate from the telemetry inbox (NotificationService).
 * Future transports (Web Push with VAPID, Android FCM, iOS APNs) should call the same
 * `showBrowserNotification` entry point after resolving permission/subscription —
 * no redesign of category prefs or WS wiring should be required.
 */

export type BrowserNotificationPermission = NotificationPermission | "unsupported";

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  /** Collapse duplicate alerts (e.g. same run id). */
  tag?: string;
  /** Relative dashboard path or absolute URL — opened on click. */
  href?: string;
}

/** True when `window.Notification` exists (desktop browsers, installed PWAs). */
export function isNotificationSupported(): boolean {
  return typeof globalThis.Notification !== "undefined";
}

/** Current permission, or `"unsupported"` when the API is unavailable. */
export function getPermission(): BrowserNotificationPermission {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/** Prompt the user for OS notification permission (no-op when unsupported). */
export async function requestPermission(): Promise<BrowserNotificationPermission> {
  if (!isNotificationSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * Show a native OS notification when permission is granted.
 * No-op when unsupported, denied, or still on the default prompt state.
 */
export function showBrowserNotification(options: BrowserNotificationOptions): void {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  const { title, body, tag, href } = options;
  try {
    const notification = new Notification(title, { body, tag });
    if (href) {
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (href.startsWith("http://") || href.startsWith("https://")) {
          window.open(href, "_blank", "noopener,noreferrer");
        } else {
          window.location.assign(href);
        }
      };
    }
  } catch {
    // Safari / strict contexts may throw even when permission is granted.
  }
}
