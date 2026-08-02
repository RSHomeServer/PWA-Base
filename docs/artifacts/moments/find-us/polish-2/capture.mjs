import { chromium } from "/mnt/storage/Containers/Cursor/Website_Hosting/node_modules/.pnpm/playwright@1.61.1/node_modules/playwright/index.mjs";
import path from "node:path";
import fs from "node:fs";

const OUT = path.resolve("docs/artifacts/moments/find-us/polish-2");
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

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    serviceWorkers: "block",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[aria-label="Constellation moment"]', { timeout: 20000 });
  await shot(page, "01-opening-or-sky");

  // Wait until Leo interaction ready
  await page.getByRole("button", { name: /awaiting your touch/i }).waitFor({ timeout: 20000 });
  await shot(page, "02-leo-first-active");

  // Activate first few Leo stars
  for (let i = 0; i < 4; i++) await clickNext(page);
  await page.waitForTimeout(400);
  await shot(page, "03-leo-partial-lines");

  // Finish Leo
  while (await page.getByRole("button", { name: /awaiting your touch/i }).count()) {
    const label = await page.getByRole("button", { name: /awaiting your touch/i }).getAttribute("aria-label");
    if (label && /Sagittarius|Kaus|Alnasi|Nunki|Ascella|Albaldah|τ/i.test(label)) break;
    await clickNext(page);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(800);
  await shot(page, "04-leo-complete-art");

  // Sagittarius
  await page.getByRole("button", { name: /awaiting your touch/i }).waitFor({ timeout: 20000 });
  await shot(page, "05-sag-start");
  while (await page.getByRole("button", { name: /awaiting your touch/i }).count()) {
    await clickNext(page);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1000);
  await shot(page, "06-both-complete");

  // Wait for paper phase
  for (let i = 0; i < 40; i++) {
    const paper = await page.evaluate(() => !!document.querySelector('[class*="paperStage"], [class*="paperPhase"]'));
    if (paper) break;
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(600);
  await shot(page, "07-transition-or-paper");
  await page.waitForTimeout(2500);
  await shot(page, "08-paper-end");

  // Aspect check: wide viewport
  await page.setViewportSize({ width: 1400, height: 700 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /awaiting your touch/i }).waitFor({ timeout: 20000 });
  await shot(page, "09-wide-aspect-stage");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("button", { name: /awaiting your touch/i }).waitFor({ timeout: 20000 });
  await shot(page, "10-mobile-aspect-stage");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
