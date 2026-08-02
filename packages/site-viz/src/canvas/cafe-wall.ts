export interface CafeWallParams {
  tileSize: number;
  mortarWidth: number;
  rowOffset: number;
  rows: number;
  showGuides: boolean;
}

export function drawCafeWall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: CafeWallParams,
): void {
  const { tileSize, mortarWidth, rowOffset, rows, showGuides } = params;
  const rowHeight = tileSize + mortarWidth;

  ctx.fillStyle = "#9ca3af";
  ctx.fillRect(0, 0, width, height);

  for (let row = 0; row < rows; row++) {
    const y = row * rowHeight;
    const offset = row % 2 === 0 ? 0 : rowOffset;

    ctx.fillStyle = "#9ca3af";
    ctx.fillRect(0, y, width, mortarWidth);

    let x = -offset;
    let col = 0;
    while (x < width + tileSize) {
      ctx.fillStyle = col % 2 === 0 ? "#ffffff" : "#111827";
      ctx.fillRect(x, y + mortarWidth, tileSize, tileSize);
      x += tileSize;
      col += 1;
    }
  }

  if (showGuides) {
    ctx.save();
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    for (let row = 0; row < rows; row++) {
      const y = row * rowHeight + mortarWidth / 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}
