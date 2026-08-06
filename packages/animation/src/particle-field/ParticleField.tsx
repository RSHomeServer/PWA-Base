import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { useReducedMotion } from "../useReducedMotion.js";
import { DEFAULT_PARTICLE_TONES } from "./defaultTones.js";
import styles from "./ParticleField.module.css";
import type { ParticleFieldProps, ParticleLabel, ParticleTone } from "./types.js";

interface ActiveParticle {
  id: number;
  x: number;
  labelText: string;
  labelColor: string;
  sway: number;
  durationSec: number;
  rotateDeg: number;
  toneIndex: number;
  glowScale: number;
  sizeScale: number;
  generation: number;
}

interface DistantParticle {
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

function buildToneIndex(tones: readonly ParticleTone[]): Record<string, number> {
  const index: Record<string, number> = {};
  tones.forEach((tone, i) => {
    index[tone.id] = i;
  });
  return index;
}

function pickLabel(
  pool: readonly ParticleLabel[],
  active: readonly ActiveParticle[],
  nearX: number,
  avoidText?: string,
): ParticleLabel {
  const nearbyTexts = new Set(
    active
      .filter((particle) => Math.abs(particle.x - nearX) < 18)
      .map((particle) => particle.labelText),
  );
  if (avoidText) nearbyTexts.add(avoidText);

  const fresh = pool.filter((entry) => !nearbyTexts.has(entry.text));
  const candidates = fresh.length > 0 ? fresh : pool;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

function createActiveParticle(
  id: number,
  toneIndex: Record<string, number>,
  opts: {
    x: number;
    label: ParticleLabel;
    generation?: number;
  },
): ActiveParticle {
  return {
    id,
    x: opts.x,
    labelText: opts.label.text,
    labelColor: opts.label.textColor,
    sway: (Math.random() - 0.5) * 48,
    durationSec: 14 + Math.random() * 5,
    rotateDeg: (Math.random() - 0.5) * 7,
    toneIndex: toneIndex[opts.label.toneId] ?? 0,
    glowScale: 0.8 + Math.random() * 0.45,
    sizeScale: 0.9 + Math.random() * 0.25,
    generation: opts.generation ?? 0,
  };
}

function createDistant(
  id: number,
  toneCount: number,
  stagger: boolean,
): DistantParticle {
  const durationSec = 22 + Math.random() * 14;
  return {
    id,
    x: 4 + Math.random() * 92,
    sway: (Math.random() - 0.5) * 36,
    durationSec,
    delaySec: stagger ? -(Math.random() * durationSec) : 0,
    rotateDeg: (Math.random() - 0.5) * 5,
    toneIndex: Math.floor(Math.random() * toneCount),
    sizeScale: 0.35 + Math.random() * 0.28,
    opacity: 0.12 + Math.random() * 0.14,
    generation: 0,
  };
}

function DefaultParticleFigure() {
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

const defaultLiveRegionLabel = (released: number, total: number) =>
  `${released} of ${total} released`;

/**
 * Click a night-sky field to release labelled particles. Dim distant particles
 * drift in the background; interactive particles appear on click and leave
 * once their journey ends.
 */
export function ParticleField({
  pool = [],
  tones = DEFAULT_PARTICLE_TONES,
  renderParticle,
  distantCount = 7,
  hintActive = "Touch the dark to release a particle",
  hintDone = "Every particle is on its way",
  liveRegionLabel = defaultLiveRegionLabel,
  onAllReleased,
  className,
}: ParticleFieldProps) {
  const [particles, setParticles] = useState<ActiveParticle[]>([]);
  const [distant, setDistant] = useState<DistantParticle[]>([]);
  const [releasedCount, setReleasedCount] = useState(0);
  const idRef = useRef(0);
  const distantIdRef = useRef(0);
  const seededRef = useRef(false);
  const reducedMotion = useReducedMotion();
  const totalLabels = pool.length;
  const toneIndex = useMemo(() => buildToneIndex(tones), [tones]);
  const renderGlyph = renderParticle ?? (() => <DefaultParticleFigure />);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    setDistant(
      Array.from({ length: distantCount }, () =>
        createDistant(distantIdRef.current++, tones.length, !reducedMotion),
      ),
    );
  }, [distantCount, reducedMotion, tones.length]);

  const release = useCallback(
    (clientX: number, container: HTMLDivElement) => {
      if (pool.length === 0) return;

      const rect = container.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const id = idRef.current++;

      setParticles((prev) => {
        const label = pickLabel(pool, prev, x);
        return [...prev, createActiveParticle(id, toneIndex, { x, label })];
      });
      setReleasedCount((prev) => {
        const next = prev + 1;
        if (next === totalLabels) onAllReleased?.();
        return next;
      });
    },
    [onAllReleased, pool, toneIndex, totalLabels],
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      release(event.clientX, event.currentTarget);
    },
    [release],
  );

