import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createMasterGraph } from "./createMasterGraph.js";
import {
  AudioEngineReactContext,
  type AudioEngineApi,
  type EngineNodes,
} from "./engineContext.js";

export function AudioEngineProvider({ children }: { children: ReactNode }) {
  const nodesRef = useRef<EngineNodes | null>(null);
  const [contextState, setContextState] = useState<AudioContextState | "unstarted">("unstarted");
  const [masterVolume, setMasterVolumeState] = useState(0.85);
  const [sampleRate, setSampleRate] = useState<number | null>(null);

  const ensureEngine = useCallback((): EngineNodes => {
    if (!nodesRef.current) {
      const nodes = createMasterGraph();
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
