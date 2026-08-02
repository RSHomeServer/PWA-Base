import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, EmptyState, Select, Spinner, TextField } from "@platform/ui";
import {
  clearInbox,
  deleteInboxItem,
  fetchInbox,
  markAllInboxRead,
  markInboxRead,
} from "../api/client.js";
import type { InboxNotification, NotificationCategory, WsMessage } from "../api/types.js";
import { DashboardLayout } from "../components/DashboardLayout.js";
import { useTelemetrySocket } from "../hooks/useTelemetrySocket.js";
import {
  NOTIFICATION_CATEGORIES,
  formatTimestamp,
  humanizeNotificationCategory,
  notificationCategoryTone,
} from "../lib/format.js";
import styles from "./pages.module.css";

export function NotificationsPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState<NotificationCategory | "">("");
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchInbox({
        category: category || undefined,
        unread: unreadOnly || undefined,
        q: debouncedQ || undefined,
        limit: 200,
      });
      setItems(res.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [category, unreadOnly, debouncedQ]);

  useEffect(() => {
    void load();
  }, [load]);

  const onMessage = useCallback(
    (msg: WsMessage) => {
      if (msg.kind === "notification.created") void load();
    },
    [load],
  );
  useTelemetrySocket(onMessage);

  const toggleRead = useCallback(
    async (n: InboxNotification) => {
      const read = !n.readAt;
      setItems((prev) =>
        prev.map((it) => (it.id === n.id ? { ...it, readAt: read ? new Date().toISOString() : null } : it)),
      );
      try {
        await markInboxRead(n.id, read);
      } catch {
        void load();
      }
    },
    [load],
  );

  const handleDelete = useCallback(
    async (n: InboxNotification) => {
      setItems((prev) => prev.filter((it) => it.id !== n.id));
      try {
        await deleteInboxItem(n.id);
      } catch {
        void load();
      }
    },
    [load],
  );

  const handleMarkAllRead = useCallback(async () => {
    setItems((prev) => prev.map((it) => ({ ...it, readAt: it.readAt ?? new Date().toISOString() })));
    try {
      await markAllInboxRead();
    } catch {
      void load();
    }
  }, [load]);

  const handleClearAll = useCallback(async () => {
    if (!window.confirm("Clear all notifications? This cannot be undone.")) return;
    setItems([]);
    try {
      await clearInbox();
    } catch {
      void load();
    }
  }, [load]);

  const hasUnread = items.some((n) => !n.readAt);
  const hasAnyFilters = Boolean(category || unreadOnly || debouncedQ);

  return (
    <DashboardLayout
      title="Notifications"
      subtitle="Every run, deployment, and health alert delivered to your inbox."
      actions={
        <div className={styles.notificationHeaderActions}>
          <Button type="button" variant="secondary" size="sm" onClick={() => void handleMarkAllRead()} disabled={!hasUnread}>
            Mark all read
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => void handleClearAll()} disabled={items.length === 0}>
            Clear all
          </Button>
        </div>
      }
    >
      <div className={styles.notificationToolbar}>
        <TextField
          type="search"
          placeholder="Search notifications…"
          value={q}
          onChange={(ev) => setQ(ev.target.value)}
          aria-label="Search notifications"
          className={styles.notificationSearch}
        />
        <Select
          value={category}
          onChange={(ev) => setCategory(ev.target.value as NotificationCategory | "")}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {NOTIFICATION_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {humanizeNotificationCategory(c)}
            </option>
          ))}
        </Select>
        <label className={styles.notificationUnreadToggle}>
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(ev) => setUnreadOnly(ev.target.checked)}
          />
          Unread only
        </label>
      </div>

      {error ? <p className={styles.errorTitle}>{error}</p> : null}

      {loading && items.length === 0 ? (
        <div className={styles.notificationLoading}>
          <Spinner size="md" />
        </div>
      ) : items.length === 0 && !error ? (
        <EmptyState
          title={hasAnyFilters ? "No matching notifications" : "No notifications yet"}
          description={
            hasAnyFilters
              ? "Try clearing filters or search terms."
              : "Run, deployment, and health alerts will appear here as they happen."
          }
        />
      ) : (
        <ul className={styles.notificationList}>
          {items.map((n) => (
            <li
              key={n.id}
              className={[styles.notificationRow, !n.readAt ? styles.notificationRowUnread : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <span
                className={[styles.notificationDot, n.readAt ? styles.notificationDotRead : ""]
                  .filter(Boolean)
                  .join(" ")}
                aria-hidden="true"
              />
              <div className={styles.notificationContent}>
                <div className={styles.notificationTop}>
                  <Badge variant={notificationCategoryTone(n.category)}>
                    {humanizeNotificationCategory(n.category)}
                  </Badge>
                  <span className={styles.notificationTime}>{formatTimestamp(n.createdAt)}</span>
                </div>
                <p className={styles.notificationTitle}>{n.title}</p>
                <p className={styles.notificationBody}>{n.body}</p>
                {n.href ? (
                  <button
                    type="button"
                    className={styles.notificationLinkBtn}
                    onClick={() => {
                      if (!n.readAt) void toggleRead(n);
                      if (n.href!.startsWith("http")) {
                        window.open(n.href!, "_blank", "noopener,noreferrer");
                      } else {
                        navigate(n.href!);
                      }
                    }}
                  >
                    Open →
                  </button>
                ) : null}
              </div>
              <div className={styles.notificationActions}>
                <Button type="button" variant="secondary" size="sm" onClick={() => void toggleRead(n)}>
                  {n.readAt ? "Mark unread" : "Mark read"}
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => void handleDelete(n)}>
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardLayout>
  );
}
