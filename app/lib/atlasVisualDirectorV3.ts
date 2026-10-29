import type { AtlasSceneMode } from "./atlasRuntimeSceneFocusPerformance";
import type { AtlasRuntimeQualityTier } from "./simulationDiagnosticsTypes";

export const ATLAS_VISUAL_DIRECTOR_V3_VERSION = "v133-visual-director-v3" as const;

export type AtlasVisualDirectorV3Profile = {
  sceneMode: AtlasSceneMode;
  exposure: number;
  bloomThreshold: number;
  bloomIntensity: number;
  backgroundWeight: number;
  subjectCoverage: readonly [number, number];
  orbitDensity: "selected-only" | "major-and-selected" | "system-reference";
  textureTier: "mobile" | "standard" | "hd";
  maxDevicePixelRatio: number;
  cameraTransitionMs: number;
};

const PROFILES: Record<AtlasSceneMode, Omit<AtlasVisualDirectorV3Profile, "sceneMode" | "textureTier" | "maxDevicePixelRatio" | "cameraTransitionMs">> = {
  atlas: { exposure: 0.96, bloomThreshold: 1.02, bloomIntensity: 0.28, backgroundWeight: 0.78, subjectCoverage: [0.2, 0.42], orbitDensity: "major-and-selected" },
  inspect: { exposure: 0.9, bloomThreshold: 1.08, bloomIntensity: 0.22, backgroundWeight: 0.28, subjectCoverage: [0.35, 0.55], orbitDensity: "selected-only" },
  launch: { exposure: 0.72, bloomThreshold: 1.16, bloomIntensity: 0.34, backgroundWeight: 0.44, subjectCoverage: [0.3, 0.5], orbitDensity: "selected-only" },
  kerr: { exposure: 0.8, bloomThreshold: 1.04, bloomIntensity: 0.38, backgroundWeight: 0.36, subjectCoverage: [0.32, 0.54], orbitDensity: "selected-only" },
  "exoplanet-system": { exposure: 0.88, bloomThreshold: 1.06, bloomIntensity: 0.26, backgroundWeight: 0.4, subjectCoverage: [0.3, 0.56], orbitDensity: "system-reference" },
};

export function createAtlasVisualDirectorV3(
  sceneMode: AtlasSceneMode,
  qualityTier: AtlasRuntimeQualityTier,
): AtlasVisualDirectorV3Profile {
  const mobile = qualityTier === "mobile-safe";
  return {
    sceneMode,
    ...PROFILES[sceneMode],
    textureTier: mobile ? "mobile" : qualityTier === "closeup-inspect" ? "hd" : "standard",
    maxDevicePixelRatio: mobile ? 1 : qualityTier === "launch-cinematic" ? 1.25 : 1.5,
    cameraTransitionMs: mobile ? 1_100 : sceneMode === "atlas" ? 800 : 900,
  };
}

