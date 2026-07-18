import { ATLAS_RELATIVITY_CHART_VERSION, createAtlasRelativityChartSummary } from "./atlasRelativityCharts";
import {
  ATLAS_RELATIVITY_KERNEL_ID,
  ATLAS_RELATIVITY_VERIFICATION_VERSION,
  createAtlasRelativityVerificationSummary,
} from "./atlasRelativityVerification";
import { KERR_RELATIVITY_STUDIO_VERSION, createKerrRelativityStudioSummary } from "./kerrRelativityStudio";
import { RELATIVITY_GUIDED_TOUR_VERSION, createRelativityGuidedTourSummary } from "./relativityGuidedTour";
import {
  RELATIVITY_OBSERVABLE_ATLAS_VERSION,
  RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
  createRelativityObservableAtlasSummary,
  createRelativityObservableExplainerSummary,
} from "./relativityObservableAtlas";
import type {
  AtlasRelativityChartSummary,
  AtlasRelativitySimulationOptimizationAudit,
  AtlasRelativitySimulationOptimizationClassification,
  AtlasRelativitySimulationOptimizationRow,
  AtlasRelativitySimulationOptimizationSummary,
  AtlasRelativityVerificationSummary,
  KerrRelativityStudioSummary,
  RelativityGuidedTourSummary,
  RelativityObservableAtlasSummary,
  RelativityObservableExplainerSummary,
  SimulationDiagnostics,
} from "./simulationDiagnosticsTypes";

export const ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION =
  "v98-relativity-simulation-optimization" as const;

export const ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_PROFILE =
  "v98-relativity-observability-teaching-layer" as const;

export const V98_RELATIVITY_SIMULATION_OPTIMIZATION_BOUNDARY =
  "Local v98 relativity simulation optimization contract for teaching observability over the existing Relativity Observable Atlas, Kerr Studio, weak-field readouts, numerical-health explanations and optional read-only performance HUD. It is not a scientific model upgrade, not full numerical relativity, not an Einstein field-equation solver, not online validation, and it does not mutate live runtime physics, worker physics, RK4/DP integration, EIH 1PN, Kerr kernel id, Horizons fixtures, v75 budgets, V9 sky/background assets or the v97 Gaia overlay.";

export const V98_RELATIVITY_SIMULATION_OPTIMIZATION_ROW: AtlasRelativitySimulationOptimizationRow = {
  id: "v98-lock-relativity-simulation-optimization",
  label: "Lock relativity teaching observability layer",
  status: "not-run",
  observableAtlasStatus: "not-run",
  kerrStudioStatus: "not-run",
  weakFieldReadoutStatus: "not-run",
  performanceHudStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedPhysicsStatus: "not-run",
  relativitySimulationOptimization: "applied-teaching-observability-only",
} as const;

export type CreateAtlasRelativitySimulationOptimizationSummaryArgs = {
  diagnostics?: SimulationDiagnostics | null;
  audits?: readonly AtlasRelativitySimulationOptimizationAudit[];
  rows?: readonly AtlasRelativitySimulationOptimizationRow[];
  observableAtlasSummary?: RelativityObservableAtlasSummary | null;
  explainerSummary?: RelativityObservableExplainerSummary | null;
  guidedTourSummary?: RelativityGuidedTourSummary | null;
  relativityVerificationSummary?: AtlasRelativityVerificationSummary | null;
  relativityChartSummary?: AtlasRelativityChartSummary | null;
  kerrStudioSummary?: KerrRelativityStudioSummary | null;
};

