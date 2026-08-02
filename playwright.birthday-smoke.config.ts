import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  reporter: "list",
  timeout: 90_000,
  projects: [
    {
      name: "birthday-smoke",
      testMatch: /birthday-launcher-smoke\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:4196",
      },
    },
  ],
});
