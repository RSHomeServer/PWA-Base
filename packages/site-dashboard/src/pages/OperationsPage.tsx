import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, EmptyState, Label, Panel, Select } from "@platform/ui";
import {
  fetchOps,
  fetchOpsEvents,
  generateTestEvent,
  testApi,
  testSqlite,
  testWebsocket,
} from "../api/client.js";
import type {
  ConnectivityTestResult,
  HealthTone,
  OpsEventRow,
  OpsReport,
  WsMessage,
} from "../api/types.js";
import { DashboardLayout } from "../components/DashboardLayout.js";
import { useTelemetrySocket } from "../hooks/useTelemetrySocket.js";
import { formatDuration, formatTimestamp } from "../lib/format.js";
import styles from "./OperationsPage.module.css";

function ToneDot({ tone }: { tone: HealthTone }) {
  return (
    <span
      className={[
        styles.dot,
        tone === "green" ? styles.dotGreen : "",
        tone === "amber" ? styles.dotAmber : "",
        tone === "red" ? styles.dotRed : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={tone}
      title={tone}
    />
  );
}

function formatBytes(bytes: number | null): string {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function pipelineTone(stage: OpsReport["pipeline"][number]): HealthTone {
  if (stage.errors > 0 && stage.lastFailureAt && stage.lastSuccessAt) {
    return Date.parse(stage.lastFailureAt) > Date.parse(stage.lastSuccessAt) ? "red" : "amber";
  }
  if (stage.errors > 0 && !stage.lastSuccessAt) return "red";
  if (stage.totalProcessed === 0) return "amber";
  return "green";
}

export function OperationsPage() {
  const [ops, setOps] = useState<OpsReport | null>(null);
  const [events, setEvents] = useState<OpsEventRow[]>([]);
  const [eventType, setEventType] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [testLog, setTestLog] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const [report, stream] = await Promise.all([fetchOps(), fetchOpsEvents(eventType, 120)]);
      setOps(report);
      setEvents(stream.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [eventType]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 4000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const onMessage = useCallback(
    (msg: WsMessage) => {
      if (msg.kind === "hello" || msg.kind === "settings.updated") return;
      void refresh();
    },
    [refresh],
  );
  const { connected } = useTelemetrySocket(onMessage);

  const runTest = async (
    label: string,
    fn: () => Promise<ConnectivityTestResult>,
  ): Promise<void> => {
    const started = performance.now();
    try {
      const result = await fn();
      const line = `${label}: ${result.ok ? "OK" : "FAIL"} — ${result.message} (${result.elapsedMs}ms)`;
      setTestLog((prev) => [line, ...prev].slice(0, 8));
      await refresh();
    } catch (err) {
      const elapsed = Math.round(performance.now() - started);
      const line = `${label}: FAIL — ${err instanceof Error ? err.message : String(err)} (${elapsed}ms)`;
      setTestLog((prev) => [line, ...prev].slice(0, 8));
    }
  };

  const eventTypes = useMemo(() => {
    const set = new Set(events.map((e) => e.eventType));
    return ["", ...Array.from(set).sort()];
  }, [events]);

  return (
    <DashboardLayout
      title="Operations"
      subtitle="Live health of the telemetry platform — network, pipeline, database, and connectivity."
      actions={
        <Badge variant={connected ? "success" : "warning"}>
          {connected ? "Live" : "Reconnecting"}
        </Badge>
      }
    >
      {error ? (
        <Panel>
          <p className={styles.error}>Telemetry unreachable: {error}</p>
          <Button type="button" onClick={() => void refresh()}>
            Retry
          </Button>
        </Panel>
      ) : null}

      {!ops && !error ? <EmptyState title="Loading diagnostics…" /> : null}

      {ops ? (
        <div className={styles.stack}>
          <Panel title="Diagnostics">
            <dl className={styles.diagGrid}>
              <div>
                <dt>Connected telemetry endpoint</dt>
                <dd>
                  <code>{typeof window !== "undefined" ? `${window.location.origin}/telemetry` : "/telemetry"}</code>
                  {ops.runtime.dockerBackend ? (
                    <span className={styles.muted}> · Docker backend</span>
                  ) : (
                    <span className={styles.muted}> · non-Docker DB path (tests only)</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Database path</dt>
                <dd>
                  <code>{ops.database.path}</code>
                </dd>
              </div>
              <div>
                <dt>Total runs</dt>
                <dd>{ops.database.runCount}</dd>
              </div>
              <div>
                <dt>Total events</dt>
                <dd>{ops.database.eventCount}</dd>
              </div>
              <div>
                <dt>Last hook time</dt>
                <dd>
                  {ops.health.lastHook
                    ? `${formatTimestamp(ops.health.lastHook.receivedAt)} (${ops.health.lastHook.hookType})`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt>WebSocket connected</dt>
                <dd>
                  <ToneDot tone={connected ? "green" : "red"} /> {connected ? "Yes" : "No"}
                </dd>
              </div>
              <div>
                <dt>API reachable</dt>
                <dd>
                  <ToneDot tone={ops.health.ok ? "green" : "red"} /> {ops.health.ok ? "Yes" : "No"}
                </dd>
              </div>
              <div>
                <dt>SQLite writable</dt>
                <dd>
                  <ToneDot tone={ops.database.writable ? "green" : "red"} />{" "}
                  {ops.database.writable ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Overall health">
            <div className={styles.overall}>
              <ToneDot tone={ops.health.ok ? "green" : "red"} />
              <strong>{ops.health.ok ? "Healthy" : "Degraded"}</strong>
              <span className={styles.muted}>
                v{ops.runtime.version} · uptime {ops.runtime.uptimeHuman} · refreshed{" "}
                {formatTimestamp(ops.generatedAt)}
              </span>
            </div>
          </Panel>

          <Panel title="Connectivity tests">
            <div className={styles.testRow}>
              <Button type="button" size="sm" onClick={() => void runTest("API", testApi)}>
                Test API
              </Button>
              <Button type="button" size="sm" onClick={() => void runTest("SQLite", testSqlite)}>
                Test SQLite
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void runTest("WebSocket", testWebsocket)}
              >
                Test WebSocket
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => void runTest("Test event", generateTestEvent)}
              >
                Generate Test Event
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => void refresh()}>
                Refresh Diagnostics
              </Button>
            </div>
            {testLog.length > 0 ? (
              <ul className={styles.testLog}>
                {testLog.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>Run a test to see success/failure and elapsed time.</p>
            )}
          </Panel>

          <Panel title="Network diagnostics">
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th></th>
                    <th>Service</th>
                    <th>Purpose</th>
                    <th>Host</th>
                    <th>Port</th>
                    <th>Listening</th>
                    <th>Reachable</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ops.network.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <ToneDot tone={row.tone} />
                      </td>
                      <td>
                        <strong>{row.service}</strong>
                      </td>
                      <td>{row.purpose}</td>
                      <td>{row.host}</td>
                      <td>{row.port ?? "—"}</td>
                      <td>
                        <code>{row.listeningAddress ?? "—"}</code>
                      </td>
                      <td>{row.reachable ? "Yes" : "No"}</td>
                      <td>
                        {row.status}
                        {row.detail ? <div className={styles.muted}>{row.detail}</div> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="Telemetry pipeline">
            <div className={styles.pipeline}>
              {ops.pipeline.map((stage, index) => (
                <div key={stage.id} className={styles.stage}>
                  {index > 0 ? <div className={styles.arrow} aria-hidden>
                    ↓
                  </div> : null}
                  <div className={styles.stageCard}>
                    <div className={styles.stageHead}>
                      <ToneDot tone={pipelineTone(stage)} />
                      <strong>{stage.label}</strong>
                    </div>
                    <dl className={styles.stageMeta}>
                      <div>
                        <dt>Last activity</dt>
                        <dd>{formatTimestamp(stage.lastActivityAt)}</dd>
                      </div>
                      <div>
                        <dt>Last success</dt>
                        <dd>{formatTimestamp(stage.lastSuccessAt)}</dd>
                      </div>
                      <div>
                        <dt>Last failure</dt>
                        <dd>
                          {formatTimestamp(stage.lastFailureAt)}
                          {stage.lastFailureMessage ? (
                            <span className={styles.muted}> — {stage.lastFailureMessage}</span>
                          ) : null}
                        </dd>
                      </div>
                      <div>
                        <dt>Processed</dt>
                        <dd>{stage.totalProcessed}</dd>
                      </div>
                      <div>
                        <dt>Errors</dt>
                        <dd>{stage.errors}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className={styles.twoCol}>
            <Panel title="Database diagnostics">
              <dl className={styles.diagGrid}>
                <div>
                  <dt>SQLite path</dt>
                  <dd>
                    <code>{ops.database.path}</code>
                  </dd>
                </div>
                <div>
                  <dt>Database size</dt>
                  <dd>{formatBytes(ops.database.sizeBytes)}</dd>
                </div>
                <div>
                  <dt>Runs</dt>
                  <dd>{ops.database.runCount}</dd>
                </div>
                <div>
                  <dt>Events</dt>
                  <dd>{ops.database.eventCount}</dd>
                </div>
                <div>
                  <dt>Oldest event</dt>
                  <dd>{formatTimestamp(ops.database.oldestEventAt)}</dd>
                </div>
                <div>
                  <dt>Newest event</dt>
                  <dd>{formatTimestamp(ops.database.newestEventAt)}</dd>
                </div>
                <div>
                  <dt>Writable</dt>
                  <dd>
                    <ToneDot tone={ops.database.writable ? "green" : "red"} />{" "}
                    {ops.database.writable ? "Yes" : "No"}
                  </dd>
                </div>
                <div>
                  <dt>Last write</dt>
                  <dd>{formatTimestamp(ops.database.lastWriteAt)}</dd>
                </div>
              </dl>
            </Panel>

            <Panel title="Runtime configuration">
              <dl className={styles.diagGrid}>
                <div>
                  <dt>Host</dt>
                  <dd>
                    <code>{ops.runtime.host}</code>
                  </dd>
                </div>
                <div>
                  <dt>Port</dt>
                  <dd>
                    <code>{ops.runtime.port}</code>
                  </dd>
                </div>
                <div>
                  <dt>Database path</dt>
                  <dd>
                    <code>{ops.runtime.databasePath}</code>
                  </dd>
                </div>
                <div>
                  <dt>Notification provider</dt>
                  <dd>{ops.runtime.notificationProvider}</dd>
                </div>
                <div>
                  <dt>WebSocket</dt>
                  <dd>{ops.runtime.websocketEnabled ? "Enabled" : "Disabled"}</dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{ops.runtime.version}</dd>
                </div>
                <div>
                  <dt>Environment</dt>
                  <dd>
                    {ops.runtime.environment}
                    {ops.runtime.dockerBackend ? " (Docker)" : ""}
                  </dd>
                </div>
              </dl>
            </Panel>
          </div>

          <Panel title="Event stream">
            <div className={styles.filterRow}>
              <Label htmlFor="eventType">Filter by event type</Label>
              <Select
                id="eventType"
                value={eventType}
                onChange={(ev) => setEventType(ev.target.value)}
              >
                <option value="">All types</option>
                {eventTypes
                  .filter(Boolean)
                  .map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
              </Select>
            </div>
            {events.length === 0 ? (
              <EmptyState
                title="No events yet"
                description="Generate a test event or submit a Cursor prompt with hooks configured."
              />
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Event Type</th>
                      <th>Run ID</th>
                      <th>Prompt ID</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Source IP</th>
                      <th>User Agent</th>
                      <th>Correlation ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev) => (
                      <tr key={ev.id}>
                        <td>{formatTimestamp(ev.timestamp)}</td>
                        <td>
                          <Badge variant="accent">{ev.eventType}</Badge>
                        </td>
                        <td>
                          <code className={styles.mono}>{ev.runId.slice(0, 8)}…</code>
                        </td>
                        <td>
                          <code className={styles.mono}>
                            {ev.promptId ? `${ev.promptId.slice(0, 8)}…` : "—"}
                          </code>
                        </td>
                        <td>{formatDuration(ev.durationMs)}</td>
                        <td>{ev.status ?? "—"}</td>
                        <td>{ev.sourceIp ?? "—"}</td>
                        <td className={styles.ua}>{ev.userAgent ?? "—"}</td>
                        <td>
                          <code className={styles.mono}>
                            {ev.correlationId ? `${ev.correlationId.slice(0, 10)}…` : "—"}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
