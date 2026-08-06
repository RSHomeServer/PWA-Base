import { useEffect, useState } from "react";

export interface DisplayInfo {
  screenWidth: number;
  screenHeight: number;
  innerWidth: number;
  innerHeight: number;
  dpr: number;
  colorGamut: "rec2020" | "p3" | "srgb" | "unknown";
  hdr: boolean;
  contrastPreference: string;
  colorScheme: "dark" | "light";
  orientationType: string;
  orientationAngle: number;
}

function readColorGamut(): DisplayInfo["colorGamut"] {
  if (window.matchMedia("(color-gamut: rec2020)").matches) return "rec2020";
  if (window.matchMedia("(color-gamut: p3)").matches) return "p3";
  if (window.matchMedia("(color-gamut: srgb)").matches) return "srgb";
  return "unknown";
}

function readContrastPreference(): string {
  if (window.matchMedia("(prefers-contrast: more)").matches) return "More";
  if (window.matchMedia("(prefers-contrast: less)").matches) return "Less";
  if (window.matchMedia("(prefers-contrast: custom)").matches) return "Custom";
  return "No preference";
}

export function snapshotDisplayInfo(): DisplayInfo {
  const orientation = screen.orientation;
  return {
    screenWidth: screen.width,
    screenHeight: screen.height,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    dpr: window.devicePixelRatio,
    colorGamut: readColorGamut(),
    hdr: window.matchMedia("(dynamic-range: high)").matches,
    contrastPreference: readContrastPreference(),
    colorScheme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
    orientationType: orientation?.type ?? "unknown",
    orientationAngle: orientation?.angle ?? 0,
  };
}

export function useDisplayInfo(): DisplayInfo {
  const [info, setInfo] = useState<DisplayInfo>(() => snapshotDisplayInfo());

  useEffect(() => {
    const update = () => setInfo(snapshotDisplayInfo());
    window.addEventListener("resize", update);
    screen.orientation?.addEventListener("change", update);
    const gamutQuery = window.matchMedia("(color-gamut: p3)");
    gamutQuery.addEventListener("change", update);
    return () => {
      window.removeEventListener("resize", update);
      screen.orientation?.removeEventListener("change", update);
      gamutQuery.removeEventListener("change", update);
    };
  }, []);

  return info;
}
