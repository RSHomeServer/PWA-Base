import { useContext, useEffect } from "react";
import type { RefObject } from "react";
import { ScreenshotReactContext, type ScreenshotApi } from "./screenshotStore.js";

export function useScreenshotTarget(canvasRef: RefObject<HTMLCanvasElement | null>): void {
  const api = useContext(ScreenshotReactContext);
  useEffect(() => {
    api?.setTarget(canvasRef.current);
    return () => api?.setTarget(null);
  }, [api, canvasRef]);
}

export function useScreenshotApi(): ScreenshotApi | null {
  return useContext(ScreenshotReactContext);
}

export type { ScreenshotApi } from "./screenshotStore.js";
