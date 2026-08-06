import { defineConfig, devices } from "@playwright/test";

const previewHost = "127.0.0.1";
const helloPort = 4173;

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
      name: "hello",
      testMatch: /hello\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://${previewHost}:${helloPort}`,
      },
    },
  ],
  webServer: [
    {
      command: `pnpm --filter @platform/hello-web build && pnpm --filter @platform/hello-web preview --host ${previewHost} --port ${helloPort}`,
      url: `http://${previewHost}:${helloPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
