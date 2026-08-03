import type { AtlasDeliveryProfile } from "./atlasDeliveryProfile";
import type { KerrPhotonMetrologyDetailSurfaceV533 } from "./kerrPhotonMetrologyObservatoryIntentV533";

export type KerrPhotonMetrologyDetailSurfaceV534 =
  | KerrPhotonMetrologyDetailSurfaceV533
  | "bandpass-redshift";

export function resolveKerrPhotonMetrologyObservatoryIntentV534(
  deliveryProfile: AtlasDeliveryProfile,
  active: boolean,
) {
  const authorized = deliveryProfile === "local-shadow" && active;
  return Object.freeze({
    version: "v534-kerr-photon-metrology-observatory-intent-v1" as const,
    observatoryImportAuthorized: authorized,
    detailComponentCatalogSize: 36 as const,
    concurrentDetailSurfaceBudget: authorized ? 1 : (0 as 0 | 1),
    bandpassRedshiftRowCount: 4 as const,
    measuredCalibrationFileCount: 0 as const,
    electronExpectationRowCount: 0 as const,
    sciencePixelRowCount: 0 as const,
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
