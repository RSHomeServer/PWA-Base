import { type CSSProperties } from "react";
import type { ResolvedConstellation } from "./types.js";
import { STAR_LOOK } from "./starLooks.js";
import styles from "../FindUsMoment.module.css";

export type DrawnEdge = { fromUid: string; toUid: string; key: string };
export type StarPressPayload = {
  uid: string;
  name: string;
  subtitle: string;
  constellationId: string;
};

type Props = {
  constellation: ResolvedConstellation;
  activatedUids: Set<string>;
  nextUid: string | null;
  drawnEdges: DrawnEdge[];
  showArtwork: boolean;
  showLabel: boolean;
  interactive: boolean;
  hideStars: boolean;
  /** Soft entrance — defaults to true for alignment / tooling. */
  visible?: boolean;
  onHover: (
    uid: string,
    name: string,
    subtitle: string,
    x: number,
    y: number,
  ) => void;
  onLeave: () => void;
  onActivate: (uid: string) => void;
  onStarPress?: (payload: StarPressPayload) => void;
  reducedMotion: boolean;
  lineDrawMs: number;
  lineWidth: number;
  viewBox: { w: number; h: number };
};

const EFFECT_CLASS: Record<string, string> = {
  regulus: styles.regulus,
  rasalas: styles.rasalas,
  denebola: styles.denebola,
};

/**
 * Generic constellation renderer — knows nothing about Leo / Sagittarius.
 * Applies specialEffects as class hooks (no-ops until effect styles exist).
 */
