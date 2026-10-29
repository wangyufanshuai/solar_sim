import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";

export const KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V504 =
  "v504-kerr-photon-metrology-observatory-intent-v1" as const;

export const KERR_CALIBRATION_PREFLIGHT_STATUS_V504 = Object.freeze({
  sourceVersion: "v504",
  status: "blocked-inputs-missing",
  stagingRootPresent: false,
  stagingRootSafe: true,
  readyFiles: 0,
  requiredFiles: 6,
  bytesRead: 0,
  candidateReadyForIndependentValidation: false,
  authorityGranted: false,
} as const);

export type KerrPhotonMetrologyDetailSurfaceV504 =
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
  | "candidate-preflight";

export type KerrPhotonMetrologyObservatoryIntentDecisionV504 = Readonly<{
  version: typeof KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V504;
  deliveryProfile: AtlasDeliveryProfile;
  campaignEvidenceActive: boolean;
  observatoryImportAuthorized: boolean;
  automaticComponentImportBudget: 0 | 1;
  automaticSummaryRequestBudget: 0 | 1;
  detailComponentCatalogSize: 10;
  concurrentDetailSurfaceBudget: 0 | 1;
  explicitDetailDataRequestCatalogSize: 10;
  detailDataRequestAuthorizedByWrapper: false;
  detailDataRequiresSecondExplicitIntent: true;
  staticAuthorityStageCount: 8;
  staticStatusNetworkRequestBudget: 0;
  staticStatusScientificWriteback: false;
  publicPanelIdAdded: false;
  canvasCreated: false;
  sceneRevisionDelta: 0;
  physicsMutationAllowed: false;
  reason: "enabled" | "inactive" | "standalone-boundary" | "lite-boundary";
}>;

export function resolveKerrPhotonMetrologyObservatoryIntentV504(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
): KerrPhotonMetrologyObservatoryIntentDecisionV504 {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  const reason = authorized
    ? "enabled"
    : !campaignEvidenceActive
      ? "inactive"
      : deliveryProfile === "vercel-lite"
        ? "lite-boundary"
        : "standalone-boundary";
  return Object.freeze({
    version: KERR_PHOTON_METROLOGY_OBSERVATORY_INTENT_VERSION_V504,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : 0,
    automaticSummaryRequestBudget: authorized ? 1 : 0,
    detailComponentCatalogSize: 10,
    concurrentDetailSurfaceBudget: authorized ? 1 : 0,
    explicitDetailDataRequestCatalogSize: 10,
    detailDataRequestAuthorizedByWrapper: false,
    detailDataRequiresSecondExplicitIntent: true,
    staticAuthorityStageCount: 8,
    staticStatusNetworkRequestBudget: 0,
    staticStatusScientificWriteback: false,
    publicPanelIdAdded: false,
    canvasCreated: false,
    sceneRevisionDelta: 0,
    physicsMutationAllowed: false,
    reason,
  });
}
