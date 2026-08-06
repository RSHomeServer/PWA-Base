#!/usr/bin/env node
/**
 * Artifact capture entrypoint for the monorepo.
 *
 * Screenshot capture lived with the telemetry product service and was removed
 * from PWA-Base in T0.4 (B8). The completion-report contract remains the
 * in-repo source of truth at @songara/pwa-base/completion-report.
 *
 * This script stays as a stable `pnpm capture:artifacts` hook so agent/DoD
 * checklists do not break; it does not capture images. Milestone 1 updates
 * prose that still describes the old capture pipeline.
 */
console.warn(
  "[capture:artifacts] Screenshot capture is not available in PWA-Base.\n" +
    "Completion-report contract: @songara/pwa-base/completion-report\n" +
    "Capture tooling lives with the telemetry product clone (if you still run it).",
);
process.exit(0);
