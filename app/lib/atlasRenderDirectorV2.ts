import type { AtlasSceneMode } from "./atlasRuntimeSceneFocusPerformance";
import type { AtlasRuntimeQualityTier } from "./simulationDiagnosticsTypes";

export const ATLAS_RENDER_DIRECTOR_V2_VERSION = "v120-rendering-foundation-exposure-control" as const;
export const ATLAS_RENDER_DIRECTOR_V2_PROFILE = "v120-aces-scene-exposure-density-window" as const;

export type AtlasRenderPerformanceWindow = {
  windowMs: 10_000;
  frameTimeP50Ms: number;
  frameTimeP95Ms: number;
  longestTaskMs: number;
  drawCalls: number;
  triangles: number;
  textureMemoryEstimateMb: number;
  sampleCount: number;
};

export type AtlasRenderDirectorV2 = {
  sceneMode: AtlasSceneMode;
  exposure: number;
  bloomThreshold: number;
  backgroundLuminance: number;
  subjectCoverage: readonly [number, number];
  orbitDensity: "selected-only" | "major-and-selected" | "full-reference";
  hudHz: number;
};

const SCENE_PROFILE: Record<AtlasSceneMode, Omit<AtlasRenderDirectorV2, "sceneMode" | "hudHz">> = {
  atlas: { exposure: 0.92, bloomThreshold: 0.96, backgroundLuminance: 1, subjectCoverage: [0.18, 0.42], orbitDensity: "major-and-selected" },
  inspect: { exposure: 0.78, bloomThreshold: 0.985, backgroundLuminance: 0.42, subjectCoverage: [0.35, 0.55], orbitDensity: "selected-only" },
  launch: { exposure: 0.7, bloomThreshold: 0.99, backgroundLuminance: 0.62, subjectCoverage: [0.28, 0.5], orbitDensity: "selected-only" },
  kerr: { exposure: 0.82, bloomThreshold: 0.975, backgroundLuminance: 0.5, subjectCoverage: [0.3, 0.52], orbitDensity: "selected-only" },
  "exoplanet-system": { exposure: 0.84, bloomThreshold: 0.98, backgroundLuminance: 0.52, subjectCoverage: [0.3, 0.56], orbitDensity: "full-reference" },
};

export function createAtlasRenderDirectorV2(sceneMode: AtlasSceneMode, quality: AtlasRuntimeQualityTier): AtlasRenderDirectorV2 {
  return { sceneMode, ...SCENE_PROFILE[sceneMode], hudHz: quality === "mobile-safe" ? 4 : quality === "balanced" ? 5 : 10 };
}

export const ATLAS_RENDER_DIRECTOR_V2_BOUNDARY = "v120 controls presentation exposure, bloom thresholds, orbit density and rolling runtime observation only; scientific gates, fixtures, realtime/worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky and v75/v97/v99 budgets remain unchanged.";
