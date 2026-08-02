/**
 * Capture Scene Authoring Tool screenshots + optional demo video.
 *
 * BIRTHDAY_BASE=http://172.18.0.12 RECORD_VIDEO=1 node docs/artifacts/scene-engine/capture-authoring.mjs
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;
const base = process.env.BIRTHDAY_BASE ?? "http://172.18.0.12";
const recordVideo = process.env.RECORD_VIDEO === "1";

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: recordVideo
    ? { dir: outDir, size: { width: 1440, height: 900 } }
    : undefined,
});
const page = await context.newPage();
await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-scene-id="bedroom"][data-editor="authoring"]');

async function shot(name) {
  const file = path.join(outDir, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", name);
}

async function hit(id) {
  const el = page.locator(`[data-hit-prop="${id}"]`).last();
  await el.waitFor({ state: "attached", timeout: 5000 });
  const box = await el.boundingBox();
  if (!box) throw new Error(`no box for ${id}`);
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    box,
  };
}

// 1. Default bedroom
await shot("authoring-01-bedroom.png");

// 2. Asset Library open (default)
await page.locator('[data-library="open"]').waitFor({ timeout: 5000 });
await shot("authoring-02-library-open.png");

// 3. Dragging / placing Snow Globe
await page.locator('[data-library-asset="keepsake.armillary-sphere"]').click();
await page.waitForSelector('[data-placing="keepsake.armillary-sphere"]');
const shelf = await hit("shelf");
await page.mouse.move(shelf.x, shelf.y - 40);
await page.waitForTimeout(200);
await shot("authoring-03-placing-snow-globe.png");

// 4. Place on shelf
await page.mouse.click(shelf.x, shelf.y - 36);
await page.waitForFunction(() => {
  const el = document.querySelector('[data-scene-id="bedroom"]');
  return el && !el.getAttribute('data-placing');
}, null, { timeout: 10000 });
await page.waitForTimeout(200);
await shot("authoring-04-snow-globe-placed.png");

// 5. Delete a prop (chair)
const chair = await hit("chair");
await page.mouse.click(chair.x, chair.y);
await page.waitForSelector('[data-selected="chair"]');
await page.locator('[data-action="delete-prop"]').click();
await page.waitForSelector('[data-selected=""]');
await shot("authoring-05-deleted-prop.png");

// 6 / 7 Overlay
await page.locator('button:has-text("Overlay")').click();
await page.waitForSelector('[data-overlay="on"]');
await shot("authoring-07-overlay-on.png");
await page.locator('button:has-text("Overlay on")').click();
await page.waitForSelector('[data-overlay="off"]');
await shot("authoring-06-overlay-off.png");

// Demo: select → drag → place → delete → add again
const bed = await hit("bed");
await page.mouse.click(bed.x, bed.y);
await page.waitForSelector('[data-selected="bed"]');
await page.mouse.move(bed.x, bed.y);
await page.mouse.down();
await page.mouse.move(bed.x - 80, bed.y + 40, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(150);

async function waitNotPlacing() {
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-scene-id="bedroom"]');
    return el && !el.getAttribute('data-placing');
  }, null, { timeout: 10000 });
}

await page.locator('[data-library-asset="keepsake.paper-lantern"]').click();
await page.waitForSelector('[data-placing="keepsake.paper-lantern"]');
const desk = await hit("desk");
await page.mouse.click(desk.x, desk.y - 20);
await waitNotPlacing();
const selected = await page.getAttribute(
  '[data-scene-id="bedroom"]',
  "data-selected",
);
if (selected) {
  await page.locator('[data-action="delete-prop"]').click();
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-scene-id="bedroom"]');
    return el && !el.getAttribute('data-selected');
  });
}
await page.locator('[data-library-asset="keepsake.paper-lantern"]').click();
await page.waitForSelector('[data-placing="keepsake.paper-lantern"]');
await page.mouse.click(desk.x + 40, desk.y - 18);
await waitNotPlacing();
await page.waitForTimeout(200);

const videoPath = recordVideo
  ? (await page.video()?.path()) ?? null
  : null;

await context.close();
await browser.close();

if (videoPath) {
  const dest = path.join(outDir, "authoring-demo.webm");
  const { rename } = await import("node:fs/promises");
  await rename(videoPath, dest);
  console.log("wrote authoring-demo.webm");
}

await writeFile(
  path.join(outDir, "authoring-capture-ok.txt"),
  `ok ${new Date().toISOString()}\n`,
);
console.log("AUTHORING_CAPTURE_OK");
