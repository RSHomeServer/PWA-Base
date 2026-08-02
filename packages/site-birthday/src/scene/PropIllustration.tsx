/**
 * Procedural isometric prop silhouettes — composition / proportion pass.
 * Placement owns pose; this module only decorates ResolvedProp geometry.
 */
import type { ReactNode } from "react";
import { getAsset } from "./assets/catalog.js";
import { artworkBaseCorners, artworkHeight } from "./assetSizing.js";
import { polyPoints, projectPoly, type Point2 } from "./iso.js";
import {
  surfaceBoundsCorners,
  type ResolvedProp,
  type ResolvedSurface,
  type ScenePlacement,
} from "./placement.js";
import type { Vec3 } from "./types.js";
import styles from "./PropIllustration.module.css";
import {
  defaultAuthoringParams,
  type SceneAuthoringParams,
} from "./geometry/params.js";
import { buildWardrobeGeometry } from "./geometry/buildWardrobe.js";
import { frameFromResolved } from "./geometry/frame.js";
import { RenderGeometry } from "./geometry/renderPrimitives.js";

/** Warm architectural-mockup palette — one language for every prop. */
export const PROP_STYLE = {
  stroke: "#2c241c",
  strokeWidth: 1.25,
  wood: "#9a7a58",
  woodDark: "#7a5e42",
  woodLight: "#b8956e",
  fabric: "#8a909c",
  fabricLight: "#a8aeb8",
  fabricDark: "#6a707c",
  linen: "#c4b8a8",
  linenDark: "#a89888",
  frame: "#6e655c",
  frameDark: "#4a433c",
  glass: "rgba(210, 225, 230, 0.48)",
  muntin: "#eef4f7",
  rug: "#6e6256",
  rugInner: "#7e7266",
  brass: "#b08a4a",
  brassLight: "#d4b46a",
  brassDark: "#7a5c30",
  paper: "#e8dcc8",
  paperDark: "#c4b49a",
  /** Traditional festival lantern paper. */
  paperRed: "#c45c48",
  paperRedDark: "#9e3f32",
  paperRedLight: "#d47864",
  glow: "rgba(255, 210, 140, 0.85)",
  glowCore: "#ffe6a8",
  star: "#fff4c8",
  vinyl: "#1a1a1a",
  vinylGroove: "#0c0c0c",
  leather: "#5c3a28",
  leatherLight: "#7a5238",
  leatherDark: "#3e2618",
  metal: "#8a9098",
  metalDark: "#5a6068",
  metalLight: "#b0b6bc",
  ribbon: "#8b3a3a",
} as const;

function elevate(corners: readonly Vec3[], dy: number): Vec3[] {
  return corners.map((c) => ({ x: c.x, y: c.y + dy, z: c.z }));
}

function lerpVec(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function insetQuad(corners: readonly Vec3[], amount: number): Vec3[] {
  const cx =
    (corners[0]!.x + corners[1]!.x + corners[2]!.x + corners[3]!.x) / 4;
  const cy =
    (corners[0]!.y + corners[1]!.y + corners[2]!.y + corners[3]!.y) / 4;
  const cz =
    (corners[0]!.z + corners[1]!.z + corners[2]!.z + corners[3]!.z) / 4;
  return corners.map((c) => ({
    x: c.x + (cx - c.x) * amount,
    y: c.y + (cy - c.y) * amount,
    z: c.z + (cz - c.z) * amount,
  }));
}

function depthKey(corners: readonly Vec3[]): number {
  return (
    corners.reduce((s, c) => s + c.x + c.z, 0) / Math.max(1, corners.length)
  );
}

function Face({
  corners,
  offset,
  fill,
}: {
  corners: readonly Vec3[];
  offset: Point2;
  fill: string;
}) {
  return (
    <polygon
      className={styles.face}
      fill={fill}
      stroke={PROP_STYLE.stroke}
      strokeWidth={PROP_STYLE.strokeWidth}
      strokeLinejoin="round"
      points={polyPoints(projectPoly(corners), offset)}
    />
  );
}

/** Full extruded box with depth-sorted sides — feels grounded, not C-shaped. */
function ExtrudedBox({
  base,
  height,
  offset,
  topFill,
  sideFill,
  sideFillAlt,
}: {
  base: readonly Vec3[];
  height: number;
  offset: Point2;
  topFill: string;
  sideFill: string;
  sideFillAlt: string;
}) {
  const top = elevate(base, height);
  const edgePairs: Array<[number, number]> = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
  ];
  const sides = edgePairs
    .map(([i, j], index) => {
      const quad = [base[i]!, base[j]!, top[j]!, top[i]!];
      return { quad, depth: depthKey(quad), index };
    })
    .sort((a, b) => a.depth - b.depth);

  return (
    <>
      {sides.map(({ quad, index }) => (
        <Face
          key={index}
          corners={quad}
          offset={offset}
          fill={index % 2 === 0 ? sideFill : sideFillAlt}
        />
      ))}
      <Face corners={top} offset={offset} fill={topFill} />
    </>
  );
}

function Legs({
  base,
  height,
  offset,
  thickness = 0.14,
}: {
  base: readonly Vec3[];
  height: number;
  offset: Point2;
  thickness?: number;
}) {
  return (
    <>
      {base.map((corner, i) => {
        const next = base[(i + 1) % 4]!;
        const prev = base[(i + 3) % 4]!;
        const towardNext = lerpVec(corner, next, thickness);
        const towardPrev = lerpVec(corner, prev, thickness);
        const inward = {
          x: corner.x + (towardNext.x - corner.x) + (towardPrev.x - corner.x),
          y: corner.y,
          z: corner.z + (towardNext.z - corner.z) + (towardPrev.z - corner.z),
        };
        const legBase = [corner, towardNext, inward, towardPrev];
        return (
          <ExtrudedBox
            key={i}
            base={legBase}
            height={height}
            offset={offset}
            topFill={PROP_STYLE.woodDark}
            sideFill={PROP_STYLE.woodDark}
            sideFillAlt={PROP_STYLE.frameDark}
          />
        );
      })}
    </>
  );
}

