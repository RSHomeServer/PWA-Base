import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ShowcaseTocContext, type TocEntry } from "./showcaseTocContext.js";

export function ShowcaseTocProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<TocEntry[]>([]);

  const register = useCallback((entry: TocEntry) => {
    setEntries((current) => {
      if (current.some((item) => item.id === entry.id)) {
        return current;
      }
      return [...current, entry];
    });

    return () => {
      setEntries((current) => current.filter((item) => item.id !== entry.id));
    };
  }, []);

  const value = useMemo(() => ({ entries, register }), [entries, register]);

  return <ShowcaseTocContext.Provider value={value}>{children}</ShowcaseTocContext.Provider>;
}
