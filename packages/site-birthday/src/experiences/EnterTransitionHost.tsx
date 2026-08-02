import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { getExperienceDefinition } from "./registry.js";
import { previewAlignTransform, transformCss } from "./previewAlign.js";
import { useExperienceRuntime } from "./useExperienceRuntime.js";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import styles from "./EnterTransitionHost.module.css";

const ALIGN_MS = 720;
const FILL_MS = 520;
const SETTLE_MS = 160;

/**
 * Camera zoom: Image A starts transformed so its Image-B bbox sits on the
 * launcher aperture, then eases to identity (A fills the viewport), then
 * navigates to the live route which begins on that same first frame.
 */
export function EnterTransitionHost() {
  const { transition, setTransitionPhase, clearTransition } =
    useExperienceRuntime();
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const [aligned, setAligned] = useState(false);
  const [frameFaded, setFrameFaded] = useState(false);
  const runIdRef = useRef(0);

  const experience = transition
    ? getExperienceDefinition(transition.experienceId)
    : undefined;

  const startTransform = useMemo(() => {
    if (!transition || !experience) return null;
    const viewport = {
      width: window.innerWidth || 1,
      height: window.innerHeight || 1,
    };
    return previewAlignTransform(
      transition.fromRect,
      experience.preview.bbox,
      viewport,
    );
  }, [transition, experience]);

  useEffect(() => {
    if (!transition) {
      setExpanded(false);
      setAligned(false);
      setFrameFaded(false);
      return;
    }

    const runId = ++runIdRef.current;
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    void (async () => {
      setExpanded(false);
      setAligned(false);
      setFrameFaded(false);
      setTransitionPhase("selected");
      await wait(reducedMotion ? 0 : 40);
      if (cancelled || runId !== runIdRef.current) return;

      // Grow the aperture while Image A eases from bbox-align → identity.
      setExpanded(true);
      setAligned(true);
      setTransitionPhase("aligning");
      await wait(reducedMotion ? 0 : ALIGN_MS);
      if (cancelled || runId !== runIdRef.current) return;

      setFrameFaded(true);
      setTransitionPhase("filling");
      await wait(reducedMotion ? 0 : FILL_MS);
      if (cancelled || runId !== runIdRef.current) return;

      setTransitionPhase("navigating");
      navigate(transition.route);
      await wait(reducedMotion ? 0 : SETTLE_MS);
      if (cancelled || runId !== runIdRef.current) return;

      setTransitionPhase("settling");
      await wait(reducedMotion ? 0 : 100);
      if (cancelled || runId !== runIdRef.current) return;

      clearTransition();
    })();

    return () => {
      cancelled = true;
      for (const id of timers) window.clearTimeout(id);
    };
  }, [transition, reducedMotion, navigate, setTransitionPhase, clearTransition]);

  if (!transition || !experience || !startTransform) return null;
  if (typeof document === "undefined") return null;

  const { fromRect, fromRadius } = transition;
  const style = {
    ["--from-top" as string]: `${fromRect.top}px`,
    ["--from-left" as string]: `${fromRect.left}px`,
    ["--from-width" as string]: `${fromRect.width}px`,
    ["--from-height" as string]: `${fromRect.height}px`,
    ["--from-radius" as string]: fromRadius,
  };

  const imageStyle = {
    transform: aligned
      ? "translate(0px, 0px) scale(1)"
      : transformCss(startTransform),
    transitionDuration: reducedMotion ? "0.01ms" : `${ALIGN_MS + FILL_MS}ms`,
  };

  return createPortal(
    <div
      className={[
        styles.overlay,
        expanded ? styles.expanded : styles.origin,
        frameFaded ? styles.frameFaded : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      role="presentation"
      aria-hidden="true"
      data-enter-transition={experience.id}
    >
      <div className={styles.frame}>
        <img
          className={styles.imageA}
          src={experience.preview.fullSrc}
          alt=""
          draggable={false}
          style={imageStyle}
        />
      </div>
    </div>,
    document.body,
  );
}
