/**
 * Milky Way galactic structure parameters.
 * Based on Reid et al. (2019) and other radio parallax surveys.
 */

export type SpiralArmDef = {
  name: string;
  nameCn: string;
  /** Starting angle in radians (where arm leaves bar) */
  startAngleRad: number;
  /** Pitch angle in radians (how tightly wound) */
  pitchAngleRad: number;
  /** Radial extent from galactic center in parsecs */
  radiusMinPc: number;
  radiusMaxPc: number;
  /** Width scatter in parsecs */
  widthPc: number;
  /** Vertical thickness in parsecs */
  thicknessPc: number;
  /** Relative star density multiplier */
  starDensity: number;
  /** Color bias for rendering */
  colorBias: "blue" | "warm" | "mixed";
};

export type CentralBarDef = {
  halfLengthPc: number;
  widthPc: number;
  thicknessPc: number;
  /** Position angle from Sun-GC line in radians */
  positionAngleRad: number;
};

/** Sun's distance from galactic center in parsecs */
export const SUN_DISTANCE_PC = 8178;

export const SPIRAL_ARMS: SpiralArmDef[] = [
  {
    name: "Perseus Arm",
    nameCn: "英仙臂",
    startAngleRad: 1.2,
    pitchAngleRad: 0.21,   // ~12 deg
    radiusMinPc: 8000,
    radiusMaxPc: 14000,
    widthPc: 800,
    thicknessPc: 300,
    starDensity: 1.0,
    colorBias: "mixed",
  },
  {
    name: "Sagittarius Arm",
    nameCn: "人马臂",
    startAngleRad: 3.5,
    pitchAngleRad: 0.19,   // ~11 deg
    radiusMinPc: 4000,
    radiusMaxPc: 9000,
    widthPc: 900,
    thicknessPc: 350,
    starDensity: 1.3,
    colorBias: "warm",
  },
  {
    name: "Scutum-Centaurus Arm",
    nameCn: "盾牌-半人马臂",
    startAngleRad: 5.8,
    pitchAngleRad: 0.24,   // ~14 deg
    radiusMinPc: 3500,
    radiusMaxPc: 10000,
    widthPc: 1000,
    thicknessPc: 350,
    starDensity: 1.2,
    colorBias: "warm",
  },
  {
    name: "Norma Arm",
    nameCn: "矩尺臂",
    startAngleRad: 0.5,
    pitchAngleRad: 0.20,   // ~11.5 deg
    radiusMinPc: 2500,
    radiusMaxPc: 5500,
    widthPc: 700,
    thicknessPc: 300,
    starDensity: 0.8,
    colorBias: "mixed",
  },
  {
    name: "Local/Orion Spur",
    nameCn: "猎户臂（本地臂）",
    startAngleRad: 2.0,
    pitchAngleRad: 0.17,   // ~10 deg
    radiusMinPc: 7500,
    radiusMaxPc: 9000,
    widthPc: 500,
    thicknessPc: 200,
    starDensity: 0.5,
    colorBias: "blue",
  },
];

export const CENTRAL_BAR: CentralBarDef = {
  halfLengthPc: 3500,
  widthPc: 1500,
  thicknessPc: 1000,
  positionAngleRad: 0.45,  // ~25 deg from Sun-GC line
};

/** Named galactic features for labeling */
export type GalacticFeatureDef = {
  name: string;
  nameCn: string;
  kind: "arm" | "bar" | "core" | "gap" | "feature";
  /** Position in galactic (l, b) degrees */
  galLonDeg: number;
  galLatDeg: number;
  /** Approximate distance in parsecs (0 = place on far sphere) */
  distancePc: number;
  description?: string;
};

export const GALACTIC_FEATURES: GalacticFeatureDef[] = [
  { name: "Sagittarius A*", nameCn: "人马座A*", kind: "core", galLonDeg: 359.94, galLatDeg: -0.05, distancePc: 8178 },
  { name: "Perseus Arm", nameCn: "英仙臂", kind: "arm", galLonDeg: 160, galLatDeg: 0, distancePc: 0 },
  { name: "Sagittarius Arm", nameCn: "人马臂", kind: "arm", galLonDeg: 30, galLatDeg: 0, distancePc: 0 },
  { name: "Scutum-Centaurus Arm", nameCn: "盾牌-半人马臂", kind: "arm", galLonDeg: 320, galLatDeg: 0, distancePc: 0 },
  { name: "Norma Arm", nameCn: "矩尺臂", kind: "arm", galLonDeg: 340, galLatDeg: 0, distancePc: 0 },
  { name: "Local Spur", nameCn: "猎户臂", kind: "arm", galLonDeg: 80, galLatDeg: 0, distancePc: 0 },
  { name: "Central Bar", nameCn: "银河棒", kind: "bar", galLonDeg: 27, galLatDeg: 0, distancePc: 0 },
  { name: "Great Rift", nameCn: "大裂谷", kind: "feature", galLonDeg: 30, galLatDeg: 2, distancePc: 0, description: "Dark nebula lane through the Milky Way" },
  { name: "Coalsack", nameCn: "煤袋星云", kind: "feature", galLonDeg: 303, galLatDeg: -1, distancePc: 180 },
  { name: "Gum Nebula", nameCn: "古姆星云", kind: "feature", galLonDeg: 258, galLatDeg: -2, distancePc: 500 },
];
