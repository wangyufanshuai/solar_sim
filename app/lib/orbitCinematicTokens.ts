import * as THREE from "three";
import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";

/**
 * Global orbit trail opacity before LOD / selection / body-size boost.
 */
export const ORBIT_CINEMATIC_BASE_OPACITY = 0.12;

/** Spline resampling bounds for closed orbit polylines. */
export const ORBIT_SPLINE_MAX_SAMPLES = 500;
export const ORBIT_SPLINE_MIN_SAMPLES = 80;

export const ORBIT_VELOCITY_MIN_KM_S = 0.5;
export const ORBIT_VELOCITY_MAX_KM_S = 60;

export function normalizeOrbitVelocityKmS(speedKmS: number): number {
  if (!Number.isFinite(speedKmS) || speedKmS <= ORBIT_VELOCITY_MIN_KM_S) return 0;
  const minLog = Math.log1p(ORBIT_VELOCITY_MIN_KM_S);
  const maxLog = Math.log1p(ORBIT_VELOCITY_MAX_KM_S);
  return THREE.MathUtils.clamp((Math.log1p(speedKmS) - minLog) / (maxLog - minLog), 0, 1);
}

export function orbitVelocityColor(normalizedSpeed: number): THREE.Color {
  const t = THREE.MathUtils.clamp(normalizedSpeed, 0, 1);
  const cold = new THREE.Color("#65c7d4");
  const mid = new THREE.Color("#d9b45f");
  const hot = new THREE.Color("#ef765f");
  return t < 0.5 ? cold.lerp(mid, t * 2) : mid.lerp(hot, (t - 0.5) * 2);
}

/**
 * Body-ID → orbit trail color.
 * Muted but visible tones with AdditiveBlending.
 */
const BODY_ORBIT_COLORS: Record<string, string> = {
  // Major planets
  sun: "#c8b89b",
  mercury: "#7e8792",
  venus: "#b3a78a",
  earth: "#7f9ac5",
  moon: "#7c7b80",
  mars: "#c58a64",
  jupiter: "#bda96f",
  saturn: "#c7ae78",
  uranus: "#96bac2",
  neptune: "#83a0ce",
  pluto: "#8e8274",

  // Mars moons
  phobos: "#887868",
  deimos: "#887868",

  // Asteroid belt
  ceres: "#8f877b",
  vesta: "#938a80",
  pallas: "#8d857a",
  hygiea: "#84807a",
  juno: "#928880",
  hebe: "#90877f",
  iris: "#938981",
  flora: "#8f867d",
  lutetia: "#857f79",
  daphne: "#918881",
  kleopatra: "#9d8f63",
  eros: "#938a80",
  ida: "#8e857c",
  mathilde: "#817c78",
  itokawa: "#86807a",
  steins: "#86807a",

  // KBOs / TNOs
  haumea: "#708898",
  makemake: "#887068",
  eris: "#887898",
  sedna: "#987868",
  quaoar: "#708098",
  orcus: "#788098",
  gonggong: "#887080",
  salacia: "#708098",

  // Centaurs
  chiron: "#a08060",
  pholus: "#a88860",
  nessus: "#a08060",

  // Comets
  halley: "#a89060",
  hale_bopp: "#b09868",
  encke: "#a89060",

  // Fallback categories
  _innerBelt: "#8e857d",
  _outerBelt: "#847f7a",
  _kbo: "#74808f",
  _centaur: "#907762",
  _comet: "#a18a64",
};

/**
 * Parse hex string to THREE.Color.
 */
function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

/** Cache for parsed colors to avoid repeated allocation. */
const _colorCache = new Map<string, THREE.Color>();

/**
 * Get orbit trail color for a body by its ID string.
 * Falls back to a deterministic hash-based color for unknown IDs.
 */
export function orbitColorForBodyId(id: string): THREE.Color {
  const cached = _colorCache.get(id);
  if (cached) return cached.clone();

  const hex = BODY_ORBIT_COLORS[id];
  if (hex) {
    const c = hexToColor(hex);
    _colorCache.set(id, c);
    return c.clone();
  }

  // Deterministic fallback: FNV-1a hash → hue-based color (dark, desaturated)
  let h = 2166136261;
  for (let j = 0; j < id.length; j++) {
    h ^= id.charCodeAt(j);
    h = Math.imul(h, 16777619);
  }
  const hue = (Math.abs(h) % 360) / 360;
  const c = new THREE.Color().setHSL(hue, 0.28, 0.45);
  _colorCache.set(id, c);
  return c.clone();
}

/** Deterministic orbit color for reference Kepler orbit id strings. */
export function orbitHairlineColorForReferenceId(id: string): THREE.Color {
  return orbitColorForBodyId(id);
}

/**
 * Backward-compatible: maps body index to body ID, then looks up color.
 */
export function orbitHairlineColorForBodyIndex(bodyIndex: number): THREE.Color {
  const def = SOLAR_SYSTEM_BODIES[bodyIndex];
  if (def) return orbitColorForBodyId(def.id);
  return orbitColorForBodyId(`body-${bodyIndex}`);
}

/**
 * Alias for PredictedOrbitPath backward compatibility.
 */
export function orbitTrailRgbForBodyIndex(bodyIndex: number): THREE.Color {
  return orbitHairlineColorForBodyIndex(bodyIndex);
}

/**
 * Larger scene disc radius ⇒ slightly stronger line (Sun/Jupiter vs small moons).
 * Clamped range narrowed: don't over-brighten large bodies.
 */
export function orbitOpacityMulFromLodWorldRadius(lodWorldRadius: number): number {
  const r = Math.max(lodWorldRadius, 1e-6);
  const earth = 0.095;
  const ratio = r / earth;
  const raw = Math.pow(ratio, 0.28);
  return THREE.MathUtils.clamp(raw, 0.85, 1.4);
}
