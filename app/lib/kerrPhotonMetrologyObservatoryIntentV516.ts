import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV515 } from "./kerrPhotonMetrologyObservatoryIntentV515";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V516 =
  "v516-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV516 =
  | KerrPhotonMetrologyDetailSurfaceV515
  | "uncertainty-witness";

export function resolveKerrPhotonMetrologyObservatoryIntentV516(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V516,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : (0 as 0 | 1),
    detailComponentCatalogSize: 18 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    witnessTransitionCount: 512 as const,
    witnessCheckpointCount: 8 as const,
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
