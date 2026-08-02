/**
 * Capture bespoke keepsakes + shelf walls + wardrobe.
 * BIRTHDAY_BASE=http://172.18.0.12 node docs/artifacts/scene-engine/capture-keepsakes.mjs
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
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-scene-id="bedroom"]');

async function shot(name) {
  await page.screenshot({ path: path.join(outDir, name), fullPage: false });
  console.log("wrote", name);
}

await page.locator('[data-mode-btn="experience"]').click();
await page.waitForSelector('[data-mode="experience"]');
await shot("keepsakes-01-bedroom.png");

await page.locator('[data-mode-btn="editor"]').click();
await page.waitForSelector('[data-mode="editor"]');

// Select armillary / lantern closeups via zoom toward shelf
await page.locator('[data-hit-prop="keepsake-armillary"]').last().click({ force: true });
await page.waitForSelector('[data-selected="keepsake-armillary"]');
await shot("keepsakes-02-armillary-shelf.png");

await page.locator('[data-hit-prop="keepsake-lantern"]').last().click({ force: true });
await page.waitForSelector('[data-selected="keepsake-lantern"]');
await shot("keepsakes-03-lantern-shelf.png");

await page.locator('[data-hit-prop="wardrobe"]').last().click({ force: true });
await page.waitForSelector('[data-selected="wardrobe"]');
await shot("keepsakes-04-wardrobe.png");

// Move shelf to wall-back
const shelf = page.locator('[data-hit-prop="shelf"]').last();
const box = await shelf.boundingBox();
const wallBack = page.locator('[data-hit-prop="window"]').last();
const wb = await wallBack.boundingBox();
if (box && wb) {
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(wb.x + wb.width * 0.2, wb.y + wb.height * 0.7, {
    steps: 14,
  });
  await page.waitForTimeout(200);
  await page.mouse.up();
}
await page.waitForTimeout(300);
await shot("keepsakes-05-shelf-wall-back.png");

// Place a second shelf on wall-right from library
await page.locator('[data-library-asset="surface.shelf"]').click();
await page.waitForSelector('[data-placing="surface.shelf"]');
// Aim toward right side of room
await page.mouse.click(1100, 420);
await page.waitForFunction(() => {
  const el = document.querySelector('[data-scene-id="bedroom"]');
  return el && !el.getAttribute("data-placing");
});
await shot("keepsakes-06-shelf-walls.png");

if (errors.length) {
  console.error("CONSOLE_ERRORS", errors);
  process.exitCode = 1;
} else {
  console.log("NO_CONSOLE_ERRORS");
}
await browser.close();
console.log("KEEPSAKES_CAPTURE_OK");
