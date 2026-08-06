import {
  Gauge as UiGauge,
  type GaugeProps as UiGaugeProps,
  type GaugeTone,
} from "@platform/ui";
import type { Verdict } from "../lib/verdict.js";

const VERDICT_TONE: Record<Verdict, GaugeTone> = {
  pass: "success",
  warn: "warning",
  fail: "error",
  info: "neutral",
};

export type GaugeProps = Omit<UiGaugeProps, "tone"> & {
  verdict?: Verdict;
};

export function Gauge({ verdict = "info", ...props }: GaugeProps) {
  return <UiGauge tone={VERDICT_TONE[verdict]} {...props} />;
}
