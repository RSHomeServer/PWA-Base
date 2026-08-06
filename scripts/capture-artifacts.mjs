#!/usr/bin/env node
/**
 * Artifact capture entrypoint for the monorepo.
 *
 * Screenshot capture uploads to the telemetry HTTP service and remains part of
 * the @platform/telemetry product until that service is extracted (T0.4).
 * The completion-report contract lives in @platform/completion-report.
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const passthroughArgs = process.argv.slice(2);

console.error(
  "[capture:artifacts] Capture uploads to the telemetry service; long-term home is the telemetry product repo.",
);

const result = spawnSync(
  "pnpm",
  ["--filter", "@platform/telemetry", "capture", "--", ...passthroughArgs],
  {
    cwd: root,
    stdio: "inherit",
    shell: false,
    env: process.env,
  },
);

process.exit(result.status ?? 1);
