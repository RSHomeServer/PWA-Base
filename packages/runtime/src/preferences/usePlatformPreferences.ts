import { useCallback, useEffect, useState } from "react";
import {
  loadPlatformPreferences,
  patchPlatformPreferences,
  subscribePlatformPreferences,
} from "./store.js";
import type { PlatformPreferences, PlatformUpdatePreferences } from "./types.js";

export function usePlatformPreferences() {
  const [prefs, setPrefs] = useState<PlatformPreferences>(() => loadPlatformPreferences());

  useEffect(() => subscribePlatformPreferences(setPrefs), []);

  const setUpdatePreference = useCallback(
    <K extends keyof PlatformUpdatePreferences>(
      key: K,
      value: PlatformUpdatePreferences[K],
    ) => {
      setPrefs(patchPlatformPreferences({ updates: { [key]: value } }));
    },
    [],
  );

  return { prefs, setUpdatePreference };
}
