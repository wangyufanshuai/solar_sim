import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV521 } from "./kerrPhotonMetrologyObservatoryIntentV521";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V522 =
  "v522-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV522 =
  | KerrPhotonMetrologyDetailSurfaceV521
  | "frequency-sensitivity";

export function resolveKerrPhotonMetrologyObservatoryIntentV522(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V522,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : (0 as 0 | 1),
    detailComponentCatalogSize: 24 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    sensitivityScenarioCount: 9 as const,
    sensitivityScenarioRowCount: 216 as const,
    directAdaptiveIntegralCount: 888 as const,
    envelopeRowCount: 24 as const,
    physicalPriorCount: 0 as const,
    measuredStokesRowCount: 0 as const,
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
