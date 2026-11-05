import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV530 } from "./kerrPhotonMetrologyObservatoryIntentV530";

export type KerrPhotonMetrologyDetailSurfaceV531 =
  | KerrPhotonMetrologyDetailSurfaceV530
  | "regret-ranking";
export function resolveKerrPhotonMetrologyObservatoryIntentV531(
  deliveryProfile: AtlasDeliveryProfile,
  campaignEvidenceActive: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && campaignEvidenceActive;
  return Object.freeze({
    version: "v531-kerr-photon-metrology-observatory-intent-v1" as const,
    deliveryProfile,
    campaignEvidenceActive,
    observatoryImportAuthorized: authorized,
    automaticComponentImportBudget: authorized ? 1 : (0 as 0 | 1),
    detailComponentCatalogSize: 33 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    dominanceComparisonCount: 4704 as const,
    scalarizationEvaluationCount: 9898 as const,
    scientificGeometryInputCount: 300 as const,
    selectedPreferenceCount: 0 as const,
    measuredCalibrationFileCount: 0 as const,
    requiredMeasuredCalibrationFileCount: 6 as const,
    staticStatusNetworkRequestBudget: 0 as const,
    staticStatusScientificWriteback: false as const,
    canvasCreated: false as const,
    sceneRevisionDelta: 0 as const,
    physicsMutationAllowed: false as const,
    reason: authorized ? ("enabled" as const) : !campaignEvidenceActive ? ("inactive" as const) : deliveryProfile === "vercel-lite" ? ("lite-boundary" as const) : ("standalone-boundary" as const),
  });
}
