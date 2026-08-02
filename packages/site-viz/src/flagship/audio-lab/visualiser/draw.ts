import type { PeakData } from "./waveformPeaks.js";

/** Prepares a canvas backing buffer for crisp drawing at a fixed logical resolution. */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  maxDpr = 2,
): CanvasRenderingContext2D {
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function drawWaveform(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  peaks: PeakData | null,
  progress: number,
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fillRect(0, 0, w, h);
  const midY = h / 2;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(0, midY);
  ctx.lineTo(w, midY);
  ctx.stroke();

  if (!peaks || peaks.min.length === 0) {
    return;
  }

  const n = peaks.min.length;
  const playedBars = Math.round(progress * n);

  for (let i = 0; i < n; i++) {
    const x = (i / n) * w;
    const barW = Math.max(1, w / n);
    const yMax = midY - peaks.max[i]! * midY * 0.94;
    const yMin = midY - peaks.min[i]! * midY * 0.94;
    ctx.fillStyle = i < playedBars ? "#2dd4bf" : "rgba(148, 163, 184, 0.55)";
    ctx.fillRect(x, Math.min(yMax, yMin), barW, Math.max(1, Math.abs(yMax - yMin)));
  }

  const playX = progress * w;
  ctx.strokeStyle = "#f8fafc";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(playX, 0);
  ctx.lineTo(playX, h);
  ctx.stroke();
}

export function drawSpectrumBars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  freqData: Uint8Array,
  barCount = 96,
): void {
  ctx.clearRect(0, 0, w, h);
  const usableBins = Math.floor(freqData.length * 0.75);
  const binsPerBar = Math.max(1, Math.floor(usableBins / barCount));
  const barW = w / barCount;

  for (let i = 0; i < barCount; i++) {
    let sum = 0;
    const start = i * binsPerBar;
    const end = Math.min(usableBins, start + binsPerBar);
    for (let b = start; b < end; b++) sum += freqData[b]!;
    const avg = end > start ? sum / (end - start) : 0;
    const level = avg / 255;
    const barH = level * h;
    const hue = 168 - level * 60;
    ctx.fillStyle = `hsl(${hue}, 78%, ${42 + level * 20}%)`;
    ctx.fillRect(i * barW + 0.5, h - barH, Math.max(1, barW - 1), barH);
  }
}

export function drawStereoScope(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  left: Float32Array,
  right: Float32Array,
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.03)";
  ctx.fillRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(w, cy);
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, h);
  ctx.stroke();

  ctx.fillStyle = "#5eead4";
  const n = Math.min(left.length, right.length);
  const step = Math.max(1, Math.floor(n / 900));
  for (let i = 0; i < n; i += step) {
    const x = cx + left[i]! * cx * 0.92;
    const y = cy - right[i]! * cy * 0.92;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
}

const SPECTRO_COLOR_STOPS: [number, number, number][] = [
  [6, 8, 23],
  [30, 41, 100],
  [45, 130, 180],
  [45, 212, 191],
  [250, 204, 21],
  [248, 113, 113],
];

function spectrogramColor(level: number): string {
  const clamped = Math.max(0, Math.min(1, level));
  const scaled = clamped * (SPECTRO_COLOR_STOPS.length - 1);
  const idx = Math.min(SPECTRO_COLOR_STOPS.length - 2, Math.floor(scaled));
  const t = scaled - idx;
  const a = SPECTRO_COLOR_STOPS[idx]!;
  const b = SPECTRO_COLOR_STOPS[idx + 1]!;
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

/** Scrolls the spectrogram canvas one pixel-column to the left and paints a fresh FFT column at the right edge. */
export function pushSpectrogramColumn(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  freqData: Uint8Array,
): void {
  ctx.drawImage(ctx.canvas, 1, 0, w - 1, h, 0, 0, w - 1, h);
  const usableBins = Math.floor(freqData.length * 0.85);
  for (let y = 0; y < h; y++) {
    const bin = Math.floor(((h - y) / h) * usableBins);
    const level = (freqData[bin] ?? 0) / 255;
    ctx.fillStyle = spectrogramColor(level);
    ctx.fillRect(w - 1, y, 1, 1);
  }
}

export function drawBandMeters(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bands: number[],
  labels: string[],
): void {
  ctx.clearRect(0, 0, w, h);
  const gap = 6;
  const barW = (w - gap * (bands.length - 1)) / bands.length;
  ctx.font = "10px var(--font-family-mono, monospace)";
  ctx.textAlign = "center";
  for (let i = 0; i < bands.length; i++) {
    const level = bands[i] ?? 0;
    const x = i * (barW + gap);
    const barH = Math.max(2, level * (h - 16));
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(x, 0, barW, h - 16);
    ctx.fillStyle = `hsl(${168 - level * 50}, 75%, 55%)`;
    ctx.fillRect(x, h - 16 - barH, barW, barH);
    ctx.fillStyle = "rgba(226,232,240,0.75)";
    ctx.fillText(labels[i] ?? "", x + barW / 2, h - 4);
  }
}
