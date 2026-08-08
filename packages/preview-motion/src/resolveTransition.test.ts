import { describe, expect, it } from "vitest";
import { INSTANT_TRANSITION, resolveTransition } from "./resolveTransition.js";

describe("resolveTransition", () => {
  it("returns an instant transition when reduced motion is preferred", () => {
    expect(resolveTransition(true, { duration: 0.4, ease: "easeOut" })).toEqual(
      INSTANT_TRANSITION,
    );
    expect(resolveTransition(true)).toEqual(INSTANT_TRANSITION);
  });

  it("returns the provided transition when motion is allowed", () => {
    const transition = { duration: 0.35, ease: "easeInOut" as const };
    expect(resolveTransition(false, transition)).toBe(transition);
  });

  it("returns an empty transition object when allowed and none was provided", () => {
    expect(resolveTransition(false)).toEqual({});
  });
});
