import { useEffect } from "react";

/**
 * Applies a subtle breathing glow intensity to a CSS custom property on the
 * document root while the shell is mounted. Respects reduced motion.
 */
export function useAtmosphereBreath(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      document.documentElement.style.setProperty("--shell-glow-intensity", "0.42");
      return;
    }

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const intensity = 0.34 + Math.sin(elapsed * 0.55) * 0.08;
      document.documentElement.style.setProperty("--shell-glow-intensity", intensity.toFixed(3));
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.style.removeProperty("--shell-glow-intensity");
    };
  }, [enabled]);
}
