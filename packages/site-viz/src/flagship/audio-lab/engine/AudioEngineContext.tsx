import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AudioEngineReactContext,
  type AudioEngineApi,
  type EngineNodes,
} from "./audioEngineStore.js";

/**
 * One shared Web Audio graph for the whole lab so every mode's sound reaches the
 * same speakers through the same gentle safety compressor, and so we only ever ask
 * the browser for a single AudioContext (creating more than one is wasteful and,
 * on some browsers, rate-limited).
 *
 * Graph: `<mode nodes>` → masterGain → masterCompressor → masterAnalyser → destination
 */
function createEngineNodes(): EngineNodes {
  const AC =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

export function AudioEngineProvider({ children }: { children: ReactNode }) {
  const nodesRef = useRef<EngineNodes | null>(null);
  const [contextState, setContextState] = useState<AudioContextState | "unstarted">("unstarted");
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const [sampleRate, setSampleRate] = useState<number | null>(null);

  const ensureEngine = useCallback((): EngineNodes => {
    if (!nodesRef.current) {
      const nodes = createEngineNodes();
      nodesRef.current = nodes;
      nodes.masterGain.gain.value = masterVolume;
      setContextState(nodes.ctx.state);
      setSampleRate(nodes.ctx.sampleRate);
      nodes.ctx.addEventListener("statechange", () => {
        setContextState(nodes.ctx.state);
      });
    }
    if (nodesRef.current.ctx.state === "suspended") {
      void nodesRef.current.ctx.resume();
    }
    return nodesRef.current;
  }, [masterVolume]);

  const peekEngine = useCallback(() => nodesRef.current, []);

  const resume = useCallback(async () => {
    const nodes = ensureEngine();
    await nodes.ctx.resume();
  }, [ensureEngine]);

  const setMasterVolume = useCallback((value: number) => {
    setMasterVolumeState(value);
    if (nodesRef.current) {
      nodesRef.current.masterGain.gain.setTargetAtTime(
        value,
        nodesRef.current.ctx.currentTime,
        0.02,
      );
    }
  }, []);

  useEffect(
    () => () => {
      nodesRef.current?.ctx.close().catch(() => undefined);
    },
    [],
  );

  const value = useMemo<AudioEngineApi>(
    () => ({
      ensureEngine,
      peekEngine,
      resume,
      contextState,
      masterVolume,
      setMasterVolume,
      sampleRate,
    }),
    [ensureEngine, peekEngine, resume, contextState, masterVolume, setMasterVolume, sampleRate],
  );

  return (
    <AudioEngineReactContext.Provider value={value}>{children}</AudioEngineReactContext.Provider>
  );
}

export type { AudioEngineApi, EngineNodes } from "./audioEngineStore.js";
