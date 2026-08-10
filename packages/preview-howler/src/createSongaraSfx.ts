import { Howl, type HowlOptions } from "howler";

export type CreateSongaraSfxOptions = {
  /** One or more URLs / Content Pack paths (app-owned assets). */
  src: string | string[];
  volume?: number;
  html5?: boolean;
  loop?: boolean;
  /** Extra Howler options (sprite, rate, …). */
  howl?: Omit<HowlOptions, "src" | "volume" | "html5" | "loop">;
};

/**
 * Thin multi-format SFX façade. Does **not** replace Stable `AudioEngineProvider`.
 * Prefer Stable audio for shared Songara graphs; use Howler for simple one-shot banks.
 */
export function createSongaraSfx(options: CreateSongaraSfxOptions): Howl {
  const src = Array.isArray(options.src) ? options.src : [options.src];
  if (src.length === 0 || src.some((s) => !s.trim())) {
    throw new Error("createSongaraSfx: src must contain at least one non-empty URL");
  }
  return new Howl({
    ...options.howl,
    src,
    volume: options.volume ?? 1,
    html5: options.html5 ?? false,
    loop: options.loop ?? false,
  });
}
