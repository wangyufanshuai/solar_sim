import * as THREE from "three";
import { AU_TO_SCENE } from "../data/planetsJ2000";

export type SolarPresentationMode = "orbit-atlas" | "sandbox";
export type OrbitAtlasScaleMode = "compressed" | "physical";
export type OrbitAtlasRenderBudget = "balanced" | "dense";
export type OrbitAtlasVisualProfile =
  | "orbit-atlas-v5"
  | "orbit-atlas-v6"
  | "orbit-atlas-v7"
  | "orbit-atlas-v8"
  | "orbit-atlas-v9"
  | "orbit-atlas-v10"
  | "orbit-atlas-v11"
  | "orbit-atlas-v12";
export type OrbitAtlasTextureProfile = "overview-2k" | "selected-8k";
export type OrbitAtlasPostProfile = "sandbox" | "atlas-scientific";
export type OrbitAtlasOrbitBatchStyle = Exclude<OrbitAtlasOrbitLayerStyle, "major">;
export type OrbitAtlasSkyLayerManifest = {
  desktopBase: string;
  mobileBase: string;
  desktopStars: string;
  mobileStars: string;
  desktopDistantStars?: string;
  mobileDistantStars?: string;
  dustMask: string;
  negativeSpaceMask?: string;
  nebulaHazeMask?: string;
  rotation: readonly [number, number, number];
};
export type OrbitAtlasOrbitLayerStyle =
  | "major"
  | "inner-minor"
  | "outer-minor"
  | "high-inclination"
  | "background-crossing";
export type OrbitAtlasOrbitStyleToken = {
  color: string;
  coolTint: string;
  linewidthPx: number;
  glowWidthPx: number;
  baseOpacity: readonly [number, number];
  coreAlpha: readonly [number, number];
  haloAlpha: readonly [number, number];
  centerFade: number;
  horizonFade: number;
  depthFade: number;
  inclinationFade: number;
  hueJitter: number;
  alphaJitter: number;
  edgeSoftness: number;
  edgeHold: number;
  foregroundBoost: number;
  depthTest: boolean;
};
export type OrbitAtlasV12OrbitColor = {
  core: string;
  halo: string;
};
export type OrbitAtlasBodyVisualProfile =
  | "sun"
  | "terrestrial"
  | "gas-giant"
  | "ringed"
  | "fallback";
export type OrbitAtlasBodyStyleToken = {
  overviewRadiusScale: number;
  selectedRadiusScale: number;
  spriteMinPx: number;
  emissiveIntensity: number;
  selectedEmissiveIntensity: number;
  rimOpacity: number;
  selectedRimOpacity: number;
  textureFill: number;
  selectedTextureFill: number;
  bumpScale: number;
};
export type OrbitClass = "planet" | "asteroid" | "centaur" | "tno" | "comet";

export const ORBIT_ATLAS_RADIAL_SCALE = 90;
export const ORBIT_ATLAS_RADIAL_KNEE_AU = 0.18;
export const ORBIT_ATLAS_VISUAL_PROFILE: OrbitAtlasVisualProfile = "orbit-atlas-v12";
export const ORBIT_ATLAS_ORBIT_RENDERER = "cold-body-web-v12";
export const ORBIT_ATLAS_BALANCED_VISIBLE_ORBIT_COUNT = 32;
export const ORBIT_ATLAS_DENSE_VISIBLE_ORBIT_COUNT = 50;

export const ORBIT_ATLAS_BODY_BASE_RADIUS: Readonly<Record<string, number>> = {
  sun: 6.4,
  mercury: 1.15,
  venus: 1.55,
  earth: 3.8,
  moon: 0.82,
  mars: 1.35,
  jupiter: 7.2,
  saturn: 6.4,
  uranus: 2.7,
  neptune: 2.7,
  pluto: 0.72,
  ceres: 0.58,
};

export const ORBIT_ATLAS_CAMERA_POSITION = new THREE.Vector3(-190, 330, 780);
export const ORBIT_ATLAS_CAMERA_TARGET = new THREE.Vector3(28, -34, 0);
export const ORBIT_ATLAS_CAMERA_FOV = 52;
export const SANDBOX_CAMERA_POSITION = new THREE.Vector3(0, 460, 300);

