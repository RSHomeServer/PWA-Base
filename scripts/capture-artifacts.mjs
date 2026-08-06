#!/usr/bin/env node
/**
 * Artifact capture entrypoint for the monorepo.
 *
 * Screenshot capture lived with the telemetry product service and was removed
 * from PWA-Base in T0.4 (B8). The completion-report contract remains in
 * @platform/completion-report / @songara/pwa-base/completion-report.
 */
console.error(
  "[capture:artifacts] Screenshot capture moved with the telemetry product (clone).\n" +
    "Completion-report contract: @songara/pwa-base/completion-report",
);
process.exit(1);
