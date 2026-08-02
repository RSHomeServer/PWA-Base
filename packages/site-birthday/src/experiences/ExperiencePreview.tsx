import { useEffect, useRef } from "react";
import type { ExperienceDefinition } from "./types.js";
import styles from "./ExperiencePreview.module.css";

type Props = {
  experience: ExperienceDefinition;
  /**
   * Which still to show:
   * - crop (Image B) inside snow globe / portal aperture
   * - full (Image A) only used by the enter transition host
   */
  variant?: "crop" | "full";
  active?: boolean;
  onReady?: () => void;
  onError?: () => void;
  className?: string;
};

/**
 * Static preview still for an experience. Motion lives in EnterTransitionHost,
 * not inside the launcher aperture.
 */
export function ExperiencePreview({
  experience,
  variant = "crop",
  active = true,
  onReady,
  onError,
  className,
}: Props) {
  const readySent = useRef(false);
  const src =
    variant === "full"
      ? experience.preview.fullSrc
      : experience.preview.cropSrc;

  useEffect(() => {
    readySent.current = false;
  }, [experience.id, src, active]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled || readySent.current) return;
      readySent.current = true;
      onReady?.();
    };
    img.onerror = () => {
      if (cancelled) return;
      onError?.();
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [active, src, onReady, onError]);

  return (
    <div
      className={[styles.clip, className].filter(Boolean).join(" ")}
      data-experience-preview={experience.id}
      data-preview-variant={variant}
    >
      {active ? (
        <img
          className={styles.still}
          src={src}
          alt=""
          draggable={false}
          decoding="async"
        />
      ) : (
        <div className={styles.placeholder}>
          <span aria-hidden="true">{experience.icon}</span>
          <span className={styles.placeholderLabel}>{experience.title}</span>
        </div>
      )}
    </div>
  );
}
