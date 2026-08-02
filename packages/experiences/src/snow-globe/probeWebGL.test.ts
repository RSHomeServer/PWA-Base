import { describe, expect, it, vi } from "vitest";

describe("probeThreeWebGL", () => {
  it("returns false when WebGLRenderer construction throws", async () => {
    vi.resetModules();
    vi.doMock("three", () => ({
      WebGLRenderer: class {
        constructor() {
          throw new Error("Error creating WebGL context.");
        }
      },
    }));
    const { probeThreeWebGL } = await import("./probeWebGL.js");
    await expect(probeThreeWebGL()).resolves.toBe(false);
  });
});
