import { useEffect, useState } from "react";
import { useReducedMotion } from "./useReducedMotion.js";

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
];

export function useKonamiCode(onMatch: () => void): void {
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const expected = KONAMI[index];
      if (event.key === expected) {
        const next = index + 1;
        if (next === KONAMI.length) {
          onMatch();
          setIndex(0);
        } else {
          setIndex(next);
        }
      } else {
        setIndex(event.key === KONAMI[0] ? 1 : 0);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, onMatch, reducedMotion]);
}
