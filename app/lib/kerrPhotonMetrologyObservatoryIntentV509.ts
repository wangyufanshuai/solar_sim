import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V509 =
  "v509-kerr-photon-metrology-observatory-intent-v1" as const;

export type KerrPhotonMetrologyDetailSurfaceV509 =
  | "none"
  | "coordinate-atlas"
  | "contrast-lattice"
  | "gauge-reconstruction"
  | "edge-redundancy"
  | "double-edge-identifiability"
  | "minimum-cut"
  | "connectivity-lattice"
  | "detector-admission"
  | "calibration-readiness"
  | "candidate-preflight"
  | "detector-timeline";

export type KerrPhotonMetrologyObservatoryIntentDecisionV509 = Readonly<{
  version: typeof KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V509;
  deliveryProfile: AtlasDeliveryProfile;
  campaignEvidenceActive: boolean;
  observatoryImportAuthorized: boolean;
  automaticComponentImportBudget: 0 | 1;
  automaticSummaryRequestBudget: 0 | 1;
  detailComponentCatalogSize: 11;
  concurrentDetailSurfaceBudget: 0 | 1;
  explicitDetailDataRequestCatalogSize: 11;
  detailDataRequestAuthorizedByWrapper: false;
  detailDataRequiresSecondExplicitIntent: true;
  staticAuthorityStageCount: 9;
  staticStatusNetworkRequestBudget: 0;
  staticStatusScientificWriteback: false;
  publicPanelIdAdded: false;
  canvasCreated: false;
  sceneRevisionDelta: 0;
  physicsMutationAllowed: false;
  reason: "enabled" | "inactive" | "standalone-boundary" | "lite-boundary";
}>;

export function resolveKerrPhotonMetrologyObservatoryIntentV509(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
): KerrPhotonMetrologyObservatoryIntentDecisionV509 {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  const reason = authorized
    ? "enabled"
    : !campaignEvidenceActive
      ? "inactive"
      : deliveryProfile === "vercel-lite"
        ? "lite-boundary"
        : "standalone-boundary";
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V509,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : 0,
    automaticSummaryRequestBudget: authorized ? 1 : 0,
    detailComponentCatalogSize: 11,
    concurrentDetailSurfaceBudget: authorized ? 1 : 0,
    explicitDetailDataRequestCatalogSize: 11,
    detailDataRequestAuthorizedByWrapper: false,
    detailDataRequiresSecondExplicitIntent: true,
    staticAuthorityStageCount: 9,
    staticStatusNetworkRequestBudget: 0,
    staticStatusScientificWriteback: false,
    publicPanelIdAdded: false,
    canvasCreated: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
    reason,
  });
}
