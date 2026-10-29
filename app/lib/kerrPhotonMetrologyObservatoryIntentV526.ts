import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV525 } from "./kerrPhotonMetrologyObservatoryIntentV525";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V526 = "v526-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV526 = KerrPhotonMetrologyDetailSurfaceV525 | "calibration-uncertainty-transfer";
export function resolveKerrPhotonMetrologyObservatoryIntentV526(deliveryProfile: AtlasDeliveryProfile, campaignEvidenceActive: boolean) {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V526,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : (0 as 0 | 1),
    detailComponentCatalogSize: 28 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    inputChannelCount: 6 as const,
    observableParameterCount: 2 as const,
    correlationStressSampleCount: 5 as const,
    unitBoxVertexCount: 64 as const,
    measuredCalibrationFileCount: 0 as const,
    requiredMeasuredCalibrationFileCount: 6 as const,
    staticStatusNetworkRequestBudget: 0 as const,
    staticStatusScientificWriteback: false as const,
    canvasCreated: false as const,
    sceneRevisionDelta: 0 as const,
    physicsMutationAllowed: false as const,
    reason: authorized ? ("enabled" as const) : !campaignEvidenceActive ? ("inactive" as const) : deliveryProfile === "vercel-lite" ? ("lite-boundary" as const) : ("standalone-boundary" as const),
  });
}
