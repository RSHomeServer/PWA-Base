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

/** Logical canvas dimensions — display size is controlled via CSS (max 960px wide). */
export const DEFAULT_CANVAS_WIDTH = 960;
export const DEFAULT_CANVAS_HEIGHT = 720;
export const DEFAULT_CANVAS_ASPECT = DEFAULT_CANVAS_WIDTH / DEFAULT_CANVAS_HEIGHT;

/** Larger desktop-first canvas dimensions used by flagship exhibits. */
export const FLAGSHIP_CANVAS_WIDTH = 1280;
export const FLAGSHIP_CANVAS_HEIGHT = 800;
export const FLAGSHIP_CANVAS_ASPECT = FLAGSHIP_CANVAS_WIDTH / FLAGSHIP_CANVAS_HEIGHT;

/**
 * Simulation grid resolution for flagship fluid-style sims. Must stay a power of
 * two — the fluid solver wraps indices with a bitmask instead of modulo, which is
 * what makes 256 cheap enough to run at 60fps while looking conference-wall sharp
 * (4x the cells of the old 128 grid).
 */
export const FLAGSHIP_SIM_GRID = 256;

/** Standard devicePixelRatio ceiling for flagship canvases — sharp on 4K walls. */
export const FLAGSHIP_MAX_DPR = 2;

/** Ceiling used only while a FlagshipShell experience is in immersive fullscreen. */
export const FLAGSHIP_IMMERSIVE_MAX_DPR = 2.5;
