/** Compare param snapshots to detect when a simulation should reinitialize. */
export function paramsKey(values: Record<string, unknown>, ids: string[]): string {
  return ids.map((id) => `${id}:${String(values[id])}`).join("|");
}

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function fadeCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  alpha: number,
  fill: string,
): void {
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = fill;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
}
