import { createContext } from "react";

/** Nodes wired by {@link createMasterGraph}: mode sources → masterGain → compressor → analyser → destination. */
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
