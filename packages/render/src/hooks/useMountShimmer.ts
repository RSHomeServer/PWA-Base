import { useEffect, useState } from "react";

const DEFAULT_SHIMMER_MS = 1100;

/** Brief loading shimmer while the canvas frame first mounts. */
export function useMountShimmer(durationMs = DEFAULT_SHIMMER_MS): boolean {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setActive(false), durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs]);

  return active;
}
