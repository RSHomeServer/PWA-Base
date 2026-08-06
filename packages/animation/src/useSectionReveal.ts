import type { RefObject } from "react";
import { useInView } from "./useInView.js";

export type UseSectionRevealResult<T extends HTMLElement> = {
  ref: RefObject<T | null>;
  visible: boolean;
};

/**
 * One-shot section reveal for marketing / landing layouts.
 * Honours reduced motion (immediately visible) and uses a mild root margin.
 */
export function useSectionReveal<T extends HTMLElement>(): UseSectionRevealResult<T> {
  const [ref, visible] = useInView<T>({
    threshold: 0.08,
    once: true,
    rootMargin: "0px 0px -6% 0px",
    revealIfReducedMotion: true,
  });
  return { ref, visible };
}
