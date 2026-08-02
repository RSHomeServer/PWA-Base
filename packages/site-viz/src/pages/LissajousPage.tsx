import { useCallback, useEffect, useRef, useState } from "react";
import type { ParamDef, ParamValue, ParamValues } from "@platform/controls";
import { ParameterPanel } from "@platform/controls";
import { downloadCanvasPng } from "@platform/export";
import { Button, Link } from "@platform/ui";
import { drawLissajous } from "../canvas/lissajous.js";
import { DEFAULT_CANVAS_HEIGHT, DEFAULT_CANVAS_WIDTH, prepareCanvas } from "../canvas/setup.js";
import { adjacentDemos, demoHref } from "../demos/catalog.js";
import styles from "../components/DemoShell.module.css";
import "../site.css";

const paramDefs: ParamDef[] = [
  {
    id: "freqA",
    type: "number",
    label: "Frequency A",
    description: "Horizontal oscillation frequency.",
    min: 1,
    max: 9,
    step: 1,
  },
  {
    id: "freqB",
    type: "number",
    label: "Frequency B",
    description: "Vertical oscillation frequency.",
    min: 1,
    max: 9,
    step: 1,
  },
  {
    id: "phase",
    type: "number",
    label: "Phase offset",
    description: "Phase difference between the two sine waves (radians).",
    min: 0,
    max: 6.28,
    step: 0.1,
  },
  {
    id: "amplitude",
    type: "number",
    label: "Amplitude",
    min: 0.2,
    max: 1,
    step: 0.05,
  },
  {
    id: "speed",
    type: "number",
    label: "Animation speed",
    min: 0,
    max: 3,
    step: 0.1,
  },
];

const initialValues: ParamValues = {
  freqA: 3,
  freqB: 2,
  phase: 1.57,
  amplitude: 0.9,
  speed: 1,
};

export function LissajousPage() {
  const [values, setValues] = useState<ParamValues>(initialValues);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasFrameRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef(0);
  const frameRef = useRef<number | undefined>(undefined);

  const handleChange = useCallback((id: string, value: ParamValue) => {
    setValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  const renderFrame = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const ctx = prepareCanvas(canvas, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT);
      drawLissajous(ctx, DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT, {
        freqA: Number(values.freqA),
        freqB: Number(values.freqB),
        phase: Number(values.phase),
        amplitude: Number(values.amplitude),
        time,
      });
    },
    [values],
  );

  useEffect(() => {
    let lastStamp: number | undefined;

    const tick = (stamp: number) => {
      if (lastStamp !== undefined) {
        const delta = (stamp - lastStamp) / 1000;
        timeRef.current += delta * Number(values.speed);
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
  }, [renderFrame, values.speed]);

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    downloadCanvasPng("lissajous.png", canvas);
  }, []);

  const handleFullscreen = useCallback(() => {
    const frame = canvasFrameRef.current;
    if (!frame) {
      return;
    }
    void frame.requestFullscreen?.();
  }, []);

  const { prev, next } = adjacentDemos("/lissajous");

  return (
    <main className="viz-page">
      <header className="viz-page-header">
        <Link href={demoHref("")} className="viz-back-link">
          ← All visualisations
        </Link>
        <h1>Lissajous Curves</h1>
      </header>

      <div className={styles.demoShell}>
        <div className={styles.workspace}>
          <div className={styles.canvasWrap}>
            <div ref={canvasFrameRef} className={styles.canvasFrame}>
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                width={DEFAULT_CANVAS_WIDTH}
                height={DEFAULT_CANVAS_HEIGHT}
                aria-label="Lissajous curve canvas"
              />
            </div>
            <div className={styles.canvasActions}>
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
            <ParameterPanel params={paramDefs} values={values} onChange={handleChange} />
          </aside>
        </div>

        <details className={styles.about}>
          <summary className={styles.aboutSummary}>About this demo</summary>
          <div className={styles.aboutBody}>
            <div className={styles.prose}>
              <p>
                Lissajous figures appear when two sinusoidal motions are combined on perpendicular
                axes: <em>x = A sin(a t + δ)</em> and <em>y = B sin(b t)</em>. Integer frequency
                ratios produce closed loops; incommensurate ratios fill denser patterns over time.
              </p>
              <p>
                This demo animates the phase over time so the curve rotates and morphs. Try
                frequency pairs like 3:2 or 5:4, then adjust phase to see how the loop opens and
                closes. Set animation speed to zero to freeze a single curve.
              </p>
            </div>
          </div>
        </details>

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
      </div>
    </main>
  );
}
