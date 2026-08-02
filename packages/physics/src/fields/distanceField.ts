/** Signed distance from `(x, y)` to a circle centered at `(cx, cy)` with radius `r`.
 * Negative inside, zero on the boundary, positive outside. */
export function circleSdf(x: number, y: number, cx: number, cy: number, r: number): number {
  const dx = x - cx;
  const dy = y - cy;
  return Math.sqrt(dx * dx + dy * dy) - r;
}

/** Signed distance from `(x, y)` to an axis-aligned box centered at `(cx, cy)` with
 * half-extents `(halfWidth, halfHeight)`. Negative inside, positive outside. */
export function boxSdf(
  x: number,
  y: number,
  cx: number,
  cy: number,
  halfWidth: number,
  halfHeight: number,
): number {
  const dx = Math.abs(x - cx) - halfWidth;
  const dy = Math.abs(y - cy) - halfHeight;
  const outsideDx = Math.max(dx, 0);
  const outsideDy = Math.max(dy, 0);
  const outsideDist = Math.sqrt(outsideDx * outsideDx + outsideDy * outsideDy);
  const insideDist = Math.min(Math.max(dx, dy), 0);
  return outsideDist + insideDist;
}