export const ORBIT_ATLAS_V7_SKY = {
  rotation: [-0.3, 1.42, -0.58] as const,
  uvOffset: [0.022, -0.01] as const,
  exposure: 0.27,
  contrast: 1.1,
  saturation: 0.46,
  dustLaneStrength: 0.5,
  centerProtection: 0.58,
} as const;

export const ORBIT_ATLAS_V8_SKY = {
  rotation: [-0.34, 1.36, -0.62] as const,
  uvOffset: [0.018, -0.016] as const,
  exposure: 0.48,
  contrast: 1.32,
  saturation: 0.38,
  dustLaneStrength: 0.46,
  centerProtection: 0.36,
  milkyWayBandMask: 0.16,
  coreSuppression: 0.18,
} as const;

export const ORBIT_ATLAS_V9_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v9-base-8k.jpg",
  mobileBase: "/textures/sky/orbit-atlas-v9-base-4k.jpg",
  desktopStars: "/textures/sky/orbit-atlas-v9-stars-4k.jpg",
  mobileStars: "/textures/sky/orbit-atlas-v9-stars-2k.jpg",
  dustMask: "/textures/sky/orbit-atlas-v9-dust-2k.jpg",
  rotation: [-0.34, 4.24, -0.86],
};

export const ORBIT_ATLAS_V48_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v48-base-8k.jpg",
  mobileBase: "/textures/sky/orbit-atlas-v48-base-4k.jpg",
  desktopStars: "/textures/sky/orbit-atlas-v48-stars-4k.jpg",
  mobileStars: "/textures/sky/orbit-atlas-v48-stars-2k.jpg",
  dustMask: "/textures/sky/orbit-atlas-v48-dust-2k.jpg",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v48-negative-space-2k.jpg",
  rotation: [-0.34, 4.24, -0.86],
};

export const ORBIT_ATLAS_V56_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v56-base-8k.jpg",
  mobileBase: "/textures/sky/orbit-atlas-v56-base-4k.jpg",
  desktopStars: "/textures/sky/orbit-atlas-v56-stars-4k.jpg",
  mobileStars: "/textures/sky/orbit-atlas-v56-stars-2k.jpg",
  dustMask: "/textures/sky/orbit-atlas-v56-dust-2k.jpg",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v56-negative-space-2k.jpg",
  nebulaHazeMask: "/textures/sky/orbit-atlas-v56-nebula-haze-2k.jpg",
  rotation: [-0.34, 4.24, -0.86],
};

export const ORBIT_ATLAS_V57_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v57-base-8k.jpg",
  mobileBase: "/textures/sky/orbit-atlas-v57-base-4k.jpg",
  desktopStars: "/textures/sky/orbit-atlas-v57-primary-stars-4k.jpg",
  mobileStars: "/textures/sky/orbit-atlas-v57-primary-stars-2k.jpg",
  desktopDistantStars: "/textures/sky/orbit-atlas-v57-distant-stars-4k.jpg",
  mobileDistantStars: "/textures/sky/orbit-atlas-v57-distant-stars-2k.jpg",
  dustMask: "/textures/sky/orbit-atlas-v57-dust-4k.jpg",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v57-negative-space-4k.jpg",
  nebulaHazeMask: "/textures/sky/orbit-atlas-v57-nebula-haze-4k.jpg",
  rotation: [-0.34, 4.24, -0.86],
};

export const ORBIT_ATLAS_V59_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v59-base-8k.jpg",
  mobileBase: "/textures/sky/orbit-atlas-v59-base-4k.jpg",
  desktopStars: "/textures/sky/orbit-atlas-v59-primary-stars-4k.jpg",
  mobileStars: "/textures/sky/orbit-atlas-v59-primary-stars-2k.jpg",
  desktopDistantStars: "/textures/sky/orbit-atlas-v59-distant-stars-4k.jpg",
  mobileDistantStars: "/textures/sky/orbit-atlas-v59-distant-stars-2k.jpg",
  dustMask: "/textures/sky/orbit-atlas-v59-dust-4k.jpg",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v59-negative-space-4k.jpg",
  nebulaHazeMask: "/textures/sky/orbit-atlas-v59-nebula-haze-4k.jpg",
  rotation: [-0.34, 4.24, -0.86],
};

