import * as THREE from "three";
import { AU_TO_SCENE } from "../data/planetsJ2000";

export type SolarPresentationMode = "orbit-atlas" | "sandbox";
export type OrbitAtlasScaleMode = "compressed" | "physical";
export type OrbitAtlasRenderBudget = "balanced" | "dense";
export type OrbitAtlasVisualProfile = "orbit-atlas-v5" | "orbit-atlas-v6";
export type OrbitAtlasBodyVisualProfile =
  | "sun"
  | "terrestrial"
  | "gas-giant"
  | "ringed"
  | "fallback";
export type OrbitClass = "planet" | "asteroid" | "centaur" | "tno" | "comet";

export const ORBIT_ATLAS_RADIAL_SCALE = 90;
export const ORBIT_ATLAS_RADIAL_KNEE_AU = 0.18;
export const ORBIT_ATLAS_VISUAL_PROFILE: OrbitAtlasVisualProfile = "orbit-atlas-v6";

export const ORBIT_ATLAS_CAMERA_POSITION = new THREE.Vector3(0, 720, 420);
export const SANDBOX_CAMERA_POSITION = new THREE.Vector3(0, 460, 300);

export const ORBIT_ATLAS_V6_SKY = {
  rotation: [-0.3, 1.42, -0.58] as const,
  uvOffset: [0.035, -0.018] as const,
  exposure: 0.56,
  contrast: 1.35,
  saturation: 0.58,
  dustLaneStrength: 0.28,
  centerProtection: 0.22,
} as const;

const GAS_GIANT_IDS = new Set(["jupiter", "saturn", "uranus", "neptune"]);
const TERRESTRIAL_IDS = new Set(["mercury", "venus", "earth", "moon", "mars"]);

export function orbitAtlasDisplayRadius(radiusAu: number): number {
  if (!Number.isFinite(radiusAu) || radiusAu <= 0) return 0;
  return (
    ORBIT_ATLAS_RADIAL_SCALE *
    Math.log1p(radiusAu / ORBIT_ATLAS_RADIAL_KNEE_AU)
  );
}

export function mapOrbitAtlasPositionAu(
  xAu: number,
  yAu: number,
  zAu: number,
  scaleMode: OrbitAtlasScaleMode,
  target = new THREE.Vector3(),
): THREE.Vector3 {
  if (scaleMode === "physical") {
    return target.set(xAu * AU_TO_SCENE, yAu * AU_TO_SCENE, zAu * AU_TO_SCENE);
  }

  const radiusAu = Math.hypot(xAu, yAu, zAu);
  if (radiusAu <= 1e-12) return target.set(0, 0, 0);
  const displayRadius = orbitAtlasDisplayRadius(radiusAu);
  const scale = displayRadius / radiusAu;
  return target.set(xAu * scale, yAu * scale, zAu * scale);
}

export function mapOrbitAtlasVector(
  positionAu: THREE.Vector3,
  scaleMode: OrbitAtlasScaleMode,
  target = new THREE.Vector3(),
): THREE.Vector3 {
  return mapOrbitAtlasPositionAu(
    positionAu.x,
    positionAu.y,
    positionAu.z,
    scaleMode,
    target,
  );
}

const PLANET_ORBIT_IDS = new Set([
  "mercury",
  "venus",
  "earth",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
]);
const CENTAUR_IDS = new Set(["pholus", "chiron", "asbolus", "nessus", "chariklo"]);
const COMET_IDS = new Set(["c1996e1", "hidalgo"]);

export function classifyReferenceOrbit(
  id: string,
  semiMajorAxisAu: number,
): OrbitClass {
  if (PLANET_ORBIT_IDS.has(id)) return "planet";
  if (CENTAUR_IDS.has(id)) return "centaur";
  if (COMET_IDS.has(id)) return "comet";
  if (semiMajorAxisAu >= 30) return "tno";
  return "asteroid";
}

export function orbitAtlasBodyVisualProfile(
  id: string,
  showRings?: boolean,
): OrbitAtlasBodyVisualProfile {
  if (id === "sun") return "sun";
  if (showRings || id === "saturn") return "ringed";
  if (GAS_GIANT_IDS.has(id)) return "gas-giant";
  if (TERRESTRIAL_IDS.has(id)) return "terrestrial";
  return "fallback";
}

export const ORBIT_ATLAS_LABELS: Readonly<Record<string, string>> = {
  sun: "太阳",
  mercury: "水星",
  venus: "金星",
  earth: "地球",
  mars: "火星",
  jupiter: "木星",
  saturn: "土星",
  uranus: "天王星",
  neptune: "海王星",
  pluto: "冥王星",
  ceres: "谷神星",
  eris: "阋神星",
  sedna: "赛德娜",
};

export const ORBIT_ATLAS_DEFAULT_LABEL_IDS = Object.freeze(
  Object.keys(ORBIT_ATLAS_LABELS),
);
