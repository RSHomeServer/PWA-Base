import { chromium } from "/mnt/storage/Containers/Cursor/Website_Hosting/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs";
import path from "node:path";
import fs from "node:fs";

const OUT = path.resolve("docs/artifacts/moments/find-us/leo-polish");
fs.mkdirSync(OUT, { recursive: true });
const base = process.env.MOMENT_URL || "https://memories.songara.uk/moment";

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("saved", file);
}

async function clickNext(page) {
  const btn = page.getByRole("button", { name: /awaiting your touch/i });
  await btn.waitFor({ state: "visible", timeout: 15000 });
  await btn.click({ force: true });
}

async function finishLeo(page) {
  while (await page.getByRole("button", { name: /awaiting your touch/i }).count()) {
    const label = await page
      .getByRole("button", { name: /awaiting your touch/i })
      .getAttribute("aria-label");
    if (label && /Sagittarius|Kaus|Alnasi|Nunki|Ascella|Albaldah|τ/i.test(label)) break;
    await clickNext(page);
    await page.waitForTimeout(140);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    serviceWorkers: "block",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  // Iteration 1 — desktop Leo complete
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[aria-label="Constellation moment"]', { timeout: 30000 });
  // Opening copy fades before first star is interactive
  await page.getByRole("button", { name: /awaiting your touch/i }).waitFor({ timeout: 60000 });
  await shot(page, "iter1-01-leo-start");
  for (let i = 0; i < 5; i++) await clickNext(page);
  await page.waitForTimeout(300);
  await shot(page, "iter1-02-leo-mid-sketch");
  await finishLeo(page);
  await page.waitForTimeout(1200);
  await shot(page, "iter1-03-leo-complete-art");

  // Hover completed star name
  const lit = page.getByRole("button", { name: /Regulus, lit/i });
  if (await lit.count()) {
    await lit.hover({ force: true });
    await page.waitForTimeout(200);
    await shot(page, "iter1-04-hover-completed");
  }

  // Iteration 2 — wide aspect (alignment lock)
  await page.setViewportSize({ width: 1500, height: 700 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /awaiting your touch/i }).waitFor({ timeout: 25000 });
  await finishLeo(page);
  await page.waitForTimeout(1200);
  await shot(page, "iter2-01-wide-leo-complete");

  // Iteration 3 — mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /awaiting your touch/i }).waitFor({ timeout: 25000 });
  await finishLeo(page);
  await page.waitForTimeout(1200);
  await shot(page, "iter3-01-mobile-leo-complete");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