export const ORBIT_ATLAS_V60_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v60-base-4k.jpg",
  mobileBase: "/textures/sky/orbit-atlas-v60-base-2k.jpg",
  desktopStars: "/textures/sky/orbit-atlas-v60-primary-stars-4k.jpg",
  mobileStars: "/textures/sky/orbit-atlas-v60-primary-stars-2k.jpg",
  dustMask: "/textures/sky/orbit-atlas-v60-dust-2k.jpg",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v60-negative-space-2k.jpg",
  rotation: [-0.34, 4.24, -0.86],
};

export const ORBIT_ATLAS_V61_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v61-reset-base-4k.jpg?v=61d",
  mobileBase: "/textures/sky/orbit-atlas-v61-reset-base-2k.jpg?v=61d",
  desktopStars: "/textures/sky/orbit-atlas-v61-reset-primary-stars-4k.jpg?v=61d",
  mobileStars: "/textures/sky/orbit-atlas-v61-reset-primary-stars-2k.jpg?v=61d",
  dustMask: "/textures/sky/orbit-atlas-v61-reset-dust-2k.jpg?v=61d",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v61-reset-negative-space-2k.jpg?v=61d",
  rotation: [-0.28, 5.18, -0.7],
};

export const ORBIT_ATLAS_V62_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v61-reset-base-4k.jpg?v=62a",
  mobileBase: "/textures/sky/orbit-atlas-v61-reset-base-2k.jpg?v=62a",
  desktopStars: "/textures/sky/orbit-atlas-v61-reset-primary-stars-4k.jpg?v=62a",
  mobileStars: "/textures/sky/orbit-atlas-v61-reset-primary-stars-2k.jpg?v=62a",
  dustMask: "/textures/sky/orbit-atlas-v61-reset-dust-2k.jpg?v=62a",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v61-reset-negative-space-2k.jpg?v=62a",
  rotation: [-0.28, 5.18, -0.7],
};

export const ORBIT_ATLAS_V63_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v63-final-base-4k.jpg",
  mobileBase: "/textures/sky/orbit-atlas-v63-final-base-2k.jpg",
  desktopStars: "/textures/sky/orbit-atlas-v63-final-primary-stars-4k.jpg",
  mobileStars: "/textures/sky/orbit-atlas-v63-final-primary-stars-2k.jpg",
  dustMask: "/textures/sky/orbit-atlas-v63-final-dust-2k.jpg",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v63-final-negative-space-2k.jpg",
  rotation: [-0.28, 5.18, -0.7],
};

export const ORBIT_ATLAS_V64_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v64-cinematic-base-4k.jpg",
  mobileBase: "/textures/sky/orbit-atlas-v64-cinematic-base-2k.jpg",
  desktopStars: "/textures/sky/orbit-atlas-v64-cinematic-primary-stars-4k.jpg",
  mobileStars: "/textures/sky/orbit-atlas-v64-cinematic-primary-stars-2k.jpg",
  dustMask: "/textures/sky/orbit-atlas-v64-cinematic-dust-2k.jpg",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v64-cinematic-negative-space-2k.jpg",
  rotation: [-0.28, 5.18, -0.7],
};

export const ORBIT_ATLAS_V65_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v65-lock-cinematic-base-4k.jpg",
  mobileBase: "/textures/sky/orbit-atlas-v65-lock-cinematic-base-2k.jpg",
  desktopStars: "/textures/sky/orbit-atlas-v65-lock-primary-stars-4k.jpg",
  mobileStars: "/textures/sky/orbit-atlas-v65-lock-primary-stars-2k.jpg",
  dustMask: "/textures/sky/orbit-atlas-v65-lock-dust-2k.jpg",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v65-lock-negative-space-2k.jpg",
  rotation: [-0.28, 5.18, -0.7],
};

export const ORBIT_ATLAS_V66_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v66-milky-way-depth-base-4k.jpg?v=66d",
  mobileBase: "/textures/sky/orbit-atlas-v66-milky-way-depth-base-2k.jpg?v=66d",
  desktopStars: "/textures/sky/orbit-atlas-v65-lock-primary-stars-4k.jpg",
  mobileStars: "/textures/sky/orbit-atlas-v65-lock-primary-stars-2k.jpg",
  dustMask: "/textures/sky/orbit-atlas-v65-lock-dust-2k.jpg",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v65-lock-negative-space-2k.jpg",
  rotation: [0.12, 5.9, -0.52],
};

