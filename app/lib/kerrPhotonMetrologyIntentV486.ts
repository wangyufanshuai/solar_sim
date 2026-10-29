import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";

export const KERR_PHOTON_METROLOGY_INTENT_VERSION_V486 =
  "v486-kerr-photon-metrology-runtime-intent-v1" as const;

export type KerrPhotonMetrologyIntentReasonV486 =
  | "enabled-local-shadow-campaign-evidence"
  | "inactive-campaign-evidence"
  | "standalone-boundary"
  | "lite-boundary";

export interface KerrPhotonMetrologyIntentDecisionV486 {
  version: typeof KERR_PHOTON_METROLOGY_INTENT_VERSION_V486;
  deliveryProfile: AtlasDeliveryProfile;
  campaignEvidenceActive: boolean;
  componentImportAuthorized: boolean;
  summaryRequestAuthorized: boolean;
  publicPanelIdAdded: false;
  canvasCreated: false;
  sceneRevisionDelta: 0;
  physicsMutationAllowed: false;
  reason: KerrPhotonMetrologyIntentReasonV486;
}

export function resolveKerrPhotonMetrologyIntentV486(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
): KerrPhotonMetrologyIntentDecisionV486 {
  const localShadow = deliveryProfile === "local-shadow";
  const authorized = localShadow && campaignEvidenceActive;
  const reason: KerrPhotonMetrologyIntentReasonV486 = authorized
    ? "enabled-local-shadow-campaign-evidence"
    : !campaignEvidenceActive
      ? "inactive-campaign-evidence"
      : deliveryProfile === "vercel-lite"
        ? "lite-boundary"
        : "standalone-boundary";

  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_INTENT_VERSION_V486,
    deliveryProfile,
    campaignEvidenceActive,
    componentImportAuthorized: authorized,
    summaryRequestAuthorized: authorized,
    publicPanelIdAdded: false,
    canvasCreated: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
    reason,
  });
}
