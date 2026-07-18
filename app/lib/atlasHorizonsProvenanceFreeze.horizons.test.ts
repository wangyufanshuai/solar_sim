import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import {
  V90_LEGACY_V75_FIXTURE_SHA256,
  V90_MIGRATED_FIXTURE_SHA256,
  createAtlasHorizonsProvenanceFreezeSummary,
} from "./atlasHorizonsProvenanceFreeze";
import {
  readAtlasHorizonsFixtureFileAudit,
  runAtlasHorizonsProvenanceFreezeAudit,
  v90HorizonsProvenanceFreezeCommandContract,
} from "./atlasHorizonsProvenanceFreezeRunner";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v90 Horizons provenance freeze", () => {
  it("audits fixture hashes, command ownership, v89 migration and docs boundary", async () => {
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
    const docsText = [
      readFileSync(resolve(process.cwd(), "README.md"), "utf8"),
      readFileSync(resolve(process.cwd(), "docs/TECHNICAL_OVERVIEW.md"), "utf8"),
    ].join("\n");

    const migratedFixtureAudit = readAtlasHorizonsFixtureFileAudit(V87_CANDIDATE_FIXTURE_PATH);
    const legacyFixtureAudit = readAtlasHorizonsFixtureFileAudit(V87_CURRENT_STRICT_FIXTURE_PATH);
    const { lockAudits, rows } = await runAtlasHorizonsProvenanceFreezeAudit({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
      packageScripts: packageJson.scripts,
      migratedFixtureAudit,
      legacyFixtureAudit,
      docsText,
    });
    const summary = createAtlasHorizonsProvenanceFreezeSummary({
      lockAudits,
      rows,
    });
    const row = summary.freezeRows[0]!;

    expect(v90HorizonsProvenanceFreezeCommandContract()).toEqual({
      defaultScientificCommand: "npm run test:atlas:horizons-scientific-gate",
      legacyV75Command: "npm run test:atlas:horizons-scientific-gate:legacy-v75",
      migratedFixturePath: V87_CANDIDATE_FIXTURE_PATH,
      legacyFixturePath: V87_CURRENT_STRICT_FIXTURE_PATH,
      migratedFixtureSha256: V90_MIGRATED_FIXTURE_SHA256,
      legacyFixtureSha256: V90_LEGACY_V75_FIXTURE_SHA256,
    });
    expect(packageJson.scripts["test:atlas:horizons-provenance-freeze"]).toBe(
      "vitest run app/lib/atlasHorizonsProvenanceFreeze.horizons.test.ts",
    );
    expect(migratedFixtureAudit).toEqual({
      path: V87_CANDIDATE_FIXTURE_PATH,
      sha256: V90_MIGRATED_FIXTURE_SHA256,
      sizeBytes: 21863,
    });
    expect(legacyFixtureAudit).toEqual({
      path: V87_CURRENT_STRICT_FIXTURE_PATH,
      sha256: V90_LEGACY_V75_FIXTURE_SHA256,
      sizeBytes: 14678,
    });
    expect(v84OuterSystemDataset.variant).toBe("v84-outer-system-barycenter-reference");
    expect(v84OuterSystemDataset.targetProvenance).toHaveLength(12);
    expect(summary.status).toBe("ready-freeze-locked");
    expect(summary.classification).toBe("freeze-lock-pass");
    expect(summary.lockAudits.map((audit) => [audit.id, audit.status])).toEqual([
      ["default-scientific-command-lock", "ready"],
      ["legacy-v75-command-lock", "ready"],
      ["verify-scientific-command-lock", "ready"],
      ["migrated-fixture-hash-lock", "ready"],
      ["legacy-fixture-hash-lock", "ready"],
      ["migrated-fixture-provenance-lock", "ready"],
      ["v75-budget-lock", "ready"],
      ["v89-default-migration-lock", "ready"],
      ["legacy-v75-blocker-lock", "ready"],
      ["docs-boundary-lock", "ready"],
    ]);
    expect(row.status).toBe("complete");
    expect(row.fixtureHashStatus).toBe("pass");
    expect(row.commandOwnershipStatus).toBe("pass");
    expect(row.budgetLockStatus).toBe("pass");
    expect(row.legacyAuditStatus).toBe("expected-blocker-preserved");
    expect(row.docsBoundaryStatus).toBe("pass");
    expect(summary.provenanceFreeze).toBe("applied-offline-contract-only");
    expect(summary.defaultGateConfigMutation).toBe("not-applied");
    expect(summary.legacyAuditMutation).toBe("not-applied");
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
      "offline-gate-frozen-not-nasa-jpl-certified",
    );
  }, 420_000);
});
