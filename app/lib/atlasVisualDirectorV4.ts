import type { AtlasSceneMode } from "./atlasRuntimeSceneFocusPerformance";
import type { AtlasRuntimeQualityTier } from "./simulationDiagnosticsTypes";
import { createAtlasVisualDirectorV3 } from "./atlasVisualDirectorV3";

export const ATLAS_VISUAL_DIRECTOR_V4_VERSION =
  "v162-scientific-visual-director-v4" as const;

export type AtlasVisualDirectorV4Profile = ReturnType<typeof createAtlasVisualDirectorV4>;

export function createAtlasVisualDirectorV4(
  sceneMode: AtlasSceneMode,
  qualityTier: AtlasRuntimeQualityTier,
) {
  const base = createAtlasVisualDirectorV3(sceneMode, qualityTier);
  const inspect = sceneMode === "inspect";
  const launch = sceneMode === "launch";
  return {
    ...base,
    version: ATLAS_VISUAL_DIRECTOR_V4_VERSION,
    exposure: base.exposure * (inspect ? 0.94 : launch ? 0.9 : 1),
    bloomThreshold: Math.max(1.04, base.bloomThreshold),
    darkSideReadability: inspect ? 0.18 : launch ? 0.12 : 0.08,
    terminatorSoftness: inspect ? 0.26 : 0.2,
    textureResidencyLimitBytes: inspect ? 1.25 * 1024 ** 3 : 768 * 1024 ** 2,
    totalGpuResidencyLimitBytes: 2.2 * 1024 ** 3,
    maxDevicePixelRatio: qualityTier === "mobile-safe" ? 1 : Math.min(1.5, base.maxDevicePixelRatio),
    boundary: "presentation-only-webgl2-v9-sky-and-science-kernels-unchanged" as const,
  };
}
