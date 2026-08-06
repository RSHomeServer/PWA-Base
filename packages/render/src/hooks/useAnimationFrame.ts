import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "./prefersReducedMotion.js";

/**
 * Drives a continuous requestAnimationFrame loop, calling `callback(dt, elapsed)`
 * every frame with delta-time and total elapsed seconds. Automatically pauses
 * when `running` is false or the tab honours prefers-reduced-motion (the callback
 * still fires once so a static frame renders).
 */
export function useAnimationFrame(
  callback: (dt: number, elapsed: number) => void,
  running = true,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!running) {
      return undefined;
    }

    if (prefersReducedMotion()) {
      callbackRef.current(0, 0);
      return undefined;
    }

    let raf = 0;
    let last: number | null = null;
    let elapsed = 0;

    const tick = (t: number) => {
      if (last !== null) {
        const dt = Math.min((t - last) / 1000, 0.1);
        elapsed += dt;
        callbackRef.current(dt, elapsed);
      }
      last = t;
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}
