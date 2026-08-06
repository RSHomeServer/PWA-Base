import { expect, test } from "@playwright/test";

test.describe("hello reference app", () => {
  test("loads Hello World content", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Hello/i, level: 1 })).toBeVisible({
      timeout: 30_000,
    });
  });
});
