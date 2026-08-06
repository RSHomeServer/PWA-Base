import { createContext, useContext } from "react";
import type { PlatformNavConfig } from "./nav.js";

export const PlatformNavContext = createContext<PlatformNavConfig | null>(null);

export function usePlatformNavConfig(): PlatformNavConfig | null {
  return useContext(PlatformNavContext);
}
