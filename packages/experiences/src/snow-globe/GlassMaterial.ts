import { MeshPhysicalMaterial } from "three";

/** Production-default milk-glass approx — reliable without transmission. */
export function createMilkGlassMaterial(tint = "#e8f2f8") {
  return new MeshPhysicalMaterial({
    color: tint,
    transparent: true,
    opacity: 0.28,
    roughness: 0.14,
    metalness: 0,
    envMapIntensity: 0.85,
    clearcoat: 0.55,
    clearcoatRoughness: 0.2,
    depthWrite: false,
  });
}
