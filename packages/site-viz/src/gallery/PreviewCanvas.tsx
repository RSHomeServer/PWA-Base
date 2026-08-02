import { useEffect, useRef } from "react";
import { prepareCanvas } from "../canvas/setup.js";
import type { PreviewSource } from "./previewResolver.js";

export interface PreviewCanvasProps {
  source: PreviewSource;
  className?: string;
  label: string;
  width?: number;
  height?: number;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PreviewCanvas({
  source,
  className,
  label,
  width = 320,
  height = 180,
}: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = prepareCanvas(canvas, width, height);
    let frameId = 0;
    const start = performance.now();
    const reduced = prefersReducedMotion();
    const animate = source.animated && !reduced;

    const render = (now: number) => {
      const time = (now - start) / 1000;
      source.draw(ctx, width, height, source.defaults, time);
      if (animate) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    if (animate) {
      frameId = window.requestAnimationFrame(render);
    } else {
      source.draw(ctx, width, height, source.defaults, 0);
    }

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [source, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={width}
      height={height}
      aria-label={`Live preview: ${label}`}
      role="img"
    />
  );
}
