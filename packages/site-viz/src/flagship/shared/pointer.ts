export interface PointerPos {
  x: number;
  y: number;
}

/** Map a client-space (viewport) coordinate onto canvas logical (CSS pixel) space. */
export function toCanvasPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  logicalWidth: number,
  logicalHeight: number,
): PointerPos {
  const rect = canvas.getBoundingClientRect();
  const rw = rect.width || logicalWidth;
  const rh = rect.height || logicalHeight;
  return {
    x: ((clientX - rect.left) / rw) * logicalWidth,
    y: ((clientY - rect.top) / rh) * logicalHeight,
  };
}

export function primaryTouch(e: TouchEvent): Touch | null {
  return e.touches.item(0) ?? e.changedTouches.item(0) ?? null;
}
