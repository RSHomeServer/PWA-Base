import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ParameterPanel } from "@platform/controls";
import type { ParamDef, ParamValue, ParamValues } from "@platform/controls";
import { downloadCanvasPng } from "@platform/export";
import { Button, Link } from "@platform/ui";
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH, prepareCanvas } from "../canvas/setup.js";
import { adjacentDemos, demoHref } from "../demos/catalog.js";
import { prefersReducedMotion } from "../exhibits/lib/simulation.js";
import "../site.css";
import styles from "./DemoShell.module.css";

export interface DemoShellProps {
  title: string;
  /** Route path segment, e.g. "/mandelbrot" — enables prev/next demo navigation. */
  demoPath?: string;
  children: ReactNode;
  params: ParamDef[];
  values: ParamValues;
  onChange: (id: string, value: ParamValue) => void;
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, time?: number) => void;
  exportFilename: string;
  width?: number;
  height?: number;
  /** When true, redraws every frame with elapsed time in seconds. */
  animated?: boolean;
  /** Reset parameter values to defaults. */
  onReset?: () => void;
}

export function DemoShell({
  title,
  demoPath,
  children,
  params,
  values,
  onChange,
  draw,
  exportFilename,
  width = DEFAULT_CANVAS_WIDTH,
  height = DEFAULT_CANVAS_HEIGHT,
  animated = false,
  onReset,
}: DemoShellProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasFrameRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number | undefined>(undefined);

  const renderFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const ctx = prepareCanvas(canvas, width, height);
      draw(ctx, width, height, time);
    },
    [draw, height, width],
  );

  useEffect(() => {
    if (animated && !prefersReducedMotion()) {
      let lastStamp: number | undefined;

      const tick = (stamp: number) => {
        if (lastStamp !== undefined) {
          timeRef.current += (stamp - lastStamp) / 1000;
        }
        lastStamp = stamp;
        renderFrame(timeRef.current);
        frameRef.current = requestAnimationFrame(tick);
      };

      frameRef.current = requestAnimationFrame(tick);

      return () => {
        if (frameRef.current !== undefined) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }

    timeRef.current = 0;
    renderFrame(0);

    return undefined;
  }, [animated, renderFrame, values]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng(exportFilename, canvas);
  }, [exportFilename]);

  const handleFullscreen = useCallback(() => {
    const frame = canvasFrameRef.current;
    if (!frame) {
      return;
    }
    void frame.requestFullscreen?.();
  }, []);

  const { prev, next } = demoPath ? adjacentDemos(demoPath) : { prev: null, next: null };

  return (
    <main className="viz-page">
      <header className="viz-page-header">
        <Link href={demoHref("")} className="viz-back-link">
          ← All visualisations
        </Link>
        <h1>{title}</h1>
      </header>

      <div className={styles.demoShell}>
        <div className={styles.workspace}>
          <div className={styles.canvasWrap}>
            <div ref={canvasFrameRef} className={styles.canvasFrame}>
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                width={width}
                height={height}
                aria-label={`${title} canvas`}
              />
            </div>
            <div className={styles.canvasActions}>
              {onReset ? (
                <Button variant="secondary" size="sm" onClick={onReset}>
                  Reset
                </Button>
              ) : null}
              <Button variant="secondary" size="sm" onClick={handleExport}>
                Download PNG
              </Button>
              <Button variant="secondary" size="sm" onClick={handleFullscreen}>
                Fullscreen
              </Button>
            </div>
          </div>

          <aside className={styles.controls}>
            <h2 className={styles.controlsTitle}>Parameters</h2>
            <ParameterPanel params={params} values={values} onChange={onChange} />
          </aside>
        </div>

        <details className={styles.about}>
          <summary className={styles.aboutSummary}>About this demo</summary>
          <div className={styles.aboutBody}>
            <div className={styles.prose}>{children}</div>
          </div>
        </details>

        {demoPath ? (
          <nav className={styles.demoNav} aria-label="Demo navigation">
            {prev ? (
              <Link href={demoHref(prev.path)}>← {prev.title}</Link>
            ) : (
              <span className={styles.demoNavPlaceholder} aria-hidden="true">
                ←
              </span>
            )}
            {next ? (
              <Link href={demoHref(next.path)}>{next.title} →</Link>
            ) : (
              <span className={styles.demoNavPlaceholder} aria-hidden="true">
                →
              </span>
            )}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
