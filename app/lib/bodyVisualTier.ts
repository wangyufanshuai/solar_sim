import {
  MAJOR_PLANET_IDS,
  type SolarSystemBodyDef,
} from "../data/planetsJ2000";

/**
 * Visual prominence for orbit brightness and name labels (not science priority).
 */
export type BodyVisualBand =
  | "sun"
  | "major_planet"
  | "notable"
  | "regular"
  | "minor";

/** Moons / dwarfs that stay readable at medium weight. */
const NOTABLE_IDS = new Set([
  "moon",
  "pluto",
  "ceres",
  "eris",
  "makemake",
  "haumea",
  "gonggong",
  "io",
  "europa",
  "ganymede",
  "callisto",
  "titan",
  "triton",
  "charon",
  "enceladus",
  "rhea",
  "dione",
  "tethys",
  "mimas",
  "iapetus",
  "hyperion",
]);

/**
 * Heliocentric bodies (dwarf planets, major asteroids, significant TNOs)
 * that always show orbit trails alongside the 8 major planets.
 * Moons are excluded — their trail visibility is governed by parent-body selection.
 * Small asteroids and distant TNOs remain "selected only".
 */
export const TRAIL_ALWAYS_VISIBLE_IDS: ReadonlySet<string> = new Set([
  // Dwarf planets
  "pluto", "ceres", "eris", "makemake", "haumea", "gonggong",
  // Major asteroids
  "vesta", "pallas", "hygiea",
  // Significant TNOs
  "quaoar", "sedna", "orcus", "salacia", "varuna", "ixion",
]);

export function bodyVisualBandForDef(def: SolarSystemBodyDef): BodyVisualBand {
  if (def.variant === "sun") return "sun";
  if (MAJOR_PLANET_IDS.has(def.id)) return "major_planet";
  if (NOTABLE_IDS.has(def.id)) return "notable";
  if (def.radiusScene >= 0.017) return "regular";
  return "minor";
}

/** Multiplies hairline RGB (HDR-friendly). */
export function orbitVisualRgbMulForBand(band: BodyVisualBand): number {
  switch (band) {
    case "sun":
      return 1.08;
    case "major_planet":
      return 2.95;
    case "notable":
      return 1.98;
    case "regular":
      return 1.18;
    case "minor":
      return 0.7;
    default:
      return 1;
  }
}

/** Multiplies final trail / osculating opacity (after LOD). */
export function orbitVisualOpacityMulForBand(band: BodyVisualBand): number {
  switch (band) {
    case "sun":
      return 1.05;
    case "major_planet":
      return 1.18;
    case "notable":
      return 1.02;
    case "regular":
      return 0.8;
    case "minor":
      return 0.58;
    default:
      return 1;
  }
}

/** Fixed screen-space label typography (BodyLabel uses literal `12px` + CSS scale). */
export const LABEL_SCREEN_FONT_PX = 12;

/** Per-band label rendering parameters. */
export type LabelTierParams = {
  /** Font size passed to BodyLabel (larger = bigger text on screen). */
  fontSizePx: number;
  /** distanceFactor passed to BodyLabel (scales fixed-screen sizing). */
  distanceFactor: number;
  /** Camera distance (scene units) inside which label starts fading. */
  fadeNear: number;
  /** Camera distance (scene units) beyond which label is invisible. */
  fadeFar: number;
};

const LABEL_TIERS: Record<BodyVisualBand, LabelTierParams> = {
  sun: {
    fontSizePx: 320_000,
    distanceFactor: 155_000,
    fadeNear: 2200,
    fadeFar: 120_000,
  },
  major_planet: {
    fontSizePx: 260_000,
    distanceFactor: 124_000,
    fadeNear: 1800,
    fadeFar: 100_000,
  },
  notable: {
    fontSizePx: 180_000,
    distanceFactor: 96_000,
    fadeNear: 1200,
    fadeFar: 65_000,
  },
  regular: {
    fontSizePx: 120_000,
    distanceFactor: 78_000,
    fadeNear: 800,
    fadeFar: 40_000,
  },
  minor: {
    fontSizePx: 80_000,
    distanceFactor: 62_000,
    fadeNear: 500,
    fadeFar: 22_000,
  },
};

/** Get label rendering parameters for a body by its visual band. */
export function labelParamsForBand(band: BodyVisualBand): LabelTierParams {
  return LABEL_TIERS[band];
}
