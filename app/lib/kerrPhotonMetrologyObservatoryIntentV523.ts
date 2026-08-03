import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV522 } from "./kerrPhotonMetrologyObservatoryIntentV522";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V523 =
  "v523-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV523 =
  | KerrPhotonMetrologyDetailSurfaceV522
  | "ideal-analyzer-sensitivity";

export function resolveKerrPhotonMetrologyObservatoryIntentV523(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V523,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : (0 as 0 | 1),
    detailComponentCatalogSize: 25 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    analyzerStateCount: 4 as const,
    modulationRowCount: 864 as const,
    reconstructionCount: 216 as const,
    channelEnvelopeCount: 96 as const,
    expectedElectronCountRowCount: 0 as const,
    measuredCalibrationFileCount: 0 as const,
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
