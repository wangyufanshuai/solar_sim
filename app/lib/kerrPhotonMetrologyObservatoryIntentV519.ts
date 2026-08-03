import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV518 } from "./kerrPhotonMetrologyObservatoryIntentV518";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V519 =
  "v519-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV519 =
  | KerrPhotonMetrologyDetailSurfaceV518
  | "radiometry-oracle";

export function resolveKerrPhotonMetrologyObservatoryIntentV519(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V519,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : (0 as 0 | 1),
    detailComponentCatalogSize: 21 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    radiometryRayCount: 4 as const,
    radiometryBandCount: 3 as const,
    radiometryRowCount: 12 as const,
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
