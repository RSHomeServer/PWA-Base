/** Fallback accents when canvas sampling is unavailable (CORS / SSR). */
export const PLATFORM_LOGO_ACCENTS: Readonly<Record<string, string>> = {
  home: "#0d7a72",
  qbt: "#2f67ba",
  overseerr: "#6366f1",
  radarr: "#ffcb3d",
  sonarr: "#2596be",
  lidarr: "#629e48",
  prowlarr: "#e66001",
  filebrowser: "#006498",
  dozzle: "#2496ed",
  portainer: "#13bef9",
  kuma: "#5cdd8b",
  netdata: "#00ab44",
  chrome: "#4285f4",
  guacamole: "#d22128",
  notes: "#a16207",
  components: "#0d7a72",
  docs: "#0f766e",
  stats: "#1d4ed8",
  viz: "#c2410c",
  birthday: "#be185d",
  memories: "#c4a15a",
  "browser-lab": "#0e7490",
  hello: "#0f766e",
  dashboard: "#134e4a",
};

const DEFAULT_ACCENT = "#0d7a72";

export function platformNavLogoAccent(id: string): string {
  return PLATFORM_LOGO_ACCENTS[id] ?? DEFAULT_ACCENT;
}

/**
 * Sample the most common non-neutral colour from a loaded image.
 * Returns null if the canvas is tainted or sampling fails.
 */
export function extractDominantColor(img: HTMLImageElement): string | null {
  try {
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);
    const scores = new Map<string, number>();

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]!;
      if (a < 140) continue;
      const r = data[i]!;
      const g = data[i + 1]!;
      const b = data[i + 2]!;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max < 28 || min > 242) continue;
      const sat = max - min;
      if (sat < 18) continue;
      const qr = (r >> 4) << 4;
      const qg = (g >> 4) << 4;
      const qb = (b >> 4) << 4;
      const key = `${qr},${qg},${qb}`;
      scores.set(key, (scores.get(key) ?? 0) + 1 + sat / 48);
    }

    let best: string | null = null;
    let bestScore = 0;
    for (const [key, score] of scores) {
      if (score > bestScore) {
        best = key;
        bestScore = score;
      }
    }
    if (!best) return null;
    const [r, g, b] = best.split(",").map(Number) as [number, number, number];
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  } catch {
    return null;
  }
}
