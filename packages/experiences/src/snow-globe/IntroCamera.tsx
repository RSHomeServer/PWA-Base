import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { SnowGlobeIntro } from "../types.js";

type Phase = "stars" | "draw" | "spiral" | "settle" | "idle";

const HERO = {
  position: new THREE.Vector3(1.55, 1.25, 3.15),
  lookAt: new THREE.Vector3(0, -0.25, 0),
  fov: 36,
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Scripted camera for constellation-reveal, then yields to OrbitControls.
 * Timings from creative brief (wall-clock seconds).
 */
export function IntroCamera({
  intro = "none",
  onPhase,
  onComplete,
}: {
  intro?: SnowGlobeIntro;
  onPhase?: (phase: Phase, t: number) => void;
  onComplete?: () => void;
}) {
  const { camera } = useThree();
  const perspective = camera as THREE.PerspectiveCamera;
  const t0 = useRef<number | null>(null);
  const done = useRef(false);
  const phaseRef = useRef<Phase>("idle");

  useEffect(() => {
    done.current = false;
    t0.current = null;
    if (intro !== "constellation-reveal" || prefersReducedMotion()) {
      perspective.position.copy(HERO.position);
      perspective.fov = HERO.fov;
      perspective.updateProjectionMatrix();
      perspective.lookAt(HERO.lookAt);
      phaseRef.current = "idle";
      onPhase?.("idle", 0);
      onComplete?.();
      done.current = true;
    }
  }, [intro, onComplete, onPhase, perspective]);

  useFrame((state) => {
    if (done.current || intro !== "constellation-reveal") return;
    if (t0.current === null) t0.current = state.clock.elapsedTime;
    const t = state.clock.elapsedTime - t0.current;

    let phase: Phase = "stars";
    if (t >= 13.5) phase = "idle";
    else if (t >= 11) phase = "settle";
    else if (t >= 5.5) phase = "spiral";
    else if (t >= 2) phase = "draw";

    if (phase !== phaseRef.current) {
      phaseRef.current = phase;
      onPhase?.(phase, t);
    }

    const look = new THREE.Vector3();
    if (phase === "stars" || phase === "draw") {
      // Deep among the dedication stars
      perspective.position.set(0.05, 0.25, 0.55);
      look.set(0, 0.2, 0);
      perspective.fov = THREE.MathUtils.lerp(55, 48, Math.min(1, t / 5.5));
    } else if (phase === "spiral") {
      const u = (t - 5.5) / 5.5;
      const eased = 1 - Math.pow(1 - u, 2.4);
      const angle = -0.2 + eased * (Math.PI * 0.85);
      const radius = THREE.MathUtils.lerp(0.7, 3.05, eased);
      const height = THREE.MathUtils.lerp(0.35, 1.05, eased);
      perspective.position.set(Math.sin(angle) * radius, height, Math.cos(angle) * radius);
      look.set(0, THREE.MathUtils.lerp(0.15, -0.1, eased), 0);
      perspective.fov = THREE.MathUtils.lerp(48, 38, eased);
    } else if (phase === "settle") {
      const u = (t - 11) / 2.5;
      const eased = 1 - Math.pow(1 - Math.min(1, u), 2);
      perspective.position.lerpVectors(
        new THREE.Vector3(Math.sin(Math.PI * 0.65) * 3.05, 1.05, Math.cos(Math.PI * 0.65) * 3.05),
        HERO.position,
        eased,
      );
      look.lerpVectors(new THREE.Vector3(0, -0.1, 0), HERO.lookAt, eased);
      perspective.fov = THREE.MathUtils.lerp(38, HERO.fov, eased);
    } else {
      perspective.position.copy(HERO.position);
      look.copy(HERO.lookAt);
      perspective.fov = HERO.fov;
      if (!done.current) {
        done.current = true;
        onComplete?.();
      }
    }

    perspective.updateProjectionMatrix();
    perspective.lookAt(look);
  });

  return null;
}

export type { Phase as IntroPhase };
