import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, Float, OrbitControls } from "@react-three/drei";
import { Suspense, useCallback, useMemo, useState } from "react";
import type { SnowGlobeInstance } from "../types.js";
import { AmbientStars } from "./Constellation.js";
import { Centrepiece } from "./Centrepiece.js";
import { SnowField } from "./SnowField.js";
import { GlobeShell } from "./GlobeShell.js";
import { Base } from "./Base.js";
import { Interior } from "./Interior.js";
import { IntroCamera, type IntroPhase } from "./IntroCamera.js";

function moodAmbient(mood: SnowGlobeInstance["lighting"]): string {
  switch (mood?.mood) {
    case "cool":
      return "#9bb4c8";
    case "candle":
      return "#e8c088";
    case "daylight":
      return "#f0f4f8";
    default:
      return "#e2b889";
  }
}

function phaseToDraw(phase: IntroPhase, introActive: boolean): number {
  if (!introActive) return 1;
  if (phase === "stars") return 0.15;
  if (phase === "draw") return 0.85;
  return 1;
}

export function SnowGlobeScene({
  instance,
  shake = 0,
  introNonce = 0,
}: {
  instance: SnowGlobeInstance;
  shake?: number;
  introNonce?: number;
}) {
  const ambient = moodAmbient(instance.lighting);
  const density = instance.snowDensity ?? 0.45;
  const intro = instance.intro ?? "none";
  const isConstellationIntro = intro === "constellation-reveal";
  const [phase, setPhase] = useState<IntroPhase>(
    isConstellationIntro ? "stars" : "idle",
  );
  const [interactive, setInteractive] = useState(!isConstellationIntro);

  const onPhase = useCallback((p: IntroPhase) => setPhase(p), []);
  const onComplete = useCallback(() => setInteractive(true), []);

  const key = useMemo(
    () =>
      `${instance.id}:${JSON.stringify(instance.centrepiece)}:${density}:${intro}:${introNonce}`,
    [instance.id, instance.centrepiece, density, intro, introNonce],
  );

  const envPreset =
    instance.environment === "night-sky" || instance.environment === "night-city"
      ? "night"
      : instance.environment === "quiet-room"
        ? "warehouse"
        : "city";

  const intensity = instance.lighting?.intensity ?? 0.85;
  const floatActive = interactive && phase === "idle";
  const draw = phaseToDraw(phase, isConstellationIntro);
  const showAmbientStars =
    instance.environment === "night-sky" || isConstellationIntro;

  return (
    <Canvas
      key={key}
      camera={{ position: [1.55, 1.25, 3.15], fov: 36, near: 0.1, far: 40 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "default",
        failIfMajorPerformanceCaveat: false,
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#08060a"]} />
      <fog attach="fog" args={["#08060a", 10, 26]} />
      <ambientLight intensity={intensity * 0.48} color={ambient} />
      <directionalLight
        position={[2.6, 4.2, 2.4]}
        intensity={intensity * 1.15}
        color={ambient}
      />
      <directionalLight
        position={[-2.4, 1.4, -1.6]}
        intensity={intensity * 0.28}
        color="#9bb4c8"
      />
      {/* Soft rim so glass silhouette reads against museum black */}
      <directionalLight position={[0.2, 0.5, -3]} intensity={0.35} color="#cfe0f0" />

      <IntroCamera intro={intro} onPhase={onPhase} onComplete={onComplete} />

      <Suspense fallback={null}>
        {showAmbientStars ? <AmbientStars count={160} /> : null}
        <Float
          speed={floatActive ? 0.55 : 0}
          rotationIntensity={floatActive ? 0.09 : 0}
          floatIntensity={floatActive ? 0.12 : 0}
        >
          <group position={[0, 0.05, 0]}>
            <GlobeShell glassTint={instance.palette?.glass} />
            <Interior accent={instance.palette?.accent ?? ambient} />
            <Centrepiece
              centrepiece={instance.centrepiece}
              constellationDraw={draw}
            />
            <SnowField
              density={density}
              shake={shake}
              enabled={phase !== "stars"}
            />
            <Base
              wood={instance.palette?.wood}
              brass={instance.palette?.brass}
            />
          </group>
        </Float>
        {/* Museum table — grounds the plinth */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.32, 0]} receiveShadow>
          <circleGeometry args={[2.8, 64]} />
          <meshStandardMaterial color="#1a1210" roughness={0.85} metalness={0.05} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.315, 0]}>
          <ringGeometry args={[0.9, 1.6, 64]} />
          <meshBasicMaterial color="#c47a4a" transparent opacity={0.06} />
        </mesh>
        <ContactShadows
          position={[0, -1.31, 0]}
          opacity={0.55}
          scale={10}
          blur={2.8}
          far={4}
        />
        <Environment
          preset={envPreset}
          environmentIntensity={
            envPreset === "night" ? 0.22 : 0.36
          }
        />
      </Suspense>

        <OrbitControls
        enabled={interactive}
        enablePan={false}
        minDistance={2.6}
        maxDistance={5.2}
        maxPolarAngle={Math.PI * 0.48}
        minPolarAngle={Math.PI * 0.2}
        target={[0, -0.25, 0]}
        autoRotate={interactive}
        autoRotateSpeed={0.25}
      />
    </Canvas>
  );
}
