import { clamp, lerp } from "@platform/math";

export type Rgb = [number, number, number];

/** Smooth cyclic palette for escape-time fractals. */
export function fractalPalette(t: number, inside: Rgb, outside: Rgb): Rgb {
  const u = t - Math.floor(t);
  return [
    clamp(Math.floor(lerp(outside[0], inside[0], u)), 0, 255),
    clamp(Math.floor(lerp(outside[1], inside[1], u)), 0, 255),
    clamp(Math.floor(lerp(outside[2], inside[2], u)), 0, 255),
  ];
}

/** Heat-style gradient from dark blue through cyan and amber. */
export function heatPalette(t: number): Rgb {
  const x = clamp(t, 0, 1);
  if (x < 0.33) {
    return [
      clamp(Math.floor(lerp(8, 20, x / 0.33)), 0, 255),
      clamp(Math.floor(lerp(12, 80, x / 0.33)), 0, 255),
      clamp(Math.floor(lerp(40, 180, x / 0.33)), 0, 255),
    ];
  }
  if (x < 0.66) {
    const u = (x - 0.33) / 0.33;
    return [
      clamp(Math.floor(lerp(20, 255, u)), 0, 255),
      clamp(Math.floor(lerp(80, 200, u)), 0, 255),
      clamp(Math.floor(lerp(180, 80, u)), 0, 255),
    ];
  }
  const u = (x - 0.66) / 0.34;
  return [
    clamp(Math.floor(lerp(255, 255, u)), 0, 255),
    clamp(Math.floor(lerp(200, 240, u)), 0, 255),
    clamp(Math.floor(lerp(80, 120, u)), 0, 255),
  ];
}

/** Deep space palette with violet highlights. */
export function nebulaPalette(t: number): Rgb {
  const x = clamp(t, 0, 1);
  return [
    clamp(Math.floor(lerp(12, 220, Math.sin(x * Math.PI * 2) * 0.5 + 0.5)), 0, 255),
    clamp(Math.floor(lerp(8, 60, x)), 0, 255),
    clamp(Math.floor(lerp(30, 255, 1 - x * 0.7)), 0, 255),
  ];
}

/** Write RGBA into ImageData buffer. */
export function setPixel(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number,
  rgb: Rgb,
): void {
  const idx = (y * width + x) * 4;
  data[idx] = rgb[0];
  data[idx + 1] = rgb[1];
  data[idx + 2] = rgb[2];
  data[idx + 3] = 255;
}
