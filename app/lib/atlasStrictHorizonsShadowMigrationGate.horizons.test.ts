import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import {
  V88_STRICT_HORIZONS_SHADOW_MIGRATION_COMMAND,
  createAtlasStrictHorizonsShadowMigrationGateSummary,
} from "./atlasStrictHorizonsShadowMigrationGate";
import {
  runAtlasStrictHorizonsShadowMigrationGateAudit,
  v88StrictHorizonsShadowMigrationGateCommandContract,
} from "./atlasStrictHorizonsShadowMigrationGateRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v88 strict Horizons shadow migration gate", () => {
  it("runs the future strict-gate configuration as a passing non-applied shadow command", async () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const baselineDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(resolve(process.cwd(), V87_CURRENT_STRICT_FIXTURE_PATH), "utf8"),
    );
    const v82HierarchyDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(
        resolve(process.cwd(), "public/data/horizons-validation-j2000-barycenter-candidate.json"),
        "utf8",
      ),
    );
    const v84OuterSystemDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(resolve(process.cwd(), V87_CANDIDATE_FIXTURE_PATH), "utf8"),
    );

    expect(packageJson.scripts["test:atlas:horizons-scientific-gate"]).toBe(
      "vitest run app/lib/atlasPhysicsBenchmarkGate.horizons.test.ts",
    );
    expect(packageJson.scripts["test:atlas:horizons-shadow-migration-gate"]).toBe(
      "vitest run app/lib/atlasStrictHorizonsShadowMigrationGate.horizons.test.ts",
    );
    expect(baselineDataset.variant).toBeUndefined();
    expect(baselineDataset.targetProvenance).toBeUndefined();
    expect(v84OuterSystemDataset.variant).toBe("v84-outer-system-barycenter-reference");

    const { lockAudits, rows } = await runAtlasStrictHorizonsShadowMigrationGateAudit({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
    });
    const summary = createAtlasStrictHorizonsShadowMigrationGateSummary({
      lockAudits,
      rows,
    });
    const row = summary.shadowGateRows[0]!;

    expect(v88StrictHorizonsShadowMigrationGateCommandContract()).toEqual({
      currentDefaultCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
      shadowCommand: V88_STRICT_HORIZONS_SHADOW_MIGRATION_COMMAND,
      currentDefaultFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
      shadowFixturePath: V87_CANDIDATE_FIXTURE_PATH,
    });
    expect(summary.status).toBe("ready-shadow-gate-pass");
    expect(summary.classification).toBe("shadow-gate-pass-default-not-migrated");
    expect(summary.lockAudits.map((audit) => [audit.id, audit.status])).toEqual([
      ["v75-strict-fixture-lock", "ready"],
      ["v84-reference-fixture-provenance", "ready"],
      ["v75-budget-lock", "ready"],
      ["v87-migration-diff-lock", "ready"],
      ["default-strict-command-lock", "ready"],
      ["shadow-gate-contract-lock", "ready"],
    ]);
    expect(row.status).toBe("complete");
    expect(row.shadowBudgetStatus).toBe("pass");
    expect(row.currentDefaultFixturePath).toBe(V87_CURRENT_STRICT_FIXTURE_PATH);
    expect(row.shadowFixturePath).toBe(V87_CANDIDATE_FIXTURE_PATH);
    expect(row.shadowMassProfile).toBe("de440-system-gm");
    expect(row.shadowDtDays).toBe(0.125);
    expect(row.shadowSofteningAu).toBe(0);
    expect(row.currentDefaultCommand).toBe(V87_STRICT_SCIENTIFIC_GATE_COMMAND);
    expect(row.shadowCommand).toBe(V88_STRICT_HORIZONS_SHADOW_MIGRATION_COMMAND);
    expect(row.onePnRmsPositionKm).toBeLessThanOrEqual(1_000_000);
    expect(row.onePnRmsVelocityMs).toBeLessThanOrEqual(10);
    expect(row.mercuryOnePnToNewtonRatio).toBeLessThanOrEqual(1.02);
    expect(row.defaultStrictGateStatus).toBe("expected-fail-unchanged");
    expect(row.shadowGateMutationStatus).toBe("not-applied");
    expect(summary.defaultStrictFixtureMutation).toBe("not-applied");
    expect(summary.defaultStrictCommandMutation).toBe("not-applied");
    expect(summary.shadowGateCommandMutation).toBe("not-applied");
    expect(summary.defaultScientificGateMutation).toBe("not-applied");
    expect(summary.referenceFixtureAdoptionMutation).toBe("not-applied");
    expect(summary.budgetMutation).toBe("not-applied");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.workerPhysicsMutation).toBe("not-applied");
    expect(summary.rk4DefaultMutation).toBe("not-applied");
    expect(summary.eihOnePnMutation).toBe("not-applied");
    expect(summary.skyAssetMutation).toBe("not-applied");
    expect(summary.materialMutation).toBe("not-applied");
    expect(summary.kerrKernelMutation).toBe("not-applied");
    expect(summary.scientificCertificationStatus).toBe("shadow-only-default-gate-blocked");
    expect(summary.trustedBoundary).toContain("shadow strict Horizons gate rehearsal");
  }, 420_000);
});
