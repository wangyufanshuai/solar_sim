import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
  V87_STRICT_SCIENTIFIC_GATE_COMMAND,
  createAtlasStrictHorizonsMigrationDryRunSummary,
} from "./atlasStrictHorizonsMigrationDryRun";
import {
  runAtlasStrictHorizonsMigrationDryRunAudit,
  v87StrictMigrationDryRunCommandContract,
} from "./atlasStrictHorizonsMigrationDryRunRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v87 strict Horizons migration dry-run audit", () => {
  it("produces a non-applied default-gate migration diff from the passing v86 candidate", async () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const baselineDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(
        resolve(process.cwd(), V87_CURRENT_STRICT_FIXTURE_PATH),
        "utf8",
      ),
    );
    const v82HierarchyDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(
        resolve(
          process.cwd(),
          "public/data/horizons-validation-j2000-barycenter-candidate.json",
        ),
        "utf8",
      ),
    );
    const v84OuterSystemDataset = loadHorizonsValidationDatasetFromJson(
      readFileSync(resolve(process.cwd(), V87_CANDIDATE_FIXTURE_PATH), "utf8"),
    );

    expect(packageJson.scripts["test:atlas:horizons-scientific-gate"]).toBe(
      "vitest run app/lib/atlasPhysicsBenchmarkGate.horizons.test.ts",
    );
    expect(baselineDataset.variant).toBeUndefined();
    expect(baselineDataset.targetProvenance).toBeUndefined();
    expect(v84OuterSystemDataset.variant).toBe(
      "v84-outer-system-barycenter-reference",
    );

    const { lockAudits, rows } = await runAtlasStrictHorizonsMigrationDryRunAudit({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
    });
    const summary = createAtlasStrictHorizonsMigrationDryRunSummary({
      lockAudits,
      rows,
    });
    const row = summary.migrationDiffRows[0]!;

    expect(v87StrictMigrationDryRunCommandContract()).toEqual({
      currentStrictCommand: V87_STRICT_SCIENTIFIC_GATE_COMMAND,
      currentDefaultFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
      candidateFixturePath: V87_CANDIDATE_FIXTURE_PATH,
    });
    expect(summary.status).toBe("ready-migration-diff-complete");
    expect(summary.classification).toBe("default-gate-diff-ready");
    expect(summary.lockAudits.map((audit) => [audit.id, audit.status])).toEqual([
      ["v75-strict-fixture-lock", "ready"],
      ["v84-reference-fixture-provenance", "ready"],
      ["v75-budget-lock", "ready"],
      ["v86-candidate-gate-lock", "ready"],
      ["default-strict-command-lock", "ready"],
      ["migration-contract-lock", "ready"],
    ]);
    expect(row.status).toBe("complete");
    expect(row.diffStatus).toBe("complete");
    expect(row.candidateBudgetStatus).toBe("pass");
    expect(row.currentDefaultFixturePath).toBe(V87_CURRENT_STRICT_FIXTURE_PATH);
    expect(row.candidateFixturePath).toBe(V87_CANDIDATE_FIXTURE_PATH);
    expect(row.candidateMassProfile).toBe("de440-system-gm");
    expect(row.candidateDtDays).toBe(0.125);
    expect(row.candidateSofteningAu).toBe(0);
    expect(row.currentStrictCommand).toBe(V87_STRICT_SCIENTIFIC_GATE_COMMAND);
    expect(row.futureMigrationCommandTarget).toBe(V87_STRICT_SCIENTIFIC_GATE_COMMAND);
    expect(row.defaultStrictGateStatus).toBe("expected-fail-unchanged");
    expect(row.migrationMutationStatus).toBe("not-applied");
    expect(summary.defaultStrictFixtureMutation).toBe("not-applied");
    expect(summary.defaultStrictCommandMutation).toBe("not-applied");
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
    expect(summary.scientificCertificationStatus).toBe(
      "dry-run-only-default-gate-blocked",
    );
    expect(summary.trustedBoundary).toContain("dry-run audit");
  }, 420_000);
});
