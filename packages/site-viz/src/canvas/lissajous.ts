import { linspace } from "@platform/math";

export interface LissajousParams {
  freqA: number;
  freqB: number;
  phase: number;
  amplitude: number;
  time: number;
}

export function drawLissajous(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  params: LissajousParams,
): void {
  const { freqA, freqB, phase, amplitude, time } = params;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const amp = amplitude * (Math.min(width, height) / 2) * 0.85;
  const samples = linspace(0, Math.PI * 2, 1200);

  ctx.strokeStyle = "#2563eb";
  ctx.lineWidth = 2;
  ctx.beginPath();

  samples.forEach((t, index) => {
    const x = cx + amp * Math.sin(freqA * t + phase + time);
    const y = cy + amp * Math.sin(freqB * t);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  ctx.fillStyle = "#6b7280";
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
}
