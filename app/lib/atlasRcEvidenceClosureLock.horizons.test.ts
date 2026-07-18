import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE } from "../data/nebulaCatalog";
import { createAtlasRcEvidenceClosureSummary } from "./atlasRcEvidenceClosureLock";
import {
  runAtlasRcEvidenceClosureAudit,
  v106RcEvidenceClosureCommandContract,
} from "./atlasRcEvidenceClosureLockRunner";
import { readAtlasHorizonsFixtureFileAudit } from "./atlasHorizonsProvenanceFreezeRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v106 release candidate evidence closure audit", () => {
  it("locks RC evidence commands, Browser QA artifacts, repo hygiene policy and v105 reuse", async () => {
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
      readFileSync(resolve(process.cwd(), "app/components/GaiaStarField.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/ConstellationLines.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/NebulaMarkers.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/UniverseScene.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/RelativityObservableAtlasPanel.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/KerrBlackHolePanel.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/PhysicsPerformanceHud.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/evidenceLedger.ts"), "utf8"),
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
      readFileSync(resolve(process.cwd(), "app/lib/atlasPresentationRuntimePerformanceLock.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasBrowserAcceptanceRuntimeCostLock.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasFinalGaiaArtEnhancementLock.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasRcEvidenceClosureLock.ts"), "utf8"),
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

    const { audits, rows } = await runAtlasRcEvidenceClosureAudit({
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
      gaiaStarCatalogText: readFileSync(resolve(process.cwd(), "app/data/gaiaStarCatalog.ts"), "utf8"),
      gaiaStarFieldText: readFileSync(resolve(process.cwd(), "app/components/GaiaStarField.tsx"), "utf8"),
      constellationLinesText: readFileSync(resolve(process.cwd(), "app/components/ConstellationLines.tsx"), "utf8"),
      nebulaMarkersText: readFileSync(resolve(process.cwd(), "app/components/NebulaMarkers.tsx"), "utf8"),
      bodyLabelText: readFileSync(resolve(process.cwd(), "app/components/BodyLabel.tsx"), "utf8"),
      celestialCatalogLabelsText: readFileSync(resolve(process.cwd(), "app/components/CelestialCatalogLabels.tsx"), "utf8"),
    });
    const summary = createAtlasRcEvidenceClosureSummary({ audits, rows });
    const row = summary.rows[0]!;

    expect(v106RcEvidenceClosureCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:rc-evidence-closure",
      rcEvidenceVerifyCommand: "npm run verify:atlas:rc-evidence",
      finalGaiaArtVerifyCommand: "npm run verify:atlas:final-gaia-art",
      scientificVerifyCommand: "npm run verify:atlas:scientific",
      screenshotArtifactDirectory: "test-results/v106-release-candidate-evidence-closure-lock/",
      dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit",
    });
    expect(packageJson.scripts["test:atlas:rc-evidence-closure"]).toBe(
      "vitest run app/lib/atlasRcEvidenceClosureLock.horizons.test.ts",
    );
    expect(packageJson.scripts["verify:atlas:rc-evidence"]).toBe(
      "npm run test:atlas:rc-evidence-closure && npm run verify:atlas:final-gaia-art",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      [
        "v105-final-gaia-art-enhancement",
        "ready",
        "ready-final-gaia-art-locked; final-gaia-art-pass",
      ],
      ["command-matrix-lock", "ready", "v93-v106 focused and verify commands indexed"],
      ["browser-qa-lock", "ready", "v106 browser QA markers present"],
      ["artifact-index-lock", "ready", "v93-v105 screenshot artifact directories indexed with v106 screenshot path"],
      ["dirty-worktree-policy-lock", "ready", "dirty worktree policy preserves no reset/revert/clean/stage/commit"],
      ["watchpack-noise-policy-lock", "ready", "DumpStack.log.tmp and pagefile.sys known non-failure noise policy preserved"],
      ["docs-surface-lock", "ready", "v106 docs and surface markers present"],
      [
        "protected-mutation-lock",
        "ready",
        "protected mutation flags not-applied; RC evidence closure only applied",
      ],
    ]);
    expect(summary.status).toBe("ready-rc-evidence-closed");
    expect(summary.classification).toBe("rc-evidence-closure-pass");
    expect(row.status).toBe("complete");
    expect(row.v105Status).toBe("pass");
    expect(row.commandMatrixStatus).toBe("pass");
    expect(row.browserQaStatus).toBe("pass");
    expect(row.artifactIndexStatus).toBe("pass");
    expect(row.dirtyWorktreePolicyStatus).toBe("pass");
    expect(row.watchpackNoisePolicyStatus).toBe("pass");
    expect(row.docsSurfaceStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(summary.indexedScreenshotArtifactDirectories).toContain("test-results/v105-final-gaia-art-enhancement-lock/");
    expect(summary.releaseArchiveMutation).toBe("not-applied");
    expect(summary.stagingMutation).toBe("not-applied");
    expect(summary.commitMutation).toBe("not-applied");
    expect(summary.budgetMutation).toBe("not-applied");
    expect(summary.fixtureDataMutation).toBe("not-applied");
    expect(summary.v9SkyDirectionMutation).toBe("not-applied");
    expect(summary.trustedBoundary).toContain("release-candidate evidence closure");
  }, 420_000);
});
