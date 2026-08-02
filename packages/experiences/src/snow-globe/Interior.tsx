/** Soft snow bed + warm interior bounce disc under the centrepiece. */
export function Interior({ accent = "#e2b889" }: { accent?: string }) {
  return (
    <group>
      <mesh position={[0, -0.92, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.78, 48]} />
        <meshStandardMaterial color="#cfd8e2" roughness={0.97} metalness={0} />
      </mesh>
      <mesh position={[0, -0.905, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 32]} />
        <meshBasicMaterial color={accent} transparent opacity={0.28} />
      </mesh>
      <pointLight position={[0, -0.35, 0]} intensity={0.55} color={accent} distance={2.4} decay={2} />
    </group>
  );
}
