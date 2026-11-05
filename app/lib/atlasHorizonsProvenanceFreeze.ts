import { ATLAS_PHYSICS_BENCHMARK_BUDGETS } from "./atlasPhysicsBenchmarkGate";
import {
  V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
} from "./atlasDefaultStrictHorizonsMigration";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import type {
  AtlasHorizonsProvenanceFreezeClassification,
  AtlasHorizonsProvenanceFreezeLockAudit,
  AtlasHorizonsProvenanceFreezeRow,
  AtlasHorizonsProvenanceFreezeSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION =
  "v90-horizons-provenance-freeze" as const;

export const ATLAS_HORIZONS_PROVENANCE_FREEZE_PROFILE =
  "v90-default-gate-command-fixture-hash-lock" as const;

export const V90_MIGRATED_FIXTURE_SHA256 =
  "0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D" as const;

export const V90_LEGACY_V75_FIXTURE_SHA256 =
  "7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B" as const;

export const V90_HORIZONS_PROVENANCE_FREEZE_BOUNDARY =
  "Local v90 freeze of the v89 offline strict Horizons scientific gate contract. It locks command ownership, v84/v75 fixture hashes, v75 budgets, legacy blocker evidence and offline-only scope; it does not mutate live runtime physics, worker physics, RK4 runtime defaults, EIH 1PN, Kerr, materials, backgrounds, sky assets, or claim NASA/JPL certification.";

export const V90_HORIZONS_PROVENANCE_FREEZE_ROW: AtlasHorizonsProvenanceFreezeRow = {
  id: "v90-freeze-v89-default-strict-gate-contract",
  label: "Freeze v89 default strict gate command and fixture provenance",
  defaultScientificCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
  legacyV75Command: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
  verifyScientificCommand:
    "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh",
  migratedFixturePath: V87_CANDIDATE_FIXTURE_PATH,
  migratedFixtureSha256: V90_MIGRATED_FIXTURE_SHA256,
  migratedFixtureSizeBytes: 21863,
  migratedFixtureVariant: "v84-outer-system-barycenter-reference",
  migratedTargetProvenanceRows: 12,
  legacyFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
  legacyFixtureSha256: V90_LEGACY_V75_FIXTURE_SHA256,
  legacyFixtureSizeBytes: 14678,
  status: "not-run",
  fixtureHashStatus: "not-run",
  commandOwnershipStatus: "not-run",
  budgetLockStatus: "not-run",
  legacyAuditStatus: "not-run",
  docsBoundaryStatus: "not-run",
  provenanceFreeze: "applied-offline-contract-only",
} as const;

export function createAtlasHorizonsProvenanceFreezeSummary(
  args: {
    lockAudits?: readonly AtlasHorizonsProvenanceFreezeLockAudit[];
    rows?: readonly AtlasHorizonsProvenanceFreezeRow[];
  } = {},
): AtlasHorizonsProvenanceFreezeSummary {
  const lockAudits = args.lockAudits ?? [];
  const freezeRows = [
    args.rows?.find((row) => row.id === V90_HORIZONS_PROVENANCE_FREEZE_ROW.id) ??
      V90_HORIZONS_PROVENANCE_FREEZE_ROW,
  ];
  const completed = freezeRows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.fixtureHashStatus === "pass" &&
        row.commandOwnershipStatus === "pass" &&
        row.budgetLockStatus === "pass" &&
        row.legacyAuditStatus === "expected-blocker-preserved" &&
        row.docsBoundaryStatus === "pass",
    ) ?? null;
  const hasLockRegression = lockAudits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.fixtureHashStatus !== "pass" ||
      row.commandOwnershipStatus !== "pass" ||
      row.budgetLockStatus !== "pass" ||
      row.legacyAuditStatus !== "expected-blocker-preserved" ||
      row.docsBoundaryStatus !== "pass",
  );
  const status =
    completed.length === 0 && lockAudits.length === 0
      ? "pending-runtime-run"
      : hasLockRegression || hasRowRegression
        ? "ready-freeze-blocked"
        : ready
          ? "ready-freeze-locked"
          : "ready-legacy-audit-preserved";

  return {
    version: ATLAS_HORIZONS_PROVENANCE_FREEZE_VERSION,
    freezeProfile: ATLAS_HORIZONS_PROVENANCE_FREEZE_PROFILE,
    status,
    classification: classifyHorizonsProvenanceFreeze({ status, lockAudits, ready }),
    freezeRowCount: freezeRows.length,
    completedFreezeRowCount: completed.length,
    lockAudits,
    freezeRows,
    readyFreezeRowId: ready?.id ?? "",
    strictBudgetPositionRmsKm: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsPositionRmsKm,
    strictBudgetVelocityRmsMs: ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsVelocityRmsMs,
    strictBudgetMercuryRatio:
      ATLAS_PHYSICS_BENCHMARK_BUDGETS.horizonsMercuryOnePnToNewtonRatio,
    provenanceFreeze: "applied-offline-contract-only",
    defaultGateConfigMutation: "not-applied",
    legacyAuditMutation: "not-applied",
    budgetMutation: "not-applied",
    physicsMutation: "not-applied",
    workerPhysicsMutation: "not-applied",
    rk4DefaultMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    skyAssetMutation: "not-applied",
    backgroundMutation: "not-applied",
    materialMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    runtimeCertificationStatus: "not-claimed-in-app",
    scientificCertificationStatus: "offline-gate-frozen-not-nasa-jpl-certified",
    trustedBoundary: V90_HORIZONS_PROVENANCE_FREEZE_BOUNDARY,
  };
}

function classifyHorizonsProvenanceFreeze(args: {
  status: AtlasHorizonsProvenanceFreezeSummary["status"];
  lockAudits: readonly AtlasHorizonsProvenanceFreezeLockAudit[];
  ready: AtlasHorizonsProvenanceFreezeRow | null;
}): AtlasHorizonsProvenanceFreezeClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (
    args.lockAudits.some(
      (audit) =>
        (audit.id === "default-scientific-command-lock" ||
          audit.id === "legacy-v75-command-lock" ||
          audit.id === "verify-scientific-command-lock") &&
        audit.status !== "ready",
    )
  ) {
    return "command-ownership-regression";
  }
  if (
    args.lockAudits.some(
      (audit) =>
        (audit.id === "migrated-fixture-hash-lock" ||
          audit.id === "legacy-fixture-hash-lock") &&
        audit.status !== "ready",
    )
  ) {
    return "fixture-hash-regression";
  }
  if (
    args.lockAudits.some(
      (audit) => audit.id === "migrated-fixture-provenance-lock" && audit.status !== "ready",
    )
  ) {
    return "fixture-provenance-regression";
  }
  if (
    args.lockAudits.some((audit) => audit.id === "v75-budget-lock" && audit.status !== "ready")
  ) {
    return "budget-regression";
  }
  if (
    args.lockAudits.some(
      (audit) =>
        (audit.id === "v89-default-migration-lock" ||
          audit.id === "legacy-v75-blocker-lock") &&
        audit.status !== "ready",
    )
  ) {
    return "legacy-audit-regression";
  }
  if (
    args.lockAudits.some(
      (audit) => audit.id === "docs-boundary-lock" && audit.status !== "ready",
    )
  ) {
    return "docs-boundary-regression";
  }
  if (args.ready) return "freeze-lock-pass";
  return "mixed";
}
