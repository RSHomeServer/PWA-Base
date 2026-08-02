import {
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type MouseEvent,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";
import { Button, IconButton, Spinner } from "@platform/ui";
import { deleteInboxItem, fetchInbox, markAllInboxRead, markInboxRead } from "../api/client.js";
import type { InboxNotification } from "../api/types.js";
import { formatRelativeTime, humanizeNotificationCategory } from "../lib/format.js";
import styles from "./NotificationPanel.module.css";

export interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  /** Lets the panel keep the bell badge in sync as items are read/deleted. */
  onUnreadCountChange?: Dispatch<SetStateAction<number>>;
  /** Bump this to force a refetch while the panel is open (e.g. on a WS event). */
  refreshSignal?: number;
}

const PANEL_LIMIT = 30;

export function NotificationPanel({
  open,
  onClose,
  onUnreadCountChange,
  refreshSignal,
}: NotificationPanelProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchInbox({ limit: PANEL_LIMIT });
      setItems(res.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refreshSignal, load]);

  const toggleRead = useCallback(
    async (n: InboxNotification, read: boolean) => {
      const prevReadAt = n.readAt;
      setItems((prev) =>
        prev.map((it) => (it.id === n.id ? { ...it, readAt: read ? new Date().toISOString() : null } : it)),
      );
      onUnreadCountChange?.((c) => Math.max(0, read ? c - 1 : c + 1));
      try {
        await markInboxRead(n.id, read);
      } catch {
        setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, readAt: prevReadAt } : it)));
        onUnreadCountChange?.((c) => Math.max(0, read ? c + 1 : c - 1));
      }
    },
    [onUnreadCountChange],
  );

  const handleDelete = useCallback(
    (n: InboxNotification, ev: MouseEvent<HTMLButtonElement>) => {
      ev.stopPropagation();
      setItems((prev) => prev.filter((it) => it.id !== n.id));
      if (!n.readAt) onUnreadCountChange?.((c) => Math.max(0, c - 1));
      void deleteInboxItem(n.id).catch(() => void load());
    },
    [load, onUnreadCountChange],
  );

  const handleMarkAllRead = useCallback(() => {
    setItems((prev) => prev.map((it) => ({ ...it, readAt: it.readAt ?? new Date().toISOString() })));
    onUnreadCountChange?.(0);
    void markAllInboxRead().catch(() => void load());
  }, [load, onUnreadCountChange]);

  const handleItemClick = useCallback(
    (n: InboxNotification) => {
      if (!n.readAt) void toggleRead(n, true);
      if (n.href) {
        onClose();
        if (n.href.startsWith("http://") || n.href.startsWith("https://")) {
          window.open(n.href, "_blank", "noopener,noreferrer");
        } else {
          navigate(n.href);
        }
      }
    },
    [navigate, onClose, toggleRead],
  );

  const unreadInList = items.some((n) => !n.readAt);

  return (
    <>
      <div
        className={[styles.overlay, open ? styles.overlayOpen : ""].join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={[styles.panel, open ? styles.panelOpen : ""].join(" ")}
        aria-label="Notifications"
        aria-hidden={!open}
      >
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>Notifications</h2>
          <div className={styles.panelHeaderActions}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={!unreadInList}
            >
              Mark all read
            </Button>
            <IconButton label="Close notifications" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </div>
        </div>

        <div className={styles.panelBody}>
          {loading && items.length === 0 ? (
            <div className={styles.panelLoading}>
              <Spinner size="md" />
            </div>
          ) : error ? (
            <p className={styles.panelError}>{error}</p>
          ) : items.length === 0 ? (
            <div className={styles.panelEmpty}>
              <p>You&apos;re all caught up.</p>
              <p className={styles.panelEmptyHint}>New run and deployment alerts show up here.</p>
            </div>
          ) : (
            <ul className={styles.panelList}>
              {items.map((n) => (
                <li key={n.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    className={[styles.panelItem, !n.readAt ? styles.panelItemUnread : ""].join(" ")}
                    onClick={() => handleItemClick(n)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        handleItemClick(n);
                      }
                    }}
                  >
                    <span
                      className={[styles.panelItemDot, n.readAt ? styles.panelItemDotRead : ""].join(" ")}
                      aria-hidden="true"
                    />
                    <span className={styles.panelItemBody}>
                      <span className={styles.panelItemTop}>
                        <span className={styles.panelItemTitle}>{n.title}</span>
                      </span>
                      <span className={styles.panelItemText}>{n.body}</span>
                      <span className={styles.panelItemMeta}>
                        {humanizeNotificationCategory(n.category)} · {formatRelativeTime(n.createdAt)}
                      </span>
                    </span>
                    <IconButton
                      label="Delete notification"
                      size="sm"
                      className={styles.panelItemDelete}
                      onClick={(ev) => handleDelete(n, ev)}
                    >
                      <TrashIcon />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.panelFooter}>
          <Button type="button" variant="secondary" size="sm" onClick={() => { onClose(); navigate("/notifications"); }}>
            View all
          </Button>
        </div>
      </aside>
    </>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 12a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-12" />
    </svg>
  );
}
