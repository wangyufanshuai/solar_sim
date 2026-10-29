import { ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION } from "./atlasMaintenanceEvidenceIndex";
import type {
  AtlasPresentationRuntimePerformanceAudit,
  AtlasPresentationRuntimePerformanceClassification,
  AtlasPresentationRuntimePerformanceRow,
  AtlasPresentationRuntimePerformanceSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION =
  "v103-presentation-runtime-performance-lock" as const;

export const ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_PROFILE =
  "v103-gaia-constellation-label-runtime-cost" as const;

export const ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_BOUNDARY =
  "Local v103 presentation runtime performance lock over v102. It only reduces per-frame presentation-layer write pressure for Gaia, constellation and label surfaces while preserving v97 Gaia render budgets, v99 opacity caps, v75 budgets, browser screenshot thresholds, pixel settle/retry policy, scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background direction, browser QA cost policy, release packaging and certification boundaries.";

export const V103_PRESENTATION_RUNTIME_PERFORMANCE_ROW: AtlasPresentationRuntimePerformanceRow = {
  id: "v103-lock-presentation-runtime-performance",
  label: "Lock Gaia, constellation and label presentation runtime cost",
  status: "not-run",
  v102Status: "not-run",
  gaiaRuntimeStatus: "not-run",
  constellationRuntimeStatus: "not-run",
  labelRuntimeStatus: "not-run",
  budgetThresholdStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
  presentationRuntimePerformance: "applied-presentation-runtime-cost-only",
} as const;

export function createAtlasPresentationRuntimePerformanceSummary(
  args: {
    audits?: readonly AtlasPresentationRuntimePerformanceAudit[];
    rows?: readonly AtlasPresentationRuntimePerformanceRow[];
  } = {},
): AtlasPresentationRuntimePerformanceSummary {
  const audits = args.audits ?? [];
  const rows = [
    args.rows?.find((row) => row.id === V103_PRESENTATION_RUNTIME_PERFORMANCE_ROW.id) ??
      V103_PRESENTATION_RUNTIME_PERFORMANCE_ROW,
  ];
  const completed = rows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.v102Status === "pass" &&
        row.gaiaRuntimeStatus === "pass" &&
        row.constellationRuntimeStatus === "pass" &&
        row.labelRuntimeStatus === "pass" &&
        row.budgetThresholdStatus === "pass" &&
        row.docsSurfaceStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.v102Status !== "pass" ||
      row.gaiaRuntimeStatus !== "pass" ||
      row.constellationRuntimeStatus !== "pass" ||
      row.labelRuntimeStatus !== "pass" ||
      row.budgetThresholdStatus !== "pass" ||
      row.docsSurfaceStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-presentation-runtime-performance-blocked"
        : ready
          ? "ready-presentation-runtime-performance-locked"
          : "ready-presentation-runtime-optimized";

  return {
    version: ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_VERSION,
    presentationRuntimePerformanceProfile: ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_PROFILE,
    status,
    classification: classifyPresentationRuntimePerformance({ status, audits, ready }),
    maintenanceEvidenceIndexVersion: ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION,
    rowCount: rows.length,
    completedRowCount: completed.length,
    audits,
    rows,
    readyRowId: ready?.id ?? "",
    focusedCommand: "npm run test:atlas:presentation-runtime-performance",
    presentationRuntimeVerifyCommand: "npm run verify:atlas:presentation-runtime",
    maintenanceEvidenceVerifyCommand: "npm run verify:atlas:maintenance-evidence",
    gaiaRuntimePolicy: "gaia-uniform-write-dedupe-static-instance-attributes",
    constellationRuntimePolicy: "constellation-frame-signature-material-write-dedupe",
    labelRuntimePolicy: "label-dom-visible-style-write-dedupe",
    budgetThresholdPolicy: "v97-v99-v75-browser-thresholds-preserved",
    presentationRuntimePerformance: "applied-presentation-runtime-cost-only",
    browserAcceptanceCostMutation: "not-applied",
    runtimePerformanceMutation: "not-applied",
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
    trustedBoundary: ATLAS_PRESENTATION_RUNTIME_PERFORMANCE_BOUNDARY,
  };
}

function classifyPresentationRuntimePerformance(args: {
  status: AtlasPresentationRuntimePerformanceSummary["status"];
  audits: readonly AtlasPresentationRuntimePerformanceAudit[];
  ready: AtlasPresentationRuntimePerformanceRow | null;
}): AtlasPresentationRuntimePerformanceClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (args.audits.some((audit) => audit.id === "v102-maintenance-evidence-index" && audit.status !== "ready")) {
    return "v102-regression";
  }
  if (args.audits.some((audit) => audit.id === "gaia-runtime-lock" && audit.status !== "ready")) {
    return "gaia-runtime-regression";
  }
  if (args.audits.some((audit) => audit.id === "constellation-runtime-lock" && audit.status !== "ready")) {
    return "constellation-runtime-regression";
  }
  if (args.audits.some((audit) => audit.id === "label-runtime-lock" && audit.status !== "ready")) {
    return "label-runtime-regression";
  }
  if (args.audits.some((audit) => audit.id === "budget-threshold-lock" && audit.status !== "ready")) {
    return "budget-threshold-regression";
  }
  if (args.audits.some((audit) => audit.id === "docs-surface-lock" && audit.status !== "ready")) {
    return "docs-surface-regression";
  }
  if (args.audits.some((audit) => audit.id === "protected-mutation-lock" && audit.status !== "ready")) {
    return "protected-mutation-regression";
  }
  if (args.ready) return "presentation-runtime-performance-pass";
  return "mixed";
}
