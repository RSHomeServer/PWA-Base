export function Base({
  wood = "#3f2a1d",
  brass = "#b08d57",
}: {
  wood?: string;
  brass?: string;
}) {
  return (
    <group>
      <mesh position={[0, -1.08, 0]}>
        <cylinderGeometry args={[0.78, 0.92, 0.34, 48]} />
        <meshStandardMaterial color={wood} roughness={0.62} metalness={0.05} />
      </mesh>
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.7, 0.7, 0.07, 48]} />
        <meshStandardMaterial color="#2a1c14" roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh position={[0, -0.86, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.68, 0.04, 16, 64]} />
        <meshStandardMaterial color={brass} metalness={0.82} roughness={0.26} />
      </mesh>
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.96, 1.05, 0.1, 48]} />
        <meshStandardMaterial color="#241810" roughness={0.7} metalness={0.03} />
      </mesh>
    </group>
  );
}
