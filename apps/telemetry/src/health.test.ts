import { describe, expect, it } from "vitest";
import { buildHealthReport, clientIpFromRequest, formatUptime } from "./health.js";
import { DiagnosticsTracker } from "./diagnostics.js";
import type { TelemetryRuntimeConfig } from "./config.js";
import type { SettingsRecord } from "./types.js";

describe("health helpers", () => {
  it("formats uptime", () => {
    expect(formatUptime(5_000)).toBe("5s");
    expect(formatUptime(65_000)).toBe("1m 5s");
  });

  it("extracts client IP from X-Forwarded-For", () => {
    expect(
      clientIpFromRequest({
        headers: { "x-forwarded-for": "10.0.0.5, 10.0.0.1" },
        socket: { remoteAddress: "127.0.0.1" },
      }),
    ).toBe("10.0.0.5");
  });

  it("builds a health report with last hook", () => {
    const diagnostics = new DiagnosticsTracker();
    diagnostics.recordHook({
      receivedAt: "2026-01-01T00:00:00.000Z",
      sourceIp: "192.168.1.20",
      userAgent: "curl/8",
      hookType: "beforeSubmitPrompt",
    });
    const config: TelemetryRuntimeConfig = {
      host: "0.0.0.0",
      port: 4310,
      dbPath: "/tmp/t.sqlite",
      artifactsDir: "/tmp/t-artifacts",
      version: "0.1.6",
      idleTimeoutMs: 1_800_000,
      idleSoftMs: 900_000,
      supervisorIntervalMs: 30_000,
      taskCompletionGraceMs: 60_000,
    };
    const settings: SettingsRecord = {
      sqlitePath: "/tmp/t.sqlite",
      notificationProvider: "ntfy",
      ntfyServer: "https://ntfy.sh",
      ntfyTopic: "dev",
    };
    const report = buildHealthReport({
      config,
      diagnostics,
      settings,
      wsClients: 2,
      now: Date.parse(diagnostics.snapshot().startedAt) + 12_000,
    });
    expect(report.ok).toBe(true);
    expect(report.listener).toBe("0.0.0.0:4310");
    expect(report.websocket.clients).toBe(2);
    expect(report.lastHook?.sourceIp).toBe("192.168.1.20");
    expect(report.uptimeMs).toBe(12_000);
  });
});
