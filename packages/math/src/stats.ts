export function sum(values: number[]): number {
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total;
}

export function mean(values: number[]): number {
  if (values.length === 0) {
    return NaN;
  }
  return sum(values) / values.length;
}

export function varianceSample(values: number[]): number {
  const n = values.length;
  if (n < 2) {
    return NaN;
  }

  const avg = mean(values);
  let squaredDiffTotal = 0;
  for (const value of values) {
    const diff = value - avg;
    squaredDiffTotal += diff * diff;
  }
  return squaredDiffTotal / (n - 1);
}

export function stdevSample(values: number[]): number {
  const variance = varianceSample(values);
  return Number.isNaN(variance) ? NaN : Math.sqrt(variance);
}
