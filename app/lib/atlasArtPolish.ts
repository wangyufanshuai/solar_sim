import {
  ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
  ATLAS_GAIA_STARFIELD_RENDER_BUDGET,
  orbitAtlasV9SkyBoundaryPreserved,
} from "./atlasGaiaStarfieldEnhancement";
import { ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION } from "./atlasRelativitySimulationOptimization";
import type {
  AtlasArtPolishAudit,
  AtlasArtPolishClassification,
  AtlasArtPolishOpacityCaps,
  AtlasArtPolishRow,
  AtlasArtPolishSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_ART_POLISH_VERSION = "v99-art-polish" as const;

export const ATLAS_ART_POLISH_PROFILE =
  "v99-gaia-overlay-closeup-presentation-polish" as const;

export const ATLAS_ART_POLISH_OPACITY_CAPS: AtlasArtPolishOpacityCaps = {
  mobile: 0.62,
  balanced: 1.05,
  dense: 1.2,
  closeup: 0.18,
} as const;

export const ATLAS_ART_POLISH_BOUNDARY =
  "Local v99 presentation-only art polish over the v97 Gaia overlay and v98 relativity observability baseline. It improves visible Gaia star layering, constellation line restraint, nebula marker readability, selected-body closeup readability and mobile density while preserving the v97 Gaia render budgets, ORBIT_ATLAS_SKY === ORBIT_ATLAS_V9_SKY, GalaxyEnvironmentSphere legacy V9 background direction, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, materials, release packaging and certification boundaries.";

export const V99_ART_POLISH_ROW: AtlasArtPolishRow = {
  id: "v99-lock-art-polish",
  label: "Lock presentation-only Gaia, constellation, nebula and closeup art polish",
  status: "not-run",
  gaiaLayerStatus: "not-run",
  constellationLayerStatus: "not-run",
  nebulaLayerStatus: "not-run",
  closeupReadabilityStatus: "not-run",
  mobileBudgetStatus: "not-run",
  v9SkyBoundaryStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
  artPolish: "applied-presentation-layer-only",
} as const;

export function createAtlasArtPolishSummary(
  args: {
    audits?: readonly AtlasArtPolishAudit[];
    rows?: readonly AtlasArtPolishRow[];
  } = {},
): AtlasArtPolishSummary {
  const audits = args.audits ?? [];
  const artRows = [
    args.rows?.find((row) => row.id === V99_ART_POLISH_ROW.id) ?? V99_ART_POLISH_ROW,
  ];
  const completed = artRows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.gaiaLayerStatus === "pass" &&
        row.constellationLayerStatus === "pass" &&
        row.nebulaLayerStatus === "pass" &&
        row.closeupReadabilityStatus === "pass" &&
        row.mobileBudgetStatus === "pass" &&
        row.v9SkyBoundaryStatus === "pass" &&
        row.docsSurfaceStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.gaiaLayerStatus !== "pass" ||
      row.constellationLayerStatus !== "pass" ||
      row.nebulaLayerStatus !== "pass" ||
      row.closeupReadabilityStatus !== "pass" ||
      row.mobileBudgetStatus !== "pass" ||
      row.v9SkyBoundaryStatus !== "pass" ||
      row.docsSurfaceStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-art-polish-blocked"
        : ready
          ? "ready-art-polish-locked"
          : "ready-presentation-layer-budgeted";

  return {
    version: ATLAS_ART_POLISH_VERSION,
    artPolishProfile: ATLAS_ART_POLISH_PROFILE,
    status,
    classification: classifyArtPolish({ status, audits, ready }),
    opacityCaps: ATLAS_ART_POLISH_OPACITY_CAPS,
    gaiaRenderBudget: ATLAS_GAIA_STARFIELD_RENDER_BUDGET,
    gaiaEnhancementVersion: ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
    relativityOptimizationVersion: ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION,
    rowCount: artRows.length,
    completedRowCount: completed.length,
    audits,
    rows: artRows,
    readyRowId: ready?.id ?? "",
    constellationLinePolicy: "lighter-overview-closeup-mobile-density",
    nebulaMarkerPolicy: "overview-enhanced-closeup-mobile-restrained",
    closeupReadabilityPolicy: "selected-body-background-deemphasized",
    mobileDensityPolicy: "mobile-label-line-nebula-density-restrained",
    officialCertificationPolicy: "not-nasa-jpl-gaia-universe-sandbox-certified",
    artPolish: "applied-presentation-layer-only",
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
    trustedBoundary: ATLAS_ART_POLISH_BOUNDARY,
  };
}

export function artPolishV9SkyBoundaryPreserved(): boolean {
  return orbitAtlasV9SkyBoundaryPreserved();
}

function classifyArtPolish(args: {
  status: AtlasArtPolishSummary["status"];
  audits: readonly AtlasArtPolishAudit[];
  ready: AtlasArtPolishRow | null;
}): AtlasArtPolishClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (args.audits.some((audit) => audit.id === "gaia-layer-lock" && audit.status !== "ready")) {
    return "gaia-layer-regression";
  }
  if (args.audits.some((audit) => audit.id === "constellation-layer-lock" && audit.status !== "ready")) {
    return "constellation-layer-regression";
  }
  if (args.audits.some((audit) => audit.id === "nebula-layer-lock" && audit.status !== "ready")) {
    return "nebula-layer-regression";
  }
  if (args.audits.some((audit) => audit.id === "closeup-readability-lock" && audit.status !== "ready")) {
    return "closeup-readability-regression";
  }
  if (args.audits.some((audit) => audit.id === "mobile-budget-lock" && audit.status !== "ready")) {
    return "mobile-budget-regression";
  }
  if (args.audits.some((audit) => audit.id === "v9-sky-boundary-lock" && audit.status !== "ready")) {
    return "v9-sky-boundary-regression";
  }
  if (args.audits.some((audit) => audit.id === "protected-mutation-lock" && audit.status !== "ready")) {
    return "protected-mutation-regression";
  }
  if (args.audits.some((audit) => audit.id === "docs-surface-lock" && audit.status !== "ready")) {
    return "docs-surface-regression";
  }
  if (args.ready) return "art-polish-pass";
  return "mixed";
}
