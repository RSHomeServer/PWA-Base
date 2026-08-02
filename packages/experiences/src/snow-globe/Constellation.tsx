import { useMemo } from "react";
import * as THREE from "three";

/** Birthday dedication constellation — crown arc + heart tip (local unit space). */
const STAR_POSITIONS: [number, number, number][] = [
  // crown arc with Z depth
  [-0.42, 0.28, 0.22],
  [-0.28, 0.42, 0.05],
  [-0.12, 0.5, -0.08],
  [0.0, 0.54, 0.12],
  [0.12, 0.5, -0.06],
  [0.28, 0.42, 0.1],
  [0.42, 0.28, 0.2],
  // descending heart tip (forward)
  [0.22, 0.12, 0.32],
  [0.0, -0.1, 0.38],
  [-0.22, 0.12, 0.3],
  // depth sparkles
  [-0.35, -0.15, -0.28],
  [0.38, -0.1, -0.32],
  [0.05, 0.15, -0.42],
  [-0.15, 0.05, 0.45],
  [0.3, 0.0, -0.15],
];

const LINES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 9],
  [9, 0],
];

export function Constellation({
  scale = 1,
  drawProgress = 1,
}: {
  scale?: number;
  /** 0–1 line draw for intro beat B */
  drawProgress?: number;
}) {
  const { positions, linePositions, lineCount } = useMemo(() => {
    const positions = new Float32Array(STAR_POSITIONS.length * 3);
    STAR_POSITIONS.forEach((p, i) => {
      positions[i * 3] = p[0];
      positions[i * 3 + 1] = p[1];
      positions[i * 3 + 2] = p[2];
    });
    const linePositions = new Float32Array(LINES.length * 2 * 3);
    LINES.forEach(([a, b], i) => {
      const o = i * 6;
      linePositions[o] = STAR_POSITIONS[a]![0];
      linePositions[o + 1] = STAR_POSITIONS[a]![1];
      linePositions[o + 2] = STAR_POSITIONS[a]![2];
      linePositions[o + 3] = STAR_POSITIONS[b]![0];
      linePositions[o + 4] = STAR_POSITIONS[b]![1];
      linePositions[o + 5] = STAR_POSITIONS[b]![2];
    });
    return { positions, linePositions, lineCount: LINES.length };
  }, []);

  const visibleLines = Math.max(0, Math.min(lineCount, Math.ceil(drawProgress * lineCount)));
  const drawOpacity = THREE.MathUtils.clamp(drawProgress, 0, 1);
  const visibleLinePositions = useMemo(
    () => linePositions.slice(0, Math.max(6, visibleLines * 6)),
    [linePositions, visibleLines],
  );

  return (
    <group scale={scale * 0.85} position={[0, -0.05, 0]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.055}
          color="#fff4e0"
          transparent
          opacity={0.95}
          depthWrite={false}
          sizeAttenuation
          map={undefined}
        />
      </points>
      {/* Soft glow discs behind brightest stars */}
      {STAR_POSITIONS.slice(0, 7).map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.025, 12, 12]} />
          <meshBasicMaterial color="#ffe6b8" transparent opacity={0.55} depthWrite={false} />
        </mesh>
      ))}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[visibleLinePositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#d4b888"
          transparent
          opacity={0.55 * drawOpacity}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/** Background starfield for night-sky intro (outside / around the dome). */
export function AmbientStars({ count = 180 }: { count?: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const r = 4 + Math.random() * 8;
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi);
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#dce6f2" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  );
}
