export type ParticlesMotionPrefs = {
  /** Particle count when motion is allowed (default 28). */
  particleCount?: number;
};

export type ResolvedParticlesMotion = {
  particleCount: number;
  moveEnable: boolean;
  linksEnable: boolean;
};

/** Empty / frozen field for reduced motion. */
export const FROZEN_PARTICLES_MOTION = {
  particleCount: 0,
  moveEnable: false,
  linksEnable: false,
} as const satisfies ResolvedParticlesMotion;

/**
 * Pure Songara reduced-motion policy for tsparticles ambient fields.
 */
export function resolveParticlesMotion(
  reducedMotion: boolean,
  prefs?: ParticlesMotionPrefs,
): ResolvedParticlesMotion {
  if (reducedMotion) return { ...FROZEN_PARTICLES_MOTION };
  return {
    particleCount: prefs?.particleCount ?? 28,
    moveEnable: true,
    linksEnable: true,
  };
}
