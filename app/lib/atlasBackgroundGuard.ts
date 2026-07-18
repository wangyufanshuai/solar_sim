import type { AtlasBackgroundGuardSummary } from "./simulationDiagnosticsTypes";

export const ATLAS_BACKGROUND_GUARD_VERSION =
  "v71-background-regression-guard" as const;

export const ATLAS_SKY_REGRESSION_BUDGET_PROFILE =
  "v71-v69-legacy-blue-dust-budget" as const;

export const ATLAS_BACKGROUND_GUARD_BOUNDARY =
  "Local v71 background regression guard and screenshot pixel-budget metadata only. The existing orbit-atlas-v9 local sky manifest remains locked to the v69 legacy blue-gray Milky Way, dust-lane and bright-star direction. No sky asset generation, sky download, online asset completeness, AAA certification, WCAG certification, scientific certification, EIH 1PN mutation, worker physics mutation or Kerr kernel mutation is claimed.";

export function createAtlasBackgroundGuardSummary(): AtlasBackgroundGuardSummary {
  return {
    version: ATLAS_BACKGROUND_GUARD_VERSION,
    status: "informational",
    skyRegressionBudgetProfile: ATLAS_SKY_REGRESSION_BUDGET_PROFILE,
    backgroundOrbitArtVersion: "v69-legacy-8k-sky-restore",
    backgroundArtProfile: "v69-legacy-blue-dust-starfield",
    visualStabilityVersion: "v70-visual-stability-material-pass",
    lockedSkyManifest: "orbit-atlas-v9",
    protectedSkyDirection: "legacy-blue-gray-milky-way-dust-lanes-bright-stars",
    regressionGuardTarget: "overview-and-selected-body-background-budget",
    physicsMutation: "not-applied",
    skyAssetMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    artisticCertificationStatus: "not-claimed",
    scientificCertificationStatus: "not-claimed",
    wcagCertificationStatus: "not-claimed",
    onlineAssetCompletenessStatus: "not-claimed",
    kerrKernelMutation: "not-applied",
    trustedBoundary: ATLAS_BACKGROUND_GUARD_BOUNDARY,
  };
}
