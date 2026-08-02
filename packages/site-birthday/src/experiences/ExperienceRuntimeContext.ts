import { createContext } from "react";
import type { ExperienceRuntimeSnapshot } from "./runtimeStore.js";
import type { EnterTransitionPhase, ExperienceDefinition } from "./types.js";

export type ExperienceRuntimeApi = ExperienceRuntimeSnapshot & {
  startLoadingAll: () => void;
  markReady: (id: string) => void;
  markError: (id: string) => void;
  enterExperience: (
    experience: ExperienceDefinition,
    originEl: HTMLElement,
    fromRadius?: string,
  ) => void;
  setTransitionPhase: (phase: EnterTransitionPhase) => void;
  clearTransition: () => void;
};

export const ExperienceRuntimeContext =
  createContext<ExperienceRuntimeApi | null>(null);
