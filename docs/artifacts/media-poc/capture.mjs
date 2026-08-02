import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.BIRTHDAY_BASE ?? "http://172.18.0.12";
const out = "docs/artifacts/media-poc";
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function shot(name, path, action) {
  await page.goto(base + path, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(900);
  if (action) await action();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  console.log("wrote", name);
}

await shot("home", "/");
await shot("voice", "/voice");
await shot("photos", "/photos", async () => {
  await page.getByRole("button", { name: /Next page/i }).click();
  await page.waitForTimeout(450);
});
await shot("videos", "/videos", async () => {
  await page.getByRole("button", { name: /Open the curtain/i }).click();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: /Start projector/i }).click();
  await page.waitForTimeout(1100);
});

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.screenshot({ path: `${out}/home-mobile.png`, fullPage: true });
console.log("wrote home-mobile");

await browser.close();
