import { Suspense } from "react";
import type { CentrepieceRef } from "../types.js";
import { Constellation } from "./Constellation.js";
import { FittedGltf } from "./FittedGltf.js";

function Eiffel({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale * 0.55} position={[0, -0.55, 0]}>
      <mesh position={[0, 0.95, 0]}>
        <boxGeometry args={[0.08, 1.9, 0.08]} />
        <meshStandardMaterial color="#6b5b4a" metalness={0.35} roughness={0.45} />
      </mesh>
      {[
        [-0.28, 0.35, -0.28],
        [0.28, 0.35, -0.28],
        [-0.28, 0.35, 0.28],
        [0.28, 0.35, 0.28],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} rotation={[0, 0, (i % 2 === 0 ? 1 : -1) * 0.22]}>
          <boxGeometry args={[0.05, 1.1, 0.05]} />
          <meshStandardMaterial color="#7a6854" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 1.7, 0]}>
        <coneGeometry args={[0.12, 0.35, 4]} />
        <meshStandardMaterial color="#8a7460" metalness={0.4} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Tree({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale * 0.7} position={[0, -0.55, 0]}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.25, 8]} />
        <meshStandardMaterial color="#5a3a28" />
      </mesh>
      {[0.45, 0.75, 1.0].map((y, i) => (
        <mesh key={y} position={[0, y, 0]}>
          <coneGeometry args={[0.42 - i * 0.1, 0.45, 7]} />
          <meshStandardMaterial color={i === 2 ? "#3f6b52" : "#4a7a5c"} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function BalletShoes({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale * 0.65} position={[0, -0.35, 0]} rotation={[0, 0.4, 0]}>
      {[-0.18, 0.18].map((x, i) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[0.4, i === 0 ? 0.3 : -0.3, i === 0 ? 0.2 : -0.2]}>
          <capsuleGeometry args={[0.08, 0.28, 4, 8]} />
          <meshStandardMaterial color="#d9b4c0" roughness={0.55} />
        </mesh>
      ))}
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.12, 0.015, 8, 20]} />
        <meshStandardMaterial color="#c4a15a" metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

export function Centrepiece({
  centrepiece,
  constellationDraw = 1,
}: {
  centrepiece: CentrepieceRef;
  constellationDraw?: number;
}) {
  if (centrepiece.kind === "gltf") {
    return (
      <Suspense fallback={<Eiffel scale={1} />}>
        <FittedGltf src={centrepiece.src} scale={centrepiece.scale ?? 1} />
      </Suspense>
    );
  }

  const scale = centrepiece.scale ?? 1;
  switch (centrepiece.id) {
    case "constellation":
      return <Constellation scale={scale} drawProgress={constellationDraw} />;
    case "christmas-tree":
      return <Tree scale={scale} />;
    case "ballet-shoes":
      return <BalletShoes scale={scale} />;
    case "eiffel":
    default:
      return <Eiffel scale={scale} />;
  }
}
