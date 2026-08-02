/** Domain types for the in-app Notification Centre (inbox), distinct from the
 * outbound ntfy delivery log (`NotificationRecord` in ../types.ts). */

export type NotificationCategory =
  | "run_completed"
  | "run_failed"
  | "build_failed"
  | "tests_failed"
  | "deployment_completed"
  | "deployment_failed"
  | "telemetry_warning"
  | "system_health"
  | "screenshot_capture"
  | "artifacts_generated"
  | "validation_failed";

export const NOTIFICATION_CATEGORIES: readonly NotificationCategory[] = [
  "run_completed",
  "run_failed",
  "build_failed",
  "tests_failed",
  "deployment_completed",
  "deployment_failed",
  "telemetry_warning",
  "system_health",
  "screenshot_capture",
  "artifacts_generated",
  "validation_failed",
];

export function isNotificationCategory(value: unknown): value is NotificationCategory {
  return typeof value === "string" && (NOTIFICATION_CATEGORIES as string[]).includes(value);
}

export interface InboxNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  href: string | null;
  runId: string | null;
  readAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

/**
 * Per-category delivery-channel preferences. Only `browserEnabled` is active
 * today — the rest are stubs for future channels (PWA push, mobile, email,
 * webhook, Slack) and default to disabled.
 */
export interface NotificationChannelPreference {
  category: NotificationCategory;
  browserEnabled: boolean;
  pwaEnabled: boolean;
  mobileEnabled: boolean;
  emailEnabled: boolean;
  webhookEnabled: boolean;
  slackEnabled: boolean;
}

export function defaultPreference(category: NotificationCategory): NotificationChannelPreference {
  return {
    category,
    browserEnabled: true,
    pwaEnabled: false,
    mobileEnabled: false,
    emailEnabled: false,
    webhookEnabled: false,
    slackEnabled: false,
  };
}

export interface NotifyInput {
  category: NotificationCategory;
  title: string;
  body: string;
  href?: string | null;
  runId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ListInboxOptions {
  category?: NotificationCategory;
  unreadOnly?: boolean;
  q?: string;
  limit?: number;
}

export type NotificationPreferencePatch = Partial<
  Omit<NotificationChannelPreference, "category">
> & { category: NotificationCategory };
