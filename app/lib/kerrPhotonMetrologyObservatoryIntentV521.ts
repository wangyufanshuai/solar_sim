import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV520 } from "./kerrPhotonMetrologyObservatoryIntentV520";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V521 =
  "v521-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV521 =
  | KerrPhotonMetrologyDetailSurfaceV520
  | "direct-stokes-oracle";

export function resolveKerrPhotonMetrologyObservatoryIntentV521(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V521,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : (0 as 0 | 1),
    detailComponentCatalogSize: 23 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    directStokesRowCount: 24 as const,
    directAdaptiveIntegralCount: 144 as const,
    componentwiseEnvelopeCount: 24 as const,
    measuredStokesRowCount: 0 as const,
    scalarUncertaintyTotalCount: 0 as const,
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
