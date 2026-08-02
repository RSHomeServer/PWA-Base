import { describe, expect, it } from "vitest";
import { loadRuntimeConfig } from "./config.js";

describe("loadRuntimeConfig", () => {
  it("defaults to 0.0.0.0:4310", () => {
    const cfg = loadRuntimeConfig({});
    expect(cfg.host).toBe("0.0.0.0");
    expect(cfg.port).toBe(4310);
  });

  it("honours TELEMETRY_HOST and TELEMETRY_PORT", () => {
    const cfg = loadRuntimeConfig({
      TELEMETRY_HOST: "192.168.1.150",
      TELEMETRY_PORT: "4400",
    });
    expect(cfg.host).toBe("192.168.1.150");
    expect(cfg.port).toBe(4400);
  });

  it("defaults artifacts dir beside the database", () => {
    const cfg = loadRuntimeConfig({
      TELEMETRY_DB: "/tmp/tel/telemetry.sqlite",
    });
    expect(cfg.artifactsDir).toBe("/tmp/tel/run-artifacts");
  });

  it("honours idle and supervisor interval env", () => {
    const cfg = loadRuntimeConfig({
      TELEMETRY_IDLE_TIMEOUT_MS: "600000",
      TELEMETRY_IDLE_SOFT_MS: "300000",
      TELEMETRY_SUPERVISOR_INTERVAL_MS: "15000",
    });
    expect(cfg.idleTimeoutMs).toBe(600_000);
    expect(cfg.idleSoftMs).toBe(300_000);
    expect(cfg.supervisorIntervalMs).toBe(15_000);
  });
});
