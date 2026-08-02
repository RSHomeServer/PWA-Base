import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Points } from "three";
import * as THREE from "three";

export function SnowField({
  density,
  shake = 0,
  enabled = true,
}: {
  density: number;
  shake?: number;
  enabled?: boolean;
}) {
  const ref = useRef<Points>(null);
  const count = Math.max(36, Math.min(120, Math.round(100 * density)));
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = 0.18 + Math.random() * 0.72;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi);
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    return arr;
  }, [count]);

  const impulse = useRef(0);
  useEffect(() => {
    if (shake > 0) impulse.current = 1;
  }, [shake]);

  useFrame((_, delta) => {
    const points = ref.current;
    if (!points || !enabled) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    impulse.current = Math.max(0, impulse.current - delta * 0.85);
    const boost = 1 + impulse.current * 2.2;
    const attr = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < attr.count; i += 1) {
      let y = attr.getY(i) - delta * (0.06 + (i % 5) * 0.008) * boost;
      let x = attr.getX(i) + Math.sin(y * 3 + i) * delta * 0.02 * boost;
      if (y < -0.82) {
        y = 0.82;
        x *= 0.4;
      }
      const len = Math.hypot(x, y, attr.getZ(i));
      if (len > 0.92) {
        const s = 0.9 / len;
        attr.setXYZ(i, x * s, y * s, attr.getZ(i) * s);
      } else {
        attr.setX(i, x);
        attr.setY(i, y);
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.024}
        color="#f5f7fa"
        transparent
        opacity={0.72}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}
