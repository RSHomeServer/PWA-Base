import { describe, expect, it } from "vitest";
import { normalisePlatformPreferences } from "./store.js";
import {
  defaultPlatformPreferences,
  detectPlatformRuntimeMode,
} from "./types.js";

describe("platform preferences defaults", () => {
  it("detects development vs production", () => {
    expect(detectPlatformRuntimeMode({ DEV: true })).toBe("development");
    expect(detectPlatformRuntimeMode({ DEV: false })).toBe("production");
  });

  it("honours explicit VITE_PLATFORM_RUNTIME_MODE over DEV", () => {
    expect(
      detectPlatformRuntimeMode({
        DEV: false,
        VITE_PLATFORM_RUNTIME_MODE: "development",
      }),
    ).toBe("development");
    expect(
      detectPlatformRuntimeMode({
        DEV: true,
        VITE_PLATFORM_RUNTIME_MODE: "production",
      }),
    ).toBe("production");
  });

  it("uses auto-apply defaults in development", () => {
    const prefs = defaultPlatformPreferences("development");
    expect(prefs.updates.autoCheckUpdates).toBe(true);
    expect(prefs.updates.autoApplyUpdates).toBe(true);
    expect(prefs.updates.autoReloadOnActivate).toBe(true);
    expect(prefs.updates.promptBeforeUpdate).toBe(false);
  });

  it("uses stable defaults in production", () => {
    const prefs = defaultPlatformPreferences("production");
    expect(prefs.updates.autoApplyUpdates).toBe(false);
    expect(prefs.updates.autoReloadOnActivate).toBe(false);
    expect(prefs.updates.promptBeforeUpdate).toBe(true);
  });

  it("merges partial stored updates over defaults", () => {
    const merged = normalisePlatformPreferences(
      { updates: { autoApplyUpdates: true } },
      "production",
    );
    expect(merged.updates.autoApplyUpdates).toBe(true);
    expect(merged.updates.promptBeforeUpdate).toBe(true);
    expect(merged.updates.autoCheckUpdates).toBe(true);
  });
});
