import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useReducedMotion } from "../hooks/useReducedMotion.js";
import {
  LANTERN_WISH_POOL,
  type LanternWishToneName,
} from "../lib/lanternWishes.js";
import styles from "./LanternField.module.css";

type LanternTone = {
  name: LanternWishToneName;
  core: string;
  mid: string;
  deep: string;
  glow: string;
};

/** Curated warm palette — no greens, blues, or purples. */
const LANTERN_TONES: readonly LanternTone[] = [
  { name: "warmIvory", core: "#fff6e8", mid: "#f0e2c4", deep: "#d9c49a", glow: "rgba(255, 246, 232, 0.42)" },
  { name: "candleWhite", core: "#fffdf8", mid: "#f7efe0", deep: "#e8dcc8", glow: "rgba(255, 253, 248, 0.4)" },
  { name: "softAmber", core: "#ffd48a", mid: "#e9a74a", deep: "#b46724", glow: "rgba(255, 212, 138, 0.45)" },
  { name: "goldenYellow", core: "#ffe27a", mid: "#f0c94a", deep: "#c99620", glow: "rgba(255, 226, 122, 0.44)" },
  { name: "peach", core: "#ffd2b0", mid: "#f0a878", deep: "#d07a4a", glow: "rgba(255, 210, 176, 0.42)" },
  { name: "warmOrange", core: "#ffb86a", mid: "#e8893a", deep: "#b85a18", glow: "rgba(255, 184, 106, 0.46)" },
  { name: "blushPink", core: "#ffc8c0", mid: "#f0a098", deep: "#d07068", glow: "rgba(255, 200, 192, 0.4)" },
  { name: "roseGold", core: "#f0c8a8", mid: "#d4a078", deep: "#b07850", glow: "rgba(240, 200, 168, 0.42)" },
  { name: "paleCoral", core: "#ffb8a0", mid: "#e88870", deep: "#c06048", glow: "rgba(255, 184, 160, 0.43)" },
  { name: "softRed", core: "#f0a090", mid: "#d07060", deep: "#a84838", glow: "rgba(240, 160, 144, 0.4)" },
];

const TONE_INDEX: Record<LanternWishToneName, number> = {
  warmIvory: 0,
  candleWhite: 1,
  softAmber: 2,
  goldenYellow: 3,
  peach: 4,
  warmOrange: 5,
  blushPink: 6,
  roseGold: 7,
  paleCoral: 8,
  softRed: 9,
};

const DISTANT_COUNT = 7;

interface Lantern {
  id: number;
  x: number;
  wishText: string;
  wishColor: string;
  sway: number;
  durationSec: number;
  rotateDeg: number;
  toneIndex: number;
  glowScale: number;
  sizeScale: number;
  generation: number;
}

interface DistantLantern {
  id: number;
  x: number;
  sway: number;
  durationSec: number;
  delaySec: number;
  rotateDeg: number;
  toneIndex: number;
  sizeScale: number;
  opacity: number;
  generation: number;
}

interface LanternFieldProps {
  /** Kept for API compatibility; curated pool is used for display. */
  wishes?: readonly string[];
  onAllReleased?: () => void;
  className?: string;
}

