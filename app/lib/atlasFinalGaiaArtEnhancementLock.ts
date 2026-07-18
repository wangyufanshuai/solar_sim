import { GAIA_V105_SELECTION_POLICY } from "../data/gaiaStarCatalog";
import {
  ATLAS_ART_POLISH_OPACITY_CAPS,
  ATLAS_ART_POLISH_VERSION,
} from "./atlasArtPolish";
import {
  ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
  ATLAS_GAIA_STARFIELD_RENDER_BUDGET,
} from "./atlasGaiaStarfieldEnhancement";
import { ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION } from "./atlasBrowserAcceptanceRuntimeCostLock";
import type {
  AtlasFinalGaiaArtEnhancementAudit,
  AtlasFinalGaiaArtEnhancementClassification,
  AtlasFinalGaiaArtEnhancementRow,
  AtlasFinalGaiaArtEnhancementSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION =
  "v105-final-gaia-art-enhancement-lock" as const;

export const ATLAS_FINAL_GAIA_ART_ENHANCEMENT_PROFILE =
  "v105-budget-preserved-gaia-art-polish" as const;

export const ATLAS_FINAL_GAIA_ART_ENHANCEMENT_BOUNDARY =
  "Local v105 budget-preserved Gaia art enhancement over v104. It improves deterministic Gaia star selection, Gaia brightness/color layering, constellation readability and nebula presentation while preserving v97 Gaia render budgets, v99 opacity caps, browser pixel thresholds, scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background direction, release packaging and official certification boundaries.";

export const V105_FINAL_GAIA_ART_ENHANCEMENT_ROW: AtlasFinalGaiaArtEnhancementRow = {
  id: "v105-lock-final-gaia-art-enhancement",
  label: "Lock final budget-preserved Gaia art enhancement",
  status: "not-run",
  v104Status: "not-run",
  gaiaSelectionStatus: "not-run",
  gaiaVisualMappingStatus: "not-run",
  constellationNebulaReadabilityStatus: "not-run",
  browserQaStatus: "not-run",
  budgetBoundaryStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
  finalGaiaArtEnhancement: "applied-budget-preserved-presentation-data-polish",
} as const;

export function createAtlasFinalGaiaArtEnhancementSummary(
  args: {
    audits?: readonly AtlasFinalGaiaArtEnhancementAudit[];
    rows?: readonly AtlasFinalGaiaArtEnhancementRow[];
  } = {},
): AtlasFinalGaiaArtEnhancementSummary {
  const audits = args.audits ?? [];
  const rows = [
    args.rows?.find((row) => row.id === V105_FINAL_GAIA_ART_ENHANCEMENT_ROW.id) ??
      V105_FINAL_GAIA_ART_ENHANCEMENT_ROW,
  ];
  const completed = rows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.v104Status === "pass" &&
        row.gaiaSelectionStatus === "pass" &&
        row.gaiaVisualMappingStatus === "pass" &&
        row.constellationNebulaReadabilityStatus === "pass" &&
        row.browserQaStatus === "pass" &&
        row.budgetBoundaryStatus === "pass" &&
        row.docsSurfaceStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.v104Status !== "pass" ||
      row.gaiaSelectionStatus !== "pass" ||
      row.gaiaVisualMappingStatus !== "pass" ||
      row.constellationNebulaReadabilityStatus !== "pass" ||
      row.browserQaStatus !== "pass" ||
      row.budgetBoundaryStatus !== "pass" ||
      row.docsSurfaceStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-final-gaia-art-blocked"
        : ready
          ? "ready-final-gaia-art-locked"
          : "ready-budget-preserved-gaia-enhanced";

  return {
    version: ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION,
    finalGaiaArtEnhancementProfile: ATLAS_FINAL_GAIA_ART_ENHANCEMENT_PROFILE,
    status,
    classification: classifyFinalGaiaArtEnhancement({ status, audits, ready }),
    browserAcceptanceRuntimeCostVersion: ATLAS_BROWSER_ACCEPTANCE_RUNTIME_COST_VERSION,
    gaiaEnhancementVersion: ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
    artPolishVersion: ATLAS_ART_POLISH_VERSION,
    gaiaRenderBudget: ATLAS_GAIA_STARFIELD_RENDER_BUDGET,
    opacityCaps: ATLAS_ART_POLISH_OPACITY_CAPS,
    gaiaSelectionPolicy: GAIA_V105_SELECTION_POLICY,
    gaiaVisualMappingPolicy: "budget-preserved-brightness-color-temperature-layering",
    constellationNebulaReadabilityPolicy: "presentation-only-overview-readable-closeup-mobile-restrained",
    browserQaPolicy: "root-observable-evidence-validation-v105-markers",
    focusedCommand: "npm run test:atlas:final-gaia-art-enhancement",
    finalGaiaArtVerifyCommand: "npm run verify:atlas:final-gaia-art",
    defaultFreshCommand: "npm run test:atlas:browser:fresh",
    screenshotArtifactDirectory: "test-results/v105-final-gaia-art-enhancement-lock/",
    rowCount: rows.length,
    completedRowCount: completed.length,
    audits,
    rows,
    readyRowId: ready?.id ?? "",
    finalGaiaArtEnhancement: "applied-budget-preserved-presentation-data-polish",
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
    certificationClaimMutation: "not-applied",
    trustedBoundary: ATLAS_FINAL_GAIA_ART_ENHANCEMENT_BOUNDARY,
  };
}

function classifyFinalGaiaArtEnhancement(args: {
  status: AtlasFinalGaiaArtEnhancementSummary["status"];
  audits: readonly AtlasFinalGaiaArtEnhancementAudit[];
  ready: AtlasFinalGaiaArtEnhancementRow | null;
}): AtlasFinalGaiaArtEnhancementClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (args.audits.some((audit) => audit.id === "v104-browser-acceptance-runtime-cost" && audit.status !== "ready")) {
    return "v104-regression";
  }
  if (args.audits.some((audit) => audit.id === "gaia-selection-lock" && audit.status !== "ready")) {
    return "gaia-selection-regression";
  }
  if (args.audits.some((audit) => audit.id === "gaia-visual-mapping-lock" && audit.status !== "ready")) {
    return "gaia-visual-mapping-regression";
  }
  if (args.audits.some((audit) => audit.id === "constellation-nebula-readability-lock" && audit.status !== "ready")) {
    return "constellation-nebula-readability-regression";
  }
  if (args.audits.some((audit) => audit.id === "browser-qa-lock" && audit.status !== "ready")) {
    return "browser-qa-regression";
  }
  if (args.audits.some((audit) => audit.id === "budget-boundary-lock" && audit.status !== "ready")) {
    return "budget-boundary-regression";
  }
  if (args.audits.some((audit) => audit.id === "docs-surface-lock" && audit.status !== "ready")) {
    return "docs-surface-regression";
  }
  if (args.audits.some((audit) => audit.id === "protected-mutation-lock" && audit.status !== "ready")) {
    return "protected-mutation-regression";
  }
  if (args.ready) return "final-gaia-art-pass";
  return "mixed";
}
