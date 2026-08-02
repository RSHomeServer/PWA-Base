/**
 * Capture Experience vs Editor mode screenshots.
 * BIRTHDAY_BASE=http://172.18.0.12 node docs/artifacts/scene-engine/capture-modes.mjs
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;
const base = process.env.BIRTHDAY_BASE ?? "http://172.18.0.12";

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-scene-id="bedroom"]');

async function shot(name) {
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", name);
}

async function clickHit(id, position) {
  const el = page.locator(`[data-hit-prop="${id}"]`).last();
  await el.waitFor({ state: "attached", timeout: 5000 });
  await el.click({ force: true, position });
}

async function dragHit(fromId, toId) {
  const a = page.locator(`[data-hit-prop="${fromId}"]`).last();
  const b = page.locator(`[data-hit-prop="${toId}"]`).last();
  const ab = await a.boundingBox();
  const bb = await b.boundingBox();
  if (!ab || !bb) throw new Error("missing hit box");
  await page.mouse.move(ab.x + ab.width / 2, ab.y + ab.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 12 });
  await page.waitForTimeout(200);
}

await page.waitForSelector('[data-mode="experience"]');
await shot("modes-01-experience.png");

await page.locator('[data-mode-btn="editor"]').click();
await page.waitForSelector('[data-mode="editor"]');
await page.waitForSelector('[data-library]');
await shot("modes-02-editor.png");
await shot("modes-07-library-thumbnails.png");

await dragHit("wardrobe", "bed");
await shot("modes-06-collision-reject.png");
await page.mouse.up();
await page.waitForTimeout(250);

// Desk hit is covered by keepsakes near centre — click lower edge.
const desk = page.locator('[data-hit-prop="desk"]').last();
const box = await desk.boundingBox();
await desk.click({
  force: true,
  position: { x: 10, y: Math.max(12, (box?.height ?? 40) - 10) },
});
await page.waitForSelector('[data-selected="desk"]', { timeout: 8000 });
await page.locator('[data-action="delete-prop"]').click();
await page.waitForFunction(() => !document.querySelector('[data-hit-prop="desk"]'));
await shot("modes-05-delete-desk-cascade.png");

await page.locator('[data-mode-btn="experience"]').click();
await page.waitForSelector('[data-mode="experience"]');

await clickHit("keepsake-armillary");
await page.waitForURL("**/constellation", { timeout: 10000 });
await shot("modes-03-snow-globe-constellation.png");
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForSelector('[data-mode="experience"]');

await clickHit("keepsake-lantern");
await page.waitForURL("**/lanterns", { timeout: 10000 });
await shot("modes-04-lantern-launch.png");

await browser.close();
console.log("MODES_CAPTURE_OK");
