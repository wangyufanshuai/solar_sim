import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V496 = "v496-kerr-photon-metrology-observatory-intent-v1" as const;
export type KerrPhotonMetrologyDetailSurfaceV496 = "none" | "coordinate-atlas" | "contrast-lattice" | "gauge-reconstruction" | "edge-redundancy" | "double-edge-identifiability";
export interface KerrPhotonMetrologyObservatoryIntentDecisionV496 {
  version: typeof KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V496;
  deliveryProfile: AtlasDeliveryProfile;
  campaignEvidenceActive: boolean;
  observatoryImportAuthorized: boolean;
  automaticComponentImportBudget: 0 | 1;
  automaticSummaryRequestBudget: 0 | 1;
  detailComponentCatalogSize: 5;
  concurrentDetailSurfaceBudget: 0 | 1;
  explicitDetailDataRequestCatalogSize: 5;
  detailDataRequestAuthorizedByWrapper: false;
  detailDataRequiresSecondExplicitIntent: true;
  publicPanelIdAdded: false;
  canvasCreated: false;
  sceneRevisionDelta: 0;
  physicsMutationAllowed: false;
  reason: "enabled" | "inactive" | "standalone-boundary" | "lite-boundary";
}
export function resolveKerrPhotonMetrologyObservatoryIntentV496(deliveryProfile: AtlasDeliveryProfile, campaignEvidenceActive: boolean): KerrPhotonMetrologyObservatoryIntentDecisionV496 {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  const reason = authorized ? "enabled" : !campaignEvidenceActive ? "inactive" : deliveryProfile === "vercel-lite" ? "lite-boundary" : "standalone-boundary";
  return Object.freeze({ version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V496, deliveryProfile, campaignEvidenceActive, observatoryImportAuthorized: authorized, automaticComponentImportBudget: authorized ? 1 : 0, automaticSummaryRequestBudget: authorized ? 1 : 0, detailComponentCatalogSize: 5, concurrentDetailSurfaceBudget: authorized ? 1 : 0, explicitDetailDataRequestCatalogSize: 5, detailDataRequestAuthorizedByWrapper: false, detailDataRequiresSecondExplicitIntent: true, publicPanelIdAdded: false, canvasCreated: false, sceneRevisionDelta: 0, physicsMutationAllowed: false, reason });
}
