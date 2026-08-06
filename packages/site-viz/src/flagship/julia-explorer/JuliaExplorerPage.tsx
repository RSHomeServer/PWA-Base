import { useCallback, useMemo, useRef, useState } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent,
  WheelEvent as ReactWheelEvent,
} from "react";
import { Button } from "@platform/ui";
import { downloadCanvasPng } from "@platform/export";
import { clamp } from "@platform/math";
import {
  FLAGSHIP_CANVAS_HEIGHT,
  FLAGSHIP_CANVAS_WIDTH,
  prepareCanvas,
} from "../../canvas/setup.js";
import { FlagshipShell } from "../shared/FlagshipShell.js";
import { useAnimationFrame } from "../shared/useAnimationFrame.js";
import { useShortcuts } from "../shared/useShortcuts.js";
import { toCanvasPoint, primaryTouch } from "../shared/pointer.js";
import { FRACTAL_PALETTES, FRACTAL_PALETTE_NAMES } from "../shared/palettes.js";
import canvasStyles from "../shared/canvasStyles.js";
import {
  computeBudget,
  createField,
  makeJuliaEscape,
  mandelbrotEscape,
  paintField,
} from "../mandelbrot-explorer/engine.js";
import type { FractalField, FractalView } from "../mandelbrot-explorer/engine.js";
import styles from "./JuliaExplorerPage.module.css";

const WIDTH = FLAGSHIP_CANVAS_WIDTH;
const HEIGHT = FLAGSHIP_CANVAS_HEIGHT;
const MINI_W = 168;
const MINI_H = Math.round((MINI_W * HEIGHT) / WIDTH);
const MANDEL_HOME: FractalView = { centerRe: -0.5, centerIm: 0, span: 3 };
const HOME_VIEW: FractalView = { centerRe: 0, centerIm: 0, span: 3.2 };
const HOME_C = { re: -0.7, im: 0.27015 };

const PRESETS: { label: string; re: number; im: number }[] = [
  { label: "Rabbit", re: -0.7, im: 0.27015 },
  { label: "Dendrite", re: -0.235, im: 0.827 },
  { label: "Spiral", re: -0.8, im: 0.156 },
  { label: "San Marco", re: -0.75, im: 0 },
  { label: "Siegel disk", re: -0.391, im: -0.587 },
  { label: "Dust", re: 0.285, im: 0.01 },
];

