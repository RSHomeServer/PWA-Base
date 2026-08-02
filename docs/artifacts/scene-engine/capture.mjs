import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.BIRTHDAY_BASE ?? "http://172.18.0.12";
const out = "docs/artifacts/scene-engine";
const pass = process.env.PASS_LABEL ?? "final";
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector("[data-scene-id=bedroom]", { timeout: 60000 });
await page.waitForTimeout(900);

const illustrations = await page.locator("[data-illustration=prop]").count();
console.log({ pass, illustrations });

await page.screenshot({
  path: `${out}/bedroom-pass-${pass}-off.png`,
  fullPage: false,
});
await page.screenshot({
  path: `${out}/bedroom-composition-off.png`,
  fullPage: false,
});

await page.getByRole("button", { name: /Overlay/i }).click();
await page.waitForTimeout(350);
await page.screenshot({
  path: `${out}/bedroom-pass-${pass}-on.png`,
  fullPage: false,
});
await page.screenshot({
  path: `${out}/bedroom-composition-on.png`,
  fullPage: false,
});
await page.getByRole("button", { name: /Overlay/i }).click();
await page.waitForTimeout(250);

async function cropIllustration(id, filename) {
  const handle = page.locator(`[data-instance="${id}"]`);
  await handle.waitFor({ state: "attached", timeout: 5000 });
  const box = await handle.boundingBox();
  if (!box) return;
  const pad = 56;
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

await cropIllustration("desk", "closeup-desk.png");
await cropIllustration("bed", `closeup-bed-pass-${pass}.png`);
await cropIllustration("bed", "closeup-bed.png");
await cropIllustration("wardrobe", `closeup-wardrobe-pass-${pass}.png`);
await cropIllustration("wardrobe", "closeup-wardrobe.png");
await cropIllustration("nightstand-a", `closeup-nightstand-pass-${pass}.png`);
await cropIllustration("nightstand-a", "closeup-nightstand.png");

await browser.close();
