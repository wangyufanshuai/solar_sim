import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV511 } from "./kerrPhotonMetrologyObservatoryIntentV511";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V512 =
  "v512-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV512 =
  | KerrPhotonMetrologyDetailSurfaceV511
  | "science-product-eligibility";

export type KerrPhotonMetrologyObservatoryIntentDecisionV512 = Readonly<{
  version: typeof KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V512;
  deliveryProfile: AtlasDeliveryProfile;
  campaignEvidenceActive: boolean;
  observatoryImportAuthorized: boolean;
  automaticComponentImportBudget: 0 | 1;
  detailComponentCatalogSize: 14;
  concurrentDetailSurfaceBudget: 0 | 1;
  detailDataRequestAuthorizedByWrapper: false;
  detailDataRequiresSecondExplicitIntent: true;
  staticAuthorityStageCount: 9;
  portableProvenanceStageCount: 1;
  instrumentAuthorityStageCount: 6;
  scienceProductNodeCount: 10;
  staticStatusNetworkRequestBudget: 0;
  staticStatusScientificWriteback: false;
  publicPanelIdAdded: false;
  canvasCreated: false;
  sceneRevisionDelta: 0;
  physicsMutationAllowed: false;
  reason: "enabled" | "inactive" | "standalone-boundary" | "lite-boundary";
}>;

export function resolveKerrPhotonMetrologyObservatoryIntentV512(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
): KerrPhotonMetrologyObservatoryIntentDecisionV512 {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V512,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : 0,
    detailComponentCatalogSize: 14,
    concurrentDetailSurfaceBudget: authorized ? 1 : 0,
    detailDataRequestAuthorizedByWrapper: false,
    detailDataRequiresSecondExplicitIntent: true,
    staticAuthorityStageCount: 9,
    portableProvenanceStageCount: 1,
    instrumentAuthorityStageCount: 6,
    scienceProductNodeCount: 10,
    staticStatusNetworkRequestBudget: 0,
    staticStatusScientificWriteback: false,
    publicPanelIdAdded: false,
    canvasCreated: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
    reason: authorized
      ? "enabled"
      : !campaignEvidenceActive
        ? "inactive"
        : deliveryProfile === "vercel-lite"
          ? "lite-boundary"
          : "standalone-boundary",
  });
}
