import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV532 } from "./kerrPhotonMetrologyObservatoryIntentV532";

export type KerrPhotonMetrologyDetailSurfaceV533 =
  | KerrPhotonMetrologyDetailSurfaceV532
  | "grid-axis-influence";

export function resolveKerrPhotonMetrologyObservatoryIntentV533(
  deliveryProfile: AtlasDeliveryProfile,
  active: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && active;
  return Object.freeze({
    version: "v533-kerr-photon-metrology-observatory-intent-v1" as const,
    observatoryImportAuthorized: authorized,
    detailComponentCatalogSize: 35 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    axisSummaryCount: 8 as const,
    directedAxisComparisonCount: 24 as const,
    scientificGeometryInputCount: 46 as const,
    operationalAxisImportanceCount: 0 as const,
    recommendedAxisCount: 0 as const,
    canvasCreated: false as const,
    sceneRevisionDelta: 0 as const,
    physicsMutationAllowed: false as const,
    reason: authorized
      ? "enabled"
      : !active
        ? "inactive"
        : deliveryProfile === "vercel-lite"
          ? "lite-boundary"
          : "standalone-boundary",
  });
}
