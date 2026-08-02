import { expect, test } from "@playwright/test";

test.describe("dashboard History (tasks) & notifications", () => {
  test("History page shows task tabs and notification bell", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "History", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Notifications/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("tab", { name: "Conversation" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Runs" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Developer Actions" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Telemetry" })).toBeVisible();
  });

  test("task tabs switch including Developer Actions", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("tab", { name: "Developer Actions" }).click();
    await expect(page.getByText(/Actions Required|No developer action required/i).first()).toBeVisible();
    await page.getByRole("tab", { name: "Runs" }).click();
    await expect(page).toHaveURL(/tab=runs/);
  });

  test("notifications page mounts with filters", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: /Notifications/i, level: 1 })).toBeVisible();
    await expect(page.getByPlaceholder(/search/i).or(page.getByRole("searchbox"))).toBeVisible();
  });

  test("settings exposes notification preferences and OS stubs", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
    await expect(page.getByText("Notification Centre preferences")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Run Completed", exact: true })).toBeVisible();
    await expect(page.getByText(/OS notifications/i)).toBeVisible();
  });

  test("PWA manifest is reachable", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.name).toMatch(/Dashboard/i);
    expect(body.start_url).toBe("/");
    expect(body.display).toBe("standalone");
  });

  test("Actions Required shows restart when vite.config is in task summary", async ({
    page,
    request,
  }) => {
    const hook = await request.post("/telemetry/hooks", {
      data: {
        hook_event_name: "beforeSubmitPrompt",
        conversation_id: `e2e-actions-${Date.now()}`,
        generation_id: `e2e-gen-${Date.now()}`,
        prompt: "E2E Actions Required fixture for Task report",
      },
    });
    expect(hook.ok()).toBeTruthy();
    const started = (await hook.json()) as { runId: string };
    const runRes = await request.get(`/telemetry/api/runs/${started.runId}`);
    expect(runRes.ok()).toBeTruthy();
    const runBody = (await runRes.json()) as { run: { taskId: string } };
    const taskId = runBody.run.taskId;
    const put = await request.put(`/telemetry/api/tasks/${taskId}/completion-summary`, {
      data: {
        schemaVersion: 2,
        overview:
          "E2E validation of Actions Required inside the Task completion report after vite.config changes. Confirms restart guidance surfaces without creating a second Task.",
        executiveSummary: "Actions Required fixture",
        userVisibleChanges: ["Actions Required visible on Task"],
        architectureChanges: [],
        filesModified: [{ area: "host", files: ["apps/platform/vite.config.ts"] }],
        configurationChanges: [],
        testingPerformed: [],
        knownLimitations: [],
        recommendedNextMilestone: null,
        filesChanged: 1,
        testsPassed: true,
        gitCommit: null,
        source: "structured",
      },
    });
    expect(put.ok()).toBeTruthy();
    const putBody = (await put.json()) as {
      task: { id: string };
      reportValidation?: { ok: boolean; warnings?: unknown[] };
    };
    expect(putBody.task.id).toBe(taskId);
    expect(putBody.reportValidation?.ok).toBe(true);

    await page.goto(`/?task=${taskId}&tab=actions`);
    await expect(page.getByText("Actions Required", { exact: true }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Restart Required").first()).toBeVisible();
  });

  test("History detail pane does not trap nested scroll", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "History", level: 1 })).toBeVisible({
      timeout: 15_000,
    });
    const metrics = await page.evaluate(() => {
      const split = document.querySelector("[class*='runsSplit']");
      const detail = split?.querySelector("[class*='historyDetailPane']") as HTMLElement | null;
      if (!detail) return null;
      const style = getComputedStyle(detail);
      return {
        overflow: style.overflow,
        overflowY: style.overflowY,
        detailClientHeight: detail.clientHeight,
        docScrollHeight: document.documentElement.scrollHeight,
        viewport: window.innerHeight,
      };
    });
    expect(metrics).not.toBeNull();
    expect(["visible", "auto"].includes(metrics!.overflowY) || metrics!.overflow === "visible").toBeTruthy();
  });

  test("multi-run consolidation keeps one task", async ({ request }) => {
    const conv = `e2e-consol-${Date.now()}`;
    const first = await request.post("/telemetry/hooks", {
      data: {
        hook_event_name: "beforeSubmitPrompt",
        conversation_id: conv,
        generation_id: `${conv}-g1`,
        prompt: "Primary user request for consolidation e2e",
      },
    });
    expect(first.ok()).toBeTruthy();
    const second = await request.post("/telemetry/hooks", {
      data: {
        hook_event_name: "beforeSubmitPrompt",
        conversation_id: conv,
        generation_id: `${conv}-g2`,
        prompt: "Explore follow-up should stay on same task",
      },
    });
    expect(second.ok()).toBeTruthy();
    const a = (await first.json()) as { runId: string };
    const b = (await second.json()) as { runId: string };
    const ra = await (await request.get(`/telemetry/api/runs/${a.runId}`)).json();
    const rb = await (await request.get(`/telemetry/api/runs/${b.runId}`)).json();
    expect(ra.run.taskId).toBe(rb.run.taskId);
    const task = await (await request.get(`/telemetry/api/tasks/${ra.run.taskId}`)).json();
    expect(task.runs.length).toBeGreaterThanOrEqual(2);
  });
});
