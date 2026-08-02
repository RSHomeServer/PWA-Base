import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { loadJSON, saveJSON } from "../shared/storage.js";
import { FRACTAL_PALETTES, FRACTAL_PALETTE_NAMES } from "../shared/palettes.js";
import canvasStyles from "../shared/canvasStyles.module.css";
import {
  computeBudget,
  createField,
  mandelbrotEscape,
  paintField,
  suggestMaxIter,
} from "./engine.js";
import type { FractalField, FractalView } from "./engine.js";
import styles from "./MandelbrotExplorerPage.module.css";

const WIDTH = FLAGSHIP_CANVAS_WIDTH;
const HEIGHT = FLAGSHIP_CANVAS_HEIGHT;
const MINI_W = 168;
const MINI_H = Math.round((MINI_W * HEIGHT) / WIDTH);
const HOME: FractalView = { centerRe: -0.5, centerIm: 0, span: 3 };
const BOOKMARKS_KEY = "flagship:mandelbrot-explorer:bookmarks";

interface Bookmark {
  id: string;
  name: string;
  view: FractalView;
}

function viewKey(view: FractalView, maxIter: number): string {
  return `${view.centerRe.toFixed(15)}|${view.centerIm.toFixed(15)}|${view.span.toExponential(6)}|${maxIter}`;
}

