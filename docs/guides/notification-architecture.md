# Notification architecture

The dashboard has three distinct notification layers. They share category names where it helps UX, but each layer has its own storage, permission model, and delivery path.

## 1. In-app inbox (Notification Centre)

**Owner:** telemetry `NotificationService` (`apps/telemetry/src/notify/inbox-service.ts`)

**Storage:** SQLite via telemetry API

**UI:** bell icon, slide-over panel, `/dashboard/notifications` page

**Realtime:** WebSocket `notification.created` events

**Preferences:** Settings → *Notification Centre preferences* — persisted server-side (`/api/notifications/preferences`). The `browserEnabled` flag controls whether the server creates an inbox item for a category (not whether a native OS alert fires).

Inbox notifications are the source of truth for history, read/unread state, and deep links (`href`). Always create inbox items on the server when a category should appear in the bell.

## 2. OS notification stubs (Workstream E)

**Owner:** dashboard client only

**Storage:** `localStorage` key `dashboard:osNotifyPrefs:v1` — all categories default **off**

**API:** `packages/site-dashboard/src/lib/browser-notifications.ts`

**Wiring:** `useOsNotificationStubs` in `DashboardLayout` listens to telemetry WebSocket events:

| Trigger | OS category toggle |
|---------|-------------------|
| `run.finished` with `status: completed` | Run completed |
| `run.finished` with `status: failed` | Run failed |
| `notification.created` with `validation_failed` | Validation failed |
| `notification.created` with `deployment_completed` | Deployment complete |
| WebSocket disconnect after prior connection | Telemetry unavailable |

**Permission:** browser `Notification.requestPermission()` — configured on Settings → *OS notifications (browser)*.

**Behaviour:** `showBrowserNotification()` is a no-op when the API is unsupported, permission is not `granted`, or the category toggle is off. This stub does **not** call inbox APIs and does **not** duplicate `NotificationService`.

### Stub categories (local toggles)

- Run completed
- Run failed
- Validation failed
- Deployment complete
- Telemetry unavailable

## 3. Future: Web Push and mobile (not implemented)

Workstream E intentionally stops before PushManager / VAPID. The stub layer is designed so later work can plug in without redesign:

1. **Same entry point** — `showBrowserNotification({ title, body, tag?, href? })` remains the client display function; a service worker can also call `registration.showNotification()` with the same payload shape.
2. **Same category toggles** — extend `dashboard:osNotifyPrefs:v1` or migrate to server prefs; WS handlers in `useOsNotificationStubs` stay the decision point for *when* to notify.
3. **Web Push** — telemetry registers VAPID keys, stores subscriptions, and sends push payloads that mirror inbox `title` / `body` / `href`. The service worker shows the OS notification when the tab is closed.
4. **Android / iOS** — FCM/APNs bridge from telemetry using the same category model; native apps would consume server events rather than the browser Notification API.

Do **not** implement `PushManager`, service worker push handlers, or VAPID in the Workstream E stub.

## Outbound provider (ntfy)

Settings → *Outbound notification settings* configures server-side ntfy delivery. That path is independent of inbox and OS stubs — it pushes to external topics for operators who want phone/desktop alerts outside the dashboard.

## Quick reference

| Layer | Persists | Permission | When to use |
|-------|----------|------------|-------------|
| Inbox | SQLite (server) | none (in-app) | History, bell badge, all categories |
| OS stub | localStorage | Notification API | Optional native alerts while dashboard is open |
| Web Push | subscription (future) | Notification + SW | Background alerts when tab closed |
| ntfy | server config | topic secret | External operator paging |

## Related files

- `packages/site-dashboard/src/lib/browser-notifications.ts` — Notification API wrapper
- `packages/site-dashboard/src/lib/os-notify-prefs.ts` — local category toggles
- `packages/site-dashboard/src/hooks/useOsNotificationStubs.ts` — WS → OS bridge
- `packages/site-dashboard/src/pages/SettingsPage.tsx` — permission + toggles UI
- `apps/telemetry/src/notify/inbox-service.ts` — server inbox (do not duplicate)
