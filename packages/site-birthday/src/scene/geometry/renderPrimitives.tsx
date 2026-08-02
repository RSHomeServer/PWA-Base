/**
 * Draw GeomPrimitive lists in isometric SVG — shared by scene + geometry debug.
 */
import type { ReactNode } from "react";
import { polyPoints, projectPoly, type Point2 } from "../iso.js";
import type { Vec3 } from "../types.js";
import type { GeomPrimitive } from "./primitives.js";
import { yawRotate } from "./primitives.js";

/** Local palette — avoid importing PropIllustration (circular). */
const PALETTE = {
  stroke: "#2c241c",
  strokeWidth: 1.25,
  wood: "#9a7a58",
  woodDark: "#7a5e42",
  woodLight: "#b8956e",
  frame: "#6e655c",
  frameDark: "#4a433c",
  brass: "#b08a4a",
  brassLight: "#d4b46a",
  glow: "rgba(255, 210, 140, 0.85)",
  glowCore: "#ffe6a8",
  star: "#fff4c8",
} as const;

function elevate(corners: readonly Vec3[], dy: number): Vec3[] {
  return corners.map((c) => ({ x: c.x, y: c.y + dy, z: c.z }));
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
  stroke = PALETTE.stroke,
}: {
  corners: readonly Vec3[];
  offset: Point2;
  fill: string;
  stroke?: string;
}) {
  return (
    <polygon
      fill={fill}
      stroke={stroke}
      strokeWidth={PALETTE.strokeWidth}
      strokeLinejoin="round"
      points={polyPoints(projectPoly(corners), offset)}
    />
  );
}

function cuboidCorners(
  center: Vec3,
  size: { width: number; depth: number; height: number },
  yawDeg: number,
): { base: Vec3[]; top: Vec3[] } {
  const hw = size.width / 2;
  const hd = size.depth / 2;
  const hh = size.height / 2;
  const local = [
    { x: -hw, y: -hh, z: -hd },
    { x: hw, y: -hh, z: -hd },
    { x: hw, y: -hh, z: hd },
    { x: -hw, y: -hh, z: hd },
  ];
  const base = local.map((p) => {
    const r = yawRotate(p, yawDeg);
    return {
      x: center.x + r.x,
      y: center.y + r.y,
      z: center.z + r.z,
    };
  });
  const top = elevate(base, size.height);
  // base y is center.y - hh; elevate by height puts top at center.y + hh. Good.
  // Wait: base points already have y = center.y - hh. elevate adds size.height → center.y + hh. OK.
  return { base, top };
}

