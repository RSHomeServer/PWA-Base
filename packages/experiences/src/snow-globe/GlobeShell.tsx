import { BackSide } from "three";

/**
 * Milk-glass dome + thin fresnel rim.
 * Approx materials by default for WebGL reliability (Cursor + mobile).
 */
export function GlobeShell({ glassTint = "#e8f2f8" }: { glassTint?: string }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <meshPhysicalMaterial
          color={glassTint}
          transparent
          opacity={0.22}
          roughness={0.12}
          metalness={0}
          envMapIntensity={1.05}
          clearcoat={0.85}
          clearcoatRoughness={0.12}
          depthWrite={false}
        />
      </mesh>
      {/* Inner skin — soft milk scattering */}
      <mesh scale={0.985}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhysicalMaterial
          color="#f2f7fb"
          transparent
          opacity={0.08}
          roughness={0.4}
          metalness={0}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={1.018}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#f4fbff"
          transparent
          opacity={0.09}
          side={BackSide}
          depthWrite={false}
        />
      </mesh>
      {/* Soft specular catch light — museum case practical */}
      <mesh position={[-0.35, 0.45, 0.72]} scale={[0.35, 0.55, 0.12]}>
        <sphereGeometry args={[0.5, 24, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  );
}
