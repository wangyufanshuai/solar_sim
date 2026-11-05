import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import { V89_LEGACY_V75_STRICT_HORIZONS_COMMAND } from "./atlasDefaultStrictHorizonsMigration";
import type {
  AtlasScientificGateMaintenanceRunbookAudit,
  AtlasScientificGateMaintenanceRunbookClassification,
  AtlasScientificGateMaintenanceRunbookRow,
  AtlasScientificGateMaintenanceRunbookSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION =
  "v92-scientific-gate-maintenance-runbook-lock" as const;

export const ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_PROFILE =
  "v92-offline-gate-release-rollback-command-runbook" as const;

export const V92_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_BOUNDARY =
  "Local v92 maintenance runbook lock for the migrated and frozen offline strict Horizons scientific gate. It locks product verification, scientific verification, migrated strict gate, legacy v75 rollback audit, provenance freeze and offline/runtime boundary commands; it does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, fixture data, v75 budgets, or claim NASA/JPL certification.";

export const V92_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_ROW: AtlasScientificGateMaintenanceRunbookRow = {
  id: "v92-lock-offline-scientific-gate-maintenance-runbook",
  label: "Lock offline scientific gate maintenance and rollback runbook",
  productFullCommand: "npm run verify:atlas:full",
  currentScientificCommand: "npm run verify:atlas:scientific",
  migratedStrictGateCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
  legacyV75AuditCommand: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
  provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
  offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary",
  expectedInterpretation:
    "migrated-scientific-gate-passes-legacy-v75-is-rollback-audit-only",
  status: "not-run",
  commandOwnershipStatus: "not-run",
  provenanceFreezeStatus: "not-run",
  offlineRuntimeBoundaryStatus: "not-run",
  rollbackContractStatus: "not-run",
  docsRunbookStatus: "not-run",
  browserSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
  scientificGateMaintenanceRunbook: "applied-contract-only",
} as const;

export function createAtlasScientificGateMaintenanceRunbookSummary(
  args: {
    audits?: readonly AtlasScientificGateMaintenanceRunbookAudit[];
    rows?: readonly AtlasScientificGateMaintenanceRunbookRow[];
  } = {},
): AtlasScientificGateMaintenanceRunbookSummary {
  const audits = args.audits ?? [];
  const runbookRows = [
    args.rows?.find((row) => row.id === V92_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_ROW.id) ??
      V92_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_ROW,
  ];
  const completed = runbookRows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.commandOwnershipStatus === "pass" &&
        row.provenanceFreezeStatus === "pass" &&
        row.offlineRuntimeBoundaryStatus === "pass" &&
        row.rollbackContractStatus === "pass" &&
        row.docsRunbookStatus === "pass" &&
        row.browserSurfaceStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.commandOwnershipStatus !== "pass" ||
      row.provenanceFreezeStatus !== "pass" ||
      row.offlineRuntimeBoundaryStatus !== "pass" ||
      row.rollbackContractStatus !== "pass" ||
      row.docsRunbookStatus !== "pass" ||
      row.browserSurfaceStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-runbook-blocked"
        : ready
          ? "ready-runbook-locked"
          : "ready-rollback-audit-preserved";

  return {
    version: ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_VERSION,
    runbookProfile: ATLAS_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_PROFILE,
    status,
    classification: classifyScientificGateMaintenanceRunbook({
      status,
      audits,
      ready,
    }),
    runbookRowCount: runbookRows.length,
    completedRunbookRowCount: completed.length,
    audits,
    runbookRows,
    readyRunbookRowId: ready?.id ?? "",
    strictBudgetPositionRmsKm: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    strictBudgetVelocityRmsMs: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs,
    strictBudgetMercuryRatio:
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
    migratedDefaultFixturePath: V87_CANDIDATE_FIXTURE_PATH,
    legacyV75FixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
    scientificGateMaintenanceRunbook: "applied-contract-only",
    defaultGateConfigMutation: "not-applied",
    livePhysicsMutation: "not-applied",
    workerPhysicsMutation: "not-applied",
    rk4DefaultMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    skyAssetMutation: "not-applied",
    backgroundMutation: "not-applied",
    materialMutation: "not-applied",
    fixtureDataMutation: "not-applied",
    budgetMutation: "not-applied",
    certificationClaimMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    scientificCertificationStatus:
      "offline-gate-maintenance-runbook-not-nasa-jpl-certified",
    trustedBoundary: V92_SCIENTIFIC_GATE_MAINTENANCE_RUNBOOK_BOUNDARY,
  };
}

function classifyScientificGateMaintenanceRunbook(args: {
  status: AtlasScientificGateMaintenanceRunbookSummary["status"];
  audits: readonly AtlasScientificGateMaintenanceRunbookAudit[];
  ready: AtlasScientificGateMaintenanceRunbookRow | null;
}): AtlasScientificGateMaintenanceRunbookClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (
    args.audits.some(
      (audit) => audit.id === "command-ownership-lock" && audit.status !== "ready",
    )
  ) {
    return "command-ownership-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "v90-provenance-freeze-lock" && audit.status !== "ready",
    )
  ) {
    return "provenance-freeze-regression";
  }
  if (
    args.audits.some(
      (audit) =>
        audit.id === "v91-offline-runtime-boundary-lock" && audit.status !== "ready",
    )
  ) {
    return "offline-runtime-boundary-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "rollback-contract-lock" && audit.status !== "ready",
    )
  ) {
    return "rollback-contract-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "docs-runbook-lock" && audit.status !== "ready",
    )
  ) {
    return "docs-runbook-regression";
  }
  if (
    args.audits.some(
      (audit) => audit.id === "browser-surface-lock" && audit.status !== "ready",
    )
  ) {
    return "browser-surface-regression";
  }
  if (args.ready) return "maintenance-runbook-pass";
  return "mixed";
}
