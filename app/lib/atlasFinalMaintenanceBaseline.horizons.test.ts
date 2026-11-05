import { readProjectSourceBundle } from "../test-utils/sourceBundles";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createAtlasFinalMaintenanceBaselineSummary,
} from "./atlasFinalMaintenanceBaseline";
import {
  runAtlasFinalMaintenanceBaselineAudit,
  v96FinalMaintenanceBaselineCommandContract,
} from "./atlasFinalMaintenanceBaselineRunner";
import {
  readAtlasHorizonsFixtureFileAudit,
} from "./atlasHorizonsProvenanceFreezeRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v96 final maintenance baseline", () => {
  it("locks final maintenance entrypoints, evidence chain, docs and post-baseline policy", async () => {
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
      readFileSync(resolve(process.cwd(), "app/lib/atlasBrowserCiStabilityLock.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasReleaseArtifactManifestLock.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasFinalMaintenanceBaseline.ts"), "utf8"),
    ].join("\n");
    const browserSpecText = readFileSync(
      resolve(process.cwd(), "tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      "utf8",
    );
    const freshConfigText = readFileSync(
      resolve(process.cwd(), "playwright.atlas.fresh.config.ts"),
      "utf8",
    );

    const { audits, rows } = await runAtlasFinalMaintenanceBaselineAudit({
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
    const summary = createAtlasFinalMaintenanceBaselineSummary({ audits, rows });
    const row = summary.baselineRows[0]!;

    expect(v96FinalMaintenanceBaselineCommandContract()).toEqual({
      productFullCommand: "npm run verify:atlas:full",
      scientificVerifyCommand: "npm run verify:atlas:scientific",
      releaseArtifactManifestCommand: "npm run test:atlas:release-artifact-manifest",
      browserCiStabilityCommand: "npm run test:atlas:browser-ci-stability",
      releaseEvidenceCommand: "npm run test:atlas:scientific-gate-release-evidence",
      maintenanceRunbookCommand: "npm run test:atlas:scientific-gate-runbook",
      provenanceFreezeCommand: "npm run test:atlas:horizons-provenance-freeze",
      offlineRuntimeBoundaryCommand: "npm run test:atlas:offline-runtime-boundary",
      migratedStrictGateCommand: "npm run test:atlas:horizons-scientific-gate",
      legacyV75AuditCommand: "npm run test:atlas:horizons-scientific-gate:legacy-v75",
      browserFreshCommand: "npm run test:atlas:browser:fresh",
      finalBaselinePolicy: "post-v96-scientific-mainline-requires-intentional-upgrade",
    });
    expect(packageJson.scripts["test:atlas:final-maintenance-baseline"]).toBe(
      "vitest run app/lib/atlasFinalMaintenanceBaseline.horizons.test.ts",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      ["v95-release-artifact-manifest-lock", "ready", "ready-artifact-manifest-locked; release-artifact-manifest-pass"],
      ["product-full-verify-entrypoint-lock", "ready", "npm run verify:atlas && npm run test:atlas:browser:fresh"],
      [
        "scientific-verify-entrypoint-lock",
        "ready",
        "npm run verify:atlas && npm run test:atlas:horizons-scientific-gate && npm run test:atlas:browser:fresh",
      ],
      ["scientific-gate-chain-lock", "ready", expect.any(String)],
      ["post-baseline-policy-lock", "ready", "post-v96 scientific mainline policy present"],
      ["docs-baseline-lock", "ready", "v96 final maintenance baseline docs present"],
      ["browser-surface-lock", "ready", "v96 final maintenance baseline surface present"],
      ["protected-mutation-lock", "ready", "all protected final baseline mutation flags not-applied"],
    ]);
    expect(summary.status).toBe("ready-maintenance-baseline-locked");
    expect(summary.classification).toBe("final-maintenance-baseline-pass");
    expect(row.status).toBe("complete");
    expect(row.artifactManifestStatus).toBe("pass");
    expect(row.productFullEntrypointStatus).toBe("pass");
    expect(row.scientificVerifyEntrypointStatus).toBe("pass");
    expect(row.scientificGateChainStatus).toBe("pass");
    expect(row.postBaselinePolicyStatus).toBe("pass");
    expect(row.docsBaselineStatus).toBe("pass");
    expect(row.browserSurfaceStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(summary.finalMaintenanceBaseline).toBe("applied-contract-only");
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
      "final-maintenance-baseline-not-nasa-jpl-certified",
    );
  }, 420_000);
});