function DeskIllustration({
  resolved,
  hosted,
  offset,
}: {
  resolved: ResolvedProp;
  hosted: ResolvedSurface | undefined;
  offset: Point2;
}) {
  const top =
    hosted != null
      ? insetQuad(surfaceBoundsCorners(hosted), 0.03)
      : insetQuad(elevate(resolved.footprintCorners, 0.75), 0.04);
  const topThickness = 0.1;
  const topBottom = elevate(top, -topThickness);
  const legBase = insetQuad(resolved.footprintCorners, 0.1);
  const legHeight = Math.max(
    0.35,
    top[0]!.y - resolved.worldOrigin.y - topThickness,
  );

  return (
    <g data-illustration="desk">
      <Legs base={legBase} height={legHeight} offset={offset} thickness={0.16} />
      <ExtrudedBox
        base={topBottom}
        height={topThickness}
        offset={offset}
        topFill={PROP_STYLE.woodLight}
        sideFill={PROP_STYLE.wood}
        sideFillAlt={PROP_STYLE.woodDark}
      />
    </g>
  );
}

function BedIllustration({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  // Stacked flush components only — frame → mattress → blanket → pillows → headboard.
  // Footprint: [0–1] head (low v), [3–2] foot (high v).
  const platform = insetQuad(resolved.footprintCorners, 0.02);
  const frameH = 0.26;
  const mattressH = 0.2;
  const blanketH = 0.05;
  const pillowH = 0.09;
  const headboardH = 0.48;

  const frameTopY = resolved.worldOrigin.y + frameH;
  const mattressTopY = frameTopY + mattressH;

  // Frame platform (no legs — avoids floating underside shards).
  const frameBase = platform.map((c) => ({
    ...c,
    y: resolved.worldOrigin.y,
  }));

  // Mattress sits fully on the frame, slightly inset.
  const mattressBase = insetQuad(
    frameBase.map((c) => ({ ...c, y: frameTopY })),
    0.06,
  );

  // Headboard stands on the frame at the head edge only (not extruded from floor).
  const headOnFrame = [
    frameBase[0]!,
    frameBase[1]!,
    lerpVec(frameBase[1]!, frameBase[2]!, 0.08),
    lerpVec(frameBase[0]!, frameBase[3]!, 0.08),
  ].map((c) => ({ ...c, y: frameTopY }));

  // Blanket covers foot half of the mattress top.
  const mattressTop = elevate(mattressBase, mattressH);
  const blanketBase = [
    lerpVec(mattressTop[0]!, mattressTop[3]!, 0.42),
    lerpVec(mattressTop[1]!, mattressTop[2]!, 0.42),
    mattressTop[2]!,
    mattressTop[3]!,
  ].map((c) => ({ ...c, y: mattressTopY }));

  // Two pillows flush on the mattress, clear of the headboard face.
  const pillowPad = 0.05;
  const pillowFromHead = 0.12;
  const pillowDepth = 0.3;
  const headEdge = (t: number) =>
    lerpVec(
      lerpVec(mattressTop[0]!, mattressTop[3]!, pillowFromHead),
      lerpVec(mattressTop[1]!, mattressTop[2]!, pillowFromHead),
      t,
    );
  const pillowFar = (t: number) =>
    lerpVec(
      lerpVec(mattressTop[0]!, mattressTop[3]!, pillowFromHead + pillowDepth),
      lerpVec(mattressTop[1]!, mattressTop[2]!, pillowFromHead + pillowDepth),
      t,
    );
  const pillowLeft = [
    headEdge(0.08),
    headEdge(0.44),
    pillowFar(0.44),
    pillowFar(0.08),
  ].map((c) => ({ ...c, y: mattressTopY }));
  const pillowRight = [
    headEdge(0.56),
    headEdge(0.92),
    pillowFar(0.92),
    pillowFar(0.56),
  ].map((c) => ({ ...c, y: mattressTopY }));

  return (
    <g data-illustration="bed">
      <ExtrudedBox
        base={frameBase}
        height={frameH}
        offset={offset}
        topFill={PROP_STYLE.wood}
        sideFill={PROP_STYLE.woodDark}
        sideFillAlt={PROP_STYLE.frameDark}
      />
      <ExtrudedBox
        base={mattressBase}
        height={mattressH}
        offset={offset}
        topFill={PROP_STYLE.linen}
        sideFill={PROP_STYLE.linenDark}
        sideFillAlt={PROP_STYLE.fabricDark}
      />
      <ExtrudedBox
        base={blanketBase}
        height={blanketH}
        offset={offset}
        topFill={PROP_STYLE.fabricLight}
        sideFill={PROP_STYLE.fabric}
        sideFillAlt={PROP_STYLE.fabricDark}
      />
      <ExtrudedBox
        base={insetQuad(pillowLeft, pillowPad)}
        height={pillowH}
        offset={offset}
        topFill={PROP_STYLE.fabricLight}
        sideFill={PROP_STYLE.fabric}
        sideFillAlt={PROP_STYLE.fabricDark}
      />
      <ExtrudedBox
        base={insetQuad(pillowRight, pillowPad)}
        height={pillowH}
        offset={offset}
        topFill={PROP_STYLE.fabricLight}
        sideFill={PROP_STYLE.fabric}
        sideFillAlt={PROP_STYLE.fabricDark}
      />
      <ExtrudedBox
        base={headOnFrame}
        height={headboardH}
        offset={offset}
        topFill={PROP_STYLE.woodLight}
        sideFill={PROP_STYLE.wood}
        sideFillAlt={PROP_STYLE.woodDark}
      />
    </g>
  );
}

function WardrobeIllustration({
  resolved,
  offset,
  authoring,
}: {
  resolved: ResolvedProp;
  offset: Point2;
  authoring: SceneAuthoringParams;
}) {
  const frame = frameFromResolved(resolved);
  const geometry = buildWardrobeGeometry(frame, authoring.wardrobe);
  return (
    <g
      data-illustration="wardrobe"
      data-primitive-count={geometry.primitives.length}
    >
      <RenderGeometry primitives={geometry.primitives} offset={offset} />
    </g>
  );
}

function NightstandIllustration({
  resolved,
  hosted,
  offset,
}: {
  resolved: ResolvedProp;
  hosted: ResolvedSurface | undefined;
  offset: Point2;
}) {
  const height = hosted
    ? Math.max(0.5, hosted.worldOrigin.y - resolved.worldOrigin.y)
    : 0.55;
  const base = insetQuad(resolved.footprintCorners, 0.05);
  const bodyH = height * 0.88;
  const topPad = elevate(insetQuad(base, 0.02), bodyH);

  const drawerY0 = bodyH * 0.38;
  const drawerY1 = bodyH * 0.72;
  const drawer = [
    lerpVec(elevate(base, drawerY0)[0]!, elevate(base, drawerY0)[1]!, 0.12),
    lerpVec(elevate(base, drawerY0)[0]!, elevate(base, drawerY0)[1]!, 0.88),
    lerpVec(elevate(base, drawerY1)[0]!, elevate(base, drawerY1)[1]!, 0.88),
    lerpVec(elevate(base, drawerY1)[0]!, elevate(base, drawerY1)[1]!, 0.12),
  ];

  return (
    <g data-illustration="nightstand">
      <ExtrudedBox
        base={base}
        height={bodyH}
        offset={offset}
        topFill={PROP_STYLE.wood}
        sideFill={PROP_STYLE.woodDark}
        sideFillAlt={PROP_STYLE.frameDark}
      />
      <Face corners={drawer} offset={offset} fill={PROP_STYLE.woodLight} />
      <ExtrudedBox
        base={elevate(topPad, -0.04)}
        height={0.06}
        offset={offset}
        topFill={PROP_STYLE.woodLight}
        sideFill={PROP_STYLE.wood}
        sideFillAlt={PROP_STYLE.woodDark}
      />
    </g>
  );
}

function ChairIllustration({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  const base = insetQuad(resolved.footprintCorners, 0.08);
  const seatH = 0.48;
  const seat = elevate(insetQuad(base, 0.04), seatH);
  // Back along edge 2–3 (rear of seat)
  const back = [
    lerpVec(seat[3]!, seat[0]!, 0.05),
    lerpVec(seat[2]!, seat[1]!, 0.05),
    lerpVec(seat[2]!, seat[1]!, 0.28),
    lerpVec(seat[3]!, seat[0]!, 0.28),
  ];

  return (
    <g data-illustration="chair">
      <Legs
        base={insetQuad(base, 0.18)}
        height={seatH}
        offset={offset}
        thickness={0.18}
      />
      <ExtrudedBox
        base={insetQuad(elevate(base, seatH - 0.06), 0.02)}
        height={0.06}
        offset={offset}
        topFill={PROP_STYLE.fabricLight}
        sideFill={PROP_STYLE.fabric}
        sideFillAlt={PROP_STYLE.fabricDark}
      />
      <ExtrudedBox
        base={back}
        height={0.52}
        offset={offset}
        topFill={PROP_STYLE.fabricLight}
        sideFill={PROP_STYLE.fabric}
        sideFillAlt={PROP_STYLE.fabricDark}
      />
    </g>
  );
}

function RugIllustration({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  const outer = insetQuad(resolved.footprintCorners, 0.02);
  const inner = insetQuad(outer, 0.1);
  return (
    <g data-illustration="rug">
      <Face corners={outer} offset={offset} fill={PROP_STYLE.rug} />
      <Face corners={inner} offset={offset} fill={PROP_STYLE.rugInner} />
    </g>
  );
}

function ShelfIllustration({
  resolved,
  hosted,
  offset,
}: {
  resolved: ResolvedProp;
  hosted: ResolvedSurface | undefined;
  offset: Point2;
}) {
  if (!hosted) {
    return (
      <g data-illustration="shelf">
        <Face
          corners={insetQuad(resolved.footprintCorners, 0.08)}
          offset={offset}
          fill={PROP_STYLE.wood}
        />
      </g>
    );
  }

  const plank = insetQuad(surfaceBoundsCorners(hosted), 0.02);
  const thickness = 0.1;
  const plankBottom = elevate(plank, -thickness);
  // Wall brackets: short supports from wall mount toward plank rear
  const mount = insetQuad(resolved.footprintCorners, 0.2);
  const bracketA = [
    lerpVec(mount[0]!, mount[1]!, 0.2),
    lerpVec(mount[0]!, mount[1]!, 0.28),
    lerpVec(plankBottom[0]!, plankBottom[1]!, 0.2),
    lerpVec(plankBottom[0]!, plankBottom[1]!, 0.12),
  ];
  const bracketB = [
    lerpVec(mount[0]!, mount[1]!, 0.72),
    lerpVec(mount[0]!, mount[1]!, 0.8),
    lerpVec(plankBottom[0]!, plankBottom[1]!, 0.8),
    lerpVec(plankBottom[0]!, plankBottom[1]!, 0.72),
  ];

  return (
    <g data-illustration="shelf">
      <Face corners={bracketA} offset={offset} fill={PROP_STYLE.woodDark} />
      <Face corners={bracketB} offset={offset} fill={PROP_STYLE.woodDark} />
      <ExtrudedBox
        base={plankBottom}
        height={thickness}
        offset={offset}
        topFill={PROP_STYLE.woodLight}
        sideFill={PROP_STYLE.wood}
        sideFillAlt={PROP_STYLE.woodDark}
      />
    </g>
  );
}

function WindowIllustration({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  const outer = insetQuad(resolved.footprintCorners, 0.03);
  const inner = insetQuad(outer, 0.16);
  const midV = [
    lerpVec(inner[0]!, inner[3]!, 0.5),
    lerpVec(inner[1]!, inner[2]!, 0.5),
  ];
  const midH = [
    lerpVec(inner[0]!, inner[1]!, 0.5),
    lerpVec(inner[3]!, inner[2]!, 0.5),
  ];
  const sill = [
    outer[0]!,
    outer[1]!,
    lerpVec(outer[1]!, outer[2]!, 0.12),
    lerpVec(outer[0]!, outer[3]!, 0.12),
  ];
  const p = (v: Vec3) => projectPoly([v])[0]!;

  return (
    <g data-illustration="window">
      <Face corners={outer} offset={offset} fill={PROP_STYLE.frame} />
      <Face corners={inner} offset={offset} fill={PROP_STYLE.glass} />
      <line
        className={styles.muntin}
        x1={p(midV[0]!).x - offset.x}
        y1={p(midV[0]!).y - offset.y}
        x2={p(midV[1]!).x - offset.x}
        y2={p(midV[1]!).y - offset.y}
      />
      <line
        className={styles.muntin}
        x1={p(midH[0]!).x - offset.x}
        y1={p(midH[0]!).y - offset.y}
        x2={p(midH[1]!).x - offset.x}
        y2={p(midH[1]!).y - offset.y}
      />
      <Face corners={sill} offset={offset} fill={PROP_STYLE.woodLight} />
    </g>
  );
}

function LaptopIllustration({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  const base = insetQuad(artworkBaseCorners(resolved), 0.05);
  const lid = [
    lerpVec(base[0]!, base[3]!, -0.02),
    lerpVec(base[1]!, base[2]!, -0.02),
    lerpVec(base[1]!, base[2]!, 0.55),
    lerpVec(base[0]!, base[3]!, 0.55),
  ].map((c) => ({ ...c, y: c.y + 0.06 }));

  return (
    <g data-illustration="laptop">
      <ExtrudedBox
        base={base}
        height={0.04}
        offset={offset}
        topFill={PROP_STYLE.frame}
        sideFill={PROP_STYLE.frameDark}
        sideFillAlt={PROP_STYLE.frameDark}
      />
      <Face corners={lid} offset={offset} fill={PROP_STYLE.glass} />
    </g>
  );
}

/** Circle in XZ, tilted around local X then yawed — classic armillary ring. */
function ringPoints(
  center: Vec3,
  radius: number,
  yawDeg: number,
  tiltDeg: number,
  segments = 28,
): Vec3[] {
  const yaw = (yawDeg * Math.PI) / 180;
  const tilt = (tiltDeg * Math.PI) / 180;
  const pts: Vec3[] = [];
  for (let i = 0; i < segments; i += 1) {
    const a = (i / segments) * Math.PI * 2;
    const lx = Math.cos(a) * radius;
    const ly0 = Math.sin(a) * radius;
    const ly = ly0 * Math.cos(tilt);
    const lz = ly0 * Math.sin(tilt);
    const x = center.x + lx * Math.cos(yaw) - lz * Math.sin(yaw);
    const z = center.z + lx * Math.sin(yaw) + lz * Math.cos(yaw);
    pts.push({ x, y: center.y + ly, z });
  }
  return pts;
}

function diskCorners(
  center: Vec3,
  radius: number,
  yawDeg: number,
  sides = 14,
): Vec3[] {
  const yaw = (yawDeg * Math.PI) / 180;
  const pts: Vec3[] = [];
  for (let i = 0; i < sides; i += 1) {
    const a = (i / sides) * Math.PI * 2;
    const lx = Math.cos(a) * radius;
    const lz = Math.sin(a) * radius;
    pts.push({
      x: center.x + lx * Math.cos(yaw) - lz * Math.sin(yaw),
      y: center.y,
      z: center.z + lx * Math.sin(yaw) + lz * Math.cos(yaw),
    });
  }
  return pts;
}

function ExtrudedPoly({
  base,
  height,
  offset,
  topFill,
  sideFill,
  sideFillAlt,
}: {
  base: readonly Vec3[];
  height: number;
  offset: Point2;
  topFill: string;
  sideFill: string;
  sideFillAlt: string;
}) {
  const top = elevate(base, height);
  const n = base.length;
  const sides = Array.from({ length: n }, (_, i) => {
    const j = (i + 1) % n;
    const quad = [base[i]!, base[j]!, top[j]!, top[i]!];
    return { quad, depth: depthKey(quad), index: i };
  }).sort((a, b) => a.depth - b.depth);

  return (
    <>
      {sides.map(({ quad, index }) => (
        <Face
          key={index}
          corners={quad}
          offset={offset}
          fill={index % 2 === 0 ? sideFill : sideFillAlt}
        />
      ))}
      <Face corners={top} offset={offset} fill={topFill} />
    </>
  );
}

function ArmillaryIllustration({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  const height = artworkHeight(resolved);
  const origin = resolved.worldOrigin;
  const yaw = resolved.yawDeg;
  const artBase = artworkBaseCorners(resolved);
  const artW = Math.hypot(
    artBase[1]!.x - artBase[0]!.x,
    artBase[1]!.z - artBase[0]!.z,
  );
  const artD = Math.hypot(
    artBase[3]!.x - artBase[0]!.x,
    artBase[3]!.z - artBase[0]!.z,
  );
  const span = Math.max(0.35, Math.min(artW, artD));

  // Proportions: base ≈25%, rings ≈60%, support ≈15% of the silhouette.
  // Base diameter reduced ~35% from the prior span*0.46 stand.
  const baseR = span * 0.3;
  const baseH = Math.max(0.035, height * 0.06);
  const postH = height * 0.14;
  const ringR = span * 0.55;
  const ringCenter = {
    x: origin.x,
    y: origin.y + baseH + postH + ringR * 0.72,
    z: origin.z,
  };
  const disk = diskCorners(
    { x: origin.x, y: origin.y, z: origin.z },
    baseR,
    yaw,
    16,
  );
  const post = diskCorners(
    { x: origin.x, y: origin.y + baseH, z: origin.z },
    Math.max(0.018, baseR * 0.16),
    yaw,
    8,
  );

  const rings: Array<{ pts: Vec3[]; stroke: string; width: number }> = [
    {
      pts: ringPoints(ringCenter, ringR, yaw, 6, 36),
      stroke: PROP_STYLE.brass,
      width: 3.4,
    },
    {
      pts: ringPoints(ringCenter, ringR * 0.97, yaw, 90, 36),
      stroke: PROP_STYLE.brassLight,
      width: 3.2,
    },
    {
      pts: ringPoints(ringCenter, ringR * 0.93, yaw + 52, 45, 34),
      stroke: PROP_STYLE.brassDark,
      width: 2.9,
    },
    {
      pts: ringPoints(ringCenter, ringR * 0.89, yaw - 38, 65, 34),
      stroke: PROP_STYLE.brass,
      width: 2.7,
    },
  ];

  const p = (v: Vec3) => projectPoly([v])[0]!;
  const star = p(ringCenter);
  const poly = (pts: Vec3[]) =>
    pts
      .map((c) => {
        const s = p(c);
        return `${s.x - offset.x},${s.y - offset.y}`;
      })
      .join(" ");

  return (
    <g data-illustration="armillary">
      <ExtrudedPoly
        base={disk}
        height={baseH}
        offset={offset}
        topFill={PROP_STYLE.woodLight}
        sideFill={PROP_STYLE.wood}
        sideFillAlt={PROP_STYLE.woodDark}
      />
      <ExtrudedPoly
        base={post}
        height={postH}
        offset={offset}
        topFill={PROP_STYLE.wood}
        sideFill={PROP_STYLE.woodDark}
        sideFillAlt={PROP_STYLE.frameDark}
      />
      {rings.map((ring, i) => (
        <polygon
          key={i}
          points={poly(ring.pts)}
          fill="none"
          stroke={ring.stroke}
          strokeWidth={ring.width}
          strokeLinejoin="round"
        />
      ))}
      <circle
        cx={star.x - offset.x}
        cy={star.y - offset.y}
        r={7.2}
        fill={PROP_STYLE.glow}
        opacity={0.9}
      />
      <circle
        cx={star.x - offset.x}
        cy={star.y - offset.y}
        r={4.2}
        fill={PROP_STYLE.glowCore}
        stroke={PROP_STYLE.star}
        strokeWidth={1.35}
      />
      <circle
        cx={star.x - offset.x}
        cy={star.y - offset.y}
        r={1.85}
        fill={PROP_STYLE.star}
      />
    </g>
  );
}

function PaperLanternIllustration({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  // Traditional red festival lantern — bulbous mid, tapered ends, all within footprint.
  // artworkBaseCorners already sit at worldOrigin.y — elevate by relative height only.
  const footprint = artworkBaseCorners(resolved);
  const height = artworkHeight(resolved);
  const rimH = Math.max(0.02, height * 0.035);

  const bottom = elevate(insetQuad(footprint, 0.28), height * 0.06);
  const lower = elevate(insetQuad(footprint, 0.1), height * 0.28);
  const mid = elevate(insetQuad(footprint, 0.02), height * 0.5);
  const upper = elevate(insetQuad(footprint, 0.1), height * 0.72);
  const top = elevate(insetQuad(footprint, 0.28), height * 0.9);
  const topLid = elevate(insetQuad(footprint, 0.34), height * 0.9 + rimH);
  const bottomGlow = elevate(insetQuad(footprint, 0.38), height * 0.08);

  const band = (a: readonly Vec3[], b: readonly Vec3[]): Vec3[][] => [
    [a[0]!, a[1]!, b[1]!, b[0]!],
    [a[1]!, a[2]!, b[2]!, b[1]!],
    [a[2]!, a[3]!, b[3]!, b[2]!],
    [a[3]!, a[0]!, b[0]!, b[3]!],
  ];

  const paperBands = [
    ...band(bottom, lower),
    ...band(lower, mid),
    ...band(mid, upper),
    ...band(upper, top),
  ];

  const glow = elevate(insetQuad(footprint, 0.22), height * 0.48);
  const glowCore = elevate(insetQuad(footprint, 0.36), height * 0.52);

  const folds = [0.25, 0.5, 0.75].map((t) => [
    lerpVec(bottom[0]!, bottom[1]!, t),
    lerpVec(mid[0]!, mid[1]!, t),
    lerpVec(top[0]!, top[1]!, t),
  ]);
  const p = (v: Vec3) => projectPoly([v])[0]!;

  return (
    <g data-illustration="paper-lantern">
      <ExtrudedBox
        base={bottom}
        height={rimH}
        offset={offset}
        topFill={PROP_STYLE.woodDark}
        sideFill={PROP_STYLE.frameDark}
        sideFillAlt={PROP_STYLE.frameDark}
      />
      <Face corners={bottomGlow} offset={offset} fill={PROP_STYLE.glow} />
      {paperBands.map((face, i) => (
        <Face
          key={`paper-${i}`}
          corners={face}
          offset={offset}
          fill={i % 2 === 0 ? PROP_STYLE.paperRed : PROP_STYLE.paperRedDark}
        />
      ))}
      <Face corners={glow} offset={offset} fill={PROP_STYLE.glow} />
      <Face corners={glowCore} offset={offset} fill={PROP_STYLE.glowCore} />
      {folds.map((line, i) => {
        const a = p(line[0]!);
        const b = p(line[2]!);
        return (
          <line
            key={`fold-${i}`}
            x1={a.x - offset.x}
            y1={a.y - offset.y}
            x2={b.x - offset.x}
            y2={b.y - offset.y}
            stroke={PROP_STYLE.paperRedLight}
            strokeWidth={0.7}
            opacity={0.55}
          />
        );
      })}
      <ExtrudedBox
        base={top}
        height={rimH}
        offset={offset}
        topFill={PROP_STYLE.woodDark}
        sideFill={PROP_STYLE.frameDark}
        sideFillAlt={PROP_STYLE.frameDark}
      />
      <Face corners={topLid} offset={offset} fill={PROP_STYLE.paperRedDark} />
    </g>
  );
}

/** Vintage record player — wooden plinth, vinyl, brass spindle, tonearm. */
function RecordPlayerIllustration({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  const height = Math.max(artworkHeight(resolved), 0.22);
  const origin = resolved.worldOrigin;
  const yaw = resolved.yawDeg;
  const plinth = insetQuad(artworkBaseCorners(resolved), 0.02);
  const plinthH = Math.max(0.08, height * 0.48);

  const artBase = artworkBaseCorners(resolved);
  const artW = Math.hypot(
    artBase[1]!.x - artBase[0]!.x,
    artBase[1]!.z - artBase[0]!.z,
  );
  const artD = Math.hypot(
    artBase[3]!.x - artBase[0]!.x,
    artBase[3]!.z - artBase[0]!.z,
  );
  const vinylR = Math.min(artW, artD) * 0.38;
  const vinylCenter = { x: origin.x, y: origin.y + plinthH, z: origin.z };
  const vinyl = diskCorners(vinylCenter, vinylR, yaw, 22);
  const label = diskCorners(vinylCenter, vinylR * 0.26, yaw, 12);
  const spindle = diskCorners(
    vinylCenter,
    Math.max(0.014, vinylR * 0.07),
    yaw,
    8,
  );
  const spindleH = Math.max(0.045, height * 0.28);

  const armAngle = ((yaw - 28) * Math.PI) / 180;
  const armPivot = {
    x: vinylCenter.x + Math.cos(armAngle) * vinylR * 1.05,
    y: origin.y + plinthH + 0.03,
    z: vinylCenter.z + Math.sin(armAngle) * vinylR * 1.05,
  };
  const armMid = {
    x: vinylCenter.x + Math.cos(armAngle - 0.55) * vinylR * 0.55,
    y: origin.y + plinthH + 0.055,
    z: vinylCenter.z + Math.sin(armAngle - 0.55) * vinylR * 0.55,
  };
  const armTip = {
    x: vinylCenter.x + Math.cos(armAngle - 1.05) * vinylR * 0.12,
    y: origin.y + plinthH + 0.04,
    z: vinylCenter.z + Math.sin(armAngle - 1.05) * vinylR * 0.12,
  };
  const p = (v: Vec3) => projectPoly([v])[0]!;
  const pivot = p(armPivot);
  const mid = p(armMid);
  const tip = p(armTip);

  return (
    <g data-illustration="record-player">
      <ExtrudedBox
        base={plinth}
        height={plinthH}
        offset={offset}
        topFill={PROP_STYLE.woodLight}
        sideFill={PROP_STYLE.wood}
        sideFillAlt={PROP_STYLE.woodDark}
      />
      <ExtrudedPoly
        base={vinyl}
        height={Math.max(0.02, height * 0.1)}
        offset={offset}
        topFill={PROP_STYLE.vinyl}
        sideFill={PROP_STYLE.vinylGroove}
        sideFillAlt={PROP_STYLE.frameDark}
      />
      <ExtrudedPoly
        base={label}
        height={Math.max(0.022, height * 0.11)}
        offset={offset}
        topFill={PROP_STYLE.paper}
        sideFill={PROP_STYLE.paperDark}
        sideFillAlt={PROP_STYLE.paperDark}
      />
      <ExtrudedPoly
        base={spindle}
        height={spindleH}
        offset={offset}
        topFill={PROP_STYLE.brassLight}
        sideFill={PROP_STYLE.brass}
        sideFillAlt={PROP_STYLE.brassDark}
      />
      <polyline
        points={`${pivot.x - offset.x},${pivot.y - offset.y} ${mid.x - offset.x},${mid.y - offset.y} ${tip.x - offset.x},${tip.y - offset.y}`}
        fill="none"
        stroke={PROP_STYLE.brass}
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pivot.x - offset.x}
        cy={pivot.y - offset.y}
        r={3.1}
        fill={PROP_STYLE.brassLight}
        stroke={PROP_STYLE.brassDark}
        strokeWidth={0.9}
      />
      <circle
        cx={tip.x - offset.x}
        cy={tip.y - offset.y}
        r={2.1}
        fill={PROP_STYLE.brassDark}
      />
    </g>
  );
}

/** Leather photo album — thick cover, brass corners, bookmark ribbon. */
function PhotoAlbumIllustration({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  const height = Math.max(artworkHeight(resolved), 0.14);
  const origin = resolved.worldOrigin;
  const cover = insetQuad(artworkBaseCorners(resolved), 0.01);
  const coverH = Math.max(0.07, height * 0.92);

  const spine = [
    lerpVec(cover[0]!, cover[1]!, 0),
    lerpVec(cover[0]!, cover[1]!, 0.16),
    lerpVec(cover[3]!, cover[2]!, 0.16),
    lerpVec(cover[3]!, cover[2]!, 0),
  ].map((c) => ({ ...c, y: origin.y }));

  const brassPads = [0, 1, 2, 3].map((i) => {
    const a = cover[i]!;
    const b = cover[(i + 1) % 4]!;
    const d = cover[(i + 3) % 4]!;
    const along = lerpVec(a, b, 0.28);
    const inward = lerpVec(a, d, 0.28);
    const tip = {
      x: a.x + (along.x - a.x) + (inward.x - a.x),
      y: origin.y + coverH + 0.006,
      z: a.z + (along.z - a.z) + (inward.z - a.z),
    };
    return [
      { ...a, y: origin.y + coverH },
      { ...along, y: origin.y + coverH },
      tip,
      { ...inward, y: origin.y + coverH },
    ];
  });

  const midFront = lerpVec(cover[0]!, cover[1]!, 0.52);
  const ribbon = [
    {
      x: midFront.x - 0.02,
      y: origin.y + coverH + 0.002,
      z: midFront.z,
    },
    {
      x: midFront.x + 0.02,
      y: origin.y + coverH + 0.002,
      z: midFront.z,
    },
    {
      x: midFront.x + 0.025,
      y: origin.y - height * 0.55,
      z: midFront.z + 0.06,
    },
    {
      x: midFront.x - 0.025,
      y: origin.y - height * 0.55,
      z: midFront.z + 0.06,
    },
  ];

  return (
    <g data-illustration="photo-album">
      <ExtrudedBox
        base={cover}
        height={coverH}
        offset={offset}
        topFill={PROP_STYLE.leatherLight}
        sideFill={PROP_STYLE.leather}
        sideFillAlt={PROP_STYLE.leatherDark}
      />
      <ExtrudedBox
        base={spine}
        height={coverH * 1.06}
        offset={offset}
        topFill={PROP_STYLE.leatherDark}
        sideFill={PROP_STYLE.leatherDark}
        sideFillAlt={PROP_STYLE.frameDark}
      />
      {brassPads.map((pad, i) => (
        <Face
          key={`brass-${i}`}
          corners={pad}
          offset={offset}
          fill={i % 2 === 0 ? PROP_STYLE.brassLight : PROP_STYLE.brass}
        />
      ))}
      <Face corners={ribbon} offset={offset} fill={PROP_STYLE.ribbon} />
    </g>
  );
}

/** Classic film reel — metal disc, circular cut-outs, brass hub. */
function FilmReelIllustration({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  const height = Math.max(artworkHeight(resolved), 0.2);
  const origin = resolved.worldOrigin;
  const yaw = resolved.yawDeg;
  const artBase = artworkBaseCorners(resolved);
  const artW = Math.hypot(
    artBase[1]!.x - artBase[0]!.x,
    artBase[1]!.z - artBase[0]!.z,
  );
  const artD = Math.hypot(
    artBase[3]!.x - artBase[0]!.x,
    artBase[3]!.z - artBase[0]!.z,
  );
  const r = Math.min(artW, artD) * 0.46;
  const rimH = Math.max(0.07, height * 0.72);
  const outer = diskCorners(origin, r, yaw, 26);
  const rimInner = diskCorners(origin, r * 0.86, yaw, 22);
  const web = diskCorners(origin, r * 0.42, yaw, 16);
  const hub = diskCorners(origin, r * 0.2, yaw, 12);
  const hubCore = diskCorners(origin, r * 0.08, yaw, 8);

  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a0 = (i / 6) * Math.PI * 2 + (yaw * Math.PI) / 180;
    const a1 = a0 + Math.PI / 9;
    const outerA = {
      x: origin.x + Math.cos(a0) * r * 0.82,
      y: origin.y + rimH * 0.55,
      z: origin.z + Math.sin(a0) * r * 0.82,
    };
    const outerB = {
      x: origin.x + Math.cos(a1) * r * 0.82,
      y: origin.y + rimH * 0.55,
      z: origin.z + Math.sin(a1) * r * 0.82,
    };
    const innerA = {
      x: origin.x + Math.cos(a0) * r * 0.28,
      y: origin.y + rimH * 0.55,
      z: origin.z + Math.sin(a0) * r * 0.28,
    };
    const innerB = {
      x: origin.x + Math.cos(a1) * r * 0.28,
      y: origin.y + rimH * 0.55,
      z: origin.z + Math.sin(a1) * r * 0.28,
    };
    return [outerA, outerB, innerB, innerA];
  });

  return (
    <g data-illustration="film-reel">
      <ExtrudedPoly
        base={outer}
        height={rimH}
        offset={offset}
        topFill={PROP_STYLE.metalLight}
        sideFill={PROP_STYLE.metal}
        sideFillAlt={PROP_STYLE.metalDark}
      />
      <ExtrudedPoly
        base={rimInner}
        height={rimH * 0.92}
        offset={offset}
        topFill={PROP_STYLE.metalDark}
        sideFill={PROP_STYLE.metalDark}
        sideFillAlt={PROP_STYLE.frameDark}
      />
      {spokes.map((hole, i) => (
        <Face
          key={`cut-${i}`}
          corners={hole}
          offset={offset}
          fill="#1a1612"
        />
      ))}
      <ExtrudedPoly
        base={web}
        height={rimH * 0.95}
        offset={offset}
        topFill={PROP_STYLE.metal}
        sideFill={PROP_STYLE.metalDark}
        sideFillAlt={PROP_STYLE.frameDark}
      />
      <ExtrudedPoly
        base={hub}
        height={rimH * 1.12}
        offset={offset}
        topFill={PROP_STYLE.brassLight}
        sideFill={PROP_STYLE.brass}
        sideFillAlt={PROP_STYLE.brassDark}
      />
      <ExtrudedPoly
        base={hubCore}
        height={rimH * 1.2}
        offset={offset}
        topFill={PROP_STYLE.brassDark}
        sideFill={PROP_STYLE.brassDark}
        sideFillAlt={PROP_STYLE.frameDark}
      />
    </g>
  );
}

function KeepsakeIllustration({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  const asset = getAsset(resolved.prop.assetId);
  const height = artworkHeight(resolved);
  const base = insetQuad(artworkBaseCorners(resolved), 0.08);
  const label = asset?.placeholderLabel ?? "K";
  const topCenter = projectPoly(elevate(base, height))[0]!;
  const cx =
    (projectPoly(base).reduce((s, p) => s + p.x, 0) / 4) - offset.x;
  const cy = topCenter.y - offset.y - 4;

  return (
    <g data-illustration="keepsake">
      <ExtrudedBox
        base={base}
        height={height}
        offset={offset}
        topFill={PROP_STYLE.fabricLight}
        sideFill={PROP_STYLE.fabric}
        sideFillAlt={PROP_STYLE.fabricDark}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        style={{
          fontSize: 7,
          fill: "#2c241c",
          fontFamily: "ui-monospace, monospace",
          fontWeight: 700,
        }}
      >
        {label}
      </text>
    </g>
  );
}

function DecorationIllustration({
  resolved,
  offset,
}: {
  resolved: ResolvedProp;
  offset: Point2;
}) {
  const asset = getAsset(resolved.prop.assetId);
  const height = asset?.defaultSize.height ?? 0.5;
  const base = insetQuad(resolved.footprintCorners, 0.06);
  return (
    <g data-illustration="decoration">
      <ExtrudedBox
        base={base}
        height={height}
        offset={offset}
        topFill={PROP_STYLE.woodLight}
        sideFill={PROP_STYLE.wood}
        sideFillAlt={PROP_STYLE.woodDark}
      />
    </g>
  );
}

export function PropIllustration({
  resolved,
  placement,
  offset,
  authoring = defaultAuthoringParams(),
}: {
  resolved: ResolvedProp;
  placement: ScenePlacement;
  offset: Point2;
  authoring?: SceneAuthoringParams;
}): ReactNode {
  const hostedId = resolved.prop.hostedSurfaceId;
  const hosted = hostedId ? placement.surfaceById.get(hostedId) : undefined;
  const id = resolved.prop.assetId;

  let body: ReactNode = null;
  if (id === "surface.desk") {
    body = <DeskIllustration resolved={resolved} hosted={hosted} offset={offset} />;
  } else if (id === "surface.bed") {
    body = <BedIllustration resolved={resolved} offset={offset} />;
  } else if (id === "prop.wardrobe") {
    body = (
      <WardrobeIllustration
        resolved={resolved}
        offset={offset}
        authoring={authoring}
      />
    );
  } else if (id === "prop.nightstand") {
    body = (
      <NightstandIllustration resolved={resolved} hosted={hosted} offset={offset} />
    );
  } else if (id === "prop.chair") {
    body = <ChairIllustration resolved={resolved} offset={offset} />;
  } else if (id === "decoration.rug") {
    body = <RugIllustration resolved={resolved} offset={offset} />;
  } else if (id === "surface.shelf") {
    body = <ShelfIllustration resolved={resolved} hosted={hosted} offset={offset} />;
  } else if (id === "prop.window") {
    body = <WindowIllustration resolved={resolved} offset={offset} />;
  } else if (id === "keepsake.armillary-sphere") {
    body = (
      <ArmillaryIllustration resolved={resolved} offset={offset} />
    );
  } else if (id === "keepsake.paper-lantern") {
    body = <PaperLanternIllustration resolved={resolved} offset={offset} />;
  } else if (id === "keepsake.record-player") {
    body = <RecordPlayerIllustration resolved={resolved} offset={offset} />;
  } else if (id === "keepsake.photo-album") {
    body = <PhotoAlbumIllustration resolved={resolved} offset={offset} />;
  } else if (id === "keepsake.film-reel") {
    body = <FilmReelIllustration resolved={resolved} offset={offset} />;
  } else if (id.startsWith("keepsake.")) {
    body = (
      <KeepsakeIllustration resolved={resolved} offset={offset} />
    );
  } else if (id === "prop.laptop") {
    body = <LaptopIllustration resolved={resolved} offset={offset} />;
  } else if (id.startsWith("decoration.") && id !== "decoration.rug") {
    body = (
      <DecorationIllustration resolved={resolved} offset={offset} />
    );
  } else {
    body = (
      <Face
        corners={insetQuad(resolved.footprintCorners, 0.05)}
        offset={offset}
        fill={PROP_STYLE.frame}
      />
    );
  }

  return (
    <g
      data-instance={resolved.prop.id}
      data-asset={id}
      data-illustration="prop"
    >
      {body}
    </g>
  );
}
