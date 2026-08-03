import { readProjectSourceBundle } from "../test-utils/sourceBundles";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createAtlasScientificGateMaintenanceRunbookSummary,
} from "./atlasScientificGateMaintenanceRunbook";
import {
  runAtlasScientificGateMaintenanceRunbookAudit,
  v92ScientificGateMaintenanceRunbookCommandContract,
} from "./atlasScientificGateMaintenanceRunbookRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v92 scientific gate maintenance runbook", () => {
  it("locks the offline scientific gate maintenance commands and rollback contract", async () => {
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
    const surfaceText = [
      readFileSync(resolve(process.cwd(), "app/UniverseRuntimeController.tsx"), "utf8"),
      readProjectSourceBundle("app/components/RelativityObservableAtlasPanel.tsx"),
      readProjectSourceBundle("app/lib/evidenceLedger.ts"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasValidationConsole.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasOfflineRuntimeBoundaryAudit.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasScientificGateMaintenanceRunbook.ts"), "utf8"),
    ].join("\n");

    const { audits, rows } = await runAtlasScientificGateMaintenanceRunbookAudit({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
      packageScripts: packageJson.scripts,
      docsText,
      surfaceText,
    });
    const summary = createAtlasScientificGateMaintenanceRunbookSummary({
      audits,
      rows,
    });
    const row = summary.runbookRows[0]!;

    expect(v92ScientificGateMaintenanceRunbookCommandContract()).toEqual({
      productFullCommand: "npm run verify:atlas:full",
      currentScientificCommand: "npm run verify:atlas:scientific",
      migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate",
      legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75",
      provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
      offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary",
      migratedDefaultFixturePath:
        "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json",
      legacyV75FixturePath: "public/data/horizons-validation-j2000.json",
    });
    expect(packageJson.scripts["test:atlas:scientific-gate-runbook"]).toBe(
      "vitest run app/lib/atlasScientificGateMaintenanceRunbook.horizons.test.ts",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      ["v91-offline-runtime-boundary-lock", "ready", "ready-boundary-locked; offline-runtime-boundary-pass"],
      ["v90-provenance-freeze-lock", "ready", "ready-freeze-locked; freeze-lock-pass"],
      ["command-ownership-lock", "ready", expect.any(String)],
      ["rollback-contract-lock", "ready", "rollback runbook contract present"],
      ["docs-runbook-lock", "ready", "v92 docs runbook present"],
      ["browser-surface-lock", "ready", "v92 browser surface present"],
      ["protected-mutation-lock", "ready", "all protected runbook mutation flags not-applied"],
    ]);
    expect(summary.status).toBe("ready-runbook-locked");
    expect(summary.classification).toBe("maintenance-runbook-pass");
    expect(row.status).toBe("complete");
    expect(row.commandOwnershipStatus).toBe("pass");
    expect(row.provenanceFreezeStatus).toBe("pass");
    expect(row.offlineRuntimeBoundaryStatus).toBe("pass");
    expect(row.rollbackContractStatus).toBe("pass");
    expect(row.docsRunbookStatus).toBe("pass");
    expect(row.browserSurfaceStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(row.expectedInterpretation).toBe(
      "migrated-scientific-gate-passes-legacy-v75-is-rollback-audit-only",
    );
    expect(summary.scientificGateMaintenanceRunbook).toBe("applied-contract-only");
    expect(summary.defaultGateConfigMutation).toBe("not-applied");
    expect(summary.livePhysicsMutation).toBe("not-applied");
    expect(summary.workerPhysicsMutation).toBe("not-applied");
    expect(summary.rk4DefaultMutation).toBe("not-applied");
    expect(summary.eihOnePnMutation).toBe("not-applied");
    expect(summary.kerrKernelMutation).toBe("not-applied");
    expect(summary.skyAssetMutation).toBe("not-applied");
    expect(summary.backgroundMutation).toBe("not-applied");
    expect(summary.materialMutation).toBe("not-applied");
    expect(summary.fixtureDataMutation).toBe("not-applied");
    expect(summary.budgetMutation).toBe("not-applied");
    expect(summary.certificationClaimMutation).toBe("not-applied");
    expect(summary.scientificCertificationStatus).toBe(
      "offline-gate-maintenance-runbook-not-nasa-jpl-certified",
    );
  }, 420_000);
});
