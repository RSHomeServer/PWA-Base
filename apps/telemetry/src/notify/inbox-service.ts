import { randomUUID } from "node:crypto";
import type { TelemetryStore } from "../db/store.js";
import type { WsMessage } from "../types.js";
import {
  NOTIFICATION_CATEGORIES,
  defaultPreference,
  type InboxNotification,
  type ListInboxOptions,
  type NotificationCategory,
  type NotificationChannelPreference,
  type NotificationPreferencePatch,
  type NotifyInput,
} from "./inbox-types.js";

export type BroadcastFn = (message: WsMessage) => void;

/**
 * In-app Notification Centre (inbox) — separate from the outbound ntfy
 * delivery log (`notifications` table / `NotificationRecord`). Gates on
 * per-category browser preference, persists to SQLite, and broadcasts a
 * `notification.created` WS event to connected dashboards.
 */
export class NotificationService {
  constructor(
    private readonly store: TelemetryStore,
    private readonly broadcast: BroadcastFn,
  ) {
    this.store.ensureDefaultPreferences();
  }

  /** Creates an inbox notification unless the category's browser channel is disabled. */
  notify(input: NotifyInput): InboxNotification | null {
    const preferences = this.store.listNotificationPreferences();
    const pref = preferences.find((p) => p.category === input.category);
    if (pref && !pref.browserEnabled) {
      return null;
    }

    const notification: InboxNotification = {
      id: randomUUID(),
      category: input.category,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      runId: input.runId ?? null,
      readAt: null,
      createdAt: new Date().toISOString(),
      metadata: input.metadata ?? null,
    };
    this.store.insertInboxNotification(notification);
    this.broadcast({ kind: "notification.created", notification });
    return notification;
  }

  list(opts?: ListInboxOptions): InboxNotification[] {
    return this.store.listInboxNotifications(opts);
  }

  get(id: string): InboxNotification | null {
    return this.store.getInboxNotification(id);
  }

  unreadCount(): number {
    return this.store.countUnreadInboxNotifications();
  }

  markRead(id: string, read = true): InboxNotification | null {
    return this.store.markInboxRead(id, read);
  }

  markAllRead(): number {
    return this.store.markAllInboxRead();
  }

  delete(id: string): boolean {
    return this.store.deleteInboxNotification(id);
  }

  clear(): void {
    this.store.clearInboxNotifications();
  }

  getPreferences(): NotificationChannelPreference[] {
    const stored = this.store.listNotificationPreferences();
    const byCategory = new Map(stored.map((p) => [p.category, p]));
    return NOTIFICATION_CATEGORIES.map(
      (category) => byCategory.get(category) ?? defaultPreference(category),
    );
  }

  /** Merge one or more per-category patches onto current preferences and persist. */
  updatePreferences(
    patches: NotificationPreferencePatch | NotificationPreferencePatch[],
  ): NotificationChannelPreference[] {
    const list = Array.isArray(patches) ? patches : [patches];
    const current = new Map(this.getPreferences().map((p) => [p.category, p]));
    for (const patch of list) {
      const base = current.get(patch.category) ?? defaultPreference(patch.category);
      const merged: NotificationChannelPreference = { ...base, ...patch, category: patch.category };
      this.store.upsertNotificationPreference(merged);
      current.set(patch.category, merged);
    }
    return this.getPreferences();
  }
}

export type { NotificationCategory };
