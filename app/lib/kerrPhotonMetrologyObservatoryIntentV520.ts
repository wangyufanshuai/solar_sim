import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV519 } from "./kerrPhotonMetrologyObservatoryIntentV519";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V520 =
  "v520-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV520 =
  | KerrPhotonMetrologyDetailSurfaceV519
  | "fixed-band-stokes";

export function resolveKerrPhotonMetrologyObservatoryIntentV520(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V520,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : (0 as 0 | 1),
    detailComponentCatalogSize: 22 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    stokesRayCount: 4 as const,
    stokesBandCount: 3 as const,
    stokesTransportMethodCount: 2 as const,
    stokesRowCount: 24 as const,
    measuredStokesRowCount: 0 as const,
    circularStokesRowCount: 0 as const,
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
