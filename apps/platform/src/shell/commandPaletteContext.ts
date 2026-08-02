import { createContext } from "react";

export interface CommandPaletteContextValue {
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);
