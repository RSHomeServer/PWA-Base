/**
 * Capture route-reorganisation validation screenshots.
 *
 * Usage:
 *   BIRTHDAY_BASE=http://172.18.0.12 PASS_LABEL=route-reorg \
 *     node docs/artifacts/scene-engine/capture-route-reorg.mjs
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.BIRTHDAY_BASE ?? "https://birthday.songara.uk";
const out = "docs/artifacts/scene-engine";
const pass = process.env.PASS_LABEL ?? "route-reorg";
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function shot(path, filename, waitFor) {
  console.log("goto", path);
  await page.goto(`${base}${path}`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  if (waitFor) {
    await page.waitForSelector(waitFor, { state: "attached", timeout: 90000 });
  }
  await page.waitForTimeout(path === "/" ? 3500 : 1400);
  const file = `${out}/${filename}`;
  await page.screenshot({ path: file, fullPage: false });
  console.log("wrote", file);
}

await shot("/", `homepage-website-${pass}.png`, "main#main-content");
await shot("/bedroom", `bedroom-${pass}.png`, "[data-scene-id=bedroom]");
await shot("/experiences", `experiences-shelf-${pass}.png`, "[aria-label='Keepsake shelf']");
await shot("/constellation", `constellation-${pass}.png`, "[data-constellation-stage]");
await shot("/lanterns", `lantern-${pass}.png`, "text=Lantern Wishes");
await shot("/voice", `voice-${pass}.png`, null);
await shot("/photos", `photos-${pass}.png`, null);
await shot("/videos", `videos-${pass}.png`, null);

// Crop new keepsake models from bedroom
await page.goto(`${base}/bedroom`, {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForSelector("[data-scene-id=bedroom]", {
  state: "attached",
  timeout: 60000,
});
await page.waitForTimeout(1200);

async function cropIllustration(illustration, filename) {
  const handle = page.locator(`[data-illustration="${illustration}"]`).first();
  await handle.waitFor({ state: "attached", timeout: 8000 });
  const box = await handle.boundingBox();
  if (!box) {
    console.log("skip", illustration, "(no box)");
    return;
  }
  const pad = 48;
  await page.screenshot({
    path: `${out}/${filename}`,
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: Math.min(1440 - Math.max(0, box.x - pad), box.width + pad * 2),
      height: Math.min(900 - Math.max(0, box.y - pad), box.height + pad * 2),
    },
  });
  console.log("wrote", filename);
}

await cropIllustration("record-player", `keepsake-record-player-${pass}.png`);
await cropIllustration("photo-album", `keepsake-photo-album-${pass}.png`);
await cropIllustration("film-reel", `keepsake-film-reel-${pass}.png`);
await cropIllustration("armillary", `keepsake-armillary-${pass}.png`);
await cropIllustration("paper-lantern", `keepsake-lantern-${pass}.png`);

await browser.close();
console.log("done", pass);
