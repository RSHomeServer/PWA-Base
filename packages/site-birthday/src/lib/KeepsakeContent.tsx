import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_KEEPSAKE } from "./constants.js";
import { loadKeepsakeContent } from "./loadKeepsakeContent.js";
import type { ResolvedKeepsake } from "./keepsakeTypes.js";

const KeepsakeContext = createContext<ResolvedKeepsake>(DEFAULT_KEEPSAKE);

export function useKeepsakeContent(): ResolvedKeepsake {
  return useContext(KeepsakeContext);
}

/**
 * Loads pack-backed keepsake content after the Ready gate. Falls back to
 * built-in defaults if the pack entry is missing or invalid.
 */
export function KeepsakeContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<ResolvedKeepsake>(DEFAULT_KEEPSAKE);
  const [status, setStatus] = useState<"loading" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const loaded = await loadKeepsakeContent();
        if (!cancelled) setContent(loaded);
      } catch {
        if (!cancelled) setContent(DEFAULT_KEEPSAKE);
      } finally {
        if (!cancelled) setStatus("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "var(--bd-navy, #07111c)",
          color: "var(--bd-ivory, #faf5eb)",
          fontFamily: "var(--bd-font-body, Georgia, serif)",
          padding: "2rem",
          textAlign: "center",
        }}
        aria-busy="true"
        aria-live="polite"
      >
        <p>Opening the keepsake…</p>
      </div>
    );
  }

  return <KeepsakeContext.Provider value={content}>{children}</KeepsakeContext.Provider>;
}
