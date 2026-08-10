import { describe, expect, it } from "vitest";
import { songaraWebcamConstraints } from "./songaraWebcamConstraints.js";

describe("songaraWebcamConstraints", () => {
  it("defaults to user-facing 1280x720 ideal", () => {
    expect(songaraWebcamConstraints()).toEqual({
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 },
    });
  });

  it("honours facing / ideals", () => {
    expect(
      songaraWebcamConstraints({
        facingMode: "environment",
        widthIdeal: 640,
        heightIdeal: 480,
      }),
    ).toEqual({
      facingMode: "environment",
      width: { ideal: 640 },
      height: { ideal: 480 },
    });
  });
});
