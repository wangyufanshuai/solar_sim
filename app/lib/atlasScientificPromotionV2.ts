import { RELATIVITY_V2_EPHEMERIS_GATES } from "./relativityForceModelV2";

export const ATLAS_CATALOG_ARCHITECTURE_VERSION =
  "v125-catalog-architecture-universal-search" as const;
export const ATLAS_STELLAR_ART_V3_VERSION =
  "v126-stellar-art-v3-ktx2-planet-pipeline" as const;
export const ATLAS_EXOPLANET_COMPLETE_VERSION =
  "v127-exoplanet-atlas-complete-ux" as const;
export const ATLAS_RELATIVITY_FORCE_MODEL_V2_VERSION =
  "v128-relativity-force-model-v2-shadow" as const;
export const ATLAS_KERR_3D_RENDERER_VERSION =
  "v129-kerr-3d-geodesics-black-hole-renderer" as const;
export const ATLAS_SCIENTIFIC_PROMOTION_V2_VERSION =
  "v130-scientific-promotion-release-gate" as const;

export type AtlasScientificPromotionV2Input = {
  catalogDocumentCount?: number;
  exoplanetSystemCount?: number;
  ktx2AssetCount?: number;
  tenYearPositionRmsKm?: number;
  tenYearVelocityRmsMS?: number;
  kerrInvariantGatePassed?: boolean;
  performanceGatePassed?: boolean;
  regressionGatePassed?: boolean;
};

export type AtlasScientificPromotionV2Summary = {
  version: typeof ATLAS_SCIENTIFIC_PROMOTION_V2_VERSION;
  catalogVersion: typeof ATLAS_CATALOG_ARCHITECTURE_VERSION;
  stellarArtVersion: typeof ATLAS_STELLAR_ART_V3_VERSION;
  exoplanetVersion: typeof ATLAS_EXOPLANET_COMPLETE_VERSION;
  relativityVersion: typeof ATLAS_RELATIVITY_FORCE_MODEL_V2_VERSION;
  kerrVersion: typeof ATLAS_KERR_3D_RENDERER_VERSION;
  defaultRelativityKernel: "legacy-eih-1pn" | "relativity-force-model-v2";
  shadowKernel: "relativity-force-model-v2";
  promotionDecision: "promoted" | "blocked-shadow-retained";
  promotionReady: boolean;
  blockers: string[];
  runtimeBoundary: "offline-catalog-shadow-science-no-browser-exe";
};

export function createAtlasScientificPromotionV2Summary(
  input: AtlasScientificPromotionV2Input = {},
): AtlasScientificPromotionV2Summary {
  const blockers: string[] = [];
  if ((input.catalogDocumentCount ?? 0) < 200_000) {
    blockers.push("catalog-document-count-below-200000");
  }
  if ((input.exoplanetSystemCount ?? 0) < 4_735) {
    blockers.push("exoplanet-system-count-below-4735");
  }
  if ((input.ktx2AssetCount ?? 0) < 1) {
    blockers.push("ktx2-assets-not-verified");
  }
  if (
    input.tenYearPositionRmsKm == null ||
    input.tenYearPositionRmsKm >=
      RELATIVITY_V2_EPHEMERIS_GATES.promotion.positionRmsKmExclusive
  ) {
    blockers.push("ten-year-position-rms-promotion-gate-not-passed");
  }
  if (
    input.tenYearVelocityRmsMS == null ||
    input.tenYearVelocityRmsMS >=
      RELATIVITY_V2_EPHEMERIS_GATES.promotion.velocityRmsMSExclusive
  ) {
    blockers.push("ten-year-velocity-rms-promotion-gate-not-passed");
  }
  if (input.kerrInvariantGatePassed !== true) {
    blockers.push("kerr-invariant-gate-not-passed");
  }
  if (input.performanceGatePassed !== true) {
    blockers.push("performance-gate-not-passed");
  }
  if (input.regressionGatePassed !== true) {
    blockers.push("regression-gate-not-passed");
  }
  const promotionReady = blockers.length === 0;
  return {
    version: ATLAS_SCIENTIFIC_PROMOTION_V2_VERSION,
    catalogVersion: ATLAS_CATALOG_ARCHITECTURE_VERSION,
    stellarArtVersion: ATLAS_STELLAR_ART_V3_VERSION,
    exoplanetVersion: ATLAS_EXOPLANET_COMPLETE_VERSION,
    relativityVersion: ATLAS_RELATIVITY_FORCE_MODEL_V2_VERSION,
    kerrVersion: ATLAS_KERR_3D_RENDERER_VERSION,
    defaultRelativityKernel: promotionReady
      ? "relativity-force-model-v2"
      : "legacy-eih-1pn",
    shadowKernel: "relativity-force-model-v2",
    promotionDecision: promotionReady ? "promoted" : "blocked-shadow-retained",
    promotionReady,
    blockers,
    runtimeBoundary: "offline-catalog-shadow-science-no-browser-exe",
  };
}
