import { useEffect } from "react";
import styles from "./SecretToast.module.css";

interface SecretToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function SecretToast({ message, onDismiss }: SecretToastProps) {
  useEffect(() => {
    if (!message) return;
    const id = window.setTimeout(onDismiss, 5000);
    return () => window.clearTimeout(id);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <p className={styles.text}>{message}</p>
      <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
