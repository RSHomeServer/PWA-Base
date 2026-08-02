import type { ExperienceLoadState } from "./types.js";

export function statusLabel(
  state: ExperienceLoadState,
  loadingAll: boolean,
): string {
  switch (state) {
    case "ready":
      return "Ready";
    case "loading":
      return "Loading…";
    case "waiting":
      return loadingAll ? "Waiting…" : "Waiting";
    case "error":
      return "Error";
    case "idle":
    default:
      return "Not loaded";
  }
}

export function statusGlyph(state: ExperienceLoadState): string {
  if (state === "ready") return "✓";
  if (state === "error") return "!";
  if (state === "loading") return "…";
  return "·";
}

export function loadStateShortLabel(state: ExperienceLoadState): string {
  if (state === "ready") return "Ready";
  if (state === "loading") return "Loading";
  if (state === "waiting") return "Waiting";
  if (state === "error") return "Error";
  return "Idle";
}
