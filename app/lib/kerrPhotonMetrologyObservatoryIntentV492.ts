import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V492 =
  "v492-kerr-photon-metrology-observatory-intent-v1" as const;

export type KerrPhotonMetrologyDetailSurfaceV492 =
  | "none"
  | "coordinate-atlas"
  | "contrast-lattice"
  | "gauge-reconstruction";

export interface KerrPhotonMetrologyObservatoryIntentDecisionV492 {
  version: typeof KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V492;
  deliveryProfile: AtlasDeliveryProfile;
  campaignEvidenceActive: boolean;
  observatoryImportAuthorized: boolean;
  automaticComponentImportBudget: 0 | 1;
  automaticSummaryRequestBudget: 0 | 1;
  detailComponentCatalogSize: 3;
  concurrentDetailSurfaceBudget: 0 | 1;
  explicitDetailDataRequestCatalogSize: 3;
  detailDataRequestAuthorizedByWrapper: false;
  detailDataRequiresSecondExplicitIntent: true;
  publicPanelIdAdded: false;
  canvasCreated: false;
  sceneRevisionDelta: 0;
  physicsMutationAllowed: false;
  reason: "enabled" | "inactive" | "standalone-boundary" | "lite-boundary";
}

export function resolveKerrPhotonMetrologyObservatoryIntentV492(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
): KerrPhotonMetrologyObservatoryIntentDecisionV492 {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  const reason = authorized
    ? "enabled"
    : !campaignEvidenceActive
      ? "inactive"
      : deliveryProfile === "vercel-lite"
        ? "lite-boundary"
        : "standalone-boundary";
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V492,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : 0,
    automaticSummaryRequestBudget: authorized ? 1 : 0,
    detailComponentCatalogSize: 3,
    concurrentDetailSurfaceBudget: authorized ? 1 : 0,
    explicitDetailDataRequestCatalogSize: 3,
    detailDataRequestAuthorizedByWrapper: false,
    detailDataRequiresSecondExplicitIntent: true,
    publicPanelIdAdded: false,
    canvasCreated: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
    reason,
  });
}
