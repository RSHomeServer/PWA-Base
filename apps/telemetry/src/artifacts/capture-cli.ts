/**
 * Capture run artifacts after validation succeeds.
 *
 * Usage:
 *   pnpm --filter @platform/telemetry capture -- \
 *     --run-id <uuid> \
 *     --files HistoryPage.tsx,RunSummaryCard.tsx \
 *     --base-url http://127.0.0.1:4173 \
 *     --phase after \
 *     --telemetry-url http://127.0.0.1:4310
 *
 * Gates: typecheck + build + unit tests (unless --skip-validate).
 * Does not capture when validation fails.
 * Does not overwrite existing after-screenshots.
 */
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { detectCapturePages } from "./page-detect.js";
import type { ArtifactPhase, CapturePageTarget } from "./types.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");

interface CliArgs {
  runId: string;
  files: string[];
  baseUrl: string;
  phase: ArtifactPhase;
  telemetryUrl: string;
  skipValidate: boolean;
  outDir: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  const get = (name: string): string | undefined => {
    const idx = argv.indexOf(name);
    return idx >= 0 ? argv[idx + 1] : undefined;
  };
  const runId = get("--run-id") ?? process.env.TELEMETRY_RUN_ID ?? "";
  if (!runId) {
    throw new Error("--run-id (or TELEMETRY_RUN_ID) is required");
  }
  const filesRaw = get("--files") ?? "";
  const files = filesRaw
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
  return {
    runId,
    files,
    baseUrl: (get("--base-url") ?? "http://127.0.0.1:4173").replace(/\/$/, ""),
    phase: get("--phase") === "before" ? "before" : "after",
    telemetryUrl: (get("--telemetry-url") ?? process.env.TELEMETRY_ENDPOINT ?? "http://127.0.0.1:4310").replace(
      /\/$/,
      "",
    ),
    skipValidate: argv.includes("--skip-validate"),
    outDir: get("--out-dir") ?? null,
  };
}

function runGate(label: string, command: string, args: string[]): void {
  console.log(`[capture] gate: ${label}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`Validation failed: ${label} (exit ${result.status})`);
  }
}

async function uploadArtifact(
  telemetryUrl: string,
  runId: string,
  body: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(`${telemetryUrl}/api/runs/${encodeURIComponent(runId)}/artifacts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
}

async function capturePages(
  pages: CapturePageTarget[],
  args: CliArgs,
): Promise<{ pageKey: string; filename: string; bytes: Buffer }[]> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const results: { pageKey: string; filename: string; bytes: Buffer }[] = [];

  try {
    for (const target of pages) {
      const url = `${args.baseUrl}${target.path}`;
      console.log(`[capture] screenshot ${target.pageLabel} → ${url}`);
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForTimeout(400);
      const buffer = await page.screenshot({ type: "png", fullPage: false });
      const filename = `${target.pageKey}-${args.phase ?? "after"}.png`;
      results.push({ pageKey: target.pageKey, filename, bytes: Buffer.from(buffer) });
    }
  } finally {
    await browser.close();
  }

  return results;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.skipValidate) {
    runGate("typecheck", "pnpm", ["typecheck"]);
    runGate("build", "pnpm", ["--filter", "@platform/host", "build"]);
    runGate("unit", "pnpm", ["--filter", "@platform/telemetry", "test:unit"]);
    runGate("e2e", "pnpm", ["test:e2e", "--", "e2e/host.spec.ts"]);
  } else {
    console.log("[capture] skipping validation gates (--skip-validate)");
  }

  const pages = detectCapturePages(args.files);
  console.log(
    `[capture] pages: ${pages.map((p) => p.pageKey).join(", ") || "(none)"}`,
  );

  const shots = await capturePages(pages, args);

  if (args.outDir) {
    mkdirSync(args.outDir, { recursive: true });
  }

  const generated: string[] = [];
  for (const shot of shots) {
    const page = pages.find((p) => p.pageKey === shot.pageKey)!;
    if (args.outDir) {
      writeFileSync(join(args.outDir, shot.filename), shot.bytes);
    }
    try {
      await uploadArtifact(args.telemetryUrl, args.runId, {
        kind: "screenshot",
        pageKey: page.pageKey,
        pageLabel: page.pageLabel,
        phase: args.phase,
        filename: shot.filename,
        mimeType: "image/png",
        caption: `${page.pageLabel} (${args.phase})`,
        contentBase64: shot.bytes.toString("base64"),
      });
      generated.push(shot.filename);
      console.log(`[capture] uploaded ${shot.filename}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/already exists|refusing overwrite/i.test(message)) {
        console.warn(`[capture] skip overwrite: ${shot.filename} — ${message}`);
        continue;
      }
      throw err;
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        runId: args.runId,
        phase: args.phase,
        pagesCaptured: pages.map((p) => p.pageLabel),
        artifactsGenerated: generated,
        storage: `run-artifacts/${args.runId}/`,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("[capture] failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