export function MandelbrotExplorerPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  const viewRef = useRef<FractalView>({ ...HOME });
  const fieldRef = useRef<FractalField | null>(null);
  const fieldKeyRef = useRef<string>("");
  const imageDataRef = useRef<ImageData | null>(null);
  const dragRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const miniDrawnRef = useRef(false);
  const rectOverlayRef = useRef<HTMLDivElement>(null);
  /** Smooth zoom inertia: target span eases toward wheel input over several frames. */
  const zoomInertiaRef = useRef<{
    factor: number;
    cx: number;
    cy: number;
  } | null>(null);
  const palettePhaseRef = useRef(0);
  const lastClickRef = useRef(0);

  const [paletteIdx, setPaletteIdx] = useState(0);
  const [autoIter, setAutoIter] = useState(true);
  const [manualIter, setManualIter] = useState(300);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => loadJSON(BOOKMARKS_KEY, []));
  const [, forceTick] = useState(0);

  const paletteName = FRACTAL_PALETTE_NAMES[paletteIdx % FRACTAL_PALETTE_NAMES.length]!;
  const palette = FRACTAL_PALETTES[paletteName]!;
  const maxIter = autoIter ? suggestMaxIter(viewRef.current.span) : manualIter;

  const resetView = useCallback(() => {
    viewRef.current = { ...HOME };
    fieldKeyRef.current = "";
    forceTick((n) => n + 1);
  }, []);

  const zoomAt = useCallback((cx: number, cy: number, factor: number) => {
    const v = viewRef.current;
    const aspect = WIDTH / HEIGHT;
    const spanX = v.span;
    const spanY = v.span / aspect;
    const re = v.centerRe + (cx / WIDTH - 0.5) * spanX;
    const im = v.centerIm + (cy / HEIGHT - 0.5) * spanY;
    const newSpan = clamp(v.span * factor, 1e-13, 6);
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

  const saveBookmark = useCallback(() => {
    const view = viewRef.current;
    const bm: Bookmark = {
      id: `${Date.now()}`,
      name: `Zoom ${(3 / view.span).toFixed(0)}×`,
      view: { ...view },
    };
    setBookmarks((prev) => {
      const next = [...prev, bm].slice(-12);
      saveJSON(BOOKMARKS_KEY, next);
      return next;
    });
  }, []);

  const goToBookmark = useCallback((bm: Bookmark) => {
    viewRef.current = { ...bm.view };
  }, []);

  const deleteBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      saveJSON(BOOKMARKS_KEY, next);
      return next;
    });
  }, []);

  // Draw the static low-res overview once for the minimap.
  useEffect(() => {
    const mini = miniRef.current;
    if (!mini || miniDrawnRef.current) {
      return;
    }
    miniDrawnRef.current = true;
    const ctx = prepareCanvas(mini, MINI_W, MINI_H, { maxDpr: 1 });
    const field = createField(MINI_W, MINI_H, 160);
    computeBudget(field, HOME, 5000, mandelbrotEscape);
    const imageData = ctx.createImageData(MINI_W, MINI_H);
    paintField(field, imageData, FRACTAL_PALETTES.Mono!, 0, 1);
    ctx.putImageData(imageData, 0, 0);
  }, []);

  useAnimationFrame((dt) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = prepareCanvas(canvas, WIDTH, HEIGHT, { maxDpr: 1.5 });
    if (!imageDataRef.current || imageDataRef.current.width !== WIDTH) {
      imageDataRef.current = ctx.createImageData(WIDTH, HEIGHT);
    }

    // Apply scroll-zoom inertia.
    const zi = zoomInertiaRef.current;
    if (zi && Math.abs(Math.log(zi.factor)) > 0.001) {
      const step = Math.pow(zi.factor, Math.min(1, dt * 6));
      zoomAt(zi.cx, zi.cy, step);
      zi.factor /= step;
    } else {
      zoomInertiaRef.current = null;
    }

    const view = viewRef.current;
    const key = viewKey(view, maxIter);
    if (key !== fieldKeyRef.current) {
      fieldRef.current = createField(WIDTH, HEIGHT, maxIter);
      fieldKeyRef.current = key;
    }
    const field = fieldRef.current!;
    if (field.rowsDone < HEIGHT) {
      computeBudget(field, view, 14, mandelbrotEscape);
    }

    // Smooth palette drift — continuous phase, no jarring jumps.
    palettePhaseRef.current += dt * 0.035;
    paintField(field, imageDataRef.current, palette, palettePhaseRef.current, 5);
    ctx.putImageData(imageDataRef.current, 0, 0);

    // Soft vignette for depth.
    const vig = ctx.createRadialGradient(
      WIDTH * 0.5,
      HEIGHT * 0.5,
      HEIGHT * 0.25,
      WIDTH * 0.5,
      HEIGHT * 0.5,
      HEIGHT * 0.75,
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (hudRef.current) {
      const zoom = 3 / view.span;
      const pct =
        field.rowsDone >= HEIGHT
          ? ""
          : ` · rendering ${Math.round((field.rowsDone / HEIGHT) * 100)}%`;
      hudRef.current.textContent = `re ${view.centerRe.toFixed(6)}  im ${view.centerIm.toFixed(6)}  ·  zoom ${zoom.toExponential(2)}×  ·  iter ${maxIter}${pct}`;
    }

    const rect = rectOverlayRef.current;
    if (rect) {
      const zoom = view.span / HOME.span;
      const w = MINI_W * zoom;
      const h = MINI_H * zoom;
      const cxFrac = 0.5 + (view.centerRe - HOME.centerRe) / HOME.span;
      const cyFrac = 0.5 + (view.centerIm - HOME.centerIm) / HOME.span;
      rect.style.left = `${cxFrac * MINI_W - w / 2}px`;
      rect.style.top = `${cyFrac * MINI_H - h / 2}px`;
      rect.style.width = `${Math.max(2, w)}px`;
      rect.style.height = `${Math.max(2, h)}px`;
    }
  });

  const handleWheel = useCallback((e: ReactWheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const p = toCanvasPoint(canvas, e.clientX, e.clientY, WIDTH, HEIGHT);
    const factor = e.deltaY > 0 ? 1.18 : 1 / 1.18;
    const zi = zoomInertiaRef.current;
    if (zi && Math.hypot(zi.cx - p.x, zi.cy - p.y) < 40) {
      zi.factor *= factor;
      zi.cx = p.x;
      zi.cy = p.y;
    } else {
      zoomInertiaRef.current = { factor, cx: p.x, cy: p.y };
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const now = performance.now();
      if (now - lastClickRef.current < 320 && !e.shiftKey && e.button === 0) {
        // Double-click resets to home view.
        resetView();
        lastClickRef.current = 0;
        dragRef.current = null;
        return;
      }
      lastClickRef.current = now;
      dragRef.current = { x: e.clientX, y: e.clientY, moved: false };
    },
    [resetView],
  );

  const handlePointerMove = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        drag.moved = true;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = WIDTH / rect.width;
        const scaleY = HEIGHT / rect.height;
        panBy(dx * scaleX, dy * scaleY);
      }
      drag.x = e.clientX;
      drag.y = e.clientY;
    },
    [panBy],
  );

  const handlePointerUp = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const drag = dragRef.current;
      dragRef.current = null;
      if (!drag || drag.moved) {
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const p = toCanvasPoint(canvas, e.clientX, e.clientY, WIDTH, HEIGHT);
      zoomAt(p.x, p.y, e.button === 2 || e.shiftKey ? 2 : 0.5);
    },
    [zoomAt],
  );

  const touchStateRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = useCallback((e: ReactTouchEvent<HTMLCanvasElement>) => {
    const t = primaryTouch(e.nativeEvent);
    if (t) {
      touchStateRef.current = { x: t.clientX, y: t.clientY };
    }
  }, []);
  const handleTouchMove = useCallback(
    (e: ReactTouchEvent<HTMLCanvasElement>) => {
      const t = primaryTouch(e.nativeEvent);
      const prev = touchStateRef.current;
      if (!t || !prev) {
        return;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        panBy(
          (t.clientX - prev.x) * (WIDTH / rect.width),
          (t.clientY - prev.y) * (HEIGHT / rect.height),
        );
      }
      touchStateRef.current = { x: t.clientX, y: t.clientY };
    },
    [panBy],
  );

  const handleMiniClick = useCallback((e: ReactMouseEvent<HTMLCanvasElement>) => {
    const mini = miniRef.current;
    if (!mini) {
      return;
    }
    const rect = mini.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    viewRef.current = {
      centerRe: HOME.centerRe + (fx - 0.5) * HOME.span,
      centerIm: HOME.centerIm + (fy - 0.5) * HOME.span,
      span: viewRef.current.span,
    };
  }, []);

  useShortcuts({
    "+": () => zoomAt(WIDTH / 2, HEIGHT / 2, 1 / 1.5),
    "=": () => zoomAt(WIDTH / 2, HEIGHT / 2, 1 / 1.5),
    "-": () => zoomAt(WIDTH / 2, HEIGHT / 2, 1.5),
    arrowup: () => panBy(0, -60),
    arrowdown: () => panBy(0, 60),
    arrowleft: () => panBy(-60, 0),
    arrowright: () => panBy(60, 0),
    r: resetView,
    p: cyclePalette,
    b: saveBookmark,
  });

  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      downloadCanvasPng("mandelbrot-explorer.png", canvas);
    }
  }, []);

  const shortcuts = useMemo(
    () => [
      { keys: "Drag", label: "Pan the view" },
      { keys: "Click", label: "Zoom in 2×" },
      { keys: "Double-click", label: "Reset view home" },
      { keys: "Shift+Click / Right-click", label: "Zoom out" },
      { keys: "Scroll", label: "Zoom at cursor (with inertia)" },
      { keys: "+ / -", label: "Zoom in / out" },
      { keys: "↑ ↓ ← →", label: "Pan" },
      { keys: "R", label: "Reset view" },
      { keys: "P", label: "Cycle palette" },
      { keys: "B", label: "Save bookmark" },
    ],
    [],
  );

  return (
    <FlagshipShell
      title="Mandelbrot Explorer"
      tagline="Infinite zoom into the boundary of z → z² + c, with smooth colouring and animated palettes."
      demoPath="/mandelbrot-explorer"
      shortcuts={shortcuts}
      onReset={resetView}
      onExport={handleExport}
      statusBar={<div ref={hudRef} className={styles.hud} />}
      toolbarExtra={
        <>
          <Button variant="secondary" size="sm" onClick={cyclePalette}>
            🎨 {paletteName}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setAutoIter((v) => !v)}
            aria-pressed={autoIter}
          >
            {autoIter ? "Auto detail" : `Detail ${manualIter}`}
          </Button>
          {!autoIter ? (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setManualIter((v) => Math.max(50, v - 50))}
              >
                −Iter
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setManualIter((v) => Math.min(2000, v + 50))}
              >
                +Iter
              </Button>
            </>
          ) : null}
          <Button variant="secondary" size="sm" onClick={saveBookmark}>
            ★ Bookmark
          </Button>
        </>
      }
      overlay={
        <>
          <div className={canvasStyles.minimap}>
            <canvas
              ref={miniRef}
              width={MINI_W}
              height={MINI_H}
              style={{ width: MINI_W, height: MINI_H, display: "block", cursor: "pointer" }}
              onClick={handleMiniClick}
              aria-label="Mandelbrot overview minimap"
            />
            <div ref={rectOverlayRef} className={styles.miniRect} />
          </div>
          {bookmarks.length > 0 ? (
            <div className={styles.bookmarkPanel}>
              <span className={styles.bookmarkTitle}>Bookmarks</span>
              <ul className={styles.bookmarkList}>
                {bookmarks.map((bm) => (
                  <li key={bm.id}>
                    <button type="button" onClick={() => goToBookmark(bm)}>
                      {bm.name}
                    </button>
                    <button
                      type="button"
                      className={styles.bookmarkDelete}
                      onClick={() => deleteBookmark(bm.id)}
                      aria-label={`Delete bookmark ${bm.name}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      }
      about={
        <>
          <p>
            The Mandelbrot set contains every complex number <em>c</em> for which the sequence{" "}
            <em>z → z² + c</em> (starting at <em>z = 0</em>) never escapes to infinity. Points that
            escape are shaded by <strong>how quickly</strong> they escape, using a continuous
            (fractional) iteration count so colour bands stay smooth even at extreme zoom.
          </p>
          <p>
            Drag to pan, scroll or click to zoom toward the cursor, and watch detail resolve
            progressively — the renderer spends a small time budget per frame so the page never
            freezes, even while it works through thousands of iterations per pixel deep in the zoom.
            Save the views you like as bookmarks; they persist in this browser.
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
        aria-label="Mandelbrot explorer canvas"
        onWheel={handleWheel}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => {
          dragRef.current = null;
        }}
        onContextMenu={(e) => e.preventDefault()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      />
    </FlagshipShell>
  );
}
