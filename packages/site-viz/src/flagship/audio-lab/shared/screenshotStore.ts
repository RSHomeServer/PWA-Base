import { createContext } from "react";

/**
 * Lets whichever mode is mounted register its "primary" canvas so the shared
 * LabShell toolbar's Export button can screenshot it, without every mode needing
 * to know about the shell chrome.
 */
export interface ScreenshotApi {
  setTarget: (canvas: HTMLCanvasElement | null) => void;
  capture: (filename: string) => void;
}

export const ScreenshotReactContext = createContext<ScreenshotApi | null>(null);
