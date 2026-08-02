import { useCallback, useEffect, useRef } from "react";
import type { WsMessage } from "../api/types.js";
import { showBrowserNotification } from "../lib/browser-notifications.js";
import {
  isOsNotifyEnabled,
  type OsNotifyCategory,
} from "../lib/os-notify-prefs.js";
import { firstLine } from "../lib/format.js";
import { useTelemetrySocket } from "./useTelemetrySocket.js";

const INBOX_OS_CATEGORIES = new Set<OsNotifyCategory>([
  "validation_failed",
  "deployment_completed",
]);

function maybeShow(category: OsNotifyCategory, options: Parameters<typeof showBrowserNotification>[0]): void {
  if (!isOsNotifyEnabled(category)) return;
  showBrowserNotification(options);
}

/**
 * Listens to telemetry WS events and fires native OS notifications when the
 * matching Settings toggle is on and browser permission is granted.
 * Does not touch inbox NotificationService — inbox items remain server-owned.
 */
export function useOsNotificationStubs(): void {
  const prevConnected = useRef<boolean | null>(null);

  const onMessage = useCallback((msg: WsMessage) => {
    if (msg.kind === "run.finished") {
      const { run, prompt } = msg;
      const title = prompt?.title ?? "Untitled prompt";
      const href = `/?run=${run.id}`;

      if (run.status === "completed") {
        maybeShow("run_completed", {
          title: "Run completed",
          body: `${title} finished successfully`,
          tag: `run-${run.id}`,
          href,
        });
      } else if (run.status === "failed") {
        const detail =
          firstLine(run.completionSummary?.executiveSummary) ??
          firstLine(run.summary) ??
          "See dashboard for details";
        maybeShow("run_failed", {
          title: "Run failed",
          body: `${title}: ${detail}`,
          tag: `run-${run.id}`,
          href,
        });
      }
      return;
    }

    if (msg.kind === "notification.created") {
      const { notification: n } = msg;
      if (!INBOX_OS_CATEGORIES.has(n.category as OsNotifyCategory)) return;
      maybeShow(n.category as OsNotifyCategory, {
        title: n.title,
        body: n.body,
        tag: `inbox-${n.id}`,
        href: n.href ?? undefined,
      });
    }
  }, []);

  const { connected } = useTelemetrySocket(onMessage);

  useEffect(() => {
    if (prevConnected.current === true && !connected) {
      maybeShow("telemetry_unavailable", {
        title: "Telemetry offline",
        body: "Live updates paused — check Operations or restart telemetry.",
        tag: "telemetry-offline",
        href: "/ops",
      });
    }
    prevConnected.current = connected;
  }, [connected]);
}
