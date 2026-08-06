import type { ReactNode } from "react";
import type { PlatformNavConfig } from "./nav.js";
import { PlatformNavContext } from "./PlatformNavContext.js";

export function PlatformNavProvider({
  nav,
  children,
}: {
  nav?: PlatformNavConfig | null;
  children: ReactNode;
}) {
  return (
    <PlatformNavContext.Provider value={nav ?? null}>{children}</PlatformNavContext.Provider>
  );
}
