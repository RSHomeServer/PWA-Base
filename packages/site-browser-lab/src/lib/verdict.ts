import type { BadgeVariant } from "@platform/ui";
import type { Verdict } from "@platform/browser";

export type { Verdict } from "@platform/browser";
export { verdictFromThresholds } from "@platform/browser";

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
