import styles from "./GrainOverlay.module.css";

const NOISE_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'>
      <filter id='n'>
        <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch' result='t'/>
        <feColorMatrix in='t' type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.045 0'/>
      </filter>
      <rect width='100%' height='100%' filter='url(#n)'/>
    </svg>`,
  );

/**
 * A quiet, page-wide film-grain texture. Purely atmospheric — never
 * intercepts pointer events, and holds still for reduced-motion users.
 */
export function GrainOverlay() {
  return (
    <div
      className={styles.grain}
      aria-hidden="true"
      style={{ backgroundImage: `url("${NOISE_SVG}")` }}
    />
  );
}
