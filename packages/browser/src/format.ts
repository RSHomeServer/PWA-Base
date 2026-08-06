export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function formatNumber(value: number, digits = 0): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "—";
  }
  if (bytes === 0) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatMs(ms: number, digits = 1): string {
  if (!Number.isFinite(ms)) {
    return "—";
  }
  if (ms < 1) {
    return `${(ms * 1000).toFixed(0)} µs`;
  }
  return `${ms.toFixed(digits)} ms`;
}

export function formatHz(hz: number): string {
  if (!Number.isFinite(hz)) {
    return "—";
  }
  return `${formatNumber(hz, 0)} Hz`;
}

export function percent(value: number, total: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return clamp((value / total) * 100, 0, 100);
}
