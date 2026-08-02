import { afterEach, describe, expect, it } from "vitest";
import {
  getExperienceDefinition,
  listHomeExperiences,
  listPortalExperiences,
} from "./registry.js";
import {
  beginEnterTransition,
  getExperienceRuntimeSnapshot,
  getLoadState,
  markExperienceReady,
  resetExperienceRuntimeForTests,
  setEnterTransitionPhase,
  startLoadingAllExperiences,
} from "./runtimeStore.js";

describe("experience launcher registry", () => {
  it("exposes shared fields for every portal experience", () => {
    const portals = listPortalExperiences();
    expect(portals.length).toBeGreaterThanOrEqual(6);
    for (const experience of portals) {
      expect(experience.title).toBeTruthy();
      expect(experience.icon).toBeTruthy();
      expect(experience.route.startsWith("/")).toBe(true);
      expect(experience.Preview).toBeTypeOf("function");
      expect(experience.preview.fullSrc).toBeTruthy();
      expect(experience.preview.cropSrc).toBeTruthy();
      expect(experience.preview.bbox.width).toBeGreaterThan(0);
    }
  });

  it("limits Home to constellation for this prototype", () => {
    const home = listHomeExperiences();
    expect(home).toHaveLength(1);
    expect(home[0]?.id).toBe("constellation");
    expect(getExperienceDefinition("constellation")?.route).toBe(
      "/constellation",
    );
  });
});

describe("experience runtime store", () => {
  afterEach(() => {
    resetExperienceRuntimeForTests();
  });

  it("tracks sequential preload statuses", () => {
    startLoadingAllExperiences();
    const snap = getExperienceRuntimeSnapshot();
    expect(snap.loadingAll).toBe(true);
    expect(Object.values(snap.statuses).some((s) => s === "loading")).toBe(
      true,
    );
    expect(Object.values(snap.statuses).some((s) => s === "waiting")).toBe(
      true,
    );

    const loadingId = Object.entries(snap.statuses).find(
      ([, state]) => state === "loading",
    )?.[0];
    expect(loadingId).toBeTruthy();
    markExperienceReady(loadingId!);
    expect(getLoadState(loadingId!)).toBe("ready");
  });

  it("stores enter-transition requests", () => {
    beginEnterTransition({
      experienceId: "constellation",
      route: "/constellation",
      fromRect: { top: 10, left: 20, width: 100, height: 100 },
      fromRadius: "50%",
    });
    expect(getExperienceRuntimeSnapshot().transitionPhase).toBe("selected");
    setEnterTransitionPhase("aligning");
    expect(getExperienceRuntimeSnapshot().transitionPhase).toBe("aligning");
  });
});
