import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V488 =
  "v488-kerr-photon-metrology-observatory-intent-v1" as const;

export type KerrPhotonMetrologyObservatoryIntentReasonV488 =
  | "enabled-local-shadow-campaign-evidence"
  | "inactive-campaign-evidence"
  | "standalone-boundary"
  | "lite-boundary";

export interface KerrPhotonMetrologyObservatoryIntentDecisionV488 {
  version: typeof KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V488;
  deliveryProfile: AtlasDeliveryProfile;
  campaignEvidenceActive: boolean;
  observatoryImportAuthorized: boolean;
  cockpitSummaryRequestAuthorized: boolean;
  coordinateAtlasComponentImportAuthorized: boolean;
  coordinateAtlasDataRequestAuthorizedByWrapper: false;
  coordinateAtlasDataRequiresExplicitUserIntent: true;
  publicPanelIdAdded: false;
  canvasCreated: false;
  sceneRevisionDelta: 0;
  physicsMutationAllowed: false;
  reason: KerrPhotonMetrologyObservatoryIntentReasonV488;
}

export function resolveKerrPhotonMetrologyObservatoryIntentV488(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
): KerrPhotonMetrologyObservatoryIntentDecisionV488 {
  const localShadow = deliveryProfile === "local-shadow";
  const authorized = localShadow && campaignEvidenceActive;
  const reason: KerrPhotonMetrologyObservatoryIntentReasonV488 = authorized
    ? "enabled-local-shadow-campaign-evidence"
    : !campaignEvidenceActive
      ? "inactive-campaign-evidence"
      : deliveryProfile === "vercel-lite"
        ? "lite-boundary"
        : "standalone-boundary";
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V488,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    cockpitSummaryRequestAuthorized: authorized,
    coordinateAtlasComponentImportAuthorized: authorized,
    coordinateAtlasDataRequestAuthorizedByWrapper: false,
    coordinateAtlasDataRequiresExplicitUserIntent: true,
    publicPanelIdAdded: false,
    canvasCreated: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
    reason,
  });
}