  const dismiss = useCallback((id: number) => {
    setParticles((prev) => prev.filter((particle) => particle.id !== id));
  }, []);

  const recycleDistant = useCallback(
    (id: number) => {
      setDistant((prev) =>
        prev.map((particle) => {
          if (particle.id !== id) return particle;
          const next = createDistant(id, tones.length, false);
          return { ...next, generation: particle.generation + 1 };
        }),
      );
    },
    [tones.length],
  );

  const remaining = Math.max(0, totalLabels - releasedCount);
  const hint = remaining > 0 ? hintActive : hintDone;

  return (
    <div
      className={[styles.field, className].filter(Boolean).join(" ")}
      onClick={handleClick}
      role="presentation"
    >
      <p className={styles.hint} aria-hidden="true">
        {hint}
      </p>
      <div className={styles.sr} aria-live="polite">
        {liveRegionLabel(releasedCount, totalLabels)}
      </div>

      {distant.map((particle) => {
        const tone = tones[particle.toneIndex] ?? tones[0]!;
        const style = {
          left: `${particle.x}%`,
          "--sway": `${particle.sway}px`,
          "--duration": `${particle.durationSec}s`,
          "--delay": `${particle.delaySec}s`,
          "--rot": `${particle.rotateDeg}deg`,
          "--core": tone.core,
          "--mid": tone.mid,
          "--deep": tone.deep,
          "--glow": tone.glow,
          "--size": String(particle.sizeScale),
          "--distant-opacity": String(particle.opacity),
        } as CSSProperties;

        return (
          <div
            key={`distant-${particle.id}-${particle.generation}`}
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
                    recycleDistant(particle.id);
                  }
            }
          >
            {renderGlyph()}
          </div>
        );
      })}

      {particles.map((particle) => {
        const tone = tones[particle.toneIndex] ?? tones[0]!;
        const style = {
          left: `${particle.x}%`,
          "--sway": `${particle.sway}px`,
          "--duration": `${particle.durationSec}s`,
          "--rot": `${particle.rotateDeg}deg`,
          "--core": tone.core,
          "--mid": tone.mid,
          "--deep": tone.deep,
          "--glow": tone.glow,
          "--label-color": particle.labelColor,
          "--glow-scale": String(particle.glowScale),
          "--size": String(particle.sizeScale),
        } as CSSProperties;

        return (
          <div
            key={`${particle.id}-${particle.generation}`}
            className={[
              styles.particle,
              reducedMotion ? styles.particleStatic : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={style}
            onAnimationEnd={
              reducedMotion
                ? undefined
                : (event) => {
                    if (event.target !== event.currentTarget) return;
                    dismiss(particle.id);
                  }
            }
          >
            <span className={styles.label}>{particle.labelText}</span>
            {renderGlyph()}
          </div>
        );
      })}
    </div>
  );
}

export type { ParticleFieldProps, ParticleLabel, ParticleTone };