export function createAtlasRelativitySimulationOptimizationSummary({
  diagnostics = null,
  audits = [],
  rows,
  observableAtlasSummary = null,
  explainerSummary = null,
  guidedTourSummary = null,
  relativityVerificationSummary = null,
  relativityChartSummary = null,
  kerrStudioSummary = null,
}: CreateAtlasRelativitySimulationOptimizationSummaryArgs = {}): AtlasRelativitySimulationOptimizationSummary {
  const kerr = kerrStudioSummary ?? createKerrRelativityStudioSummary();
  const observable =
    observableAtlasSummary ??
    createRelativityObservableAtlasSummary({
      diagnostics,
      kerrStudioSummary: kerr,
    });
  const explainer =
    explainerSummary ??
    createRelativityObservableExplainerSummary({
      diagnostics,
      kerrStudioSummary: kerr,
      observableAtlasSummary: observable,
    });
  const tour =
    guidedTourSummary ??
    createRelativityGuidedTourSummary({
      diagnostics,
      observableAtlasSummary: observable,
      explainerSummary: explainer,
    });
  const verification =
    relativityVerificationSummary ??
    createAtlasRelativityVerificationSummary({
      diagnostics,
      kerrStudioSummary: kerr,
      observableAtlasSummary: observable,
      explainerSummary: explainer,
      guidedTourSummary: tour,
    });
  const chart =
    relativityChartSummary ??
    createAtlasRelativityChartSummary({
      diagnostics,
      kerrStudioSummary: kerr,
      verificationSummary: verification,
    });
  const optimizationRows = [
    rows?.find((row) => row.id === V98_RELATIVITY_SIMULATION_OPTIMIZATION_ROW.id) ??
      V98_RELATIVITY_SIMULATION_OPTIMIZATION_ROW,
  ];
  const completed = optimizationRows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.observableAtlasStatus === "pass" &&
        row.kerrStudioStatus === "pass" &&
        row.weakFieldReadoutStatus === "pass" &&
        row.performanceHudStatus === "pass" &&
        row.docsSurfaceStatus === "pass" &&
        row.protectedPhysicsStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.observableAtlasStatus !== "pass" ||
      row.kerrStudioStatus !== "pass" ||
      row.weakFieldReadoutStatus !== "pass" ||
      row.performanceHudStatus !== "pass" ||
      row.docsSurfaceStatus !== "pass" ||
      row.protectedPhysicsStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-relativity-optimization-blocked"
        : ready
          ? "ready-relativity-optimization-locked"
          : "ready-teaching-overlay-budgeted";

  return {
    version: ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_VERSION,
    optimizationProfile: ATLAS_RELATIVITY_SIMULATION_OPTIMIZATION_PROFILE,
    status,
    classification: classifyRelativitySimulationOptimization({ status, audits, ready }),
    observableAtlasVersion: observable.version,
    explainerVersion: explainer.version,
    guidedTourVersion: tour.version,
    verificationVersion: verification.version,
    chartVersion: chart.version,
    kerrStudioVersion: kerr.version,
    kerrKernelId: verification.kerrKernelId,
    weakFieldObservableCount: verification.weakFieldObservableCount,
    strongFieldReadoutCount: verification.strongFieldObservableCount,
    numericalHealthMetricCount: verification.numericalHealthMetricCount,
    readyReadoutCount: verification.readyReadoutCount,
    readoutCount: verification.readoutCount,
    rowCount: optimizationRows.length,
    completedRowCount: completed.length,
    audits,
    rows: optimizationRows,
    readyRowId: ready?.id ?? "",
    teachingOverlayPolicy: "observable-atlas-and-kerr-studio-default",
    performanceHudPolicy: "optional-collapsed-read-only-main-canvas",
    scientificModelUpgradePolicy: "not-scientific-model-upgrade",
    relativitySimulationOptimization: "applied-teaching-observability-only",
    livePhysicsMutation: "not-applied",
    workerPhysicsMutation: "not-applied",
    rk4DefaultMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    skyAssetMutation: "not-applied",
    backgroundMutation: "not-applied",
    fixtureDataMutation: "not-applied",
    budgetMutation: "not-applied",
    defaultGateConfigMutation: "not-applied",
    certificationClaimMutation: "not-applied",
    trustedBoundary: `${V98_RELATIVITY_SIMULATION_OPTIMIZATION_BOUNDARY} Chart layer ${chart.version}; kernel ${ATLAS_RELATIVITY_KERNEL_ID}.`,
  };
}

function classifyRelativitySimulationOptimization(args: {
  status: AtlasRelativitySimulationOptimizationSummary["status"];
  audits: readonly AtlasRelativitySimulationOptimizationAudit[];
  ready: AtlasRelativitySimulationOptimizationRow | null;
}): AtlasRelativitySimulationOptimizationClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (args.audits.some((audit) => audit.id === "observable-atlas-lock" && audit.status !== "ready")) {
    return "observable-atlas-regression";
  }
  if (args.audits.some((audit) => audit.id === "kerr-studio-lock" && audit.status !== "ready")) {
    return "kerr-studio-regression";
  }
  if (args.audits.some((audit) => audit.id === "weak-field-readout-lock" && audit.status !== "ready")) {
    return "weak-field-readout-regression";
  }
  if (args.audits.some((audit) => audit.id === "performance-hud-lock" && audit.status !== "ready")) {
    return "performance-hud-regression";
  }
  if (args.audits.some((audit) => audit.id === "protected-physics-lock" && audit.status !== "ready")) {
    return "protected-physics-regression";
  }
  if (args.audits.some((audit) => audit.id === "docs-surface-lock" && audit.status !== "ready")) {
    return "docs-surface-regression";
  }
  if (args.ready) return "relativity-optimization-pass";
  return "mixed";
}

export function v98RelativitySimulationOptimizationVersionContract(): Readonly<{
  observableAtlasVersion: typeof RELATIVITY_OBSERVABLE_ATLAS_VERSION;
  explainerVersion: typeof RELATIVITY_OBSERVABLE_EXPLAINER_VERSION;
  guidedTourVersion: typeof RELATIVITY_GUIDED_TOUR_VERSION;
  verificationVersion: typeof ATLAS_RELATIVITY_VERIFICATION_VERSION;
  chartVersion: typeof ATLAS_RELATIVITY_CHART_VERSION;
  kerrStudioVersion: typeof KERR_RELATIVITY_STUDIO_VERSION;
  kerrKernelId: typeof ATLAS_RELATIVITY_KERNEL_ID;
}> {
  return {
    observableAtlasVersion: RELATIVITY_OBSERVABLE_ATLAS_VERSION,
    explainerVersion: RELATIVITY_OBSERVABLE_EXPLAINER_VERSION,
    guidedTourVersion: RELATIVITY_GUIDED_TOUR_VERSION,
    verificationVersion: ATLAS_RELATIVITY_VERIFICATION_VERSION,
    chartVersion: ATLAS_RELATIVITY_CHART_VERSION,
    kerrStudioVersion: KERR_RELATIVITY_STUDIO_VERSION,
    kerrKernelId: ATLAS_RELATIVITY_KERNEL_ID,
  };
}
