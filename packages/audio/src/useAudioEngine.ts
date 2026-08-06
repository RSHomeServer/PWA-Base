import { useContext } from "react";
import { AudioEngineReactContext, type AudioEngineApi } from "./engineContext.js";

export function useAudioEngine(): AudioEngineApi {
  const ctx = useContext(AudioEngineReactContext);
  if (!ctx) {
    throw new Error("useAudioEngine must be used within an AudioEngineProvider");
  }
  return ctx;
}
