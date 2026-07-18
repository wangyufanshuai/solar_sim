import { CATALOG_V7_VERSION } from "./catalogV7";
import { OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION } from "./observationalAstrophysics";
import { SCIENTIFIC_DATA_SNAPSHOT_VERSION } from "./scientificDataSnapshot";
import { SCIENTIFIC_EVIDENCE_BUNDLE_V5_VERSION } from "./scientificEvidenceBundleV5";
import { STELLAR_PORTRAIT_PROFILE_V5_VERSION } from "./stellarPortraitProfileV5";
import { SCIENTIFIC_VISUAL_FIDELITY_V152_VERSION } from "./scientificVisualFidelityV152";

export const ATLAS_SCIENTIFIC_DATA_RELEASE_TRAIN_V153_VERSION = "v147-v153-scientific-data-release-train" as const;
export const ATLAS_SCIENTIFIC_DATA_RELEASE_TRAIN_V153_PROFILE = "reproducible-data-observation-independent-evidence-runtime-visual-integration" as const;
export const ATLAS_SCIENTIFIC_DATA_RELEASE_TRAIN_V153_BOUNDARY = "Build-time scientific data and shadow evidence remain isolated from frozen live/worker physics, RK4/DP, legacy EIH 1PN, V9 sky, v75, v97 and v99 budgets." as const;

export function createAtlasScientificDataProgramV153Summary() {
  return {
    version: ATLAS_SCIENTIFIC_DATA_RELEASE_TRAIN_V153_VERSION,
    profile: ATLAS_SCIENTIFIC_DATA_RELEASE_TRAIN_V153_PROFILE,
    snapshotVersion: SCIENTIFIC_DATA_SNAPSHOT_VERSION,
    catalogVersion: CATALOG_V7_VERSION,
    observationVersion: OBSERVATIONAL_ASTROPHYSICS_LAB_V2_VERSION,
    evidenceVersion: SCIENTIFIC_EVIDENCE_BUNDLE_V5_VERSION,
    materialVersion: STELLAR_PORTRAIT_PROFILE_V5_VERSION,
    visualFidelityVersion: SCIENTIFIC_VISUAL_FIDELITY_V152_VERSION,
    defaultScientificKernel: "legacy-eih-1pn" as const,
    promotionPolicy: "fail-closed-independent-v5-bundle-only" as const,
    runtimeDataPolicy: "offline-after-build-or-content-pack-install" as const,
    desktopInstallerPolicy: "deferred-web-standalone-baseline" as const,
    boundary: ATLAS_SCIENTIFIC_DATA_RELEASE_TRAIN_V153_BOUNDARY,
  };
}
