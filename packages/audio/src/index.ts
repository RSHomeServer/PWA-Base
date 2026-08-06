/**
 * `@platform/audio` — Web Audio graph, React integration, and shared DSP analysis.
 *
 * No exhibit routes, stem asset packs, or demo song arrangements. Consuming apps
 * wire their own modes/instruments onto the shared master graph from
 * {@link AudioEngineProvider}.
 */

export type { AudioContextConstructor } from "./createMasterGraph.js";
export { createMasterGraph, resolveAudioContextConstructor } from "./createMasterGraph.js";

export type { AudioEngineApi, EngineNodes } from "./engineContext.js";
export { AudioEngineReactContext } from "./engineContext.js";

export { AudioEngineProvider } from "./AudioEngineProvider.js";
export { useAudioEngine } from "./useAudioEngine.js";

export type { FrequencyBand } from "./analysis.js";
export {
  FREQUENCY_BANDS,
  SimpleKWeightFilter,
  amplitudeToDb,
  bandEnergies,
  phaseCorrelation,
  rms,
} from "./analysis.js";
