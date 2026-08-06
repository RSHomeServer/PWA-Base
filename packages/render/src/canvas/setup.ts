export interface PrepareCanvasOptions {
  /** Cap devicePixelRatio (e.g. to 2) to bound work for expensive per-pixel renders. */
  maxDpr?: number;
  alpha?: boolean;
}

/** Prepare a canvas for crisp 2D drawing at the given CSS pixel size. */
export function prepareCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  options?: PrepareCanvasOptions,
): CanvasRenderingContext2D {
  const rawDpr = window.devicePixelRatio || 1;
  const dpr = options?.maxDpr ? Math.min(rawDpr, options.maxDpr) : rawDpr;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext("2d", { alpha: options?.alpha ?? true });
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** Logical canvas dimensions — display size is controlled via CSS. */
export const DEFAULT_CANVAS_WIDTH = 960;
export const DEFAULT_CANVAS_HEIGHT = 720;
export const DEFAULT_CANVAS_ASPECT = DEFAULT_CANVAS_WIDTH / DEFAULT_CANVAS_HEIGHT;

/** Larger desktop-first canvas dimensions for full-stage experiences. */
export const RENDER_CANVAS_WIDTH = 1280;
export const RENDER_CANVAS_HEIGHT = 800;
export const RENDER_CANVAS_ASPECT = RENDER_CANVAS_WIDTH / RENDER_CANVAS_HEIGHT;

/**
 * Simulation grid resolution for fluid-style sims. Must stay a power of two —
 * solvers wrap indices with a bitmask instead of modulo.
 */
export const RENDER_SIM_GRID = 256;

/** Standard devicePixelRatio ceiling for large canvases. */
export const RENDER_MAX_DPR = 2;

/** DPR ceiling while a render shell is in immersive fullscreen. */
export const RENDER_IMMERSIVE_MAX_DPR = 2.5;
