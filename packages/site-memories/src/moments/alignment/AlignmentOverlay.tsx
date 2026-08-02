import type { ResolvedConstellation, Vec2 } from "../constellation/types.js";
import type { AlignmentDisplayOptions } from "./model.js";
import styles from "./AlignmentTool.module.css";

type Props = {
  constellation: ResolvedConstellation;
  constellationCentre: Vec2;
  options: AlignmentDisplayOptions;
  viewBox: { w: number; h: number };
};

/**
 * Dev-only overlays (centres, UIDs, names, draw-order indices, bounding boxes).
 * Star/artwork drawing stays in ConstellationRenderer.
 */
export function AlignmentOverlay({
  constellation,
  constellationCentre,
  options,
  viewBox,
}: Props) {
  const { vertices, artwork, drawSegments } = constellation;
  const byUid = new Map(vertices.map((v) => [v.uid, v]));
  const artCx = artwork ? artwork.x + artwork.width / 2 : 0;
  const artCy = artwork ? artwork.y + artwork.height / 2 : 0;

  return (
    <svg
      className={styles.overlaySvg}
      viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      {options.showDrawOrder
        ? drawSegments.map(([a, b], i) => {
            const sa = byUid.get(a);
            const sb = byUid.get(b);
            if (!sa || !sb) return null;
            return (
              <g key={`draw-${i}`}>
                <line
                  x1={sa.x}
                  y1={sa.y}
                  x2={sb.x}
                  y2={sb.y}
                  className={styles.drawOrderEdge}
                />
                <text
                  x={(sa.x + sb.x) / 2}
                  y={(sa.y + sb.y) / 2}
                  className={styles.drawOrderIndex}
                >
                  {i + 1}
                </text>
              </g>
            );
          })
        : null}

      {options.showBoundingBoxes && artwork ? (
        <rect
          x={artwork.x}
          y={artwork.y}
          width={artwork.width}
          height={artwork.height}
          className={styles.bbox}
        />
      ) : null}

      {options.showArtworkCentre && artwork ? (
        <g className={styles.centreArt}>
          <line x1={artCx - 3} y1={artCy} x2={artCx + 3} y2={artCy} />
          <line x1={artCx} y1={artCy - 3} x2={artCx} y2={artCy + 3} />
          <circle cx={artCx} cy={artCy} r={0.55} />
          <text x={artCx + 1.4} y={artCy - 1.4} className={styles.centreLabel}>
            art
          </text>
        </g>
      ) : null}

      {options.showConstellationCentre ? (
        <g className={styles.centreConst}>
          <line
            x1={constellationCentre.x - 3}
            y1={constellationCentre.y}
            x2={constellationCentre.x + 3}
            y2={constellationCentre.y}
          />
          <line
            x1={constellationCentre.x}
            y1={constellationCentre.y - 3}
            x2={constellationCentre.x}
            y2={constellationCentre.y + 3}
          />
          <circle cx={constellationCentre.x} cy={constellationCentre.y} r={0.55} />
          <text
            x={constellationCentre.x + 1.4}
            y={constellationCentre.y - 1.4}
            className={styles.centreLabel}
          >
            c
          </text>
        </g>
      ) : null}

      {vertices.map((v) => (
        <g key={`ov-${v.uid}`}>
          {options.showVertexUids ? (
            <text x={v.x + 1.2} y={v.y - 1.2} className={styles.uidLabel}>
              {v.uid}
            </text>
          ) : null}
          {options.showStarNames ? (
            <text x={v.x + 1.2} y={v.y + 2.4} className={styles.nameLabel}>
              {v.name}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