export const ORBIT_ATLAS_V67_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v67-galactic-depth-base-4k.jpg?v=67d",
  mobileBase: "/textures/sky/orbit-atlas-v67-galactic-depth-base-2k.jpg?v=67d",
  desktopStars: "/textures/sky/orbit-atlas-v67-primary-stars-4k.jpg?v=67d",
  mobileStars: "/textures/sky/orbit-atlas-v67-primary-stars-2k.jpg?v=67d",
  dustMask: "/textures/sky/orbit-atlas-v67-dust-2k.jpg?v=67d",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v67-negative-space-2k.jpg?v=67d",
  rotation: [-0.36, 0, -0.55],
};

export const ORBIT_ATLAS_V68_SKY: OrbitAtlasSkyLayerManifest = {
  desktopBase: "/textures/sky/orbit-atlas-v68-reference-backdrop-base-4k.jpg?v=68f",
  mobileBase: "/textures/sky/orbit-atlas-v68-reference-backdrop-base-2k.jpg?v=68f",
  desktopStars: "/textures/sky/orbit-atlas-v68-reference-primary-stars-4k.jpg?v=68f",
  mobileStars: "/textures/sky/orbit-atlas-v68-reference-primary-stars-2k.jpg?v=68f",
  dustMask: "/textures/sky/orbit-atlas-v68-reference-dust-2k.jpg?v=68f",
  negativeSpaceMask: "/textures/sky/orbit-atlas-v68-reference-negative-space-2k.jpg?v=68f",
  rotation: [1.57, -0.65, -0.55],
};

export const ORBIT_ATLAS_SKY = ORBIT_ATLAS_V9_SKY;

export const ORBIT_ATLAS_V12_ORBIT_STYLES: Readonly<Record<OrbitAtlasOrbitLayerStyle, OrbitAtlasOrbitStyleToken>> = {
  major: {
    color: "#b8ad86",
    coolTint: "#8aa4ad",
    linewidthPx: 0.92,
    glowWidthPx: 0.56,
    baseOpacity: [0.232, 0.36],
    coreAlpha: [0.232, 0.38],
    haloAlpha: [0.014, 0.03],
    centerFade: 0.82,
    horizonFade: 1,
    depthFade: 0.74,
    inclinationFade: 1,
    hueJitter: 0.035,
    alphaJitter: 0.025,
    edgeSoftness: 0.68,
    edgeHold: 0.86,
    foregroundBoost: 1,
    depthTest: true,
  },
  "inner-minor": {
    color: "#707879",
    coolTint: "#738f97",
    linewidthPx: 0.46,
    glowWidthPx: 0.14,
    baseOpacity: [0.045, 0.095],
    coreAlpha: [0.045, 0.095],
    haloAlpha: [0.003, 0.01],
    centerFade: 0.46,
    horizonFade: 1.12,
    depthFade: 0.46,
    inclinationFade: 0.72,
    hueJitter: 0.055,
    alphaJitter: 0.16,
    edgeSoftness: 0.5,
    edgeHold: 0.88,
    foregroundBoost: 0.94,
    depthTest: true,
  },
  "outer-minor": {
    color: "#5e6d73",
    coolTint: "#627f8d",
    linewidthPx: 0.44,
    glowWidthPx: 0.12,
    baseOpacity: [0.038, 0.085],
    coreAlpha: [0.038, 0.085],
    haloAlpha: [0.0025, 0.008],
    centerFade: 0.42,
    horizonFade: 1.12,
    depthFade: 0.4,
    inclinationFade: 0.62,
    hueJitter: 0.06,
    alphaJitter: 0.18,
    edgeSoftness: 0.5,
    edgeHold: 0.86,
    foregroundBoost: 0.9,
    depthTest: true,
  },
  "high-inclination": {
    color: "#606665",
    coolTint: "#617a82",
    linewidthPx: 0.4,
    glowWidthPx: 0.1,
    baseOpacity: [0.026, 0.065],
    coreAlpha: [0.026, 0.065],
    haloAlpha: [0.0018, 0.006],
    centerFade: 0.36,
    horizonFade: 1.08,
    depthFade: 0.32,
    inclinationFade: 0.48,
    hueJitter: 0.065,
    alphaJitter: 0.22,
    edgeSoftness: 0.48,
    edgeHold: 0.84,
    foregroundBoost: 0.86,
    depthTest: true,
  },
  "background-crossing": {
    color: "#665756",
    coolTint: "#6e6864",
    linewidthPx: 0.38,
    glowWidthPx: 0.08,
    baseOpacity: [0.022, 0.055],
    coreAlpha: [0.022, 0.055],
    haloAlpha: [0.0015, 0.005],
    centerFade: 0.32,
    horizonFade: 1,
    depthFade: 0.28,
    inclinationFade: 0.44,
    hueJitter: 0.07,
    alphaJitter: 0.24,
    edgeSoftness: 0.48,
    edgeHold: 0.82,
    foregroundBoost: 0.84,
    depthTest: true,
  },
};

