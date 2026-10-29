import type { AtlasMaterialProfileSummary } from "./simulationDiagnosticsTypes";

export const ATLAS_MATERIAL_PROFILE_VERSION =
  "v72-material-profile-contract" as const;

export const ATLAS_CLOSEUP_MATERIAL_BUDGET_PROFILE =
  "v72-earth-saturn-sun-closeup-material-budget" as const;

export const ATLAS_MATERIAL_PROFILE_BOUNDARY =
  "Local v72 shader/material presentation profile contract only. Earth, Saturn, Sun and gas-giant close-up budgets preserve the existing v69 legacy sky direction, v70 material pass and v71 background guard. No sky asset generation, sky download, online asset completeness, AAA certification, WCAG certification, scientific certification, EIH 1PN mutation, worker physics mutation or Kerr kernel mutation is claimed.";

export const V72_MATERIAL_PROFILE_IDS = {
  earth: "earth-v72-cloud-night-terminator",
  saturn: "saturn-v72-ring-shadow-cassini",
  sun: "sun-v72-granulation-limb-bloom-restraint",
  gasGiant: "gas-giant-v72-band-microcontrast",
} as const;

export const V72_CLOSEUP_MATERIAL_BUDGETS = {
  earth: {
    normalScale: [2.22, 2.22] as const,
    depthLightingOpacity: 0.098,
    colorGradeOpacity: 0.105,
    nightCoolFloor: [0.105, 0.15, 0.205] as const,
    nightCoolFloorMix: 0.36,
  },
  saturn: {
    normalScale: [1.28, 0.78] as const,
    keyFillOpacity: 0.062,
    depthLightingOpacity: 0.22,
    colorGradeOpacity: 0.132,
    ringShadowContribution: 1.65,
    occlusionMixMax: 0.92,
  },
  sun: {
    materialDepth: 1.75,
    exposure: 0.74,
    mobileExposure: 0.3,
    glowOpacity: 0.042,
    mobileGlowOpacity: 0.028,
    granuleFrequencyMax: 70,
    cellFrequencyMax: 160,
  },
  gasGiant: {
    normalScale: [1.1, 0.72] as const,
    keyFillOpacity: 0.074,
    colorGradeOpacity: 0.205,
  },
  saturnRing: {
    showcaseOpacityMultiplier: 2.02,
    artOpacityMultiplier: 1.74,
    mainRingOpacity: 0.58,
    cassiniGapOpacity: 0.34,
    outerRingOpacity: 0.16,
    shaderArtAlphaBoost: 1.24,
  },
} as const;

export function createAtlasMaterialProfileSummary(): AtlasMaterialProfileSummary {
  return {
    version: ATLAS_MATERIAL_PROFILE_VERSION,
    status: "informational",
    closeupMaterialBudgetProfile: ATLAS_CLOSEUP_MATERIAL_BUDGET_PROFILE,
    backgroundOrbitArtVersion: "v69-legacy-8k-sky-restore",
    backgroundGuardVersion: "v71-background-regression-guard",
    visualStabilityVersion: "v70-visual-stability-material-pass",
    earthProfileId: V72_MATERIAL_PROFILE_IDS.earth,
    saturnProfileId: V72_MATERIAL_PROFILE_IDS.saturn,
    sunProfileId: V72_MATERIAL_PROFILE_IDS.sun,
    gasGiantProfileId: V72_MATERIAL_PROFILE_IDS.gasGiant,
    assetPolicy: "existing-local-textures-and-shader-profiles-only",
    earthBudgetCue: "cloud-night-terminator-thin-atmosphere",
    saturnBudgetCue: "cassini-ring-shadow-occlusion",
    sunBudgetCue: "granulation-limb-darkening-bloom-restraint",
    gasGiantBudgetCue: "banded-microcontrast-baseline",
    physicsMutation: "not-applied",
    skyAssetMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    onlineAssetCompletenessStatus: "not-claimed",
    kerrKernelMutation: "not-applied",
    trustedBoundary: ATLAS_MATERIAL_PROFILE_BOUNDARY,
  };
}
