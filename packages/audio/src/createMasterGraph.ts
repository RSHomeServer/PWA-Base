import type { EngineNodes } from "./engineContext.js";

export type AudioContextConstructor = new () => AudioContext;

/** Resolves the platform `AudioContext` constructor (including legacy webkit prefix). */
export function resolveAudioContextConstructor(
  override?: AudioContextConstructor,
): AudioContextConstructor {
  if (override) return override;
  const prefixed = globalThis as typeof globalThis & {
    webkitAudioContext?: AudioContextConstructor;
  };
  const Ctor = globalThis.AudioContext ?? prefixed.webkitAudioContext;
  if (!Ctor) {
    throw new Error("Web Audio API is not available in this environment");
  }
  return Ctor;
}

/**
 * Builds the shared master graph: `<mode nodes>` → masterGain → masterCompressor →
 * masterAnalyser → destination. Call once per app/lab; reuse the returned nodes for
 * every mode so only one `AudioContext` is created.
 */
export function createMasterGraph(ctor?: AudioContextConstructor): EngineNodes {
  const AC = resolveAudioContextConstructor(ctor);
  const ctx = new AC();

  const masterAnalyser = ctx.createAnalyser();
  masterAnalyser.fftSize = 2048;
  masterAnalyser.smoothingTimeConstant = 0.8;

  const masterCompressor = ctx.createDynamicsCompressor();
  masterCompressor.threshold.value = -18;
  masterCompressor.knee.value = 24;
  masterCompressor.ratio.value = 4;
  masterCompressor.attack.value = 0.003;
  masterCompressor.release.value = 0.25;

  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.85;

  masterGain.connect(masterCompressor);
  masterCompressor.connect(masterAnalyser);
  masterAnalyser.connect(ctx.destination);

  return { ctx, masterGain, masterCompressor, masterAnalyser };
}