export function ConstellationRenderer({
  constellation,
  activatedUids,
  nextUid,
  drawnEdges,
  showArtwork,
  showLabel,
  interactive,
  hideStars,
  visible = true,
  onHover,
  onLeave,
  onActivate,
  onStarPress,
  reducedMotion,
  lineDrawMs,
  lineWidth,
  viewBox,
}: Props) {
  const { palette, vertices, artwork, displayName } = constellation;
  const byUid = new Map(vertices.map((v) => [v.uid, v]));
  const restState = !interactive && nextUid == null;

  function starSeed(uid: string): number {
    let hash = 2166136261;
    for (let i = 0; i < uid.length; i++) {
      hash ^= uid.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash >>> 0);
  }

  return (
    <div
      className={[
        styles.constellationLayer,
        visible ? styles.constellationVisible : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-constellation-id={constellation.id}
      style={
        {
          ["--glow"]: palette.glow,
          ["--glow-soft"]: palette.glowSoft,
          ["--line"]: palette.line,
        } as CSSProperties
      }
    >
      <svg
        className={styles.constellationSvg}
        viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {artwork ? (
          <image
            href={artwork.image}
            x={artwork.x}
            y={artwork.y}
            width={artwork.width}
            height={artwork.height}
            opacity={showArtwork ? artwork.opacity : 0}
            className={styles.atlasArt}
            style={{
              transition: reducedMotion
                ? "opacity 200ms linear"
                : "opacity 2.2s ease",
            }}
            preserveAspectRatio={
              artwork.fit === "fill" ? "none" : "xMidYMid meet"
            }
            transform={
              artwork.rotationDeg !== 0
                ? `rotate(${artwork.rotationDeg} ${artwork.x + artwork.width / 2} ${artwork.y + artwork.height / 2})`
                : undefined
            }
          />
        ) : null}

        {drawnEdges.map((edge) => {
          const sa = byUid.get(edge.fromUid);
          const sb = byUid.get(edge.toUid);
          if (!sa || !sb) return null;
          return (
            <line
              key={edge.key}
              className={styles.edge}
              x1={sa.x}
              y1={sa.y}
              x2={sb.x}
              y2={sb.y}
              stroke={palette.line}
              strokeWidth={lineWidth}
              strokeLinecap="round"
              pathLength={1}
              shapeRendering="geometricPrecision"
              style={
                {
                  animationDuration: reducedMotion ? "1ms" : `${lineDrawMs}ms`,
                  ...(reducedMotion
                    ? { strokeDashoffset: 0, animation: "none" }
                    : {}),
                } as CSSProperties
              }
            />
          );
        })}

        {!hideStars &&
          vertices.map((star) => {
            const isOn = activatedUids.has(star.uid);
            const isActive = interactive && nextUid === star.uid && !isOn;
            const look = STAR_LOOK[star.name];
            const body = look?.body ?? palette.glow;
            const core = look?.core ?? "#ffffff";
            const glow = look?.glow ?? palette.glowSoft;
            const spikeScale = look?.spikeScale ?? 1;
            const seed = starSeed(star.uid);
            const baseTwinkle = (isOn ? 7600 : 4200) + (seed % 2800);
            const twinkleMs = Math.round(
              baseTwinkle * (look?.twinkleScale ?? 1),
            );
            const twinkleDelay = -((seed % 12000) + 140);
            const pulseMs = (isOn ? 11000 : 9000) + (seed % 5000);
            const effects = star.specialEffects.join(" ");
            const spikeLong = 2.7 * spikeScale;
            const spikeDiag = 1.65 * spikeScale;
            const spikeSec = 3.4 * spikeScale;
            const starStyle = {
              ["--twinkle-ms"]: `${twinkleMs}ms`,
              ["--twinkle-delay"]: `${twinkleDelay}ms`,
              ["--pulse-ms-local"]: `${pulseMs}ms`,
            } as CSSProperties;
            return (
              <g
                key={`core-${star.uid}`}
                className={[
                  styles.starSprite,
                  isOn ? styles.starSpriteOn : "",
                  isActive ? styles.starSpriteActive : "",
                  restState ? styles.starSpriteRest : "",
                  look?.effect ? (EFFECT_CLASS[look.effect] ?? "") : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-effects={effects || undefined}
                style={starStyle}
              >
                <circle
                  className={styles.starHaloBloom}
                  cx={star.x}
                  cy={star.y}
                  r={isActive ? 2.2 : isOn ? 1.9 : 1.05}
                  fill={glow}
                />
                <circle
                  className={styles.starHaloSoft}
                  cx={star.x}
                  cy={star.y}
                  r={isActive ? 1.35 : isOn ? 1.15 : 0.7}
                  fill={glow}
                />
                {isActive ? (
                  <circle
                    className={styles.starTargetRing}
                    cx={star.x}
                    cy={star.y}
                    r={2.05}
                  />
                ) : null}
                {(isActive || isOn) && (
                  <>
                    <g className={styles.starSpikesSecondary}>
                      <line
                        x1={star.x - spikeSec}
                        y1={star.y}
                        x2={star.x + spikeSec}
                        y2={star.y}
                      />
                      <line
                        x1={star.x}
                        y1={star.y - spikeSec}
                        x2={star.x}
                        y2={star.y + spikeSec}
                      />
                    </g>
                    <g className={styles.starSpikes}>
                      <line
                        x1={star.x - spikeLong}
                        y1={star.y}
                        x2={star.x + spikeLong}
                        y2={star.y}
                      />
                      <line
                        x1={star.x}
                        y1={star.y - spikeLong}
                        x2={star.x}
                        y2={star.y + spikeLong}
                      />
                      <line
                        x1={star.x - spikeDiag}
                        y1={star.y - spikeDiag}
                        x2={star.x + spikeDiag}
                        y2={star.y + spikeDiag}
                      />
                      <line
                        x1={star.x - spikeDiag}
                        y1={star.y + spikeDiag}
                        x2={star.x + spikeDiag}
                        y2={star.y - spikeDiag}
                      />
                    </g>
                  </>
                )}
                <circle
                  className={styles.starBody}
                  cx={star.x}
                  cy={star.y}
                  r={isActive ? 1.25 : isOn ? 1.05 : 0.55}
                  fill={body}
                  shapeRendering="geometricPrecision"
                />
                <circle
                  className={styles.starCore}
                  cx={star.x}
                  cy={star.y}
                  r={isActive ? 0.42 : isOn ? 0.36 : 0.22}
                  fill={core}
                  shapeRendering="geometricPrecision"
                />
              </g>
            );
          })}
      </svg>

      {!hideStars &&
        vertices.map((star) => {
          const isOn = activatedUids.has(star.uid);
          const isActive = interactive && nextUid === star.uid && !isOn;
          return (
            <button
              key={star.uid}
              type="button"
              className={[
                styles.starBtn,
                isOn ? styles.starOn : "",
                isActive ? styles.starActive : "",
                !isOn && !isActive ? styles.starIdle : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{ left: `${star.x}%`, top: `${star.y}%` }}
              aria-label={
                isOn
                  ? star.subtitle
                    ? `${star.name}, ${star.subtitle}`
                    : star.name
                  : isActive
                    ? star.subtitle
                      ? `${star.name}, ${star.subtitle}`
                      : star.name
                    : star.subtitle
                      ? `${star.name}, ${star.subtitle}`
                      : star.name
              }
              tabIndex={isActive || isOn ? 0 : -1}
              onMouseEnter={() => {
                if (!isOn) return;
                onHover(star.uid, star.name, star.subtitle, star.x, star.y);
              }}
              onFocus={() => {
                if (!isOn) return;
                onHover(star.uid, star.name, star.subtitle, star.x, star.y);
              }}
              onMouseLeave={onLeave}
              onBlur={onLeave}
              onClick={() => {
                if (isActive) {
                  onActivate(star.uid);
                  return;
                }
                if (isOn) {
                  onStarPress?.({
                    uid: star.uid,
                    name: star.name,
                    subtitle: star.subtitle,
                    constellationId: constellation.id,
                  });
                }
              }}
            />
          );
        })}

      {showLabel ? (
        <p
          className={styles.constellationLabel}
          style={{
            color: palette.label,
            left: `${vertices.reduce((s, st) => s + st.x, 0) / Math.max(1, vertices.length)}%`,
            top: `${Math.min(90, vertices.reduce((s, st) => s + st.y, 0) / Math.max(1, vertices.length) + 11)}%`,
          }}
        >
          {displayName}
        </p>
      ) : null}
    </div>
  );
}
