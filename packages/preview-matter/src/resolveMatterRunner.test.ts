import { describe, expect, it } from "vitest";
import { resolveMatterRunner } from "./resolveMatterRunner.js";

describe("resolveMatterRunner", () => {
  it("disables runner when reduced motion", () => {
    expect(resolveMatterRunner(true)).toEqual({ enabled: false });
  });

  it("enables runner otherwise", () => {
    expect(resolveMatterRunner(false)).toEqual({ enabled: true });
  });
});
