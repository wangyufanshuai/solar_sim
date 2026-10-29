import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV551 } from "./kerrPhotonMetrologyObservatoryIntentV551";

export type KerrPhotonMetrologyDetailSurfaceV552 = KerrPhotonMetrologyDetailSurfaceV551 | "license-confirmation-packet";

export function resolveKerrPhotonMetrologyObservatoryIntentV552(deliveryProfile: AtlasDeliveryProfile, active: boolean) {
  const authorized = deliveryProfile === "local-shadow" && active;
  return Object.freeze({
    version: "v552-kerr-photon-metrology-observatory-intent-v1" as const,
    observatoryImportAuthorized: authorized,
    detailComponentCatalogSize: 54 as const,
    concurrentDetailSurfaceBudget: (authorized ? 1 : 0) as 0 | 1,
    confirmationMemberCount: 7 as const,
    confirmedCount: 0 as const,
    unconfirmedCount: 7 as const,
    replayAttemptCount: 2 as const,
    networkAttemptCount: 0 as const,
    measuredAuthorityGrantCount: 0 as const,
    sciencePixelCount: 0 as const,
    canvasCreated: false as const,
    sceneRevisionDelta: 0 as const,
    physicsMutationAllowed: false as const,
    reason: authorized ? "enabled" : !active ? "inactive" : deliveryProfile === "vercel-lite" ? "lite-boundary" : "standalone-boundary",
  });
}
