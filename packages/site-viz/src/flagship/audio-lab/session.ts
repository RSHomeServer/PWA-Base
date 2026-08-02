import { loadJSON, saveJSON } from "../shared/storage.js";

const NAMESPACE = "songara.audio-lab";

/** Per-mode session key, e.g. `songara.audio-lab.drum-machine`. */
function modeKey(modeId: string): string {
  return `${NAMESPACE}.${modeId}`;
}

/** Loads a mode's last saved settings (pattern, patch, notes, …) from `localStorage`. */
export function loadModeSession<T>(modeId: string, fallback: T): T {
  return loadJSON<T>(modeKey(modeId), fallback);
}

/** Persists a mode's settings to `localStorage` as JSON. */
export function saveModeSession<T>(modeId: string, value: T): void {
  saveJSON(modeKey(modeId), value);
}

export function clearModeSession(modeId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(modeKey(modeId));
  } catch {
    // ignore
  }
}

const ALL_MODE_IDS = ["visualiser", "stems", "drums", "piano-roll", "synth"];

/** Bundles every mode's saved session into one downloadable JSON document. */
export function exportFullSession(): string {
  const bundle: Record<string, unknown> = {};
  for (const id of ALL_MODE_IDS) {
    const raw = loadJSON<unknown | null>(modeKey(id), null);
    if (raw !== null) bundle[id] = raw;
  }
  return JSON.stringify({ version: 1, savedAt: new Date().toISOString(), modes: bundle }, null, 2);
}

/** Restores a previously exported bundle back into `localStorage`, one key per mode. */
export function importFullSession(json: string): boolean {
  try {
    const parsed = JSON.parse(json) as { modes?: Record<string, unknown> };
    if (!parsed.modes) return false;
    for (const [id, value] of Object.entries(parsed.modes)) {
      saveJSON(modeKey(id), value);
    }
    return true;
  } catch {
    return false;
  }
}
