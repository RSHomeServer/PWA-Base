import { describe, expect, it } from "vitest";
import {
  FROZEN_LOTTIE_PLAYBACK,
  resolveLottiePlayback,
} from "./resolveLottiePlayback.js";

describe("resolveLottiePlayback", () => {
  it("freezes when reduced motion is preferred", () => {
    expect(resolveLottiePlayback(true, { autoplay: true, loop: 3 })).toEqual(
      FROZEN_LOTTIE_PLAYBACK,
    );
  });

  it("defaults to autoplay + loop when motion is allowed", () => {
    expect(resolveLottiePlayback(false)).toEqual({
      autoplay: true,
      loop: true,
    });
  });

  it("passes through explicit prefs when motion is allowed", () => {
    expect(
      resolveLottiePlayback(false, { autoplay: false, loop: 2 }),
    ).toEqual({
      autoplay: false,
      loop: 2,
    });
  });
});
