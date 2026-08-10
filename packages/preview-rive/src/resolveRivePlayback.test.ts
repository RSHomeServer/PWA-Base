import { describe, expect, it } from "vitest";
import {
  FROZEN_RIVE_PLAYBACK,
  resolveRivePlayback,
} from "./resolveRivePlayback.js";

describe("resolveRivePlayback", () => {
  it("freezes when reduced motion is preferred", () => {
    expect(resolveRivePlayback(true, { autoplay: true })).toEqual(
      FROZEN_RIVE_PLAYBACK,
    );
  });

  it("honours prefs when motion is allowed", () => {
    expect(resolveRivePlayback(false)).toEqual({ autoplay: true });
    expect(resolveRivePlayback(false, { autoplay: false })).toEqual({
      autoplay: false,
    });
  });
});
