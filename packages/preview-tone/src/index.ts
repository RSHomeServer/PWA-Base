/**
 * Preview: thin Tone.js integration.
 * Public import: `@songara/pwa-base/preview/tone`
 *
 * Does **not** replace Stable `@songara/pwa-base/audio` (`AudioEngineProvider`).
 * Use Tone for synthesis / Transport experiments; prefer the Stable kit for shared
 * Songara master graphs.
 *
 * Intended Stable home: optional creative-audio subpath beside `/audio`, or remain Preview.
 */

export {
  getContext,
  start,
  Transport,
  Synth,
  MembraneSynth,
  Player,
  Volume,
  Destination,
} from "tone";

export { resolveToneTransport } from "./resolveToneTransport.js";
export type { ResolvedToneTransport } from "./resolveToneTransport.js";
