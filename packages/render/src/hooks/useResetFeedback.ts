import { useCallback, useEffect, useRef, useState } from "react";

export interface ResetFeedback {
  isResetting: boolean;
  /** Wrap a reset handler to trigger the frame pulse animation. */
  withResetFeedback: (handler?: () => void) => () => void;
  triggerResetFeedback: () => void;
}

const RESET_PULSE_MS = 580;

/**
 * Drives the brief frame flash when a simulation resets. Use inside render shells
 * or wrap exhibit-level reset handlers (including keyboard shortcuts) so visual
 * feedback stays in sync with the action.
 */
export function useResetFeedback(): ResetFeedback {
  const [isResetting, setIsResetting] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const triggerResetFeedback = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    setIsResetting(true);
    timerRef.current = window.setTimeout(() => setIsResetting(false), RESET_PULSE_MS);
  }, []);

  const withResetFeedback = useCallback(
    (handler?: () => void) => () => {
      handler?.();
      triggerResetFeedback();
    },
    [triggerResetFeedback],
  );

  return { isResetting, withResetFeedback, triggerResetFeedback };
}