export const ORBIT_ATLAS_V11_ORBIT_STYLES = ORBIT_ATLAS_V12_ORBIT_STYLES;

export const ORBIT_ATLAS_V12_BODY_ORBIT_PALETTE = {
  coolBlue: "#7899a9",
  iceBlue: "#86a9b2",
  blueGray: "#748d96",
  coldGold: "#c2ad78",
  copperGray: "#8c7367",
  asteroidGray: "#777d78",
  cometBrown: "#7d645e",
  neutral: "#7d8789",
} as const;

export const ORBIT_ATLAS_V11_BODY_STYLES: Readonly<Record<OrbitAtlasBodyVisualProfile, OrbitAtlasBodyStyleToken>> = {
  sun: {
    overviewRadiusScale: 0.68,
    selectedRadiusScale: 1.18,
    spriteMinPx: 9,
    emissiveIntensity: 0.42,
    selectedEmissiveIntensity: 0.66,
    rimOpacity: 0.2,
    selectedRimOpacity: 0.3,
    textureFill: 0.18,
    selectedTextureFill: 0.28,
    bumpScale: 0.01,
  },
  terrestrial: {
    overviewRadiusScale: 0.88,
    selectedRadiusScale: 1.42,
    spriteMinPx: 7,
    emissiveIntensity: 0.12,
    selectedEmissiveIntensity: 0.24,
    rimOpacity: 0.16,
    selectedRimOpacity: 0.3,
    textureFill: 0.13,
    selectedTextureFill: 0.24,
    bumpScale: 0.028,
  },
  "gas-giant": {
    overviewRadiusScale: 0.84,
    selectedRadiusScale: 1.28,
    spriteMinPx: 7,
    emissiveIntensity: 0.1,
    selectedEmissiveIntensity: 0.2,
    rimOpacity: 0.1,
    selectedRimOpacity: 0.22,
    textureFill: 0.1,
    selectedTextureFill: 0.18,
    bumpScale: 0.018,
  },
  ringed: {
    overviewRadiusScale: 0.86,
    selectedRadiusScale: 1.34,
    spriteMinPx: 8,
    emissiveIntensity: 0.11,
    selectedEmissiveIntensity: 0.22,
    rimOpacity: 0.12,
    selectedRimOpacity: 0.24,
    textureFill: 0.11,
    selectedTextureFill: 0.2,
    bumpScale: 0.018,
  },
  fallback: {
    overviewRadiusScale: 0.92,
    selectedRadiusScale: 2.8,
    spriteMinPx: 6,
    emissiveIntensity: 0.1,
    selectedEmissiveIntensity: 0.2,
    rimOpacity: 0.14,
    selectedRimOpacity: 0.34,
    textureFill: 0.08,
    selectedTextureFill: 0.18,
    bumpScale: 0.04,
  },
};

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

export function classifyOrbitAtlasLayerStyle(
  id: string,
  semiMajorAxisAu: number,
  eccentricity: number,
  inclinationDeg: number,
): OrbitAtlasOrbitLayerStyle {
  if (PLANET_ORBIT_IDS.has(id)) return "major";
  if (eccentricity >= 0.42 || COMET_IDS.has(id)) return "background-crossing";
  if (Math.abs(inclinationDeg) >= 24) return "high-inclination";
  if (semiMajorAxisAu >= 12) return "outer-minor";
  return "inner-minor";
}

function coolLimitedHex(
  color: THREE.Color,
  saturationMax: number,
  lightnessRange: readonly [number, number],
): string {
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  hsl.s = THREE.MathUtils.clamp(hsl.s * 0.62 + 0.08, 0.08, saturationMax);
  hsl.l = THREE.MathUtils.clamp(hsl.l * 0.76 + 0.08, lightnessRange[0], lightnessRange[1]);
  return `#${new THREE.Color().setHSL(hsl.h, hsl.s, hsl.l).getHexString()}`;
}

