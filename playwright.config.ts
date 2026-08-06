import { defineConfig, devices } from "@playwright/test";

const previewHost = "127.0.0.1";
const cataloguePort = 4173;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "catalogue",
      testMatch: /host\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://${previewHost}:${cataloguePort}`,
      },
    },
  ],
  webServer: [
    {
      command: `pnpm --filter @platform/host build && pnpm --filter @platform/host preview --host ${previewHost} --port ${cataloguePort}`,
      url: `http://${previewHost}:${cataloguePort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