function ExtrudedBase({
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

function diskBase(
  center: Vec3,
  radius: number,
  yawDeg: number,
  sides: number,
): Vec3[] {
  const pts: Vec3[] = [];
  for (let i = 0; i < sides; i += 1) {
    const a = (i / sides) * Math.PI * 2;
    const local = {
      x: Math.cos(a) * radius,
      y: 0,
      z: Math.sin(a) * radius,
    };
    const r = yawRotate(local, yawDeg);
    pts.push({
      x: center.x + r.x,
      y: center.y,
      z: center.z + r.z,
    });
  }
  return pts;
}

function ringPoints(
  center: Vec3,
  radius: number,
  yawDeg: number,
  tiltDeg: number,
  segments: number,
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
    pts.push({
      x: center.x + lx * Math.cos(yaw) - lz * Math.sin(yaw),
      y: center.y + ly,
      z: center.z + lx * Math.sin(yaw) + lz * Math.cos(yaw),
    });
  }
  return pts;
}

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cylinderDisk(center: Vec3, axis: Vec3, radius: number, sides: number): Vec3[] {
  const n = normalize(axis);
  // Build orthonormal basis around axis.
  const helper =
    Math.abs(n.y) < 0.9
      ? { x: 0, y: 1, z: 0 }
      : { x: 1, y: 0, z: 0 };
  const ux = normalize({
    x: n.y * helper.z - n.z * helper.y,
    y: n.z * helper.x - n.x * helper.z,
    z: n.x * helper.y - n.y * helper.x,
  });
  const uy = normalize({
    x: n.y * ux.z - n.z * ux.y,
    y: n.z * ux.x - n.x * ux.z,
    z: n.x * ux.y - n.y * ux.x,
  });
  const pts: Vec3[] = [];
  for (let i = 0; i < sides; i += 1) {
    const a = (i / sides) * Math.PI * 2;
    pts.push({
      x: center.x + (ux.x * Math.cos(a) + uy.x * Math.sin(a)) * radius,
      y: center.y + (ux.y * Math.cos(a) + uy.y * Math.sin(a)) * radius,
      z: center.z + (ux.z * Math.cos(a) + uy.z * Math.sin(a)) * radius,
    });
  }
  return pts;
}

const FILL: Record<string, { top: string; side: string; sideAlt: string }> = {
  body: {
    top: PALETTE.woodLight,
    side: PALETTE.woodDark,
    sideAlt: PALETTE.frameDark,
  },
  plinth: {
    top: PALETTE.woodDark,
    side: PALETTE.frameDark,
    sideAlt: PALETTE.frameDark,
  },
  "door-l": {
    top: PALETTE.woodLight,
    side: PALETTE.wood,
    sideAlt: PALETTE.woodDark,
  },
  "door-r": {
    top: PALETTE.woodLight,
    side: PALETTE.wood,
    sideAlt: PALETTE.woodDark,
  },
  default: {
    top: PALETTE.woodLight,
    side: PALETTE.wood,
    sideAlt: PALETTE.woodDark,
  },
};

export function RenderPrimitive({
  primitive,
  offset,
  label,
}: {
  primitive: GeomPrimitive;
  offset: Point2;
  label?: boolean;
}): ReactNode {
  const p = (v: Vec3) => projectPoly([v])[0]!;

  if (primitive.kind === "cuboid") {
    const { base } = cuboidCorners(
      primitive.center,
      primitive.size,
      primitive.yawDeg,
    );
    // cuboidCorners base already at bottom; ExtrudedBase elevates by height.
    // But base y is center.y - height/2; we need elevate by size.height.
    const fill = FILL[primitive.id] ?? FILL.default!;
    const bottom = base;
    return (
      <g data-primitive={primitive.id} data-label={primitive.label}>
        <ExtrudedBase
          base={bottom}
          height={primitive.size.height}
          offset={offset}
          topFill={fill.top}
          sideFill={fill.side}
          sideFillAlt={fill.sideAlt}
        />
        {label ? (
          <text
            x={p(primitive.center).x - offset.x}
            y={p(primitive.center).y - offset.y}
            textAnchor="middle"
            style={{
              fontSize: 8,
              fill: "#1a1410",
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
            }}
          >
            {primitive.label}
          </text>
        ) : null}
      </g>
    );
  }

  if (primitive.kind === "disk") {
    const base = diskBase(
      primitive.center,
      primitive.radius,
      primitive.yawDeg,
      primitive.sides,
    );
    const wood =
      primitive.id === "post"
        ? {
            top: PALETTE.wood,
            side: PALETTE.woodDark,
            sideAlt: PALETTE.frameDark,
          }
        : {
            top: PALETTE.woodLight,
            side: PALETTE.wood,
            sideAlt: PALETTE.woodDark,
          };
    return (
      <g data-primitive={primitive.id} data-label={primitive.label}>
        <ExtrudedBase
          base={base}
          height={primitive.height}
          offset={offset}
          topFill={wood.top}
          sideFill={wood.side}
          sideFillAlt={wood.sideAlt}
        />
        {label ? (
          <text
            x={p(primitive.center).x - offset.x}
            y={p({ ...primitive.center, y: primitive.center.y + primitive.height }).y - offset.y - 4}
            textAnchor="middle"
            style={{
              fontSize: 7,
              fill: "#1a1410",
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
            }}
          >
            {primitive.label}
          </text>
        ) : null}
      </g>
    );
  }

  if (primitive.kind === "cylinder") {
    const n = normalize(primitive.axis);
    const base = cylinderDisk(
      primitive.base,
      n,
      primitive.radius,
      primitive.sides,
    );
    const topCenter = {
      x: primitive.base.x + n.x * primitive.height,
      y: primitive.base.y + n.y * primitive.height,
      z: primitive.base.z + n.z * primitive.height,
    };
    const top = cylinderDisk(topCenter, n, primitive.radius, primitive.sides);
    const sides = Array.from({ length: primitive.sides }, (_, i) => {
      const j = (i + 1) % primitive.sides;
      const quad = [base[i]!, base[j]!, top[j]!, top[i]!];
      return { quad, depth: depthKey(quad), index: i };
    }).sort((a, b) => a.depth - b.depth);
    return (
      <g data-primitive={primitive.id} data-label={primitive.label}>
        {sides.map(({ quad, index }) => (
          <Face
            key={index}
            corners={quad}
            offset={offset}
            fill={index % 2 === 0 ? PALETTE.frameDark : PALETTE.woodDark}
          />
        ))}
        <Face corners={top} offset={offset} fill={PALETTE.frame} />
        {label ? (
          <text
            x={p(topCenter).x - offset.x}
            y={p(topCenter).y - offset.y}
            textAnchor="middle"
            style={{
              fontSize: 7,
              fill: "#1a1410",
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
            }}
          >
            {primitive.label}
          </text>
        ) : null}
      </g>
    );
  }

  if (primitive.kind === "ring") {
    const pts = ringPoints(
      primitive.center,
      primitive.radius,
      primitive.yawDeg,
      primitive.tiltDeg,
      primitive.segments,
    );
    const points = pts
      .map((c) => {
        const s = p(c);
        return `${s.x - offset.x},${s.y - offset.y}`;
      })
      .join(" ");
    return (
      <g data-primitive={primitive.id} data-label={primitive.label}>
        <polygon
          points={points}
          fill="none"
          stroke={PALETTE.brass}
          strokeWidth={primitive.stroke}
          strokeLinejoin="round"
        />
        {label ? (
          <text
            x={p(primitive.center).x - offset.x}
            y={p(primitive.center).y - offset.y - primitive.radius * 20}
            textAnchor="middle"
            style={{
              fontSize: 7,
              fill: PALETTE.brassLight,
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
            }}
          >
            {primitive.label}
          </text>
        ) : null}
      </g>
    );
  }

  // sphere
  const s = p(primitive.center);
  const rPx = Math.max(1.2, primitive.radius * 55);
  const fill =
    primitive.role === "glow"
      ? PALETTE.glow
      : primitive.role === "core"
        ? PALETTE.glowCore
        : PALETTE.star;
  return (
    <g data-primitive={primitive.id} data-label={primitive.label}>
      <circle
        cx={s.x - offset.x}
        cy={s.y - offset.y}
        r={rPx}
        fill={fill}
        opacity={primitive.role === "glow" ? 0.85 : 1}
        stroke={primitive.role === "core" ? PALETTE.star : undefined}
        strokeWidth={primitive.role === "core" ? 1.2 : undefined}
      />
      {label && primitive.role === "star" ? (
        <text
          x={s.x - offset.x}
          y={s.y - offset.y + rPx + 10}
          textAnchor="middle"
          style={{
            fontSize: 7,
            fill: "#fff4c8",
            fontFamily: "ui-monospace, monospace",
            fontWeight: 700,
          }}
        >
          {primitive.label}
        </text>
      ) : null}
    </g>
  );
}

export function RenderGeometry({
  primitives,
  offset,
  labeled = false,
}: {
  primitives: readonly GeomPrimitive[];
  offset: Point2;
  labeled?: boolean;
}) {
  return (
    <>
      {primitives.map((primitive) => (
        <RenderPrimitive
          key={primitive.id}
          primitive={primitive}
          offset={offset}
          label={labeled}
        />
      ))}
    </>
  );
}
