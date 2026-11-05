import { readProjectSourceBundle } from "../test-utils/sourceBundles";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createAtlasScientificGateReleaseEvidenceSummary,
} from "./atlasScientificGateReleaseEvidence";
import {
  runAtlasScientificGateReleaseEvidenceAudit,
  v93ScientificGateReleaseEvidenceCommandContract,
} from "./atlasScientificGateReleaseEvidenceRunner";
import {
  readAtlasHorizonsFixtureFileAudit,
} from "./atlasHorizonsProvenanceFreezeRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v93 scientific gate release evidence bundle", () => {
  it("locks the release evidence matrix over runbook, boundary, freeze, commands and fixtures", async () => {
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
      readFileSync(resolve(process.cwd(), "app/lib/atlasScientificGateReleaseEvidence.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "tests/atlas-browser/atlas-browser-acceptance.spec.ts"), "utf8"),
    ].join("\n");

    const { audits, rows } = await runAtlasScientificGateReleaseEvidenceAudit({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
      packageScripts: packageJson.scripts,
      migratedFixtureAudit: readAtlasHorizonsFixtureFileAudit(V87_CANDIDATE_FIXTURE_PATH),
      legacyFixtureAudit: readAtlasHorizonsFixtureFileAudit(V87_CURRENT_STRICT_FIXTURE_PATH),
      docsText,
      surfaceText,
    });
    const summary = createAtlasScientificGateReleaseEvidenceSummary({
      audits,
      rows,
    });
    const row = summary.releaseEvidenceRows[0]!;

    expect(v93ScientificGateReleaseEvidenceCommandContract()).toEqual({
      productFullCommand: "npm run verify:atlas:full",
      scientificVerifyCommand: "npm run verify:atlas:scientific",
      maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook",
      provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
      offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary",
      migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate",
      legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75",
      migratedDefaultFixturePath:
        "public/data/horizons-validation-j2000-outer-system-barycenter-v84.json",
      legacyV75FixturePath: "public/data/horizons-validation-j2000.json",
      migratedFixtureSha256:
        "0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D",
      legacyFixtureSha256:
        "7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B",
    });
    expect(packageJson.scripts["test:atlas:scientific-gate-release-evidence"]).toBe(
      "vitest run app/lib/atlasScientificGateReleaseEvidence.horizons.test.ts",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      ["v92-runbook-lock", "ready", "ready-runbook-locked; maintenance-runbook-pass"],
      ["v91-offline-runtime-boundary-lock", "ready", "ready-boundary-locked; offline-runtime-boundary-pass"],
      ["v90-provenance-freeze-lock", "ready", "ready-freeze-locked; freeze-lock-pass"],
      ["command-evidence-matrix-lock", "ready", expect.any(String)],
      ["fixture-evidence-lock", "ready", expect.any(String)],
      ["docs-evidence-lock", "ready", "v93 release evidence docs present"],
      ["browser-evidence-lock", "ready", "v93 browser evidence surface present"],
      ["protected-mutation-lock", "ready", "all protected release evidence mutation flags not-applied"],
    ]);
    expect(summary.status).toBe("ready-release-evidence-locked");
    expect(summary.classification).toBe("release-evidence-pass");
    expect(row.status).toBe("complete");
    expect(row.runbookStatus).toBe("pass");
    expect(row.provenanceFreezeStatus).toBe("pass");
    expect(row.offlineRuntimeBoundaryStatus).toBe("pass");
    expect(row.commandMatrixStatus).toBe("pass");
    expect(row.fixtureEvidenceStatus).toBe("pass");
    expect(row.docsEvidenceStatus).toBe("pass");
    expect(row.browserEvidenceStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(row.migratedFixtureSha256).toBe(
      "0610A69D32B0BEAB829C70AEC7034CA0E45ADF420631A5FC13B9E0E2EE58D62D",
    );
    expect(row.legacyFixtureSha256).toBe(
      "7ACFF5ED1BEB284CF40DFE905B60ACFDE009E5EE5CE1787085353BD03DA5FD1B",
    );
    expect(row.migratedTargetProvenanceRows).toBe(12);
    expect(summary.scientificGateReleaseEvidence).toBe("applied-contract-only");
    expect(summary.defaultGateConfigMutation).toBe("not-applied");
    expect(summary.legacyAuditConfigMutation).toBe("not-applied");
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
      "offline-gate-release-evidence-not-nasa-jpl-certified",
    );
  }, 420_000);
});
