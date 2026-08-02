import type { TelemetryRuntimeConfig } from "../config.js";
import type { TelemetryService } from "../service.js";

/**
 * Periodic idle watchdog. Safety net only — does not replace Cursor stop hooks.
 */
export class LifecycleSupervisor {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly service: TelemetryService,
    private readonly config: Pick<
      TelemetryRuntimeConfig,
      "idleTimeoutMs" | "idleSoftMs" | "supervisorIntervalMs"
    >,
  ) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      try {
        this.service.evaluateActiveRunsLifecycle();
      } catch (err) {
        console.error("[telemetry] lifecycle supervisor tick failed", err);
      }
    }, this.config.supervisorIntervalMs);
    // Unref so the timer does not keep the process alive alone during tests / shutdown.
    if (typeof this.timer === "object" && this.timer && "unref" in this.timer) {
      this.timer.unref();
    }
    console.log(
      `[telemetry] lifecycle supervisor every ${this.config.supervisorIntervalMs}ms ` +
        `(soft=${this.config.idleSoftMs}ms timeout=${this.config.idleTimeoutMs}ms)`,
    );
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Immediate tick (tests / ops). */
  tick(): void {
    this.service.evaluateActiveRunsLifecycle();
  }
}
