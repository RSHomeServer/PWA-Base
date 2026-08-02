/**
 * Authoring validation captures — room panel, geometry debug, wardrobe explode, armillary scales.
 * BIRTHDAY_BASE=http://172.18.0.12 node docs/artifacts/scene-engine/capture-authoring.mjs
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
await page.locator('[data-mode-btn="editor"]').click();
await page.waitForSelector('[data-mode="editor"]');
await page.waitForSelector('[data-author-panel="room"]');

async function shot(name) {
  await page.screenshot({ path: path.join(outDir, name), fullPage: false });
  console.log("wrote", name);
}

await shot("authoring-01-room-panel.png");

const lengthInput = page.locator('[data-author="room-length"]');
const before = await page.getAttribute('[data-scene-id="bedroom"]', "data-room-length");
await lengthInput.fill("10");
await lengthInput.blur();
await page.waitForTimeout(300);
const after = await page.getAttribute('[data-scene-id="bedroom"]', "data-room-length");
console.log("room-length before/after", before, after);
await shot("authoring-02-room-length-10.png");
await lengthInput.fill("16");
await lengthInput.blur();
await page.waitForTimeout(300);
await shot("authoring-03-room-length-16.png");
await lengthInput.fill("14");
await lengthInput.blur();

// Geometry debug — wardrobe exploded
await page.locator('[data-author="geometry-view"]').check();
await page.locator('[data-author="geometry-focus"]').selectOption("prop.wardrobe");
await page.waitForSelector('[data-geometry-view="on"]');
await page.waitForTimeout(200);
await shot("authoring-04-geometry-wardrobe-exploded.png");

await page.locator('[data-author="geometry-focus"]').selectOption("keepsake.armillary-sphere");
await page.waitForTimeout(200);
await shot("authoring-05-geometry-armillary.png");

await page.locator('[data-author="geometry-view"]').uncheck();
await page.waitForSelector('[data-geometry-view="off"]');

// Armillary scales
for (const scale of ["1", "2.1", "3"]) {
  await page.locator('[data-author="keepsake-scale"]').fill(scale);
  await page.locator('[data-author="keepsake-scale"]').blur();
  await page.waitForTimeout(250);
  await shot(`authoring-06-armillary-scale-${scale.replace(".", "_")}.png`);
}

if (errors.length) {
  console.error("CONSOLE_ERRORS", errors);
  process.exitCode = 1;
} else {
  console.log("NO_CONSOLE_ERRORS");
}
await browser.close();
console.log("AUTHORING_CAPTURE_OK", { before, after });
