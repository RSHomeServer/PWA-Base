import { useCallback, useState } from "react";
import { useShortcuts } from "../flagship/shared/useShortcuts.js";
import type { UseLabShortcutsOptions, UseLabShortcutsResult } from "./types.js";

const PREVIEW_COUNT = 4;

/**
 * Lab keyboard layer: transport, help overlay, and exhibit-specific bindings.
 * Ignores key events while focus is in form fields.
 */
export function useLabShortcuts({
  shortcuts,
  handlers,
  active = true,
}: UseLabShortcutsOptions): UseLabShortcutsResult {
  const [showHelp, setShowHelp] = useState(false);

  const toggleHelp = useCallback(() => {
    handlers.onToggleHelp?.();
    setShowHelp((open) => !open);
  }, [handlers]);

  const openHelp = useCallback(() => setShowHelp(true), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);

  useShortcuts(
    {
      "?": toggleHelp,
      " ": () => handlers.onTogglePlay?.(),
      ".": () => handlers.onStep?.(),
      r: () => handlers.onReset?.(),
      f: () => handlers.onFullscreen?.(),
      ...handlers.custom,
    },
    active,
  );

  useShortcuts(
    {
      escape: closeHelp,
    },
    active && showHelp,
  );

  return {
    showHelp,
    setShowHelp,
    toggleHelp,
    openHelp,
    closeHelp,
    previewShortcuts: shortcuts.slice(0, PREVIEW_COUNT),
  };
}
