import {
  useCallback,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { getExperienceDefinition } from "./registry.js";
import { ExperiencePreview } from "./ExperiencePreview.js";
import {
  ExperienceRuntimeContext,
  type ExperienceRuntimeApi,
} from "./ExperienceRuntimeContext.js";
import {
  beginEnterTransition,
  clearEnterTransition,
  getExperienceRuntimeSnapshot,
  getPreloadMountIds,
  markExperienceError,
  markExperienceReady,
  setEnterTransitionPhase,
  startLoadingAllExperiences,
  subscribeExperienceRuntime,
  type ExperienceRuntimeSnapshot,
} from "./runtimeStore.js";
import type { EnterTransitionRequest, ExperienceDefinition } from "./types.js";
import styles from "./ExperienceRuntime.module.css";

function useRuntimeSnapshot(): ExperienceRuntimeSnapshot {
  return useSyncExternalStore(
    subscribeExperienceRuntime,
    getExperienceRuntimeSnapshot,
    getExperienceRuntimeSnapshot,
  );
}

export function ExperienceRuntimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const snapshot = useRuntimeSnapshot();

  const enterExperience = useCallback(
    (
      experience: ExperienceDefinition,
      originEl: HTMLElement,
      fromRadius = "0px",
    ) => {
      const rect = originEl.getBoundingClientRect();
      const request: EnterTransitionRequest = {
        experienceId: experience.id,
        route: experience.route,
        fromRect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        fromRadius,
      };
      beginEnterTransition(request);
    },
    [],
  );

  const value = useMemo<ExperienceRuntimeApi>(
    () => ({
      ...snapshot,
      startLoadingAll: startLoadingAllExperiences,
      markReady: markExperienceReady,
      markError: markExperienceError,
      enterExperience,
      setTransitionPhase: setEnterTransitionPhase,
      clearTransition: clearEnterTransition,
    }),
    [snapshot, enterExperience],
  );

  const preloadIds = getPreloadMountIds();

  return (
    <ExperienceRuntimeContext.Provider value={value}>
      {children}
      {typeof document !== "undefined"
        ? createPortal(
            <div className={styles.hiddenPreloadHost} aria-hidden="true">
              {preloadIds.map((id) => {
                const experience = getExperienceDefinition(id);
                if (!experience) return null;
                return (
                  <div key={id} className={styles.hiddenPreloadSlot}>
                    <ExperiencePreview
                      experience={experience}
                      active
                      onReady={() => markExperienceReady(id)}
                      onError={() => markExperienceError(id)}
                    />
                  </div>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </ExperienceRuntimeContext.Provider>
  );
}
