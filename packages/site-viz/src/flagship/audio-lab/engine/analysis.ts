/** Small, dependency-free DSP helpers shared by the visualiser, stem, and meter UIs. */

/** Root-mean-square level of a time-domain buffer, in `[0, 1]` for `Float32Array` input. */
export function rms(buffer: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    const v = buffer[i]!;
    sum += v * v;
  }
  return Math.sqrt(sum / Math.max(1, buffer.length));
}

/** Converts a linear amplitude to decibels, floored to avoid `-Infinity`. */
export function amplitudeToDb(amplitude: number, floorDb = -100): number {
  if (amplitude <= 0) return floorDb;
  return Math.max(floorDb, 20 * Math.log10(amplitude));
}

/**
 * Simplified K-weighting: a first-order high-pass around 60 Hz (removes rumble the
 * way ITU-R BS.1770's shelving stage does) followed by a small high-frequency
 * boost. This is a pragmatic approximation of "LUFS" for a level meter — not a
 * certified loudness measurement — hence the "-ish" in the UI label.
 */
export class SimpleKWeightFilter {
  private x1 = 0;
  private y1 = 0;
  private readonly alpha: number;

  constructor(sampleRate: number, cutoffHz = 60) {
    const dt = 1 / sampleRate;
    const rc = 1 / (2 * Math.PI * cutoffHz);
    this.alpha = rc / (rc + dt);
  }

  /** Filters in place and returns the same buffer for convenience. */
  process(buffer: Float32Array): Float32Array {
    let x1 = this.x1;
    let y1 = this.y1;
    for (let i = 0; i < buffer.length; i++) {
      const x0 = buffer[i]!;
      const y0 = this.alpha * (y1 + x0 - x1);
      buffer[i] = y0;
      x1 = x0;
      y1 = y0;
    }
    this.x1 = x1;
    this.y1 = y1;
    return buffer;
  }
}

/** Pearson correlation between two equal-length channels, in `[-1, 1]`. Used for the phase meter. */
export function phaseCorrelation(left: Float32Array, right: Float32Array): number {
  let sumL = 0;
  let sumR = 0;
  let sumLR = 0;
  const n = Math.min(left.length, right.length);
  for (let i = 0; i < n; i++) {
    const l = left[i]!;
    const r = right[i]!;
    sumL += l * l;
    sumR += r * r;
    sumLR += l * r;
  }
  const denom = Math.sqrt(sumL * sumR);
  if (denom < 1e-9) return 1;
  return Math.max(-1, Math.min(1, sumLR / denom));
}

export interface FrequencyBand {
  label: string;
  loHz: number;
  hiHz: number;
}

export const FREQUENCY_BANDS: FrequencyBand[] = [
  { label: "Sub", loHz: 20, hiHz: 60 },
  { label: "Bass", loHz: 60, hiHz: 250 },
  { label: "Low-mid", loHz: 250, hiHz: 500 },
  { label: "Mid", loHz: 500, hiHz: 2000 },
  { label: "High-mid", loHz: 2000, hiHz: 4000 },
  { label: "Presence", loHz: 4000, hiHz: 8000 },
  { label: "Air", loHz: 8000, hiHz: 16000 },
];

/** Averages FFT bin magnitudes (0-255 byte data) inside each named band, normalised to `[0, 1]`. */
export function bandEnergies(
  freqData: Uint8Array,
  sampleRate: number,
  bands: FrequencyBand[] = FREQUENCY_BANDS,
): number[] {
  const nyquist = sampleRate / 2;
  const binHz = nyquist / freqData.length;
  return bands.map((band) => {
    const loBin = Math.max(0, Math.floor(band.loHz / binHz));
    const hiBin = Math.min(freqData.length - 1, Math.ceil(band.hiHz / binHz));
    let sum = 0;
    let count = 0;
    for (let i = loBin; i <= hiBin; i++) {
      sum += freqData[i]!;
      count++;
    }
    return count > 0 ? sum / count / 255 : 0;
  });
}
