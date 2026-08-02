export interface WebglInfo {
  supported: boolean;
  version: "webgl2" | "webgl1" | "none";
  vendor: string;
  renderer: string;
}

let cached: WebglInfo | null = null;

/** Creates a throwaway canvas to query the GPU vendor/renderer strings. */
export function getWebglInfo(): WebglInfo {
  if (cached) {
    return cached;
  }

  const canvas = document.createElement("canvas");
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  let version: WebglInfo["version"] = "none";

  gl = canvas.getContext("webgl2");
  if (gl) {
    version = "webgl2";
  } else {
    gl =
      canvas.getContext("webgl") ??
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (gl) {
      version = "webgl1";
    }
  }

  if (!gl) {
    cached = { supported: false, version: "none", vendor: "—", renderer: "—" };
    return cached;
  }

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const vendor = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
    : String(gl.getParameter(gl.VENDOR));
  const renderer = debugInfo
    ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
    : String(gl.getParameter(gl.RENDERER));

  cached = { supported: true, version, vendor, renderer };
  return cached;
}

export function isWebgpuAvailable(): boolean {
  return typeof navigator !== "undefined" && "gpu" in navigator;
}

export interface WasmInfo {
  supported: boolean;
  streaming: boolean;
  simd: boolean;
}

export function getWasmInfo(): WasmInfo {
  const supported =
    typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function";
  const streaming = supported && typeof WebAssembly.instantiateStreaming === "function";
  // Minimal SIMD-capable module probe (single v128 local declaration).
  let simd = false;
  if (supported) {
    try {
      simd = WebAssembly.validate(
        new Uint8Array([
          0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00, 0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b,
          0x03, 0x02, 0x01, 0x00, 0x0a, 0x0a, 0x01, 0x08, 0x00, 0x41, 0x00, 0xfd, 0x0f, 0x0b,
        ]),
      );
    } catch {
      simd = false;
    }
  }
  return { supported, streaming, simd };
}
