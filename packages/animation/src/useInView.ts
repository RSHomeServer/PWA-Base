import { useEffect, useRef, useState, type RefObject } from "react";
import { useReducedMotion } from "./useReducedMotion.js";

export type UseInViewOptions = {
  threshold?: number | number[];
  once?: boolean;
  rootMargin?: string;
  /** When true (default), treat reduced-motion users as immediately in view. */
  revealIfReducedMotion?: boolean;
};

/**
 * Observe when an element enters the viewport.
 * Returns `[ref, inView]` for flexible JSX binding.
 */
export function useInView<T extends HTMLElement>(
  options: UseInViewOptions = {},
): [RefObject<T | null>, boolean] {
  const {
    threshold = 0.25,
    once = true,
    rootMargin,
    revealIfReducedMotion = false,
  } = options;
  const ref = useRef<T>(null);
  const reducedMotion = useReducedMotion();
  const [inView, setInView] = useState(
    () => revealIfReducedMotion && reducedMotion,
  );

  useEffect(() => {
    if (revealIfReducedMotion && reducedMotion) {
      setInView(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, reducedMotion, revealIfReducedMotion, rootMargin, threshold]);

  return [ref, inView];
}
