import { expect, test } from "@playwright/test";

test.describe("birthday transition polish", () => {
  test("static previews + constellation first frame + lanterns", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "When You Miss Me" })).toBeVisible();

    await page.getByRole("button", { name: "Load Experiences" }).click();
    await page.waitForFunction(() => {
      const items = [...document.querySelectorAll("[data-state]")];
      return (
        items.length >= 6 &&
        items.every((el) => el.getAttribute("data-state") === "ready")
      );
    });

    const crop = page.locator(
      '[data-experience-preview="constellation"][data-preview-variant="crop"] img',
    );
    await expect(crop).toHaveCount(1);
    // Static still — no iframe
    await expect(page.locator("iframe")).toHaveCount(0);

    await page.getByRole("button", { name: "Enter Constellation" }).click();
    await expect(page.locator("[data-enter-transition='constellation']")).toBeVisible();
    await page.waitForURL(/\/constellation$/);

    await expect(page.locator("[data-constellation-stage]")).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Constellation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Previous" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Next" })).toHaveCount(0);

    await page.goto("/lanterns", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Lantern Wishes" })).toBeVisible();
    await expect(
      page.getByText("Touch the dark to release a lantern"),
    ).toBeVisible();
  });
});
