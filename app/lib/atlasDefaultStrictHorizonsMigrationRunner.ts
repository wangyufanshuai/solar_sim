import { createAtlasPhysicsBenchmarkGateSummary } from "./atlasPhysicsBenchmarkGate";
import { V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED } from "./atlasHorizonsGateAudit";
import { v86StrictBudgetContract } from "./atlasHorizonsCandidateScientificGateRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import {
  createAtlasStrictHorizonsShadowMigrationGateSummary,
  V88_STRICT_HORIZONS_SHADOW_GATE_ROW,
} from "./atlasStrictHorizonsShadowMigrationGate";
import {
  runAtlasStrictHorizonsShadowMigrationGateAudit,
} from "./atlasStrictHorizonsShadowMigrationGateRunner";
import {
  V89_DEFAULT_STRICT_HORIZONS_MIGRATION_ROW,
  V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
} from "./atlasDefaultStrictHorizonsMigration";
import { runHorizonsValidationDataset } from "./horizonsValidationRunner";
import type {
  AtlasDefaultStrictHorizonsMigrationLockAudit,
  AtlasDefaultStrictHorizonsMigrationRow,
  HorizonsValidationDataset,
} from "./simulationDiagnosticsTypes";

export async function runAtlasDefaultStrictHorizonsMigrationAudit(args: {
  baselineDataset: HorizonsValidationDataset;
  v82HierarchyDataset?: HorizonsValidationDataset | null;
  v84OuterSystemDataset?: HorizonsValidationDataset | null;
  packageScripts?: Readonly<Record<string, string>>;
}): Promise<{
  lockAudits: readonly AtlasDefaultStrictHorizonsMigrationLockAudit[];
  rows: readonly AtlasDefaultStrictHorizonsMigrationRow[];
}> {
  const shadowGate = await runAtlasStrictHorizonsShadowMigrationGateAudit(args);
  const shadowSummary = createAtlasStrictHorizonsShadowMigrationGateSummary(shadowGate);
  const shadowRow = shadowSummary.shadowGateRows[0];
  const legacyRun = await runHorizonsValidationDataset(args.baselineDataset);
  const legacyGate = createAtlasPhysicsBenchmarkGateSummary(legacyRun);
  const legacyHorizons = legacyGate.results.find(
    (result) => result.id === "horizons-ten-year-eih-1pn",
  );
  const lockAudits = [
    shadowGateLock(shadowSummary.status, shadowRow?.shadowBudgetStatus ?? "not-run"),
    defaultCommandLock(args.packageScripts),
    legacyCommandLock(args.packageScripts),
    budgetLock(),
    fixtureLock(args.v84OuterSystemDataset),
    legacyBlockerLock(legacyHorizons?.status ?? "pending", legacyHorizons?.measured ?? ""),
  ] as const satisfies readonly AtlasDefaultStrictHorizonsMigrationLockAudit[];

  if (lockAudits.some((audit) => audit.status !== "ready")) {
    return {
      lockAudits,
      rows: [{ ...V89_DEFAULT_STRICT_HORIZONS_MIGRATION_ROW, status: "blocked" }],
    };
  }

  return {
    lockAudits,
    rows: [migrationRow(shadowRow)],
  };
}

function shadowGateLock(
  status: ReturnType<typeof createAtlasStrictHorizonsShadowMigrationGateSummary>["status"],
  budgetStatus: AtlasDefaultStrictHorizonsMigrationRow["migratedBudgetStatus"],
): AtlasDefaultStrictHorizonsMigrationLockAudit {
  const ready = status === "ready-shadow-gate-pass" && budgetStatus === "pass";
  return {
    id: "v88-shadow-gate-lock",
    label: "v88 shadow strict gate lock",
    status: ready ? "ready" : "blocked",
    measured: `${status}; shadow budget ${budgetStatus}`,
    expected: "ready-shadow-gate-pass; shadow budget pass",
    trustedBoundary:
      "The default migration can be ready only while the v88 shadow gate remains a passing, non-live-physics rehearsal.",
  };
}

function defaultCommandLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasDefaultStrictHorizonsMigrationLockAudit {
  const measured = packageScripts?.["test:atlas:horizons-scientific-gate"] ?? "missing";
  const expected = "vitest run app/lib/atlasPhysicsBenchmarkGate.horizons.test.ts";
  return {
    id: "default-scientific-command-lock",
    label: "default strict scientific command migrated",
    status: measured === expected ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary:
      "The command name is migrated by changing the offline test configuration behind the existing default scientific gate command, not by changing live runtime physics.",
  };
}

