import type { ReactNode } from "react";
import { ThemeProvider } from "@platform/ui";

export interface ThemeDemoProviderProps {
  children: ReactNode;
}

/**
 * Wraps theme-dependent demos when the host has not mounted ThemeProvider yet.
 * Safe to nest — the inner provider scopes preference for interactive examples.
 */
export function ThemeDemoProvider({ children }: ThemeDemoProviderProps) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
