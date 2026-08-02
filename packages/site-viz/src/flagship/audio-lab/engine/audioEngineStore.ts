import { createContext } from "react";

/**
 * Shared Web Audio graph types and React context for the Audio Lab.
 * Kept free of components so Fast Refresh stays healthy for the provider file.
 */
export interface EngineNodes {
  ctx: AudioContext;
  masterGain: GainNode;
  masterCompressor: DynamicsCompressorNode;
  masterAnalyser: AnalyserNode;
}

export interface AudioEngineApi {
  /** Lazily creates (once) and returns the shared engine graph. Safe to call from a user gesture. */
  ensureEngine: () => EngineNodes;
  /** Returns the current engine if it has been created, without creating one. */
  peekEngine: () => EngineNodes | null;
  /** Resumes a suspended context — browsers require a user gesture for this to succeed. */
  resume: () => Promise<void>;
  contextState: AudioContextState | "unstarted";
  masterVolume: number;
  setMasterVolume: (value: number) => void;
  sampleRate: number | null;
}

export const AudioEngineReactContext = createContext<AudioEngineApi | null>(null);
