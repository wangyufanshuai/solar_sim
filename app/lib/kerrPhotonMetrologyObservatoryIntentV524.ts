import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV523 } from "./kerrPhotonMetrologyObservatoryIntentV523";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V524 =
  "v524-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV524 =
  | KerrPhotonMetrologyDetailSurfaceV523
  | "analyzer-identifiability";

export function resolveKerrPhotonMetrologyObservatoryIntentV524(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V524,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : (0 as 0 | 1),
    detailComponentCatalogSize: 26 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    analyzerMatrixCount: 3 as const,
    analyzerSvdCount: 3 as const,
    singularValueCount: 9 as const,
    calibrationNullspaceDimension: 2 as const,
    measuredCalibrationFileCount: 0 as const,
    expectedElectronCountRowCount: 0 as const,
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
