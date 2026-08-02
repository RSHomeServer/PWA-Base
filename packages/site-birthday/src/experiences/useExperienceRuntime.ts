import { useContext } from "react";
import { ExperienceRuntimeContext } from "./ExperienceRuntimeContext.js";

export function useExperienceRuntime() {
  const ctx = useContext(ExperienceRuntimeContext);
  if (!ctx) {
    throw new Error(
      "useExperienceRuntime must be used within ExperienceRuntimeProvider",
    );
  }
  return ctx;
}
