import type { CentrepieceRef } from "../types.js";
import styles from "./SnowGlobeFallback.module.css";

function CentrepieceArt({ centrepiece }: { centrepiece: CentrepieceRef }) {
  const id =
    centrepiece.kind === "procedural"
      ? centrepiece.id
      : centrepiece.src.includes("tree")
        ? "christmas-tree"
        : "eiffel";

  if (id === "constellation") {
    return (
      <svg className={styles.propConstellationSvg} viewBox="0 0 100 100" aria-hidden>
        <defs>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff4e0" stopOpacity="1" />
            <stop offset="100%" stopColor="#fff4e0" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g stroke="#d4b888" strokeWidth="0.8" fill="none" opacity="0.65">
          <path d="M18 42 L28 28 L40 20 L50 16 L60 20 L72 28 L82 42 L68 58 L50 72 L32 58 Z" />
        </g>
        {[
          [18, 42],
          [28, 28],
          [40, 20],
          [50, 16],
          [60, 20],
          [72, 28],
          [82, 42],
          [68, 58],
          [50, 72],
          [32, 58],
          [22, 70],
          [78, 68],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="4" fill="url(#starGlow)" opacity="0.55" />
            <circle cx={x} cy={y} r="1.6" fill="#fff4e0" />
          </g>
        ))}
      </svg>
    );
  }

  if (id === "christmas-tree") {
    return (
      <div className={styles.propTree} aria-hidden>
        <span className={styles.treeStar} />
        <span className={styles.treeTier} data-tier="1" />
        <span className={styles.treeTier} data-tier="2" />
        <span className={styles.treeTier} data-tier="3" />
        <span className={styles.treeTrunk} />
        <span className={styles.treeSnow} />
      </div>
    );
  }

  if (id === "ballet-shoes") {
    return (
      <div className={styles.propShoes} aria-hidden>
        <span className={styles.shoe} data-side="left" />
        <span className={styles.shoe} data-side="right" />
        <span className={styles.ribbon} />
      </div>
    );
  }

  return (
    <svg className={styles.propTowerSvg} viewBox="0 0 80 120" aria-hidden>
      <defs>
        <linearGradient id="towerGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8d4a8" />
          <stop offset="55%" stopColor="#b08958" />
          <stop offset="100%" stopColor="#6a4a30" />
        </linearGradient>
      </defs>
      <line x1="40" y1="4" x2="40" y2="22" stroke="url(#towerGold)" strokeWidth="2.2" />
      <polygon points="34,22 46,22 48,38 32,38" fill="url(#towerGold)" opacity="0.95" />
      <line x1="34" y1="28" x2="46" y2="28" stroke="#5a4030" strokeWidth="0.6" opacity="0.5" />
      <polygon points="30,38 50,38 56,62 24,62" fill="url(#towerGold)" />
      <line x1="32" y1="46" x2="48" y2="46" stroke="#5a4030" strokeWidth="0.55" opacity="0.45" />
      <line x1="30" y1="54" x2="50" y2="54" stroke="#5a4030" strokeWidth="0.55" opacity="0.45" />
      <polygon points="22,62 58,62 70,108 10,108" fill="url(#towerGold)" />
      <path d="M28 78 L40 70 L52 78" fill="none" stroke="#5a4030" strokeWidth="1.2" opacity="0.55" />
      <path d="M18 98 L40 86 L62 98" fill="none" stroke="#5a4030" strokeWidth="1.2" opacity="0.5" />
      <line x1="26" y1="70" x2="54" y2="70" stroke="#5a4030" strokeWidth="0.5" opacity="0.4" />
      <line x1="20" y1="88" x2="60" y2="88" stroke="#5a4030" strokeWidth="0.5" opacity="0.4" />
      <ellipse cx="40" cy="110" rx="28" ry="4" fill="rgba(0,0,0,0.25)" />
      <rect x="8" y="106" width="10" height="6" rx="1" fill="url(#towerGold)" />
      <rect x="62" y="106" width="10" height="6" rx="1" fill="url(#towerGold)" />
      <rect x="22" y="108" width="8" height="5" rx="1" fill="url(#towerGold)" opacity="0.85" />
      <rect x="50" y="108" width="8" height="5" rx="1" fill="url(#towerGold)" opacity="0.85" />
    </svg>
  );
}

/** Premium CSS collectible globe — primary craft path. */
export function SnowGlobeFallback({
  centrepiece,
  density = 0.45,
  lightingMood = "warm",
}: {
  centrepiece: CentrepieceRef;
  density?: number;
  lightingMood?: string;
}) {
  const flakes = Math.max(28, Math.round(58 * density));
  return (
    <div
      className={styles.wrap}
      data-mood={lightingMood}
      data-density={density.toFixed(2)}
    >
      <div className={styles.plinthGlow} aria-hidden />
      <div className={styles.globe}>
        <div className={styles.dome}>
          <div className={styles.innerSky} />
          <div className={styles.scene}>
            <CentrepieceArt centrepiece={centrepiece} />
            <div className={styles.ground} />
            <div className={styles.groundShadow} />
          </div>
          <div className={styles.snow} aria-hidden>
            {Array.from({ length: flakes }, (_, i) => (
              <span
                key={i}
                className={styles.flake}
                style={{
                  ["--i" as string]: String(i),
                  ["--n" as string]: String(flakes),
                  ["--x" as string]: `${8 + ((i * 47) % 84)}%`,
                  ["--delay" as string]: `${-((i * 0.37) % 6)}s`,
                  ["--dur" as string]: `${5.5 + (i % 5) * 0.55}s`,
                  ["--size" as string]: `${0.14 + (i % 4) * 0.05}rem`,
                }}
              />
            ))}
          </div>
          <div className={styles.glassRim} />
          <div className={styles.shinePrimary} />
          <div className={styles.shineSecondary} />
          <div className={styles.refraction} />
        </div>
        <div className={styles.collar} />
        <div className={styles.base}>
          <div className={styles.baseTop} />
          <div className={styles.baseBand} />
          <div className={styles.baseBody} />
          <div className={styles.baseFoot} />
          <div className={styles.plaqueSmall}>MEMORY</div>
        </div>
      </div>
      <div className={styles.tableReflection} aria-hidden />
    </div>
  );
}
