import { useCallback, useEffect, useState } from "react";
import { IconButton } from "@platform/ui";
import { fetchUnreadCount } from "../api/client.js";
import type { WsMessage } from "../api/types.js";
import { useTelemetrySocket } from "../hooks/useTelemetrySocket.js";
import { NotificationPanel } from "./NotificationPanel.js";
import styles from "./NotificationBell.module.css";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationVersion, setNotificationVersion] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const res = await fetchUnreadCount();
      setUnreadCount(res.count);
    } catch {
      // telemetry may be briefly unreachable — keep the last known badge count
    }
  }, []);

  useEffect(() => {
    void refreshUnreadCount();
    const id = window.setInterval(() => void refreshUnreadCount(), 30_000);
    return () => window.clearInterval(id);
  }, [refreshUnreadCount]);

  const onMessage = useCallback(
    (msg: WsMessage) => {
      if (msg.kind === "notification.created") {
        void refreshUnreadCount();
        setNotificationVersion((v) => v + 1);
      }
    },
    [refreshUnreadCount],
  );

  useTelemetrySocket(onMessage);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={styles.wrap}>
      <IconButton
        label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        variant="ghost"
        className={styles.bellButton}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className={styles.badge} aria-hidden="true">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </IconButton>
      <NotificationPanel
        open={open}
        onClose={() => setOpen(false)}
        onUnreadCountChange={setUnreadCount}
        refreshSignal={notificationVersion}
      />
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 3.2 0.9 5.3 2 7H4c1.1-1.7 2-3.8 2-7Z" />
      <path d="M10.3 21a1.7 1.7 0 0 0 3.4 0" />
    </svg>
  );
}
