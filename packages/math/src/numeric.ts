export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) {
    return 0;
  }
  return (value - a) / (b - a);
}

export function linspace(start: number, stop: number, count: number): number[] {
  if (count < 1) {
    return [];
  }
  if (count === 1) {
    return [start];
  }

  const step = (stop - start) / (count - 1);
  return Array.from({ length: count }, (_, index) => start + step * index);
}
