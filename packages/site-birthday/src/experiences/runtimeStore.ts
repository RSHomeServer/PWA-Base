import { LAUNCHER_EXPERIENCES } from "./registry.js";
import type {
  EnterTransitionPhase,
  EnterTransitionRequest,
  ExperienceLoadState,
} from "./types.js";

export type ExperienceRuntimeSnapshot = {
  statuses: Readonly<Record<string, ExperienceLoadState>>;
  loadingAll: boolean;
  transition: EnterTransitionRequest | null;
  transitionPhase: EnterTransitionPhase;
};

type Listener = () => void;

function initialStatuses(): Record<string, ExperienceLoadState> {
  const statuses: Record<string, ExperienceLoadState> = {};
  for (const experience of LAUNCHER_EXPERIENCES) {
    statuses[experience.id] = "idle";
  }
  return statuses;
}

let snapshot: ExperienceRuntimeSnapshot = {
  statuses: initialStatuses(),
  loadingAll: false,
  transition: null,
  transitionPhase: "idle",
};

const listeners = new Set<Listener>();

/** Experiences currently mounting a hidden preview for preload. */
let preloadQueue: string[] = [];
let preloadActiveId: string | null = null;
let preloadAbort = false;

function emit(next: ExperienceRuntimeSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

function patch(
  partial: Partial<ExperienceRuntimeSnapshot> & {
    statuses?: Record<string, ExperienceLoadState>;
  },
) {
  emit({
    ...snapshot,
    ...partial,
    statuses: partial.statuses ?? snapshot.statuses,
  });
}

export function getExperienceRuntimeSnapshot(): ExperienceRuntimeSnapshot {
  return snapshot;
}

export function subscribeExperienceRuntime(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLoadState(id: string): ExperienceLoadState {
  return snapshot.statuses[id] ?? "idle";
}

export function getPreloadMountIds(): string[] {
  if (preloadActiveId) return [preloadActiveId];
  return [];
}

/** Mark a preview surface ready (visible launcher or hidden preload mount). */
export function markExperienceReady(id: string) {
  const current = snapshot.statuses[id] ?? "idle";
  if (current === "ready") return;
  patch({
    statuses: { ...snapshot.statuses, [id]: "ready" },
  });

  if (preloadActiveId === id) {
    preloadActiveId = null;
    void advancePreloadQueue();
  }
}

export function markExperienceError(id: string) {
  patch({
    statuses: { ...snapshot.statuses, [id]: "error" },
  });
  if (preloadActiveId === id) {
    preloadActiveId = null;
    void advancePreloadQueue();
  }
}

async function advancePreloadQueue() {
  if (preloadAbort) {
    preloadActiveId = null;
    preloadQueue = [];
    patch({ loadingAll: false });
    return;
  }

  const nextId = preloadQueue.shift();
  if (!nextId) {
    preloadActiveId = null;
    patch({ loadingAll: false });
    return;
  }

  if (snapshot.statuses[nextId] === "ready") {
    void advancePreloadQueue();
    return;
  }

  preloadActiveId = nextId;
  const statuses = { ...snapshot.statuses };
  for (const experience of LAUNCHER_EXPERIENCES) {
    if (statuses[experience.id] === "idle") {
      statuses[experience.id] = "waiting";
    }
  }
  statuses[nextId] = "loading";
  patch({ statuses, loadingAll: true });

  // Notify subscribers so HiddenPreloadHost remounts; readiness comes from onReady.
  listeners.forEach((listener) => listener());
}

/**
 * Sequentially preload every launcher experience by decoding its static preview.
 * Progress: waiting → loading → ready.
 */
export function startLoadingAllExperiences() {
  preloadAbort = false;
  const statuses = { ...snapshot.statuses };
  preloadQueue = [];
  for (const experience of LAUNCHER_EXPERIENCES) {
    if (statuses[experience.id] !== "ready") {
      statuses[experience.id] = "waiting";
      preloadQueue.push(experience.id);
    }
  }
  patch({ statuses, loadingAll: true });
  void advancePreloadQueue();
}

export function beginEnterTransition(request: EnterTransitionRequest) {
  if (snapshot.transitionPhase !== "idle") return;
  patch({
    transition: request,
    transitionPhase: "selected",
  });
}

export function setEnterTransitionPhase(phase: EnterTransitionPhase) {
  if (!snapshot.transition && phase !== "idle") return;
  patch({
    transitionPhase: phase,
    transition: phase === "idle" ? null : snapshot.transition,
  });
}

export function clearEnterTransition() {
  patch({
    transition: null,
    transitionPhase: "idle",
  });
}

/** Test helper — reset singleton between unit tests. */
export function resetExperienceRuntimeForTests() {
  preloadAbort = true;
  preloadQueue = [];
  preloadActiveId = null;
  snapshot = {
    statuses: initialStatuses(),
    loadingAll: false,
    transition: null,
    transitionPhase: "idle",
  };
  preloadAbort = false;
  listeners.forEach((listener) => listener());
}