function v12PaletteAnchorForBody(
  id: string,
  layer: OrbitAtlasOrbitLayerStyle,
): THREE.Color {
  if (id === "earth" || id === "neptune") {
    return new THREE.Color(ORBIT_ATLAS_V12_BODY_ORBIT_PALETTE.coolBlue);
  }
  if (id === "uranus") {
    return new THREE.Color(ORBIT_ATLAS_V12_BODY_ORBIT_PALETTE.iceBlue);
  }
  if (id === "jupiter" || id === "saturn" || id === "venus") {
    return new THREE.Color(ORBIT_ATLAS_V12_BODY_ORBIT_PALETTE.coldGold);
  }
  if (id === "mars") {
    return new THREE.Color(ORBIT_ATLAS_V12_BODY_ORBIT_PALETTE.copperGray);
  }
  if (COMET_IDS.has(id) || layer === "background-crossing") {
    return new THREE.Color(ORBIT_ATLAS_V12_BODY_ORBIT_PALETTE.cometBrown);
  }
  if (layer === "outer-minor" || id === "pluto" || id === "eris" || id === "sedna" || id === "makemake" || id === "haumea" || id === "quaoar") {
    return new THREE.Color(ORBIT_ATLAS_V12_BODY_ORBIT_PALETTE.blueGray);
  }
  if (layer === "inner-minor" || layer === "high-inclination") {
    return new THREE.Color(ORBIT_ATLAS_V12_BODY_ORBIT_PALETTE.asteroidGray);
  }
  return new THREE.Color(ORBIT_ATLAS_V12_BODY_ORBIT_PALETTE.neutral);
}

export function orbitAtlasV12OrbitColorForBody(
  id: string,
  baseColor: string,
  layer: OrbitAtlasOrbitLayerStyle,
): OrbitAtlasV12OrbitColor {
  const source = new THREE.Color(baseColor || ORBIT_ATLAS_V12_BODY_ORBIT_PALETTE.neutral);
  const anchor = v12PaletteAnchorForBody(id, layer);
  const layerMix = layer === "major" ? 0.44 : layer === "background-crossing" ? 0.62 : 0.54;
  const core = source.clone().lerp(anchor, layerMix);
  const coreHex = coolLimitedHex(core, layer === "major" ? 0.32 : 0.28, layer === "major" ? [0.32, 0.64] : [0.24, 0.52]);
  const halo = new THREE.Color(coreHex)
    .lerp(new THREE.Color(ORBIT_ATLAS_V12_ORBIT_STYLES[layer].coolTint), 0.64);
  const haloHex = coolLimitedHex(halo, 0.22, [0.2, 0.5]);
  return {
    core: coreHex,
    halo: haloHex,
  };
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

export function orbitAtlasBodyDisplayRadius(
  id: string,
  radiusScene: number,
  selected: boolean,
  showRings?: boolean,
): number {
  const profile = orbitAtlasBodyVisualProfile(id, showRings);
  const style = ORBIT_ATLAS_V11_BODY_STYLES[profile];
  const baseRadius =
    ORBIT_ATLAS_BODY_BASE_RADIUS[id] ??
    Math.max(0.3, Math.min(0.78, radiusScene * 2.6));
  return baseRadius * (selected ? style.selectedRadiusScale : style.overviewRadiusScale);
}

export const ORBIT_ATLAS_LABELS: Readonly<Record<string, string>> = {
  sun: "\u592a\u9633",
  mercury: "\u6c34\u661f",
  venus: "\u91d1\u661f",
  earth: "\u5730\u7403",
  mars: "\u706b\u661f",
  jupiter: "\u6728\u661f",
  saturn: "\u571f\u661f",
  uranus: "\u5929\u738b\u661f",
  neptune: "\u6d77\u738b\u661f",
  pluto: "\u51a5\u738b\u661f",
  ceres: "\u8c37\u795e\u661f",
  eris: "\u960b\u795e\u661f",
  sedna: "\u8d5b\u5fb7\u5a1c",
};

export const ORBIT_ATLAS_DEFAULT_LABEL_IDS = Object.freeze(
  Object.keys(ORBIT_ATLAS_LABELS),
);
