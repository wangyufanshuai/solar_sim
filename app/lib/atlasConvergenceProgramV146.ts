import { CATALOG_LITE_V6_VERSION, CATALOG_MILLION_V6_VERSION } from "./catalogV6";
import { SCIENTIFIC_EVIDENCE_BUNDLE_V4_VERSION } from "./scientificEvidenceBundleV4";
import { STELLAR_PORTRAIT_PROFILE_V5_VERSION } from "./stellarPortraitProfileV5";
import { OBSERVATIONAL_ASTROPHYSICS_LAB_VERSION } from "./observationalAstrophysics";

export const ATLAS_RELEASE_TRAIN_V146_VERSION = "v141-v146-convergence-release-train" as const;
export const ATLAS_RELEASE_TRAIN_V146_PROFILE = "runtime-framing-catalog-pack-material-observation-science-evidence" as const;
export const ATLAS_RELEASE_TRAIN_V146_BOUNDARY =
  "Presentation, catalog packs, observational models and generated scientific evidence remain isolated from frozen scientific gates, fixtures, live/worker physics, RK4/DP, legacy EIH 1PN, V9 sky and v75/v97/v99 budgets." as const;

export type AtlasSceneControllerState = {
  sceneMode: "atlas" | "inspect" | "launch" | "exoplanet-system" | "kerr" | "science-lab";
  mountedSceneModule: string;
  activeWorkerCount: number;
  cameraLocked: boolean;
  safeViewportRevision: number;
};

export function createAtlasConvergenceProgramV146Summary() {
  return {
    version: ATLAS_RELEASE_TRAIN_V146_VERSION,
    profile: ATLAS_RELEASE_TRAIN_V146_PROFILE,
    runtimeVersion: "v141-runtime-architecture-camera-framing-v4" as const,
    liteCatalogVersion: CATALOG_LITE_V6_VERSION,
    millionCatalogVersion: CATALOG_MILLION_V6_VERSION,
    materialVersion: STELLAR_PORTRAIT_PROFILE_V5_VERSION,
    observationVersion: OBSERVATIONAL_ASTROPHYSICS_LAB_VERSION,
    evidenceVersion: SCIENTIFIC_EVIDENCE_BUNDLE_V4_VERSION,
    defaultScientificKernel: "legacy-eih-1pn" as const,
    millionPackPolicy: "optional-opfs-sqlite-offline-after-install" as const,
    visualHdPolicy: "optional-up-to-1.5-gib-scene-lru" as const,
    deploymentPolicy: "vercel-thin-preview-no-automatic-production-deploy" as const,
    boundary: ATLAS_RELEASE_TRAIN_V146_BOUNDARY,
  };
}
