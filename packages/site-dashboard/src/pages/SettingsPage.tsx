import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Badge, Button, Label, Panel, Select, Stack, TextField } from "@platform/ui";
import {
  fetchDiagnostics,
  fetchNotificationPreferences,
  fetchSettings,
  saveNotificationPreferences,
  saveSettings,
} from "../api/client.js";
import type {
  HealthReport,
  NotificationCategory,
  NotificationPreference,
  SettingsRecord,
} from "../api/types.js";
import { DashboardLayout } from "../components/DashboardLayout.js";
import {
  getPermission,
  isNotificationSupported,
  requestPermission,
  type BrowserNotificationPermission,
} from "../lib/browser-notifications.js";
import {
  formatTimestamp,
  humanizeNotificationCategory,
  NOTIFICATION_CATEGORIES,
} from "../lib/format.js";
import {
  defaultOsNotifyPrefs,
  humanizeOsNotifyCategory,
  loadOsNotifyPrefs,
  OS_NOTIFY_CATEGORIES,
  saveOsNotifyPrefs,
  type OsNotifyCategory,
  type OsNotifyPrefs,
} from "../lib/os-notify-prefs.js";
import styles from "./pages.module.css";

const DEFAULTS: SettingsRecord = {
  sqlitePath: "./data/telemetry.sqlite",
  notificationProvider: "ntfy",
  ntfyServer: "https://ntfy.sh",
  ntfyTopic: "",
};

function defaultPreferences(): NotificationPreference[] {
  return NOTIFICATION_CATEGORIES.map((category) => ({
    category,
    browserEnabled: true,
    pwaEnabled: false,
    mobileEnabled: false,
    emailEnabled: false,
    webhookEnabled: false,
    slackEnabled: false,
  }));
}

