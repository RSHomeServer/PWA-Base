import { describe, expect, it, vi } from "vitest";
import { detectBrowserIdentity } from "./detect/browserDetect.js";
import { getWasmInfo, getWebglInfo, isWebgpuAvailable, resetWebglInfoCache } from "./graphics/webgl.js";
import { readConnectionInfo } from "./network/net.js";
import { readSystemInfo } from "./system/useSystemInfo.js";
import { snapshotDisplayInfo } from "./display/useDisplayInfo.js";
import { nearestCommonRefreshRate } from "./display/useRefreshRate.js";
import { readGamepadIds, readTouchSupport } from "./input/inputProbes.js";
import { verdictFromThresholds } from "./verdict.js";
import { formatBytes, formatMs, percent } from "./format.js";

describe("detectBrowserIdentity", () => {
  it("reads Chromium userAgentData brands when present", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0",
      userAgentData: {
        brands: [
          { brand: "Not A Brand", version: "99" },
          { brand: "Google Chrome", version: "120" },
          { brand: "Chromium", version: "120" },
        ],
        platform: "Linux",
      },
    });

    expect(detectBrowserIdentity()).toEqual({
      browser: "Google Chrome",
      browserVersion: "120",
      engine: "Unknown",
      os: "Linux",
    });
  });

  it("falls back to Firefox UA sniffing", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
    });

    const identity = detectBrowserIdentity();
    expect(identity.browser).toBe("Firefox");
    expect(identity.browserVersion).toBe("128.0");
    expect(identity.engine).toBe("Gecko");
    expect(identity.os).toBe("Linux");
  });
});

describe("readConnectionInfo", () => {
  it("returns unsupported when Network Information API is absent", () => {
    vi.stubGlobal("navigator", { userAgent: "test" });
    expect(readConnectionInfo()).toEqual({
      supported: false,
      effectiveType: "unknown",
      downlinkMbps: null,
      rttMs: null,
      saveData: false,
    });
  });

  it("reads connection fields when available", () => {
    vi.stubGlobal("navigator", {
      connection: {
        effectiveType: "4g",
        downlink: 12.5,
        rtt: 45,
        saveData: true,
      },
    });

    expect(readConnectionInfo()).toEqual({
      supported: true,
      effectiveType: "4g",
      downlinkMbps: 12.5,
      rttMs: 45,
      saveData: true,
    });
  });
});

describe("readSystemInfo", () => {
  it("maps navigator fields into a system snapshot", () => {
    resetWebglInfoCache();
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/120.0",
      hardwareConcurrency: 8,
      deviceMemory: 16,
      languages: ["en-GB", "en"],
      cookieEnabled: true,
    });

    const info = readSystemInfo();
    expect(info.cores).toBe(8);
    expect(info.deviceMemoryGb).toBe(16);
    expect(info.cookiesEnabled).toBe(true);
    expect(info.languages).toBe("en-GB, en");
    expect(info.webgpu).toBe(false);
    expect(info.wasm.supported).toBe(true);
  });
});

describe("snapshotDisplayInfo", () => {
  it("reads screen and viewport geometry", () => {
    vi.stubGlobal("window", {
      innerWidth: 1280,
      innerHeight: 720,
      devicePixelRatio: 2,
      matchMedia: vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    });
    vi.stubGlobal("screen", {
      width: 2560,
      height: 1440,
      orientation: { type: "landscape-primary", angle: 0, addEventListener: vi.fn(), removeEventListener: vi.fn() },
    });

    const info = snapshotDisplayInfo();
    expect(info.screenWidth).toBe(2560);
    expect(info.innerWidth).toBe(1280);
    expect(info.dpr).toBe(2);
    expect(info.colorScheme).toBe("light");
  });
});

describe("input probes", () => {
  it("reports touch support from maxTouchPoints", () => {
    vi.stubGlobal("navigator", { maxTouchPoints: 5, getGamepads: () => [] });
    expect(readTouchSupport()).toEqual({ supported: true, maxPoints: 5 });
  });

  it("lists connected gamepad ids", () => {
    vi.stubGlobal("navigator", {
      getGamepads: () => [{ id: "Xbox 360 Controller" }, null],
    });
    expect(readGamepadIds()).toEqual(["Xbox 360 Controller"]);
  });
});

describe("graphics probes", () => {
  it("reports WebGPU availability from navigator.gpu", () => {
    vi.stubGlobal("navigator", { gpu: {} });
    expect(isWebgpuAvailable()).toBe(true);
  });

  it("returns wasm capability flags", () => {
    expect(getWasmInfo().supported).toBe(true);
  });

  it("returns unsupported webgl when contexts are unavailable", () => {
    resetWebglInfoCache();
    const canvas = {
      getContext: () => null,
    };
    vi.spyOn(document, "createElement").mockReturnValue(canvas as unknown as HTMLCanvasElement);
    expect(getWebglInfo()).toEqual({
      supported: false,
      version: "none",
      vendor: "—",
      renderer: "—",
    });
  });
});

describe("nearestCommonRefreshRate", () => {
  it("snaps to the nearest common panel rate", () => {
    expect(nearestCommonRefreshRate(58.7)).toBe(60);
    expect(nearestCommonRefreshRate(142)).toBe(144);
  });
});

describe("format helpers", () => {
  it("formats bytes and latency", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatMs(0.4)).toMatch(/µs/);
  });

  it("computes bounded percentages", () => {
    expect(percent(50, 200)).toBe(25);
    expect(percent(999, 100)).toBe(100);
  });
});

describe("verdictFromThresholds", () => {
  it("maps values to pass, warn, and fail", () => {
    expect(verdictFromThresholds(100, 50, 80)).toBe("pass");
    expect(verdictFromThresholds(60, 50, 80)).toBe("warn");
    expect(verdictFromThresholds(10, 50, 80)).toBe("fail");
  });
});
