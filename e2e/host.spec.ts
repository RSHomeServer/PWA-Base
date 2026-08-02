import { expect, test } from "@playwright/test";

test.describe("application catalogue", () => {
  test("landing page lists sectioned site cards", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Application catalogue", level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Media", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Monitoring", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Workspace", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Apps", level: 2 })).toBeVisible();

    const apps = page.getByRole("list", { name: "Apps" });
    await expect(apps.getByRole("link", { name: /Statistical Analysis/i })).toBeVisible();
    await expect(apps.getByRole("link", { name: /Visual Computing/i })).toHaveAttribute(
      "href",
      "https://viz.songara.uk",
    );
    await expect(apps.getByRole("link", { name: /Birthday/i })).toHaveAttribute(
      "href",
      "https://birthday.songara.uk",
    );
    await expect(apps.getByRole("link", { name: /Memories/i })).toHaveAttribute(
      "href",
      "https://memories.songara.uk",
    );

    const media = page.getByRole("list", { name: "Media" });
    await expect(media.getByRole("link", { name: /Overseerr/i })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  test("platform chrome mega bar exposes nav, theme, and update controls", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("aside[aria-label='Platform navigation']")).toHaveCount(0);

    const mega = page.getByRole("banner", { name: "Platform mega menu" });
    await expect(mega).toBeVisible();
    await expect(mega.getByRole("link", { name: "Homepage" })).toHaveAttribute(
      "href",
      "https://apps.songara.uk",
    );
    await expect(mega.getByRole("button", { name: "Media" })).toBeVisible();
    await expect(mega.getByRole("button", { name: "Apps" })).toBeVisible();
    await expect(mega.getByRole("button", { name: /Theme:/i })).toBeVisible();
    await expect(mega.getByRole("button", { name: /App version|Update available/i })).toBeVisible();
    await expect(mega.getByRole("button", { name: "Collapse top bar" })).toBeVisible();
  });

  test("path-hosted app routes are no longer served by the catalogue", async ({ page }) => {
    await page.goto("/birthday");
    await expect(
      page.getByRole("heading", { name: "Application catalogue", level: 1 }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/birthday$/);
  });
});
