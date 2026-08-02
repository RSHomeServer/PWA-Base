/**
 * Probe whether Three.js can actually construct a WebGLRenderer.
 * A bare canvas.getContext('webgl') can succeed where Three still fails
 * (e.g. Mesa llvmpipe / BindToCurrentSequence in Cursor's browser).
 */
export async function probeThreeWebGL(): Promise<boolean> {
  if (typeof document === "undefined") return false;
  try {
    const { WebGLRenderer } = await import("three");
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: "default",
      failIfMajorPerformanceCaveat: false,
    });
    renderer.setSize(8, 8, false);
    renderer.dispose();
    return true;
  } catch (error) {
    console.warn("[SnowGlobe] WebGL probe failed — using craft fallback", error);
    return false;
  }
}
