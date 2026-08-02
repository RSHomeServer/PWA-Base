import type { BadgeVariant } from "@platform/ui";

export type Verdict = "pass" | "warn" | "fail" | "info";

export function verdictBadgeVariant(verdict: Verdict): BadgeVariant {
  switch (verdict) {
    case "pass":
      return "accent";
    case "warn":
      return "warning";
    case "fail":
      return "error";
    default:
      return "default";
  }
}

export function verdictLabel(verdict: Verdict): string {
  switch (verdict) {
    case "pass":
      return "Strong";
    case "warn":
      return "Modest";
    case "fail":
      return "Weak";
    default:
      return "Info";
  }
}

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
