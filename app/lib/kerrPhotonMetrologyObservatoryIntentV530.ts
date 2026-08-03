import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV529 } from "./kerrPhotonMetrologyObservatoryIntentV529";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V530 =
  "v530-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV530 =
  | KerrPhotonMetrologyDetailSurfaceV529
  | "allocation-regret";
export function resolveKerrPhotonMetrologyObservatoryIntentV530(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V530,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : (0 as 0 | 1),
    detailComponentCatalogSize: 32 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    regretEvaluationCount: 49000 as const,
    scientificGeometryInputCount: 148 as const,
    overheadAuditCount: 36750 as const,
    selectedRecommendationCount: 0 as const,
    measuredCalibrationFileCount: 0 as const,
    requiredMeasuredCalibrationFileCount: 6 as const,
    staticStatusNetworkRequestBudget: 0 as const,
    staticStatusScientificWriteback: false as const,
    canvasCreated: false as const,
    sceneRevisionDelta: 0 as const,
    physicsMutationAllowed: false as const,
    reason: authorized
      ? ("enabled" as const)
      : !campaignEvidenceActive
        ? ("inactive" as const)
        : deliveryProfile === "vercel-lite"
          ? ("lite-boundary" as const)
          : ("standalone-boundary" as const),
  });
}
