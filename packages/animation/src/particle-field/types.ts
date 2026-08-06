import type { ReactNode } from "react";

export type ParticleTone = {
  id: string;
  core: string;
  mid: string;
  deep: string;
  glow: string;
};

export type ParticleLabel = {
  text: string;
  toneId: string;
  textColor: string;
};

export type ParticleFieldProps = {
  /** Labels shown on click-spawned particles. Empty pool disables release counting. */
  pool?: readonly ParticleLabel[];
  tones?: readonly ParticleTone[];
  /** Custom glyph for each particle; default is a warm lantern-like figure. */
  renderParticle?: () => ReactNode;
  distantCount?: number;
  hintActive?: string;
  hintDone?: string;
  /** Screen-reader live region, e.g. "(n) of (m) released". */
  liveRegionLabel?: (released: number, total: number) => string;
  onAllReleased?: () => void;
  className?: string;
};
