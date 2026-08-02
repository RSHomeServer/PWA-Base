/**
 * Asset refinement captures — armillary / lantern / bed.
 * BIRTHDAY_BASE=http://172.18.0.12 node docs/artifacts/scene-engine/capture-asset-refine.mjs
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
const errors = [];
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-scene-id="bedroom"]');

async function shot(name) {
  await page.screenshot({ path: path.join(outDir, name), fullPage: false });
  console.log("wrote", name);
}

await page.locator('[data-mode-btn="experience"]').click();
await page.waitForSelector('[data-mode="experience"]');
await shot("asset-refine-02-bedroom.png");

await page.locator('[data-mode-btn="editor"]').click();
await page.waitForSelector('[data-mode="editor"]');

const scene = page.locator('[data-scene-id="bedroom"] svg').first();
const box = await scene.boundingBox();

async function zoomToward(fx, fy, ticks = 8) {
  if (!box) return;
  await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy);
  for (let i = 0; i < ticks; i++) await page.mouse.wheel(0, -180);
  await page.waitForTimeout(250);
}

await page.locator('[data-hit-prop="keepsake-armillary"]').last().click({
  force: true,
});
await zoomToward(0.32, 0.3, 9);
await shot("asset-refine-03-armillary-closeup.png");

await page.locator('[data-mode-btn="experience"]').click();
await page.locator('[data-mode-btn="editor"]').click();
await page.locator('[data-hit-prop="keepsake-lantern"]').last().click({
  force: true,
});
await zoomToward(0.34, 0.32, 9);
await shot("asset-refine-04-lantern-closeup.png");

await page.locator('[data-mode-btn="experience"]').click();
await page.locator('[data-mode-btn="editor"]').click();
await page.locator('[data-hit-prop="bed"]').last().click({ force: true });
await zoomToward(0.62, 0.55, 7);
await shot("asset-refine-05-bed-closeup.png");

if (errors.length) {
  console.error("CONSOLE_ERRORS", errors);
  process.exitCode = 1;
} else {
  console.log("NO_CONSOLE_ERRORS");
}
await browser.close();
console.log("ASSET_REFINE_CAPTURE_OK");