export function SettingsPage() {
  const [form, setForm] = useState<SettingsRecord>(DEFAULTS);
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreference[]>(defaultPreferences);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  const [prefsStatus, setPrefsStatus] = useState<string | null>(null);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [osPermission, setOsPermission] = useState<BrowserNotificationPermission>(() =>
    getPermission(),
  );
  const [osPrefs, setOsPrefs] = useState<OsNotifyPrefs>(() => loadOsNotifyPrefs());
  const [osPrefsStatus, setOsPrefsStatus] = useState<string | null>(null);

  const refreshDiagnostics = useCallback(async () => {
    try {
      const [settings, diag] = await Promise.all([fetchSettings(), fetchDiagnostics()]);
      setForm(settings);
      setHealth(diag);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const refreshPreferences = useCallback(async () => {
    try {
      const res = await fetchNotificationPreferences();
      if (res.items?.length) setPreferences(res.items);
      setPrefsError(null);
    } catch (err) {
      setPrefsError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void refreshDiagnostics();
    void refreshPreferences();
    const id = window.setInterval(() => void refreshDiagnostics(), 5000);
    return () => window.clearInterval(id);
  }, [refreshDiagnostics, refreshPreferences]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const saved = await saveSettings(form);
      setForm(saved);
      setStatus("Settings saved.");
      setError(null);
      await refreshDiagnostics();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const refreshOsPermission = useCallback(() => {
    setOsPermission(getPermission());
  }, []);

  const onRequestOsPermission = async () => {
    const next = await requestPermission();
    setOsPermission(next);
  };

  const setOsNotifyEnabled = (category: OsNotifyCategory, enabled: boolean) => {
    setOsPrefs((prev) => {
      const next = { ...prev, [category]: enabled };
      saveOsNotifyPrefs(next);
      return next;
    });
    setOsPrefsStatus("OS preferences saved.");
  };

  const onResetOsPrefs = () => {
    const next = defaultOsNotifyPrefs();
    saveOsNotifyPrefs(next);
    setOsPrefs(next);
    setOsPrefsStatus("OS preferences reset.");
  };

  const setBrowserEnabled = (category: NotificationCategory, browserEnabled: boolean) => {
    setPreferences((prev) =>
      prev.map((p) => (p.category === category ? { ...p, browserEnabled } : p)),
    );
  };

  const onSavePreferences = async () => {
    setPrefsSaving(true);
    setPrefsStatus(null);
    try {
      const res = await saveNotificationPreferences(preferences);
      setPreferences(res.items);
      setPrefsStatus("Preferences saved.");
      setPrefsError(null);
    } catch (err) {
      setPrefsError(err instanceof Error ? err.message : String(err));
    } finally {
      setPrefsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Settings"
      subtitle="Notification providers and inbox preferences. Backend health lives under Operations."
    >
      <div className={styles.promptDetail}>
        <Panel title="Service diagnostics">
          {health ? (
            <dl className={styles.diagGrid}>
              <div>
                <dt>Health</dt>
                <dd>
                  <Badge variant={health.ok ? "success" : "error"}>
                    {health.ok ? "healthy" : "degraded"}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>{health.version}</dd>
              </div>
              <div>
                <dt>Telemetry host</dt>
                <dd>
                  <code>{health.configuredHost}</code>
                </dd>
              </div>
              <div>
                <dt>Telemetry port</dt>
                <dd>
                  <code>{health.configuredPort}</code>
                </dd>
              </div>
              <div>
                <dt>Current listener</dt>
                <dd>
                  <code>{health.listener}</code>
                </dd>
              </div>
              <div>
                <dt>Uptime</dt>
                <dd>{health.uptimeHuman}</dd>
              </div>
              <div>
                <dt>SQLite path</dt>
                <dd>
                  <code>{health.sqlite.path}</code>
                </dd>
              </div>
              <div>
                <dt>SQLite status</dt>
                <dd>
                  <Badge variant={health.sqlite.ok ? "success" : "error"}>
                    {health.sqlite.ok ? "ok" : "error"}
                  </Badge>
                  {health.sqlite.error ? (
                    <span className={styles.muted}> — {health.sqlite.error}</span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt>WebSocket clients</dt>
                <dd>{health.websocket.clients}</dd>
              </div>
              <div>
                <dt>Notification provider</dt>
                <dd>
                  {health.notifications.provider}
                  {health.notifications.provider === "ntfy"
                    ? health.notifications.ntfyTopicConfigured
                      ? " (topic set)"
                      : " (topic missing)"
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Last client IP</dt>
                <dd>
                  <code>{health.lastHook?.sourceIp ?? "—"}</code>
                </dd>
              </div>
              <div>
                <dt>Last hook time</dt>
                <dd>{health.lastHook ? formatTimestamp(health.lastHook.receivedAt) : "—"}</dd>
              </div>
              <div>
                <dt>Last hook type</dt>
                <dd>
                  <code>{health.lastHook?.hookType ?? "—"}</code>
                </dd>
              </div>
            </dl>
          ) : (
            <p className={styles.muted}>
              Waiting for telemetry health… Ensure the service is running and reachable via{" "}
              <code>/telemetry</code>.
            </p>
          )}
          <div className={styles.settingsActions}>
            <Button type="button" variant="secondary" onClick={() => void refreshDiagnostics()}>
              Refresh diagnostics
            </Button>
          </div>
        </Panel>

        <Panel title="Outbound notification settings">
          <form className={styles.settingsForm} onSubmit={(e) => void onSubmit(e)}>
            <Stack gap="md">
              <div>
                <Label htmlFor="sqlitePath">SQLite location</Label>
                <TextField
                  id="sqlitePath"
                  value={form.sqlitePath}
                  onChange={(ev) => setForm((f) => ({ ...f, sqlitePath: ev.target.value }))}
                  placeholder="./data/telemetry.sqlite"
                />
                <p className={styles.hint}>
                  Stored for reference. Restart the telemetry process with <code>TELEMETRY_DB</code>{" "}
                  to open a different file.
                </p>
              </div>

              <div>
                <Label htmlFor="provider">Notification provider</Label>
                <Select
                  id="provider"
                  value={form.notificationProvider}
                  onChange={(ev) =>
                    setForm((f) => ({
                      ...f,
                      notificationProvider: ev.target
                        .value as SettingsRecord["notificationProvider"],
                    }))
                  }
                >
                  <option value="ntfy">ntfy</option>
                  <option value="none">None (disabled)</option>
                </Select>
                <p className={styles.hint}>
                  Outbound push (ntfy). The in-app Notification Centre is separate.
                </p>
              </div>

              <div>
                <Label htmlFor="ntfyServer">ntfy server</Label>
                <TextField
                  id="ntfyServer"
                  value={form.ntfyServer}
                  onChange={(ev) => setForm((f) => ({ ...f, ntfyServer: ev.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="ntfyTopic">Topic name</Label>
                <TextField
                  id="ntfyTopic"
                  value={form.ntfyTopic}
                  onChange={(ev) => setForm((f) => ({ ...f, ntfyTopic: ev.target.value }))}
                  placeholder="songara-dev"
                />
              </div>

              <div className={styles.settingsActions}>
                <Button type="submit">Save settings</Button>
                {status ? <span className={styles.success}>{status}</span> : null}
                {error ? <span className={styles.errorTitle}>{error}</span> : null}
              </div>
            </Stack>
          </form>
        </Panel>

        <Panel title="OS notifications (browser)">
          <p className={styles.hint}>
            Native desktop alerts via the browser Notification API. Separate from the in-app
            Notification Centre — toggles here are stored locally and default off. Web Push
            (background delivery) is not enabled yet.
          </p>
          <dl className={styles.diagGrid}>
            <div>
              <dt>API support</dt>
              <dd>
                <Badge variant={isNotificationSupported() ? "success" : "warning"}>
                  {isNotificationSupported() ? "supported" : "unsupported"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt>Permission</dt>
              <dd>
                <Badge
                  variant={
                    osPermission === "granted"
                      ? "success"
                      : osPermission === "denied"
                        ? "error"
                        : "warning"
                  }
                >
                  {osPermission}
                </Badge>
              </dd>
            </div>
          </dl>
          <div className={styles.settingsActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void onRequestOsPermission()}
              disabled={!isNotificationSupported() || osPermission === "granted"}
            >
              Request permission
            </Button>
            <Button type="button" variant="secondary" onClick={refreshOsPermission}>
              Refresh status
            </Button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>OS alert</th>
                </tr>
              </thead>
              <tbody>
                {OS_NOTIFY_CATEGORIES.map((category) => (
                  <tr key={category}>
                    <td>{humanizeOsNotifyCategory(category)}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={osPrefs[category]}
                        onChange={(ev) => setOsNotifyEnabled(category, ev.target.checked)}
                        aria-label={`OS notification for ${humanizeOsNotifyCategory(category)}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.settingsActions}>
            <Button type="button" variant="secondary" onClick={onResetOsPrefs}>
              Reset to defaults
            </Button>
            {osPrefsStatus ? <span className={styles.success}>{osPrefsStatus}</span> : null}
          </div>
        </Panel>

        <Panel title="Notification Centre preferences">
          <p className={styles.hint}>
            Choose which categories reach the in-app inbox and bell. Browser delivery is live;
            other channels are reserved for later transports.
          </p>
          {prefsError ? (
            <p className={styles.muted}>
              Preferences API unavailable — showing defaults. ({prefsError})
            </p>
          ) : null}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Browser</th>
                  <th>PWA</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Webhook</th>
                  <th>Slack</th>
                </tr>
              </thead>
              <tbody>
                {preferences.map((pref) => (
                  <tr key={pref.category}>
                    <td>{humanizeNotificationCategory(pref.category)}</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={pref.browserEnabled}
                        onChange={(ev) => setBrowserEnabled(pref.category, ev.target.checked)}
                        aria-label={`Browser notifications for ${humanizeNotificationCategory(pref.category)}`}
                      />
                    </td>
                    <td>
                      <input type="checkbox" checked={false} disabled title="Coming soon" />
                      <span className={styles.comingSoon}>Soon</span>
                    </td>
                    <td>
                      <input type="checkbox" checked={false} disabled title="Coming soon" />
                      <span className={styles.comingSoon}>Soon</span>
                    </td>
                    <td>
                      <input type="checkbox" checked={false} disabled title="Coming soon" />
                      <span className={styles.comingSoon}>Soon</span>
                    </td>
                    <td>
                      <input type="checkbox" checked={false} disabled title="Coming soon" />
                      <span className={styles.comingSoon}>Soon</span>
                    </td>
                    <td>
                      <input type="checkbox" checked={false} disabled title="Coming soon" />
                      <span className={styles.comingSoon}>Soon</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={styles.settingsActions}>
            <Button type="button" onClick={() => void onSavePreferences()} disabled={prefsSaving}>
              {prefsSaving ? "Saving…" : "Save preferences"}
            </Button>
            {prefsStatus ? <span className={styles.success}>{prefsStatus}</span> : null}
          </div>
        </Panel>
      </div>
    </DashboardLayout>
  );
}
