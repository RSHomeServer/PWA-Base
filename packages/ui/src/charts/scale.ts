export function scaleLinear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  return (value: number) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

export function niceExtent(values: number[], padRatio = 0.1): [number, number] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [min - 1, max + 1];
  }
  const pad = (max - min) * padRatio;
  return [min - pad, max + pad];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
