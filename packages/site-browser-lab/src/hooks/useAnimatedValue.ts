import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion.js";

/**
 * Eases a displayed number toward `target` for a pleasant count-up/gauge feel.
 * Pass `initialFrom` to make the very first mount sweep in from that value
 * (e.g. 0) instead of appearing already at rest.
 */
export function useAnimatedValue(target: number, durationMs = 600, initialFrom?: number): number {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(() => (initialFrom !== undefined ? initialFrom : target));
  const fromRef = useRef(initialFrom !== undefined ? initialFrom : target);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion || !Number.isFinite(target)) {
      setDisplay(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (target - from) * eased;
      setDisplay(value);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [target, durationMs, reducedMotion]);

  return display;
}