function legacyCommandLock(
  packageScripts: Readonly<Record<string, string>> | undefined,
): AtlasDefaultStrictHorizonsMigrationLockAudit {
  const measured = packageScripts?.["test:atlas:horizons-scientific-gate:legacy-v75"] ?? "missing";
  const expected = "vitest run app/lib/atlasPhysicsBenchmarkGate.legacy-v75.horizons.test.ts";
  return {
    id: "legacy-v75-command-lock",
    label: "legacy v75 strict blocker audit command",
    status: measured === expected ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary:
      "The legacy command is retained as rollback and blocker-preservation evidence. It is not the default scientific gate after v89.",
  };
}

function budgetLock(): AtlasDefaultStrictHorizonsMigrationLockAudit {
  const budget = v86StrictBudgetContract();
  const status =
    budget.horizonsPositionRmsKm === 1_000_000 &&
    budget.horizonsVelocityRmsMs === 10 &&
    budget.horizonsMercuryOnePnToNewtonRatio === 1.02
      ? "ready"
      : "regressed";
  return {
    id: "v75-budget-lock",
    label: "v75 strict budget lock",
    status,
    measured: `${budget.horizonsPositionRmsKm} km / ${budget.horizonsVelocityRmsMs} m/s / Mercury ${budget.horizonsMercuryOnePnToNewtonRatio}`,
    expected: "1,000,000 km / 10 m/s / Mercury 1.02",
    trustedBoundary:
      "v89 migrates the default offline fixture/model path only. It does not relax the inherited v75 numerical budget.",
  };
}

function fixtureLock(
  dataset: HorizonsValidationDataset | null | undefined,
): AtlasDefaultStrictHorizonsMigrationLockAudit {
  const status =
    dataset?.variant === "v84-outer-system-barycenter-reference" &&
    (dataset.targetProvenance?.length ?? 0) === 12
      ? "ready"
      : "regressed";
  return {
    id: "v84-reference-fixture-provenance",
    label: "v84 migrated reference fixture provenance",
    status,
    measured: `variant ${dataset?.variant ?? "missing"}; provenance ${dataset?.targetProvenance?.length ?? 0}`,
    expected: "v84-outer-system-barycenter-reference; 12 provenance rows",
    trustedBoundary:
      "The migrated default gate uses the existing v84 barycentric fixture and does not overwrite or regenerate Horizons data.",
  };
}

function legacyBlockerLock(
  status: string,
  measured: string,
): AtlasDefaultStrictHorizonsMigrationLockAudit {
  const ready = status === "fail" && measured === V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED;
  return {
    id: "legacy-v75-blocker-lock",
    label: "legacy v75 blocker preservation",
    status: ready ? "ready" : "regressed",
    measured: `${status}; ${measured}`,
    expected: `fail; ${V77_HORIZONS_LAST_KNOWN_FAILURE_MEASURED}`,
    trustedBoundary:
      "The old v75 center-reference path remains available as an expected-blocker audit, not as the default scientific gate.",
  };
}

function migrationRow(
  shadowRow:
    | {
        shadowBudgetStatus: "not-run" | "pass" | "fail";
        onePnRmsPositionKm: number | null;
        onePnRmsVelocityMs: number | null;
        mercuryOnePnToNewtonRatio: number | null;
      }
    | undefined,
): AtlasDefaultStrictHorizonsMigrationRow {
  const migratedBudgetStatus = shadowRow?.shadowBudgetStatus ?? "not-run";
  return {
    ...V89_DEFAULT_STRICT_HORIZONS_MIGRATION_ROW,
    sourceShadowGateId: V88_STRICT_HORIZONS_SHADOW_GATE_ROW.id,
    defaultScientificCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    legacyV75Command: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
    previousDefaultFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
    migratedDefaultFixturePath: V87_CANDIDATE_FIXTURE_PATH,
    status: migratedBudgetStatus === "pass" ? "complete" : "blocked",
    migratedOnePnRmsPositionKm: shadowRow?.onePnRmsPositionKm ?? null,
    migratedOnePnRmsVelocityMs: shadowRow?.onePnRmsVelocityMs ?? null,
    migratedMercuryOnePnToNewtonRatio: shadowRow?.mercuryOnePnToNewtonRatio ?? null,
    migratedBudgetStatus,
    legacyV75Status: "expected-blocker-preserved",
    defaultScientificGateMigration: "applied-offline-gate-only",
  };
}

export function v89DefaultStrictHorizonsMigrationCommandContract(): Readonly<{
  defaultScientificCommand: typeof V87_STRICT_SCIENTIFIC_GATE_COMMAND;
  legacyV75Command: typeof V89_LEGACY_V75_STRICT_HORIZONS_COMMAND;
  previousDefaultFixturePath: typeof V87_CURRENT_STRICT_FIXTURE_PATH;
  migratedDefaultFixturePath: typeof V87_CANDIDATE_FIXTURE_PATH;
}> {
  return {
    defaultScientificCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
    legacyV75Command: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
    previousDefaultFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
    migratedDefaultFixturePath: V87_CANDIDATE_FIXTURE_PATH,
  };
}