function pickWish(
  active: readonly Lantern[],
  nearX: number,
  avoidText?: string,
): (typeof LANTERN_WISH_POOL)[number] {
  const nearbyTexts = new Set(
    active
      .filter((l) => Math.abs(l.x - nearX) < 18)
      .map((l) => l.wishText),
  );
  if (avoidText) nearbyTexts.add(avoidText);

  const fresh = LANTERN_WISH_POOL.filter((w) => !nearbyTexts.has(w.text));
  const pool = fresh.length > 0 ? fresh : LANTERN_WISH_POOL;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function createLantern(
  id: number,
  opts: {
    x: number;
    wish: (typeof LANTERN_WISH_POOL)[number];
    generation?: number;
  },
): Lantern {
  const toneIndex = TONE_INDEX[opts.wish.tone] ?? 0;
  return {
    id,
    x: opts.x,
    wishText: opts.wish.text,
    wishColor: opts.wish.textColor,
    sway: (Math.random() - 0.5) * 48,
    durationSec: 14 + Math.random() * 5,
    rotateDeg: (Math.random() - 0.5) * 7,
    toneIndex,
    glowScale: 0.8 + Math.random() * 0.45,
    sizeScale: 0.9 + Math.random() * 0.25,
    generation: opts.generation ?? 0,
  };
}

function createDistant(id: number, stagger: boolean): DistantLantern {
  const durationSec = 22 + Math.random() * 14;
  return {
    id,
    x: 4 + Math.random() * 92,
    sway: (Math.random() - 0.5) * 36,
    durationSec,
    delaySec: stagger ? -(Math.random() * durationSec) : 0,
    rotateDeg: (Math.random() - 0.5) * 5,
    toneIndex: Math.floor(Math.random() * LANTERN_TONES.length),
    sizeScale: 0.35 + Math.random() * 0.28,
    opacity: 0.12 + Math.random() * 0.14,
    generation: 0,
  };
}

function LanternFigure() {
  return (
    <span className={styles.figure} aria-hidden="true">
      <span className={styles.glow} />
      <span className={styles.cap} />
      <span className={styles.roof} />
      <span className={styles.body} />
      <span className={styles.base} />
    </span>
  );
}

/**
 * Click the night sky to release a wish-bearing lantern. Dim distant lanterns
 * drift quietly in the background; wish lanterns only appear on click and
 * leave the sky once their journey ends.
 */
export function LanternField({
  wishes = LANTERN_WISH_POOL.map((w) => w.text),
  onAllReleased,
  className,
}: LanternFieldProps) {
  const [lanterns, setLanterns] = useState<Lantern[]>([]);
  const [distant, setDistant] = useState<DistantLantern[]>([]);
  const [releasedCount, setReleasedCount] = useState(0);
  const idRef = useRef(0);
  const distantIdRef = useRef(0);
  const seededRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const totalWishes = Math.max(wishes.length, LANTERN_WISH_POOL.length);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    setDistant(
      Array.from({ length: DISTANT_COUNT }, () =>
        createDistant(distantIdRef.current++, !reducedMotion),
      ),
    );
  }, [reducedMotion]);

  const release = useCallback(
    (clientX: number, container: HTMLDivElement) => {
      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const id = idRef.current++;

      setLanterns((prev) => {
        const wish = pickWish(prev, x);
        return [...prev, createLantern(id, { x, wish })];
      });
      setReleasedCount((prev) => {
        const next = prev + 1;
        if (next === totalWishes) onAllReleased?.();
        return next;
      });
    },
    [onAllReleased, totalWishes],
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      release(event.clientX, event.currentTarget);
    },
    [release],
  );

  /** Wish lanterns are click-spawned only — remove them once they leave the sky. */
  const dismiss = useCallback((id: number) => {
    setLanterns((prev) => prev.filter((lantern) => lantern.id !== id));
  }, []);

  const recycleDistant = useCallback((id: number) => {
    setDistant((prev) =>
      prev.map((lantern) => {
        if (lantern.id !== id) return lantern;
        const next = createDistant(id, false);
        return { ...next, generation: lantern.generation + 1 };
      }),
    );
  }, []);

  const remaining = Math.max(0, totalWishes - releasedCount);

  return (
    <div
      className={[styles.field, className].filter(Boolean).join(" ")}
      onClick={handleClick}
      role="presentation"
    >
      <p className={styles.hint} aria-hidden="true">
        {remaining > 0
          ? "Touch the dark to release a lantern"
          : "Every wish is on its way"}
      </p>
      <div className={styles.sr} aria-live="polite">
        {releasedCount} of {totalWishes} lanterns released
      </div>

      {distant.map((lantern) => {
        const tone = LANTERN_TONES[lantern.toneIndex] ?? LANTERN_TONES[0]!;
        const style = {
          left: `${lantern.x}%`,
          "--sway": `${lantern.sway}px`,
          "--duration": `${lantern.durationSec}s`,
          "--delay": `${lantern.delaySec}s`,
          "--rot": `${lantern.rotateDeg}deg`,
          "--core": tone.core,
          "--mid": tone.mid,
          "--deep": tone.deep,
          "--glow": tone.glow,
          "--size": String(lantern.sizeScale),
          "--distant-opacity": String(lantern.opacity),
        } as CSSProperties;

        return (
          <div
            key={`distant-${lantern.id}-${lantern.generation}`}
            className={[
              styles.distant,
              reducedMotion ? styles.distantStatic : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={style}
            aria-hidden="true"
            onAnimationEnd={
              reducedMotion
                ? undefined
                : (event) => {
                    if (event.target !== event.currentTarget) return;
                    recycleDistant(lantern.id);
                  }
            }
          >
            <LanternFigure />
          </div>
        );
      })}

      {lanterns.map((lantern) => {
        const tone = LANTERN_TONES[lantern.toneIndex] ?? LANTERN_TONES[0]!;
        const style = {
          left: `${lantern.x}%`,
          "--sway": `${lantern.sway}px`,
          "--duration": `${lantern.durationSec}s`,
          "--rot": `${lantern.rotateDeg}deg`,
          "--core": tone.core,
          "--mid": tone.mid,
          "--deep": tone.deep,
          "--glow": tone.glow,
          "--wish-color": lantern.wishColor,
          "--glow-scale": String(lantern.glowScale),
          "--size": String(lantern.sizeScale),
        } as CSSProperties;

        return (
          <div
            key={`${lantern.id}-${lantern.generation}`}
            className={[
              styles.lantern,
              reducedMotion ? styles.lanternStatic : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={style}
            onAnimationEnd={
              reducedMotion
                ? undefined
                : (event) => {
                    if (event.target !== event.currentTarget) return;
                    dismiss(lantern.id);
                  }
            }
          >
            <span className={styles.wish}>{lantern.wishText}</span>
            <LanternFigure />
          </div>
        );
      })}
    </div>
  );
}
