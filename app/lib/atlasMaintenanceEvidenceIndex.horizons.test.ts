import { readProjectSourceBundle } from "../test-utils/sourceBundles";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE } from "../data/nebulaCatalog";
import {
  createAtlasMaintenanceEvidenceIndexSummary,
} from "./atlasMaintenanceEvidenceIndex";
import {
  runAtlasMaintenanceEvidenceIndexAudit,
  v102MaintenanceEvidenceIndexCommandContract,
} from "./atlasMaintenanceEvidenceIndexRunner";
import {
  readAtlasHorizonsFixtureFileAudit,
} from "./atlasHorizonsProvenanceFreezeRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v102 maintenance evidence index audit", () => {
  it("locks v93-v101 evidence index, dirty worktree policy, Watchpack noise policy and Browser QA index", async () => {
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
      readFileSync(resolve(process.cwd(), "app/components/GaiaStarOverlay.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/ConstellationLines.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/NebulaMarkers.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/UniverseScene.tsx"), "utf8"),
      readProjectSourceBundle("app/components/RelativityObservableAtlasPanel.tsx"),
      readFileSync(resolve(process.cwd(), "app/components/KerrBlackHolePanel.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/PhysicsPerformanceHud.tsx"), "utf8"),
      readProjectSourceBundle("app/lib/evidenceLedger.ts"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasValidationConsole.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasOfflineRuntimeBoundaryAudit.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasScientificGateMaintenanceRunbook.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasScientificGateReleaseEvidence.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasBrowserCiStabilityLock.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasReleaseArtifactManifestLock.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasFinalMaintenanceBaseline.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasGaiaStarfieldEnhancement.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasRelativitySimulationOptimization.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasArtPolish.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasPostEnhancementMaintenanceBaseline.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasBrowserResourcePerformanceLock.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasMaintenanceEvidenceIndex.ts"), "utf8"),
    ].join("\n");
    const browserSpecText = readFileSync(
      resolve(process.cwd(), "tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      "utf8",
    );
    const freshConfigText = readFileSync(
      resolve(process.cwd(), "playwright.atlas.fresh.config.ts"),
      "utf8",
    );
    const freshTeardownText = readFileSync(
      resolve(process.cwd(), "tests/atlas-browser/atlas-browser-fresh-teardown.ts"),
      "utf8",
    );
    const gaiaBright = JSON.parse(
      readFileSync(resolve(process.cwd(), "dist/content-packs/files/core/data/gaia-dr3-bright-5000.json"), "utf8"),
    ) as unknown[];
    const gaiaKinematics = JSON.parse(
      readFileSync(resolve(process.cwd(), "dist/content-packs/files/core/data/gaia-dr3-kinematics-2000.json"), "utf8"),
    ) as unknown[];

    const { audits, rows } = await runAtlasMaintenanceEvidenceIndexAudit({
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
      freshTeardownText,
      gaiaBrightRowCount: gaiaBright.length,
      gaiaKinematicsRowCount: gaiaKinematics.length,
      constellationRenderGroupCount: CONSTELLATION_LINES.length,
      normalizedIauConstellationCount: 88,
      nebulaMarkerCount: NEBULAE.length,
    });
    const summary = createAtlasMaintenanceEvidenceIndexSummary({ audits, rows });
    const row = summary.rows[0]!;

    expect(v102MaintenanceEvidenceIndexCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:maintenance-evidence-index",
      maintenanceEvidenceVerifyCommand: "npm run verify:atlas:maintenance-evidence",
      browserResourceVerifyCommand: "npm run verify:atlas:browser-resource",
      postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement",
      scientificVerifyCommand: "npm run verify:atlas:scientific",
      screenshotArtifactDirectoryCount: 9,
      dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit",
      watchpackNoisePolicy: "dumpstack-pagefile-known-non-failure-noise",
      evidenceIndexPolicy: "maintenance-evidence-index-only",
    });
    expect(packageJson.scripts["test:atlas:maintenance-evidence-index"]).toBe(
      "vitest run app/lib/atlasMaintenanceEvidenceIndex.horizons.test.ts",
    );
    expect(packageJson.scripts["verify:atlas:maintenance-evidence"]).toBe(
      "npm run test:atlas:maintenance-evidence-index && npm run verify:atlas:browser-resource",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      [
        "v101-browser-resource-performance-lock",
        "ready",
        "ready-browser-resource-performance-locked; browser-resource-performance-pass",
      ],
      [
        "command-index-lock",
        "ready",
        "v93-v101 focused commands indexed; maintenance verify indexed",
      ],
      [
        "screenshot-artifact-index-lock",
        "ready",
        "v93-v95-v97-v102 screenshot directories indexed",
      ],
      ["dirty-worktree-policy-lock", "ready", "dirty worktree policy locked"],
      [
        "watchpack-noise-policy-lock",
        "ready",
        "DumpStack/pagefile known non-failure noise locked",
      ],
      [
        "browser-qa-index-lock",
        "ready",
        "Browser QA root/Observable/Evidence/Validation/console/teardown indexed",
      ],
      ["docs-surface-lock", "ready", "v102 docs and surface markers present"],
      [
        "protected-mutation-lock",
        "ready",
        "protected mutation flags not-applied; maintenance index only applied",
      ],
    ]);
    expect(summary.status).toBe("ready-maintenance-evidence-indexed");
    expect(summary.classification).toBe("maintenance-evidence-index-pass");
    expect(row.status).toBe("complete");
    expect(row.v101Status).toBe("pass");
    expect(row.commandIndexStatus).toBe("pass");
    expect(row.screenshotArtifactStatus).toBe("pass");
    expect(row.dirtyWorktreePolicyStatus).toBe("pass");
    expect(row.watchpackNoisePolicyStatus).toBe("pass");
    expect(row.browserQaIndexStatus).toBe("pass");
    expect(row.docsSurfaceStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(summary.maintenanceEvidenceIndex).toBe("applied-maintenance-index-only");
    expect(summary.runtimePerformanceMutation).toBe("not-applied");
    expect(summary.livePhysicsMutation).toBe("not-applied");
    expect(summary.workerPhysicsMutation).toBe("not-applied");
    expect(summary.rk4DefaultMutation).toBe("not-applied");
    expect(summary.eihOnePnMutation).toBe("not-applied");
    expect(summary.kerrKernelMutation).toBe("not-applied");
    expect(summary.skyAssetMutation).toBe("not-applied");
    expect(summary.backgroundMutation).toBe("not-applied");
    expect(summary.v9SkyDirectionMutation).toBe("not-applied");
    expect(summary.fixtureDataMutation).toBe("not-applied");
    expect(summary.budgetMutation).toBe("not-applied");
    expect(summary.releasePackagingMutation).toBe("not-applied");
    expect(summary.certificationClaimMutation).toBe("not-applied");
  }, 420_000);
});
