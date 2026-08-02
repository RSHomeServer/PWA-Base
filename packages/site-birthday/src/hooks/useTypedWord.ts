import { useEffect, useRef } from "react";

/**
 * Listens for a word typed anywhere on the page (not inside form fields)
 * and fires a callback when it matches, Konami-style but for letters.
 */
export function useTypedWord(word: string, onMatch: () => void): void {
  const bufferRef = useRef("");
  const target = word.toLowerCase();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const activeTag = (event.target as HTMLElement | null)?.tagName;
      if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;
      if (event.key.length !== 1) return;

      bufferRef.current = (bufferRef.current + event.key.toLowerCase()).slice(-target.length);
      if (bufferRef.current === target) {
        bufferRef.current = "";
        onMatch();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onMatch, target]);
}
