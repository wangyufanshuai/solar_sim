import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V490 =
  "v490-kerr-photon-metrology-observatory-intent-v1" as const;

export type KerrPhotonMetrologyObservatoryIntentReasonV490 =
  | "enabled-local-shadow-campaign-evidence"
  | "inactive-campaign-evidence"
  | "standalone-boundary"
  | "lite-boundary";

export interface KerrPhotonMetrologyObservatoryIntentDecisionV490 {
  version: typeof KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V490;
  deliveryProfile: AtlasDeliveryProfile;
  campaignEvidenceActive: boolean;
  observatoryImportAuthorized: boolean;
  componentImportBudget: 0 | 3;
  automaticSummaryRequestBudget: 0 | 1;
  coordinateAtlasDataRequestAuthorizedByWrapper: false;
  contrastLatticeDataRequestAuthorizedByWrapper: false;
  explicitDetailRequestBudget: 0 | 2;
  explicitDetailIntentRequired: true;
  publicPanelIdAdded: false;
  canvasCreated: false;
  sceneRevisionDelta: 0;
  physicsMutationAllowed: false;
  reason: KerrPhotonMetrologyObservatoryIntentReasonV490;
}

export function resolveKerrPhotonMetrologyObservatoryIntentV490(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
): KerrPhotonMetrologyObservatoryIntentDecisionV490 {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  const reason: KerrPhotonMetrologyObservatoryIntentReasonV490 = authorized
    ? "enabled-local-shadow-campaign-evidence"
    : !campaignEvidenceActive
      ? "inactive-campaign-evidence"
      : deliveryProfile === "vercel-lite"
        ? "lite-boundary"
        : "standalone-boundary";
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V490,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    componentImportBudget: authorized ? 3 : 0,
    automaticSummaryRequestBudget: authorized ? 1 : 0,
    coordinateAtlasDataRequestAuthorizedByWrapper: false,
    contrastLatticeDataRequestAuthorizedByWrapper: false,
    explicitDetailRequestBudget: authorized ? 2 : 0,
    explicitDetailIntentRequired: true,
    publicPanelIdAdded: false,
    canvasCreated: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
    reason,
  });
}
