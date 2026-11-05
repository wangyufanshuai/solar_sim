import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV509 } from "./kerrPhotonMetrologyObservatoryIntentV509";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V510 =
  "v510-kerr-photon-metrology-observatory-intent-v1" as const;

export type KerrPhotonMetrologyDetailSurfaceV510 =
  | KerrPhotonMetrologyDetailSurfaceV509
  | "detector-provenance";

export type KerrPhotonMetrologyObservatoryIntentDecisionV510 = Readonly<{
  version: typeof KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V510;
  deliveryProfile: AtlasDeliveryProfile;
  campaignEvidenceActive: boolean;
  observatoryImportAuthorized: boolean;
  automaticComponentImportBudget: 0 | 1;
  automaticSummaryRequestBudget: 0 | 1;
  detailComponentCatalogSize: 12;
  concurrentDetailSurfaceBudget: 0 | 1;
  explicitDetailDataRequestCatalogSize: 12;
  detailDataRequestAuthorizedByWrapper: false;
  detailDataRequiresSecondExplicitIntent: true;
  staticAuthorityStageCount: 9;
  portableProvenanceStageCount: 1;
  staticStatusNetworkRequestBudget: 0;
  staticStatusScientificWriteback: false;
  publicPanelIdAdded: false;
  canvasCreated: false;
  sceneRevisionDelta: 0;
  physicsMutationAllowed: false;
  reason: "enabled" | "inactive" | "standalone-boundary" | "lite-boundary";
}>;

export function resolveKerrPhotonMetrologyObservatoryIntentV510(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
): KerrPhotonMetrologyObservatoryIntentDecisionV510 {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  const reason = authorized
    ? "enabled"
    : !campaignEvidenceActive
      ? "inactive"
      : deliveryProfile === "vercel-lite"
        ? "lite-boundary"
        : "standalone-boundary";
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V510,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : 0,
    automaticSummaryRequestBudget: authorized ? 1 : 0,
    detailComponentCatalogSize: 12,
    concurrentDetailSurfaceBudget: authorized ? 1 : 0,
    explicitDetailDataRequestCatalogSize: 12,
    detailDataRequestAuthorizedByWrapper: false,
    detailDataRequiresSecondExplicitIntent: true,
    staticAuthorityStageCount: 9,
    portableProvenanceStageCount: 1,
    staticStatusNetworkRequestBudget: 0,
    staticStatusScientificWriteback: false,
    publicPanelIdAdded: false,
    canvasCreated: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
    reason,
  });
}
