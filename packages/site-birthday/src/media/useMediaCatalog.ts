import { useEffect, useState } from "react";
import { loadMediaCatalog, type MediaCatalog } from "../media/index.js";

export function useMediaCatalog() {
  const [catalog, setCatalog] = useState<MediaCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMediaCatalog()
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load media");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, error, loading: !catalog && !error };
}
