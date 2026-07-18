import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createAtlasReleaseArtifactManifestLockSummary,
} from "./atlasReleaseArtifactManifestLock";
import {
  runAtlasReleaseArtifactManifestLockAudit,
  v95ReleaseArtifactManifestCommandContract,
} from "./atlasReleaseArtifactManifestLockRunner";
import {
  readAtlasHorizonsFixtureFileAudit,
} from "./atlasHorizonsProvenanceFreezeRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v95 release artifact manifest lock", () => {
  it("locks command matrix, fixture artifacts, browser artifacts, docs and rollback boundary", async () => {
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
      readFileSync(resolve(process.cwd(), "app/components/RelativityObservableAtlasPanel.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/evidenceLedger.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasValidationConsole.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasOfflineRuntimeBoundaryAudit.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasScientificGateMaintenanceRunbook.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasScientificGateReleaseEvidence.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasBrowserCiStabilityLock.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasReleaseArtifactManifestLock.ts"), "utf8"),
    ].join("\n");
    const browserSpecText = readFileSync(
      resolve(process.cwd(), "tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      "utf8",
    );
    const freshConfigText = readFileSync(
      resolve(process.cwd(), "playwright.atlas.fresh.config.ts"),
      "utf8",
    );

    const { audits, rows } = await runAtlasReleaseArtifactManifestLockAudit({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
      packageScripts: packageJson.scripts,
      migratedFixtureAudit: readAtlasHorizonsFixtureFileAudit(V87_CANDIDATE_FIXTURE_PATH),
      legacyFixtureAudit: readAtlasHorizonsFixtureFileAudit(V87_CURRENT_STRICT_FIXTURE_PATH),
      docsText,
      surfaceText,
      browserSpecText,
      freshConfigText,
    });
    const summary = createAtlasReleaseArtifactManifestLockSummary({ audits, rows });
    const row = summary.manifestRows[0]!;

    expect(v95ReleaseArtifactManifestCommandContract()).toEqual({
      productFullCommand: "npm run verify:atlas:full",
      scientificVerifyCommand: "npm run verify:atlas:scientific",
      releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence",
      browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability",
      migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate",
      legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75",
      maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook",
      provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
      offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary",
      browserFreshCommand: "npm run test:atlas:browser:fresh",
      freshBrowserPort: 3015,
      v93ScreenshotGlob: "test-results/v93-scientific-gate-release-evidence-lock/**/*.png",
      v94ScreenshotGlob: "test-results/v94-browser-ci-stability-lock/**/*.png",
      rollbackInterpretation: "legacy-v75-rollback-blocker-evidence-only",
    });
    expect(packageJson.scripts["test:atlas:release-artifact-manifest"]).toBe(
      "vitest run app/lib/atlasReleaseArtifactManifestLock.horizons.test.ts",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      ["v93-release-evidence-lock", "ready", "ready-release-evidence-locked; release-evidence-pass"],
      ["v94-browser-ci-stability-lock", "ready", "ready-browser-ci-locked; browser-ci-stability-pass"],
      ["command-matrix-artifact-lock", "ready", expect.any(String)],
      ["fixture-artifact-lock", "ready", expect.any(String)],
      ["browser-artifact-lock", "ready", "v93/v94/v95 screenshot globs and fresh 3015 teardown policy indexed"],
      ["docs-artifact-lock", "ready", "v93/v94/v95 release artifact docs present"],
      ["rollback-boundary-lock", "ready", "legacy v75 rollback/blocker boundary preserved"],
      ["protected-mutation-lock", "ready", "all protected release artifact mutation flags not-applied"],
    ]);
    expect(summary.status).toBe("ready-artifact-manifest-locked");
    expect(summary.classification).toBe("release-artifact-manifest-pass");
    expect(row.status).toBe("complete");
    expect(row.releaseEvidenceStatus).toBe("pass");
    expect(row.browserCiStabilityStatus).toBe("pass");
    expect(row.commandMatrixStatus).toBe("pass");
    expect(row.fixtureArtifactStatus).toBe("pass");
    expect(row.browserArtifactStatus).toBe("pass");
    expect(row.docsArtifactStatus).toBe("pass");
    expect(row.rollbackBoundaryStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(summary.releaseArtifactManifestLock).toBe("applied-contract-only");
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
    expect(summary.defaultGateConfigMutation).toBe("not-applied");
    expect(summary.releasePackagingMutation).toBe("not-applied");
    expect(summary.certificationClaimMutation).toBe("not-applied");
    expect(summary.scientificCertificationStatus).toBe(
      "release-artifact-manifest-lock-not-nasa-jpl-certified",
    );
  }, 420_000);
});
