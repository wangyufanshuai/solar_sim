import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV528 } from "./kerrPhotonMetrologyObservatoryIntentV528";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V529 =
  "v529-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV529 =
  | KerrPhotonMetrologyDetailSurfaceV528
  | "cost-law-robustness";
export function resolveKerrPhotonMetrologyObservatoryIntentV529(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V529,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : (0 as 0 | 1),
    detailComponentCatalogSize: 31 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    fullFactorialCellCount: 1000 as const,
    scientificGeometryInputCount: 68 as const,
    optimizerIterationCount: 512000 as const,
    selectedModelCount: 0 as const,
    selectedAllocationCount: 0 as const,
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
