export type ResolvedMatterRunner = {
  /** When false, do not start Matter.Runner / RAF stepping. */
  enabled: boolean;
};

/**
 * Pure Songara reduced-motion policy for Matter.js runners.
 * Simulations that are not decorative may ignore this; ambient demos should honour it.
 */
export function resolveMatterRunner(reducedMotion: boolean): ResolvedMatterRunner {
  return { enabled: !reducedMotion };
}
