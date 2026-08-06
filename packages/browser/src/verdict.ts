export type Verdict = "pass" | "warn" | "fail" | "info";

/** Maps a value against ascending pass/warn thresholds (higher is better). */
export function verdictFromThresholds(value: number, warnAt: number, passAt: number): Verdict {
  if (value >= passAt) {
    return "pass";
  }
  if (value >= warnAt) {
    return "warn";
  }
  return "fail";
}
