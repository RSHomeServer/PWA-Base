import { useEffect, useState } from "react";
import { ensureRequiredPacks } from "./client.js";
import type { PackInstallProgress } from "./types.js";

export type AppReadyState =
  | { status: "loading"; progress: PackInstallProgress | null }
  | { status: "ready" }
  | { status: "error"; message: string };

/**
 * Gates application UI until required Content Packs are installed (ADR-005).
 * When `requiredPackIds` is empty, Ready immediately.
 */
export function useAppReady(
  appId: string,
  requiredPackIds: readonly string[] | undefined,
  options?: { packsRoot?: string },
): AppReadyState {
  const [state, setState] = useState<AppReadyState>(() =>
    !requiredPackIds || requiredPackIds.length === 0
      ? { status: "ready" }
      : { status: "loading", progress: null },
  );

  const packKey = (requiredPackIds ?? []).join(",");

  useEffect(() => {
    if (!requiredPackIds || requiredPackIds.length === 0) {
      setState({ status: "ready" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading", progress: null });

    ensureRequiredPacks(appId, requiredPackIds, {
      packsRoot: options?.packsRoot,
      skipIfActive: true,
      onProgress: (progress) => {
        if (!cancelled) setState({ status: "loading", progress });
      },
    })
      .then(() => {
        if (!cancelled) setState({ status: "ready" });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Failed to install required content",
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // packKey captures requiredPackIds membership
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, packKey, options?.packsRoot]);

  return state;
}
