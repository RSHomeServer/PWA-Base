/**
 * Visual refinement captures — room / wardrobe / armillary.
 * BIRTHDAY_BASE=http://172.18.0.12 node docs/artifacts/scene-engine/capture-refine.mjs
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
await shot("refine-02-refined-room.png");

await page.locator('[data-mode-btn="editor"]').click();
await page.waitForSelector('[data-mode="editor"]');

await page.locator('[data-hit-prop="wardrobe"]').last().click({ force: true });
await page.waitForSelector('[data-selected="wardrobe"]');
await shot("refine-04-wardrobe-after.png");

await page.locator('[data-hit-prop="keepsake-armillary"]').last().click({
  force: true,
});
await page.waitForSelector('[data-selected="keepsake-armillary"]');
await shot("refine-06-armillary-after.png");

if (errors.length) {
  console.error("CONSOLE_ERRORS", errors);
  process.exitCode = 1;
} else {
  console.log("NO_CONSOLE_ERRORS");
}
await browser.close();
console.log("REFINE_CAPTURE_OK");
