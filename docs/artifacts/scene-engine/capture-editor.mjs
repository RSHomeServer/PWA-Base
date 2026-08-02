import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.BIRTHDAY_BASE ?? "http://172.18.0.12";
const out = "docs/artifacts/scene-engine";
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: process.env.RECORD_VIDEO
    ? { dir: out, size: { width: 1440, height: 900 } }
    : undefined,
});
const page = await context.newPage();
await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("[data-scene-id=bedroom]", { timeout: 60000 });
await page.waitForTimeout(700);

async function shot(name) {
  await page.screenshot({ path: `${out}/${name}`, fullPage: false });
  console.log("wrote", name);
}

async function hit(id) {
  const el = page.locator(`[data-hit-prop="${id}"]`).last();
  await el.waitFor({ state: "attached", timeout: 5000 });
  const box = await el.boundingBox();
  if (!box) throw new Error(`no hit ${id}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

await shot("editor-01-default.png");

{
  const bed = await hit("bed");
  await page.mouse.click(bed.x, bed.y);
  await page.waitForTimeout(250);
  await shot("editor-02-selected-bed.png");
}

{
  const bed = await hit("bed");
  await page.mouse.move(bed.x, bed.y);
  await page.mouse.down();
  await page.mouse.move(bed.x - 90, bed.y + 45, { steps: 14 });
  await page.waitForTimeout(200);
  await shot("editor-03-dragging-bed.png");
  await page.mouse.up();
  await page.waitForTimeout(250);
}

{
  const shelf = await hit("shelf");
  await page.mouse.click(shelf.x, shelf.y);
  await page.waitForTimeout(250);
  await shot("editor-04-selected-shelf.png");
}

{
  const keepsake = await hit("keepsake-a");
  const shelf = await hit("shelf");
  await page.mouse.move(keepsake.x, keepsake.y);
  await page.mouse.down();
  await page.mouse.move(shelf.x, shelf.y - 18, { steps: 18 });
  await page.waitForTimeout(200);
  await shot("editor-05-dragging-keepsake-shelf.png");
  await page.mouse.up();
  await page.waitForTimeout(300);
}

await shot("editor-06-overlay-off.png");
await page.getByRole("button", { name: /Overlay/i }).click();
await page.waitForTimeout(300);
await shot("editor-07-overlay-on.png");

await context.close();
await browser.close();
console.log("editor capture done");
