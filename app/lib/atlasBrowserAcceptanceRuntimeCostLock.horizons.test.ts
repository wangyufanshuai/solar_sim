import { readProjectSourceBundle } from "../test-utils/sourceBundles";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE } from "../data/nebulaCatalog";
import {
  createAtlasBrowserAcceptanceRuntimeCostSummary,
} from "./atlasBrowserAcceptanceRuntimeCostLock";
import {
  runAtlasBrowserAcceptanceRuntimeCostAudit,
  v104BrowserAcceptanceRuntimeCostCommandContract,
} from "./atlasBrowserAcceptanceRuntimeCostLockRunner";
import {
  readAtlasHorizonsFixtureFileAudit,
} from "./atlasHorizonsProvenanceFreezeRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v104 browser acceptance runtime cost audit", () => {
  it("locks browser screenshot manifests, marker coverage, teardown and v103 reuse", async () => {
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
      readFileSync(resolve(process.cwd(), "app/lib/atlasPresentationRuntimePerformanceLock.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasBrowserAcceptanceRuntimeCostLock.ts"), "utf8"),
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

    const { audits, rows } = await runAtlasBrowserAcceptanceRuntimeCostAudit({
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
      gaiaStarFieldText: readFileSync(resolve(process.cwd(), "app/components/GaiaStarField.tsx"), "utf8"),
      constellationLinesText: readFileSync(resolve(process.cwd(), "app/components/ConstellationLines.tsx"), "utf8"),
      bodyLabelText: readFileSync(resolve(process.cwd(), "app/components/BodyLabel.tsx"), "utf8"),
      celestialCatalogLabelsText: readFileSync(resolve(process.cwd(), "app/components/CelestialCatalogLabels.tsx"), "utf8"),
    });
    const summary = createAtlasBrowserAcceptanceRuntimeCostSummary({ audits, rows });
    const row = summary.rows[0]!;

    expect(v104BrowserAcceptanceRuntimeCostCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:browser-acceptance-runtime-cost",
      browserAcceptanceRuntimeVerifyCommand: "npm run verify:atlas:browser-acceptance-runtime",
      defaultFreshCommand: "npm run test:atlas:browser:fresh",
      fullReviewCommand: "npm run test:atlas:browser:fresh:review",
      screenshotManifestPolicy: "default-current-plus-core-full-review-history",
      markerCoveragePolicy: "root-observable-evidence-validation-preserved",
      consoleErrorPolicy: "console-page-error-zero-preserved",
      freshTeardownPolicy: "fresh-3015-teardown-preserved",
    });
    expect(packageJson.scripts["test:atlas:browser-acceptance-runtime-cost"]).toBe(
      "vitest run app/lib/atlasBrowserAcceptanceRuntimeCostLock.horizons.test.ts",
    );
    expect(packageJson.scripts["verify:atlas:browser-acceptance-runtime"]).toBe(
      "npm run test:atlas:browser-acceptance-runtime-cost && npm run test:atlas:browser:fresh",
    );
    expect(packageJson.scripts["test:atlas:browser:fresh:review"]).toBe(
      "node tests/atlas-browser/run-fresh-review.mjs",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      [
        "v103-presentation-runtime-performance",
        "ready",
        "ready-presentation-runtime-performance-locked; presentation-runtime-performance-pass",
      ],
      [
        "screenshot-workload-lock",
        "ready",
        "default/current screenshot manifest split with opt-in full historical review",
      ],
      ["marker-coverage-lock", "ready", "v104 marker coverage preserved"],
      ["fresh-teardown-lock", "ready", "fresh 3015 teardown preserved"],
      ["console-error-lock", "ready", "console/page-error zero checks preserved"],
      ["budget-threshold-lock", "ready", "pixel thresholds, retry/settle and v97/v99 budgets preserved"],
      ["docs-surface-lock", "ready", "v104 docs and surface markers present"],
      [
        "protected-mutation-lock",
        "ready",
        "protected mutation flags not-applied; browser screenshot manifest split applied",
      ],
    ]);
    expect(summary.status).toBe("ready-browser-acceptance-runtime-cost-locked");
    expect(summary.classification).toBe("browser-acceptance-runtime-cost-pass");
    expect(row.status).toBe("complete");
    expect(row.v103Status).toBe("pass");
    expect(row.screenshotWorkloadStatus).toBe("pass");
    expect(row.markerCoverageStatus).toBe("pass");
    expect(row.freshTeardownStatus).toBe("pass");
    expect(row.consoleErrorStatus).toBe("pass");
    expect(row.budgetThresholdStatus).toBe("pass");
    expect(row.docsSurfaceStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(summary.browserAcceptanceRuntimeCost).toBe("applied-browser-screenshot-manifest-split");
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
    expect(summary.trustedBoundary).toContain("V9 sky/background direction");
  }, 420_000);
});