export function JuliaExplorerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const miniDrawnRef = useRef(false);

  const cRef = useRef({ ...HOME_C });
  const viewRef = useRef<FractalView>({ ...HOME_VIEW });
  const fieldRef = useRef<FractalField | null>(null);
  const fieldKeyRef = useRef<string>("");
  const imageDataRef = useRef<ImageData | null>(null);
  const isSettingCRef = useRef(false);
  const dragButtonRef = useRef<{ x: number; y: number; mode: "pan" | "setC" } | null>(null);
  const zoomInertiaRef = useRef<{ factor: number; cx: number; cy: number } | null>(null);
  const palettePhaseRef = useRef(0);
  const lastClickRef = useRef(0);

  const [paletteIdx, setPaletteIdx] = useState(0);
  const paletteName = FRACTAL_PALETTE_NAMES[paletteIdx % FRACTAL_PALETTE_NAMES.length]!;
  const palette = FRACTAL_PALETTES[paletteName]!;

  const reset = useCallback(() => {
    cRef.current = { ...HOME_C };
    viewRef.current = { ...HOME_VIEW };
    fieldKeyRef.current = "";
  }, []);

  const setCFromPlane = useCallback((planeX: number, planeY: number) => {
    cRef.current = { re: clamp(planeX, -2, 2), im: clamp(planeY, -2, 2) };
  }, []);

  const setCFromMandelPixel = useCallback(
    (fx: number, fy: number) => {
      setCFromPlane(
        MANDEL_HOME.centerRe + (fx - 0.5) * MANDEL_HOME.span,
        MANDEL_HOME.centerIm + (fy - 0.5) * (MANDEL_HOME.span / (MINI_W / MINI_H)),
      );
    },
    [setCFromPlane],
  );

  const nudgeC = useCallback((dre: number, dim: number) => {
    cRef.current = {
      re: clamp(cRef.current.re + dre, -2, 2),
      im: clamp(cRef.current.im + dim, -2, 2),
    };
  }, []);

  const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
    const v = viewRef.current;
    const aspect = WIDTH / HEIGHT;
    const re = v.centerRe + (cx / WIDTH - 0.5) * v.span;
    const im = v.centerIm + (cy / HEIGHT - 0.5) * (v.span / aspect);
    const newSpan = clamp(v.span * factor, 0.002, 6);
    viewRef.current = {
      centerRe: re - (re - v.centerRe) * (newSpan / v.span),
      centerIm: im - (im - v.centerIm) * (newSpan / v.span),
      span: newSpan,
    };
  }, []);

  const panBy = useCallback((dxPx: number, dyPx: number) => {
    const v = viewRef.current;
    const aspect = WIDTH / HEIGHT;
    viewRef.current = {
      centerRe: v.centerRe - (dxPx / WIDTH) * v.span,
      centerIm: v.centerIm - (dyPx / HEIGHT) * (v.span / aspect),
      span: v.span,
    };
  }, []);

  const cyclePalette = useCallback(
    () => setPaletteIdx((i) => (i + 1) % FRACTAL_PALETTE_NAMES.length),
    [],
  );

  const applyPreset = useCallback((re: number, im: number) => {
    cRef.current = { re, im };
  }, []);

  // Static Mandelbrot overview drawn once, used as the "linked c parameter" map.
  const drawMinimapOnce = useCallback(() => {
    const mini = miniRef.current;
    if (!mini || miniDrawnRef.current) {
      return;
    }
    miniDrawnRef.current = true;
    const ctx = prepareCanvas(mini, MINI_W, MINI_H, { maxDpr: 1 });
    const field = createField(MINI_W, MINI_H, 150);
    computeBudget(field, MANDEL_HOME, 5000, mandelbrotEscape);
    const imageData = ctx.createImageData(MINI_W, MINI_H);
    paintField(field, imageData, FRACTAL_PALETTES.Mono!, 0, 1);
    ctx.putImageData(imageData, 0, 0);
  }, []);

  useAnimationFrame((dt) => {
    drawMinimapOnce();
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = prepareCanvas(canvas, WIDTH, HEIGHT, { maxDpr: 1.5 });
    if (!imageDataRef.current || imageDataRef.current.width !== WIDTH) {
      imageDataRef.current = ctx.createImageData(WIDTH, HEIGHT);
    }

    // Scroll-zoom inertia.
    const zi = zoomInertiaRef.current;
    if (zi && Math.abs(Math.log(zi.factor)) > 0.001) {
      const step = Math.pow(zi.factor, Math.min(1, dt * 6));
      zoomAt(zi.cx, zi.cy, step);
      zi.factor /= step;
    } else {
      zoomInertiaRef.current = null;
    }

    const c = cRef.current;
    const view = viewRef.current;
    const iterBudget = isSettingCRef.current ? 70 : 320;
    const key = `${c.re.toFixed(6)}|${c.im.toFixed(6)}|${view.centerRe.toFixed(9)}|${view.centerIm.toFixed(9)}|${view.span.toExponential(6)}|${iterBudget}`;
    if (key !== fieldKeyRef.current) {
      fieldRef.current = createField(WIDTH, HEIGHT, iterBudget);
      fieldKeyRef.current = key;
    }
    const field = fieldRef.current!;
    if (field.rowsDone < HEIGHT) {
      computeBudget(field, view, 14, makeJuliaEscape(c.re, c.im));
    }

    palettePhaseRef.current += dt * 0.04;
    paintField(field, imageDataRef.current, palette, palettePhaseRef.current, 4);
    ctx.putImageData(imageDataRef.current, 0, 0);

    const vig = ctx.createRadialGradient(
      WIDTH * 0.5,
      HEIGHT * 0.5,
      HEIGHT * 0.25,
      WIDTH * 0.5,
      HEIGHT * 0.5,
      HEIGHT * 0.75,
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.32)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (hudRef.current) {
      const zoom = 3.2 / view.span;
      hudRef.current.textContent = `c = ${c.re.toFixed(4)} ${c.im >= 0 ? "+" : "−"} ${Math.abs(c.im).toFixed(4)}i  ·  zoom ${zoom.toFixed(2)}×`;
    }
    if (markerRef.current) {
      const fx = 0.5 + (c.re - MANDEL_HOME.centerRe) / MANDEL_HOME.span;
      const fy = 0.5 + (c.im - MANDEL_HOME.centerIm) / (MANDEL_HOME.span / (MINI_W / MINI_H));
      markerRef.current.style.left = `${fx * MINI_W}px`;
      markerRef.current.style.top = `${fy * MINI_H}px`;
    }
  });

  const handleWheel = useCallback((e: ReactWheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const p = toCanvasPoint(canvas, e.clientX, e.clientY, WIDTH, HEIGHT);
    const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    const zi = zoomInertiaRef.current;
    if (zi && Math.hypot(zi.cx - p.x, zi.cy - p.y) < 40) {
      zi.factor *= factor;
      zi.cx = p.x;
      zi.cy = p.y;
    } else {
      zoomInertiaRef.current = { factor, cx: p.x, cy: p.y };
    }
  }, []);

  const pixelToCPlane = useCallback(
    (canvas: HTMLCanvasElement, clientX: number, clientY: number) => {
      const p = toCanvasPoint(canvas, clientX, clientY, WIDTH, HEIGHT);
      const view = viewRef.current;
      const aspect = WIDTH / HEIGHT;
      return {
        re: view.centerRe + (p.x / WIDTH - 0.5) * view.span,
        im: view.centerIm + (p.y / HEIGHT - 0.5) * (view.span / aspect),
      };
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const now = performance.now();
      if (now - lastClickRef.current < 320 && e.button === 0 && !e.shiftKey) {
        reset();
        lastClickRef.current = 0;
        dragButtonRef.current = null;
        return;
      }
      lastClickRef.current = now;
      const mode = e.button === 2 || e.shiftKey ? "pan" : "setC";
      dragButtonRef.current = { x: e.clientX, y: e.clientY, mode };
      if (mode === "setC") {
        isSettingCRef.current = true;
        const canvas = canvasRef.current;
        if (canvas) {
          const p = pixelToCPlane(canvas, e.clientX, e.clientY);
          setCFromPlane(p.re, p.im);
        }
      }
    },
    [pixelToCPlane, reset, setCFromPlane],
  );

  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const drag = dragButtonRef.current;
      if (!drag) {
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      if (drag.mode === "setC") {
        const p = pixelToCPlane(canvas, e.clientX, e.clientY);
        setCFromPlane(p.re, p.im);
      } else {
        const rect = canvas.getBoundingClientRect();
        panBy(
          (e.clientX - drag.x) * (WIDTH / rect.width),
          (e.clientY - drag.y) * (HEIGHT / rect.height),
        );
      }
      drag.x = e.clientX;
      drag.y = e.clientY;
    },
    [panBy, pixelToCPlane, setCFromPlane],
  );

  const endDrag = useCallback(() => {
    dragButtonRef.current = null;
    isSettingCRef.current = false;
    fieldKeyRef.current = "";
  }, []);

  const touchRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback(
    (e: ReactTouchEvent<HTMLCanvasElement>) => {
      const t = primaryTouch(e.nativeEvent);
      const canvas = canvasRef.current;
      if (t && canvas) {
        touchRef.current = { x: t.clientX, y: t.clientY };
        isSettingCRef.current = true;
        const p = pixelToCPlane(canvas, t.clientX, t.clientY);
        setCFromPlane(p.re, p.im);
      }
    },
    [pixelToCPlane, setCFromPlane],
  );
  const handleTouchMove = useCallback(
    (e: ReactTouchEvent<HTMLCanvasElement>) => {
      const t = primaryTouch(e.nativeEvent);
      const canvas = canvasRef.current;
      if (t && canvas) {
        const p = pixelToCPlane(canvas, t.clientX, t.clientY);
        setCFromPlane(p.re, p.im);
      }
    },
    [pixelToCPlane, setCFromPlane],
  );
  const handleTouchEnd = useCallback(() => {
    touchRef.current = null;
    isSettingCRef.current = false;
    fieldKeyRef.current = "";
  }, []);

  const handleMiniClick = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const mini = miniRef.current;
      if (!mini) {
        return;
      }
      const rect = mini.getBoundingClientRect();
      setCFromMandelPixel(
        (e.clientX - rect.left) / rect.width,
        (e.clientY - rect.top) / rect.height,
      );
    },
    [setCFromMandelPixel],
  );

  useShortcuts({
    arrowup: () => nudgeC(0, -0.01),
    arrowdown: () => nudgeC(0, 0.01),
    arrowleft: () => nudgeC(-0.01, 0),
    arrowright: () => nudgeC(0.01, 0),
    r: reset,
    p: cyclePalette,
    "1": () => applyPreset(PRESETS[0]!.re, PRESETS[0]!.im),
    "2": () => applyPreset(PRESETS[1]!.re, PRESETS[1]!.im),
    "3": () => applyPreset(PRESETS[2]!.re, PRESETS[2]!.im),
    "4": () => applyPreset(PRESETS[3]!.re, PRESETS[3]!.im),
    "5": () => applyPreset(PRESETS[4]!.re, PRESETS[4]!.im),
    "6": () => applyPreset(PRESETS[5]!.re, PRESETS[5]!.im),
  });

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      downloadCanvasPng("julia-explorer.png", canvas);
    }
  }, []);

  const shortcuts = useMemo(
    () => [
      { keys: "Drag", label: "Live-set c from cursor" },
      { keys: "Double-click", label: "Reset view & c home" },
      { keys: "Shift+Drag / Right-drag", label: "Pan the Julia view" },
      { keys: "Scroll", label: "Zoom the Julia view (with inertia)" },
      { keys: "↑ ↓ ← →", label: "Nudge c" },
      { keys: "1–6", label: "Jump to a preset c" },
      { keys: "P", label: "Cycle palette" },
      { keys: "R", label: "Reset" },
    ],
    [],
  );

  return (
    <FlagshipShell
      title="Julia Explorer"
      tagline="Drag anywhere on the plane to live-steer the constant c — the whole fractal reshapes instantly."
      demoPath="/julia-explorer"
      shortcuts={shortcuts}
      onReset={reset}
      onExport={handleExport}
      statusBar={<div ref={hudRef} className={styles.hud} />}
      toolbarExtra={
        <>
          <Button variant="secondary" size="sm" onClick={cyclePalette}>
            🎨 {paletteName}
          </Button>
          {PRESETS.map((preset, i) => (
            <Button
              key={preset.label}
              variant="secondary"
              size="sm"
              onClick={() => applyPreset(preset.re, preset.im)}
              title={`${preset.re}, ${preset.im}i`}
            >
              {i + 1}. {preset.label}
            </Button>
          ))}
        </>
      }
      overlay={
        <div className={canvasStyles.minimap}>
          <canvas
            ref={miniRef}
            width={MINI_W}
            height={MINI_H}
            style={{ width: MINI_W, height: MINI_H, display: "block", cursor: "pointer" }}
            onClick={handleMiniClick}
            aria-label="Mandelbrot map — click to set c"
          />
          <div ref={markerRef} className={styles.marker} />
        </div>
      }
      about={
        <>
          <p>
            The Julia set for a fixed complex number <em>c</em> is the boundary between starting
            points <em>z₀</em> whose orbit under <em>z → z² + c</em> stays bounded, and those that
            escape. Unlike the Mandelbrot set — which varies <em>c</em> and fixes <em>z₀ = 0</em> —
            here <em>c</em> is the dial and every pixel is a different starting point.
          </p>
          <p>
            Drag anywhere on the canvas to steer <em>c</em> live: the little Mandelbrot map in the
            corner shows exactly where your current <em>c</em> sits — inside the Mandelbrot set, the
            Julia set is connected (a single blob); outside it, the set shatters into dust.
          </p>
        </>
      }
    >
      <canvas
        ref={canvasRef}
        className={canvasStyles.canvas}
        width={WIDTH}
        height={HEIGHT}
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}`, maxWidth: "100%", maxHeight: "100%" }}
        aria-label="Julia explorer canvas"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </FlagshipShell>
  );
}
