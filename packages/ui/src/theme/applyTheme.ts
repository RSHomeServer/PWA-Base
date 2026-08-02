import type { ResolvedTheme } from "./types.js";

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(preference: "light" | "dark" | "system"): ResolvedTheme {
  return preference === "system" ? getSystemTheme() : preference;
}

export function applyTheme(resolved: ResolvedTheme): void {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.classList.remove("theme-light", "theme-dark");
  root.classList.add(`theme-${resolved}`);
}
