import { useCallback, useRef, useState, type ReactNode } from "react";
import styles from "./UsageNote.module.css";

export interface UsageNoteProps {
  children: ReactNode;
}

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }

  return "";
}

export function UsageNote({ children }: UsageNoteProps) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);
  const text = extractText(children);

  const handleCopy = useCallback(async () => {
    if (!text || !navigator.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      if (resetTimer.current !== null) {
        window.clearTimeout(resetTimer.current);
      }

      resetTimer.current = window.setTimeout(() => {
        setCopied(false);
        resetTimer.current = null;
      }, 2000);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={styles.copyButton}
        onClick={() => void handleCopy()}
        aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <pre className={styles.note}>
        <code>{children}</code>
      </pre>
    </div>
  );
}
