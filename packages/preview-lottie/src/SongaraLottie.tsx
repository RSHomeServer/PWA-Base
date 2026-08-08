import { useReducedMotion } from "@platform/animation";
import Lottie, {
  type LottieComponentProps,
  type LottieRef,
  type LottieRefCurrentProps,
  type PartialLottieComponentProps,
} from "lottie-react";
import { useEffect, useMemo, useRef } from "react";
import { resolveLottiePlayback } from "./resolveLottiePlayback.js";

export type SongaraLottieProps = PartialLottieComponentProps & {
  /**
   * App / Content Pack owned JSON URL (lottie-web `path`).
   * Alternative to `animationData` — assets stay outside PWA-Base.
   */
  path?: string;
};

/**
 * Thin Lottie player that freezes on `prefers-reduced-motion: reduce`.
 * Composes foundation `@platform/animation` `useReducedMotion`.
 */
export function SongaraLottie({
  autoplay,
  loop,
  lottieRef,
  onDOMLoaded,
  path,
  animationData,
  ...rest
}: SongaraLottieProps) {
  const reducedMotion = useReducedMotion();
  const playback = resolveLottiePlayback(reducedMotion, { autoplay, loop });
  const internalRef = useRef<LottieRefCurrentProps | null>(null);

  const setLottieRef = useMemo((): LottieRef => {
    return {
      get current() {
        return internalRef.current;
      },
      set current(value) {
        internalRef.current = value;
        if (lottieRef) {
          lottieRef.current = value;
        }
      },
    };
  }, [lottieRef]);

  useEffect(() => {
    if (!reducedMotion) return;
    internalRef.current?.goToAndStop(0, true);
  }, [reducedMotion, animationData, path]);

  const handleDOMLoaded: NonNullable<LottieComponentProps["onDOMLoaded"]> = (
    ...args
  ) => {
    if (reducedMotion) {
      internalRef.current?.goToAndStop(0, true);
    }
    onDOMLoaded?.(...args);
  };

  return (
    <Lottie
      {...(rest as LottieComponentProps)}
      {...(path !== undefined ? { path } : {})}
      {...(animationData !== undefined ? { animationData } : {})}
      autoplay={playback.autoplay}
      loop={playback.loop}
      lottieRef={setLottieRef}
      onDOMLoaded={handleDOMLoaded}
    />
  );
}
