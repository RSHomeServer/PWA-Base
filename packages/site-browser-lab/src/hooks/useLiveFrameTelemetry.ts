import { useEffect, useState } from "react";

const FPS_HISTORY_LENGTH = 120;

export function useLiveFrameTelemetry() {
  const [fps, setFps] = useState(0);
  const [frameMs, setFrameMs] = useState(0);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      frames += 1;
      if (now - last >= 400) {
        const measured = Math.round((frames * 1000) / (now - last));
        setFps(measured);
        setFrameMs((now - last) / frames);
        setFpsHistory((prev) => [...prev, measured].slice(-FPS_HISTORY_LENGTH));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return { fps, frameMs, fpsHistory };
}

export function fpsHealth(fps: number): {
  tone: "good" | "warn" | "bad" | "pending";
  status: string;
} {
  if (fps <= 0) return { tone: "pending", status: "Calibrating scope…" };
  if (fps >= 55) return { tone: "good", status: "Signal stable" };
  if (fps >= 30) return { tone: "warn", status: "Frame variance detected" };
  return { tone: "bad", status: "Frame budget exceeded" };
}
