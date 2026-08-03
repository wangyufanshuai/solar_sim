import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV524 } from "./kerrPhotonMetrologyObservatoryIntentV524";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V525 =
  "v525-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV525 =
  | KerrPhotonMetrologyDetailSurfaceV524
  | "calibration-excitation-design";

export function resolveKerrPhotonMetrologyObservatoryIntentV525(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V525,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : (0 as 0 | 1),
    detailComponentCatalogSize: 27 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    candidateConstraintCount: 8 as const,
    candidatePairCount: 28 as const,
    fullRankPairCount: 9 as const,
    selectedConstraintCount: 2 as const,
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
