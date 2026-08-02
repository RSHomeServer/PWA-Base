export interface SierpinskiParams {
  depth: number;
  fillColor: string;
  strokeColor: string;
}

function drawTriangle(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  depth: number,
  fillColor: string,
): void {
  if (depth === 0) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
    return;
  }

  const mx1 = (x1 + x2) / 2;
  const my1 = (y1 + y2) / 2;
  const mx2 = (x2 + x3) / 2;
  const my2 = (y2 + y3) / 2;
  const mx3 = (x3 + x1) / 2;
  const my3 = (y3 + y1) / 2;

  drawTriangle(ctx, x1, y1, mx1, my1, mx3, my3, depth - 1, fillColor);
  drawTriangle(ctx, mx1, my1, x2, y2, mx2, my2, depth - 1, fillColor);
  drawTriangle(ctx, mx3, my3, mx2, my2, x3, y3, depth - 1, fillColor);
}

export function drawSierpinski(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: SierpinskiParams,
): void {
  const { depth, fillColor, strokeColor } = params;

  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, width, height);

  const size = Math.min(width, height) * 0.85;
  const ax = width / 2;
  const ay = (height - size * (Math.sqrt(3) / 2)) / 2 + size * (Math.sqrt(3) / 2);
  const bx = ax - size / 2;
  const by = ay - size * (Math.sqrt(3) / 2);
  const cx = ax + size / 2;
  const cy = by;

  drawTriangle(ctx, ax, ay, bx, by, cx, cy, depth, fillColor);

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.stroke();
}
