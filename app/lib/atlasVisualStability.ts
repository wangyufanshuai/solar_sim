import type { AtlasVisualStabilitySummary } from "./simulationDiagnosticsTypes";

export const ATLAS_VISUAL_STABILITY_VERSION =
  "v70-visual-stability-material-pass" as const;

export const ATLAS_SKY_ART_LOCK_PROFILE =
  "v69-legacy-blue-dust-starfield-locked" as const;

export const ATLAS_MATERIAL_STABILITY_PROFILE =
  "v70-earth-saturn-sun-material-coherence" as const;

export const ATLAS_VISUAL_STABILITY_BOUNDARY =
  "Local v70 visual stability and material presentation metadata only. The v69 legacy blue-gray Milky Way, dust lane and bright-star sky direction is locked to the existing orbit-atlas-v9 local manifest; Earth, Saturn and Sun material polish is a shader/presentation pass only. No sky asset generation, online asset completeness, AAA certification, scientific certification, EIH 1PN mutation, worker physics mutation or Kerr kernel mutation is claimed.";

export function createAtlasVisualStabilitySummary(): AtlasVisualStabilitySummary {
  return {
    version: ATLAS_VISUAL_STABILITY_VERSION,
    status: "informational",
    skyArtLockProfile: ATLAS_SKY_ART_LOCK_PROFILE,
    materialStabilityProfile: ATLAS_MATERIAL_STABILITY_PROFILE,
    backgroundOrbitArtVersion: "v69-legacy-8k-sky-restore",
    backgroundArtProfile: "v69-legacy-blue-dust-starfield",
    lockedSkyManifest: "orbit-atlas-v9",
    selectedBodyMaterialTarget: "earth-saturn-sun-closeup-coherence",
    physicsMutation: "not-applied",
    skyAssetMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    onlineAssetCompletenessStatus: "not-claimed",
    kerrKernelMutation: "not-applied",
    trustedBoundary: ATLAS_VISUAL_STABILITY_BOUNDARY,
  };
}
