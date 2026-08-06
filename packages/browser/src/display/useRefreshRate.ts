import { useCallback, useRef, useState } from "react";

const COMMON_RATES = [30, 48, 60, 75, 90, 100, 120, 144, 165, 180, 240];

export function nearestCommonRefreshRate(hz: number): number {
  return COMMON_RATES.reduce((best, rate) =>
    Math.abs(rate - hz) < Math.abs(best - hz) ? rate : best,
  );
}

export interface RefreshRateState {
  estimatedHz: number | null;
  nearestHz: number | null;
  measuring: boolean;
  measure: () => void;
}

/** Samples rAF frame intervals for ~1.2s and returns a median-based FPS estimate. */
export function useRefreshRate(): RefreshRateState {
  const [estimatedHz, setEstimatedHz] = useState<number | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const frameRef = useRef<number | null>(null);

  const measure = useCallback(() => {
    if (measuring) {
      return;
    }
    setMeasuring(true);
    const samples: number[] = [];
    let last = performance.now();
    const start = last;
    const DURATION = 1200;

    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      if (delta > 0 && delta < 100) {
        samples.push(1000 / delta);
      }
      if (now - start < DURATION) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        const sorted = [...samples].sort((a, b) => a - b);
        const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : null;
        setEstimatedHz(median ?? null);
        setMeasuring(false);
      }
    };

    frameRef.current = requestAnimationFrame((now) => {
      last = now;
      frameRef.current = requestAnimationFrame(tick);
    });
  }, [measuring]);

  const nearestHz = estimatedHz !== null ? nearestCommonRefreshRate(estimatedHz) : null;

  return { estimatedHz, nearestHz, measuring, measure };
}
