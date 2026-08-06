import { useEffect, useRef } from "react";

export type ShortcutHandlers = Record<string, (e: KeyboardEvent) => void>;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

/**
 * Registers window-level keyboard shortcuts keyed by `event.key` (lower-cased
 * for single characters, e.g. "r", " ", "arrowup"). Ignored while focus is in
 * a form field so typing still works elsewhere on the page.
 */
export function useShortcuts(handlers: ShortcutHandlers, active = true): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) {
        return;
      }
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
      const handler = handlersRef.current[key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);
}
