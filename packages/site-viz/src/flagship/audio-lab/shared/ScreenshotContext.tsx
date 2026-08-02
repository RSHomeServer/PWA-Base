import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ScreenshotReactContext, type ScreenshotApi } from "./screenshotStore.js";

export function ScreenshotProvider({
  children,
  onReady,
}: {
  children: ReactNode;
  onReady?: (api: ScreenshotApi) => void;
}) {
  const targetRef = useRef<HTMLCanvasElement | null>(null);

  const apiRef = useRef<ScreenshotApi>({
    setTarget: (canvas) => {
      targetRef.current = canvas;
    },
    capture: (filename) => {
      const canvas = targetRef.current;
      if (!canvas) return;
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    },
  });

  useEffect(() => {
    onReady?.(apiRef.current);
  }, [onReady]);

  return (
    <ScreenshotReactContext.Provider value={apiRef.current}>
      {children}
    </ScreenshotReactContext.Provider>
  );
}

export type { ScreenshotApi } from "./screenshotStore.js";
