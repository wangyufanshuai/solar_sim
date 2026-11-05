import {
  ATLAS_ART_POLISH_OPACITY_CAPS,
  ATLAS_ART_POLISH_VERSION,
} from "./atlasArtPolish";
import {
  ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION,
} from "./atlasFinalMaintenanceBaseline";
import {
  ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
  ATLAS_GAIA_STARFIELD_RENDER_BUDGET,
} from "./atlasGaiaStarfieldEnhancement";
import {
  ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION,
} from "./atlasRelativitySimulationOptimization";
import type {
  AtlasPostEnhancementMaintenanceBaselineAudit,
  AtlasPostEnhancementMaintenanceBaselineClassification,
  AtlasPostEnhancementMaintenanceBaselineRow,
  AtlasPostEnhancementMaintenanceBaselineSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_POST_ENHANCEMENT_BASELINE_VERSION =
  "v100-post-enhancement-maintenance-baseline" as const;

export const ATLAS_POST_ENHANCEMENT_BASELINE_PROFILE =
  "v100-v97-v99-visual-teaching-maintenance-lock" as const;

export const ATLAS_POST_ENHANCEMENT_BASELINE_BOUNDARY =
  "Local v100 post-enhancement maintenance baseline over the immutable v96 final baseline, v97 Gaia overlay, v98 teaching observability layer and v99 presentation-only art polish. It freezes evidence, entrypoints, browser resource policies, Gaia budgets, v99 opacity caps, 88 IAU constellation scope, curated nebula marker boundaries and protected mutation flags without performance optimization, release archive creation, fixture generation, scientific model upgrade, live physics mutation, worker physics mutation, RK4/DP mutation, EIH 1PN mutation, Kerr kernel mutation, Horizons fixture mutation, v75 budget mutation, V9 sky/background mutation or historical v95/v96 contract rewrite.";

export const V100_POST_ENHANCEMENT_BASELINE_ROW: AtlasPostEnhancementMaintenanceBaselineRow = {
  id: "v100-lock-post-enhancement-maintenance-baseline",
  label: "Lock post-enhancement maintenance baseline over v96, v97, v98 and v99",
  status: "not-run",
  finalBaselineStatus: "not-run",
  gaiaOverlayStatus: "not-run",
  relativityObservabilityStatus: "not-run",
  artPolishStatus: "not-run",
  browserResourceStatus: "not-run",
  verificationEntrypointStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
  postEnhancementBaseline: "applied-maintenance-lock-only",
} as const;

export function createAtlasPostEnhancementMaintenanceBaselineSummary(
  args: {
    audits?: readonly AtlasPostEnhancementMaintenanceBaselineAudit[];
    rows?: readonly AtlasPostEnhancementMaintenanceBaselineRow[];
  } = {},
): AtlasPostEnhancementMaintenanceBaselineSummary {
  const audits = args.audits ?? [];
  const rows = [
    args.rows?.find((row) => row.id === V100_POST_ENHANCEMENT_BASELINE_ROW.id) ??
      V100_POST_ENHANCEMENT_BASELINE_ROW,
  ];
  const completed = rows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.finalBaselineStatus === "pass" &&
        row.gaiaOverlayStatus === "pass" &&
        row.relativityObservabilityStatus === "pass" &&
        row.artPolishStatus === "pass" &&
        row.browserResourceStatus === "pass" &&
        row.verificationEntrypointStatus === "pass" &&
        row.docsSurfaceStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.finalBaselineStatus !== "pass" ||
      row.gaiaOverlayStatus !== "pass" ||
      row.relativityObservabilityStatus !== "pass" ||
      row.artPolishStatus !== "pass" ||
      row.browserResourceStatus !== "pass" ||
      row.verificationEntrypointStatus !== "pass" ||
      row.docsSurfaceStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-post-enhancement-baseline-blocked"
        : ready
          ? "ready-post-enhancement-baseline-locked"
          : "ready-post-enhancement-evidence-indexed";

  return {
    version: ATLAS_POST_ENHANCEMENT_BASELINE_VERSION,
    postEnhancementBaselineProfile: ATLAS_POST_ENHANCEMENT_BASELINE_PROFILE,
    status,
    classification: classifyPostEnhancementBaseline({ status, audits, ready }),
    finalMaintenanceBaselineVersion: ATLAS_FINAL_MAINTENANCE_BASELINE_VERSION,
    gaiaEnhancementVersion: ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
    relativityOptimizationVersion: ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION,
    artPolishVersion: ATLAS_ART_POLISH_VERSION,
    gaiaRenderBudget: ATLAS_GAIA_STARFIELD_RENDER_BUDGET,
    artOpacityCaps: ATLAS_ART_POLISH_OPACITY_CAPS,
    rowCount: rows.length,
    completedRowCount: completed.length,
    audits,
    rows,
    readyRowId: ready?.id ?? "",
    focusedCommand: "npm run test:atlas:post-enhancement-baseline",
    postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    browserFreshCommand: "npm run test:atlas:browser:fresh",
    finalMaintenanceBaselineCommand: "npm run test:atlas:final-maintenance-baseline",
    gaiaStarfieldEnhancementCommand: "npm run test:atlas:gaia-starfield-enhancement",
    relativitySimulationOptimizationCommand: "npm run test:atlas:relativity-simulation-optimization",
    artPolishCommand: "npm run test:atlas:art-polish",
    constellationCatalogPolicy: "normalized-88-iau-presentation-contract",
    nebulaMarkerPolicy: "curated-local-presentation-marker-only",
    relativityTeachingPolicy: "v98-teaching-observability-not-scientific-upgrade",
    browserResourcePolicy: "about-blank-unload-imagebitmap-close-screenshot-retry-3015-teardown-watchpack-noise",
    postEnhancementBaseline: "applied-maintenance-lock-only",
    livePhysicsMutation: "not-applied",
    workerPhysicsMutation: "not-applied",
    rk4DefaultMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    skyAssetMutation: "not-applied",
    backgroundMutation: "not-applied",
    v9SkyDirectionMutation: "not-applied",
    materialMutation: "not-applied",
    fixtureDataMutation: "not-applied",
    budgetMutation: "not-applied",
    defaultGateConfigMutation: "not-applied",
    releasePackagingMutation: "not-applied",
    performanceOptimizationMutation: "not-applied",
    certificationClaimMutation: "not-applied",
    trustedBoundary: ATLAS_POST_ENHANCEMENT_BASELINE_BOUNDARY,
  };
}

function classifyPostEnhancementBaseline(args: {
  status: AtlasPostEnhancementMaintenanceBaselineSummary["status"];
  audits: readonly AtlasPostEnhancementMaintenanceBaselineAudit[];
  ready: AtlasPostEnhancementMaintenanceBaselineRow | null;
}): AtlasPostEnhancementMaintenanceBaselineClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (args.audits.some((audit) => audit.id === "v96-baseline-lock" && audit.status !== "ready")) {
    return "v96-baseline-regression";
  }
  if (args.audits.some((audit) => audit.id === "v97-gaia-overlay-lock" && audit.status !== "ready")) {
    return "gaia-overlay-regression";
  }
  if (args.audits.some((audit) => audit.id === "v98-relativity-observability-lock" && audit.status !== "ready")) {
    return "relativity-observability-regression";
  }
  if (args.audits.some((audit) => audit.id === "v99-art-polish-lock" && audit.status !== "ready")) {
    return "art-polish-regression";
  }
  if (args.audits.some((audit) => audit.id === "browser-resource-lifecycle-lock" && audit.status !== "ready")) {
    return "browser-resource-regression";
  }
  if (args.audits.some((audit) => audit.id === "verification-entrypoint-lock" && audit.status !== "ready")) {
    return "verification-entrypoint-regression";
  }
  if (args.audits.some((audit) => audit.id === "docs-surface-lock" && audit.status !== "ready")) {
    return "docs-surface-regression";
  }
  if (args.audits.some((audit) => audit.id === "protected-mutation-lock" && audit.status !== "ready")) {
    return "protected-mutation-regression";
  }
  if (args.ready) return "post-enhancement-baseline-pass";
  return "mixed";
}
