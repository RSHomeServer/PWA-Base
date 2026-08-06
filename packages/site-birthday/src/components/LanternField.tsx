import { ParticleField, type ParticleLabel } from "@platform/animation";
import {
  LANTERN_WISH_POOL,
} from "../lib/lanternWishes.js";
import styles from "./LanternField.module.css";

const BIRTHDAY_POOL: readonly ParticleLabel[] = LANTERN_WISH_POOL.map((wish) => ({
  text: wish.text,
  toneId: wish.tone,
  textColor: wish.textColor,
}));

interface LanternFieldProps {
  /** Kept for API compatibility; curated pool is used for display. */
  wishes?: readonly string[];
  onAllReleased?: () => void;
  className?: string;
}

/**
 * Birthday adapter — click the night sky to release a wish-bearing lantern.
 */
export function LanternField({ onAllReleased, className }: LanternFieldProps) {
  return (
    <ParticleField
      pool={BIRTHDAY_POOL}
      hintActive="Touch the dark to release a lantern"
      hintDone="Every wish is on its way"
      liveRegionLabel={(released, total) =>
        `${released} of ${total} lanterns released`
      }
      onAllReleased={onAllReleased}
      className={[styles.field, className].filter(Boolean).join(" ")}
    />
  );
}
