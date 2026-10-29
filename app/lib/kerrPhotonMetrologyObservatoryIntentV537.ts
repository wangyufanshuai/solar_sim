import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV536 } from "./kerrPhotonMetrologyObservatoryIntentV536";

export type KerrPhotonMetrologyDetailSurfaceV537 = KerrPhotonMetrologyDetailSurfaceV536 | "response-aware-sparse-fits";

export function resolveKerrPhotonMetrologyObservatoryIntentV537(deliveryProfile: AtlasDeliveryProfile, active: boolean) {
  const authorized = deliveryProfile === "local-shadow" && active;
  return Object.freeze({
    version: "v537-kerr-photon-metrology-observatory-intent-v1" as const,
    observatoryImportAuthorized: authorized,
    detailComponentCatalogSize: 39 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : 0 as 0 | 1,
    sparseSampleCount: 4 as const,
    fitsBinaryTableCount: 1 as const,
    fitsImageHduCount: 0 as const,
    rasterPixelCount: 0 as const,
    canvasCreated: false as const,
    sceneRevisionDelta: 0 as const,
    physicsMutationAllowed: false as const,
    reason: authorized ? "enabled" : !active ? "inactive" : deliveryProfile === "vercel-lite" ? "lite-boundary" : "standalone-boundary",
  });
}
