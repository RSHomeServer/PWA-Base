import { useLayoutEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * Load a GLB, clone it, normalize into a unit-ish height that fits under the dome,
 * and gently warm materials so Kenney/Poly assets read as miniatures (not washed white).
 */
export function FittedGltf({
  src,
  scale = 1,
  targetHeight = 0.95,
}: {
  src: string;
  scale?: number;
  /** Desired vertical span inside the globe after fit */
  targetHeight?: number;
}) {
  const { scene } = useGLTF(src);
  const group = useRef<THREE.Group>(null);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useLayoutEffect(() => {
    const isTree = src.toLowerCase().includes("tree");
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((mat) => {
        const m = mat as THREE.MeshStandardMaterial;
        if (!m) return;
        // Drop broken / incomplete texture maps (Kenney GLBs reference sibling Textures/)
        if (m.map) {
          const img = m.map.image as { width?: number } | undefined;
          if (!img || !img.width) {
            m.map = null;
            m.needsUpdate = true;
          }
        }
        if ("roughness" in m) m.roughness = Math.min(0.85, (m.roughness ?? 0.5) + 0.08);
        if ("metalness" in m) m.metalness = Math.min(0.55, m.metalness ?? 0.1);
        if ("envMapIntensity" in m) m.envMapIntensity = 0.65;
        if (!m.map && m.color && m.color.r > 0.85 && m.color.g > 0.85 && m.color.b > 0.85) {
          const name = (mesh.name || "").toLowerCase();
          if (name.includes("ornament") || name.includes("ball") || name.includes("star")) {
            m.color.set("#f0d8a8");
            m.metalness = 0.35;
            m.roughness = 0.4;
          } else if (isTree) {
            m.color.set("#9bb59a");
            m.roughness = 0.72;
          } else {
            m.color.set("#e8e4dc");
          }
        }
      });
    });

    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const height = Math.max(size.y, 0.001);
    const fit = (targetHeight / height) * scale;
    cloned.scale.setScalar(fit);
    cloned.position.set(-center.x * fit, -box.min.y * fit - 0.9, -center.z * fit);
  }, [cloned, scale, src, targetHeight]);

  return (
    <group ref={group}>
      <primitive object={cloned} />
    </group>
  );
}

useGLTF.preload("/models/snow-globe/eiffel.glb");
useGLTF.preload("/models/snow-globe/tree-decorated.glb");
