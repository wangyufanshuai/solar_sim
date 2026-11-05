export const ATLAS_RUNTIME_SIMPLIFICATION_VERSION =
  "v131-runtime-simplification-resource-lifecycle" as const;
export const ATLAS_DESKTOP_CONTENT_PACK_VERSION =
  "v132-tauri-desktop-content-packs" as const;
export const ATLAS_VISUAL_DIRECTOR_V3_VERSION =
  "v133-visual-director-v3" as const;
export const ATLAS_MATERIAL_FINAL_VERSION =
  "v134-stellar-planet-material-final" as const;
export const ATLAS_MILLION_STAR_VERSION =
  "v135-million-star-sqlite-atlas" as const;
export const ATLAS_LAUNCH_RECONSTRUCTION_VERSION =
  "v136-launch-mission-reconstruction" as const;
export const ATLAS_RELATIVITY_PROMOTION_V3_VERSION =
  "v137-relativity-promotion-campaign" as const;
export const ATLAS_KERR_SCENE_LAB_VERSION =
  "v138-kerr-scene-lab" as const;
export const ATLAS_PUBLIC_RELEASE_VERSION =
  "v139-public-release-hardening" as const;
export const ATLAS_ONE_RELEASE_VERSION =
  "v140-windows-scientific-cinematic-atlas-1.0" as const;

export type StellarDataTier =
  | "parameter-rich"
  | "photometric-derived"
  | "catalog-basic";

export type ContentPackId =
  | "core"
  | "planet-hd"
  | "deep-sky"
  | "spacecraft"
  | "science-fixtures"
  | "runtime-codecs";

export type ContentPackManifest = {
  schemaVersion: 1;
  id: ContentPackId;
  version: string;
  appCompatibility: { minimum: string; maximumExclusive: string };
  qualityTier: "required" | "standard" | "hd" | "scientific";
  compressedBytes: number;
  installedBytes: number;
  files: readonly {
    path: string;
    bytes: number;
    sha256: string;
    source: string;
    license: string;
  }[];
};

export type ContentPackState = {
  id: ContentPackId;
  status: "not-installed" | "checking" | "downloading" | "installed" | "corrupt";
  installedVersion: string | null;
  progress: number;
  error: string | null;
};

export type SceneLabDocument = {
  schemaVersion: 1;
  id: string;
  title: string;
  sourceSceneId: string;
  createdAt: string;
  parameters: Readonly<Record<string, number | boolean | string>>;
  boundary: "isolated-copy-never-writes-canonical-ephemeris";
};

export type ScientificPromotionEvidenceV3 = {
  positionRmsKm: number | null;
  velocityRmsMS: number | null;
  kerrInvariantPassed: boolean;
  performancePassed: boolean;
  regressionPassed: boolean;
  decision: "promoted" | "blocked-shadow-retained";
  defaultKernel: "legacy-eih-1pn" | "relativity-force-model-v2";
  blockers: readonly string[];
};

export const ATLAS_FINAL_PRODUCT_BOUNDARY =
  "Windows scientific-cinematic atlas. Catalog, desktop, presentation and isolated laboratory layers do not mutate frozen scientific gates, fixtures, live/worker physics, RK4/DP, legacy EIH 1PN, V9 sky or v75/v97/v99 budgets.";

export function createScientificPromotionEvidenceV3(input: {
  positionRmsKm?: number;
  velocityRmsMS?: number;
  kerrInvariantPassed?: boolean;
  performancePassed?: boolean;
  regressionPassed?: boolean;
} = {}): ScientificPromotionEvidenceV3 {
  const promoted =
    input.positionRmsKm != null &&
    input.positionRmsKm < 10_000 &&
    input.velocityRmsMS != null &&
    input.velocityRmsMS < 1 &&
    input.kerrInvariantPassed === true &&
    input.performancePassed === true &&
    input.regressionPassed === true;
  const blockers: string[] = [];
  if (input.positionRmsKm == null || input.positionRmsKm >= 10_000) blockers.push("ten-year-position-rms");
  if (input.velocityRmsMS == null || input.velocityRmsMS >= 1) blockers.push("ten-year-velocity-rms");
  if (input.kerrInvariantPassed !== true) blockers.push("kerr-invariants");
  if (input.performancePassed !== true) blockers.push("hardware-performance");
  if (input.regressionPassed !== true) blockers.push("full-regression");
  return {
    positionRmsKm: input.positionRmsKm ?? null,
    velocityRmsMS: input.velocityRmsMS ?? null,
    kerrInvariantPassed: input.kerrInvariantPassed === true,
    performancePassed: input.performancePassed === true,
    regressionPassed: input.regressionPassed === true,
    decision: promoted ? "promoted" : "blocked-shadow-retained",
    defaultKernel: promoted ? "relativity-force-model-v2" : "legacy-eih-1pn",
    blockers,
  };
}

export function createAtlasFinalReleaseSummary() {
  return {
    version: ATLAS_ONE_RELEASE_VERSION,
    product: "Windows scientific-cinematic atlas" as const,
    canonicalDistribution: "tauri-webview2-next-standalone" as const,
    sceneCount: 6,
    catalogTarget: 1_000_000,
    visibleGaiaBudgets: [1_000, 1_800, 3_000] as const,
    contentPacks: ["core", "planet-hd", "deep-sky", "spacecraft", "science-fixtures"] as const,
    memoryPolicy: "16gb-single-heavy-process" as const,
    boundary: ATLAS_FINAL_PRODUCT_BOUNDARY,
  };
}
