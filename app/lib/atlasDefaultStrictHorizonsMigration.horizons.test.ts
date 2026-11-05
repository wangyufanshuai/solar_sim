import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
} from "./atlasStrictHorizonsMigrationDryRun";
import { V88_STRICT_HORIZONS_SHADOW_GATE_ROW } from "./atlasStrictHorizonsShadowMigrationGate";
import {
  V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
  createAtlasDefaultStrictHorizonsMigrationSummary,
} from "./atlasDefaultStrictHorizonsMigration";
import {
  runAtlasDefaultStrictHorizonsMigrationAudit,
  v89DefaultStrictHorizonsMigrationCommandContract,
} from "./atlasDefaultStrictHorizonsMigrationRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v89 default strict Horizons scientific gate migration", () => {
  it("audits the migrated default gate and preserved legacy v75 blocker", async () => {
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

    const { lockAudits, rows } = await runAtlasDefaultStrictHorizonsMigrationAudit({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
      packageScripts: packageJson.scripts,
    });
    const summary = createAtlasDefaultStrictHorizonsMigrationSummary({
      lockAudits,
      rows,
    });
    const row = summary.migrationRows[0]!;

    expect(v89DefaultStrictHorizonsMigrationCommandContract()).toEqual({
      defaultScientificCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
      legacyV75Command: V89_LEGACY_V75_STRICT_HORIZONS_COMMAND,
      previousDefaultFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
      migratedDefaultFixturePath: V87_CANDIDATE_FIXTURE_PATH,
    });
    expect(packageJson.scripts["test:atlas:horizons-scientific-gate"]).toBe(
      "vitest run app/lib/atlasPhysicsBenchmarkGate.horizons.test.ts",
    );
    expect(packageJson.scripts["test:atlas:horizons-scientific-gate:legacy-v75"]).toBe(
      "vitest run app/lib/atlasPhysicsBenchmarkGate.legacy-v75.horizons.test.ts",
    );
    expect(packageJson.scripts["verify:atlas:scientific"]).toBe(
      "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh",
    );
    expect(summary.status).toBe("ready-default-gate-migrated");
    expect(summary.classification).toBe("default-gate-migrated-shadow-provenance");
    expect(summary.lockAudits.map((audit) => [audit.id, audit.status])).toEqual([
      ["v88-shadow-gate-lock", "ready"],
      ["default-scientific-command-lock", "ready"],
      ["legacy-v75-command-lock", "ready"],
      ["v75-budget-lock", "ready"],
      ["v84-reference-fixture-provenance", "ready"],
      ["legacy-v75-blocker-lock", "ready"],
    ]);
    expect(row.status).toBe("complete");
    expect(row.sourceShadowGateId).toBe(V88_STRICT_HORIZONS_SHADOW_GATE_ROW.id);
    expect(row.migratedBudgetStatus).toBe("pass");
    expect(row.legacyV75Status).toBe("expected-blocker-preserved");
    expect(row.previousDefaultFixturePath).toBe(V87_CURRENT_STRICT_FIXTURE_PATH);
    expect(row.migratedDefaultFixturePath).toBe(V87_CANDIDATE_FIXTURE_PATH);
    expect(row.migratedMassProfile).toBe("de440-system-gm");
    expect(row.migratedDtDays).toBe(0.125);
    expect(row.migratedSofteningAu).toBe(0);
    expect(row.migratedOnePnRmsPositionKm).toBeLessThanOrEqual(1_000_000);
    expect(row.migratedOnePnRmsVelocityMs).toBeLessThanOrEqual(10);
    expect(row.migratedMercuryOnePnToNewtonRatio).toBeLessThanOrEqual(1.02);
    expect(summary.defaultScientificGateMigration).toBe("applied-offline-gate-only");
    expect(summary.legacyV75AuditMutation).toBe("not-applied");
    expect(summary.budgetMutation).toBe("not-applied");
    expect(summary.physicsMutation).toBe("not-applied");
    expect(summary.workerPhysicsMutation).toBe("not-applied");
    expect(summary.rk4DefaultMutation).toBe("not-applied");
    expect(summary.eihOnePnMutation).toBe("not-applied");
    expect(summary.skyAssetMutation).toBe("not-applied");
    expect(summary.backgroundMutation).toBe("not-applied");
    expect(summary.materialMutation).toBe("not-applied");
    expect(summary.kerrKernelMutation).toBe("not-applied");
    expect(summary.scientificCertificationStatus).toBe(
      "offline-gate-migrated-not-nasa-jpl-certified",
    );
  }, 420_000);
});
