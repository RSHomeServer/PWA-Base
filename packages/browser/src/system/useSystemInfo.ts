import { useMemo } from "react";
import { detectBrowserIdentity } from "../detect/browserDetect.js";
import { getWasmInfo, getWebglInfo, isWebgpuAvailable } from "../graphics/webgl.js";

export interface SystemInfo {
  browser: string;
  browserVersion: string;
  engine: string;
  os: string;
  cores: number;
  deviceMemoryGb: number | null;
  webgl: ReturnType<typeof getWebglInfo>;
  webgpu: boolean;
  wasm: ReturnType<typeof getWasmInfo>;
  languages: string;
  cookiesEnabled: boolean;
}

export function readSystemInfo(): SystemInfo {
  const identity = detectBrowserIdentity();
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;

  return {
    browser: identity.browser,
    browserVersion: identity.browserVersion,
    engine: identity.engine,
    os: identity.os,
    cores: navigator.hardwareConcurrency ?? 0,
    deviceMemoryGb: typeof deviceMemory === "number" ? deviceMemory : null,
    webgl: getWebglInfo(),
    webgpu: isWebgpuAvailable(),
    wasm: getWasmInfo(),
    languages: navigator.languages?.join(", ") ?? navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
  };
}

export function useSystemInfo(): SystemInfo {
  return useMemo(() => readSystemInfo(), []);
}
