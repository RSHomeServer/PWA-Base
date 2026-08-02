import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openStore } from "../db/store.js";
import type { WsMessage } from "../types.js";
import { NotificationService } from "./inbox-service.js";

const dirs: string[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function setup() {
  const dir = mkdtempSync(join(tmpdir(), "tel-inbox-"));
  dirs.push(dir);
  const store = openStore(join(dir, "t.sqlite"));
  const broadcasts: WsMessage[] = [];
  const service = new NotificationService(store, (msg) => broadcasts.push(msg));
  return { store, service, broadcasts };
}

describe("NotificationService", () => {
  it("defaults every category to browser-enabled and others disabled", () => {
    const { service } = setup();
    const prefs = service.getPreferences();
    expect(prefs).toHaveLength(11);
    for (const pref of prefs) {
      expect(pref.browserEnabled).toBe(true);
      expect(pref.pwaEnabled).toBe(false);
      expect(pref.mobileEnabled).toBe(false);
      expect(pref.emailEnabled).toBe(false);
      expect(pref.webhookEnabled).toBe(false);
      expect(pref.slackEnabled).toBe(false);
    }
  });

  it("creates a notification, persists it, and broadcasts notification.created", () => {
    const { service, broadcasts } = setup();
    const notification = service.notify({
      category: "run_completed",
      title: "Run completed",
      body: "It worked",
      runId: "r1",
      href: "/dashboard?run=r1",
      metadata: { foo: "bar" },
    });
    expect(notification).not.toBeNull();
    expect(notification!.readAt).toBeNull();
    expect(notification!.category).toBe("run_completed");

    expect(broadcasts).toHaveLength(1);
    expect(broadcasts[0]).toEqual({ kind: "notification.created", notification });

    const fetched = service.get(notification!.id);
    expect(fetched).toEqual(notification);
  });

  it("returns null and skips broadcast when a category's browser channel is disabled", () => {
    const { service, broadcasts } = setup();
    service.updatePreferences({ category: "system_health", browserEnabled: false });

    const result = service.notify({
      category: "system_health",
      title: "Health check",
      body: "Something happened",
    });

    expect(result).toBeNull();
    expect(broadcasts).toHaveLength(0);
    expect(service.list()).toHaveLength(0);
  });

  it("lists with category, unread, and query filters", () => {
    const { service } = setup();
    service.notify({ category: "run_completed", title: "Run A", body: "done" });
    service.notify({ category: "run_failed", title: "Run B", body: "broke" });
    const third = service.notify({
      category: "run_completed",
      title: "Run C",
      body: "also done",
    })!;
    service.markRead(third.id);

    expect(service.list({ category: "run_completed" })).toHaveLength(2);
    expect(service.list({ unreadOnly: true })).toHaveLength(2);
    expect(service.list({ q: "broke" })).toHaveLength(1);
    expect(service.unreadCount()).toBe(2);
  });

  it("marks a single notification read/unread and all as read", () => {
    const { service } = setup();
    const a = service.notify({ category: "run_completed", title: "A", body: "a" })!;
    service.notify({ category: "run_failed", title: "B", body: "b" })!;

    const read = service.markRead(a.id, true);
    expect(read?.readAt).not.toBeNull();
    expect(service.unreadCount()).toBe(1);

    const unread = service.markRead(a.id, false);
    expect(unread?.readAt).toBeNull();
    expect(service.unreadCount()).toBe(2);

    const count = service.markAllRead();
    expect(count).toBe(2);
    expect(service.unreadCount()).toBe(0);
  });

  it("deletes and clears notifications", () => {
    const { service } = setup();
    const a = service.notify({ category: "run_completed", title: "A", body: "a" })!;
    service.notify({ category: "run_failed", title: "B", body: "b" })!;

    expect(service.delete(a.id)).toBe(true);
    expect(service.delete("missing")).toBe(false);
    expect(service.list()).toHaveLength(1);

    service.clear();
    expect(service.list()).toHaveLength(0);
  });

  it("merges preference patches per category without clobbering others", () => {
    const { service } = setup();
    service.updatePreferences({ category: "run_failed", webhookEnabled: true });
    const prefs = service.getPreferences();
    const runFailed = prefs.find((p) => p.category === "run_failed");
    const runCompleted = prefs.find((p) => p.category === "run_completed");
    expect(runFailed?.webhookEnabled).toBe(true);
    expect(runFailed?.browserEnabled).toBe(true);
    expect(runCompleted?.webhookEnabled).toBe(false);
  });
});
