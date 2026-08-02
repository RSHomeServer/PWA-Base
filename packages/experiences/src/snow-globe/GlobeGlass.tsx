export function GlobeGlass() {
  return (
    <mesh>
      <sphereGeometry args={[1, 48, 48]} />
      <meshPhysicalMaterial
        color="#e8f2f8"
        transmission={0.92}
        thickness={0.35}
        roughness={0.08}
        metalness={0}
        ior={1.45}
        transparent
        opacity={0.95}
        attenuationColor="#cfe0ec"
        attenuationDistance={2.5}
      />
    </mesh>
  );
}
