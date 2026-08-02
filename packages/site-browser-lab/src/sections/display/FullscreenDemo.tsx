import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@platform/ui";
import styles from "./FullscreenDemo.module.css";

export function FullscreenDemo() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }
    const id = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [isFullscreen]);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void stageRef.current?.requestFullscreen().catch(() => {
      /* Permission or platform denial — silently ignored, button stays interactive. */
    });
  }, []);

  return (
    <div ref={stageRef} className={`${styles.stage} ${isFullscreen ? styles.stageFullscreen : ""}`}>
      {isFullscreen ? (
        <div className={styles.overlay}>
          <p className={styles.clock}>{clock.toLocaleTimeString()}</p>
          <p className={styles.meta}>
            {screen.width} × {screen.height} · DPR {window.devicePixelRatio}
          </p>
        </div>
      ) : (
        <p className={styles.hint}>Fullscreen preview stage</p>
      )}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={toggle}
        className={styles.button}
      >
        {isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      </Button>
    </div>
  );
}
