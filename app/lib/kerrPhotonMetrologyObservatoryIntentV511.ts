import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV510 } from "./kerrPhotonMetrologyObservatoryIntentV510";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V511 =
  "v511-kerr-photon-metrology-observatory-intent-v1" as const;

export type KerrPhotonMetrologyDetailSurfaceV511 =
  | KerrPhotonMetrologyDetailSurfaceV510
  | "instrument-authority";

export type KerrPhotonMetrologyObservatoryIntentDecisionV511 = Readonly<{
  version: typeof KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V511;
  deliveryProfile: AtlasDeliveryProfile;
  campaignEvidenceActive: boolean;
  observatoryImportAuthorized: boolean;
  automaticComponentImportBudget: 0 | 1;
  automaticSummaryRequestBudget: 0 | 1;
  detailComponentCatalogSize: 13;
  concurrentDetailSurfaceBudget: 0 | 1;
  explicitDetailDataRequestCatalogSize: 13;
  detailDataRequestAuthorizedByWrapper: false;
  detailDataRequiresSecondExplicitIntent: true;
  staticAuthorityStageCount: 9;
  portableProvenanceStageCount: 1;
  instrumentAuthorityStageCount: 6;
  staticStatusNetworkRequestBudget: 0;
  staticStatusScientificWriteback: false;
  publicPanelIdAdded: false;
  canvasCreated: false;
  sceneRevisionDelta: 0;
  physicsMutationAllowed: false;
  reason: "enabled" | "inactive" | "standalone-boundary" | "lite-boundary";
}>;

export function resolveKerrPhotonMetrologyObservatoryIntentV511(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
): KerrPhotonMetrologyObservatoryIntentDecisionV511 {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  const reason = authorized
    ? "enabled"
    : !campaignEvidenceActive
      ? "inactive"
      : deliveryProfile === "vercel-lite"
        ? "lite-boundary"
        : "standalone-boundary";
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V511,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : 0,
    automaticSummaryRequestBudget: authorized ? 1 : 0,
    detailComponentCatalogSize: 13,
    concurrentDetailSurfaceBudget: authorized ? 1 : 0,
    explicitDetailDataRequestCatalogSize: 13,
    detailDataRequestAuthorizedByWrapper: false,
    detailDataRequiresSecondExplicitIntent: true,
    staticAuthorityStageCount: 9,
    portableProvenanceStageCount: 1,
    instrumentAuthorityStageCount: 6,
    staticStatusNetworkRequestBudget: 0,
    staticStatusScientificWriteback: false,
    publicPanelIdAdded: false,
    canvasCreated: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
    reason,
  });
}
