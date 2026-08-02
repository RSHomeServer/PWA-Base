import { describe, expect, it } from "vitest";
import { detectRestartActions } from "../../../../packages/site-dashboard/src/lib/restart-detection.ts";

describe("detectRestartActions", () => {
  it("requires restart for vite.config", () => {
    const result = detectRestartActions([
      { area: "host", files: ["apps/platform/vite.config.ts"] },
    ]);
    expect(result.restartRequired).toBe(true);
    expect(result.priority).toBe("required");
    expect(result.items[0]?.action).toBe("Restart Required");
  });

  it("requires restart for package.json and docker files", () => {
    expect(
      detectRestartActions([{ area: "root", files: ["package.json"] }]).restartRequired,
    ).toBe(true);
    expect(
      detectRestartActions([{ area: "ops", files: ["Dockerfile"] }]).restartRequired,
    ).toBe(true);
    expect(
      detectRestartActions([
        { area: "telemetry", files: ["apps/telemetry/src/cli.ts"] },
      ]).restartRequired,
    ).toBe(true);
  });

  it("marks HMR-only site package changes as no action", () => {
    const result = detectRestartActions([
      {
        area: "dashboard",
        files: [
          "packages/site-dashboard/src/pages/RunsPage.tsx",
          "packages/site-dashboard/src/pages/pages.module.css",
        ],
      },
    ]);
    expect(result.restartRequired).toBe(false);
    expect(result.priority).toBe("none");
    expect(result.items[0]?.action).toBe("No developer action required.");
  });

  it("recommends soft refresh for mixed non-hard paths", () => {
    const result = detectRestartActions([
      { area: "docs", files: ["docs/architecture.md"] },
    ]);
    expect(result.restartRequired).toBe(false);
    expect(result.priority).toBe("recommended");
  });
});
