import { readProjectSourceBundle } from "../test-utils/sourceBundles";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE } from "../data/nebulaCatalog";
import { createAtlasFinalGaiaArtEnhancementSummary } from "./atlasFinalGaiaArtEnhancementLock";
import {
  runAtlasFinalGaiaArtEnhancementAudit,
  v105FinalGaiaArtEnhancementCommandContract,
} from "./atlasFinalGaiaArtEnhancementLockRunner";
import { readAtlasHorizonsFixtureFileAudit } from "./atlasHorizonsProvenanceFreezeRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v105 final Gaia art enhancement audit", () => {
  it("locks budget-preserved Gaia selection, visual mapping, surface markers and v104 reuse", async () => {
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
      readFileSync(resolve(process.cwd(), "app/lib/atlasFinalGaiaArtEnhancementLock.ts"), "utf8"),
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

    const { audits, rows } = await runAtlasFinalGaiaArtEnhancementAudit({
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
    const summary = createAtlasFinalGaiaArtEnhancementSummary({ audits, rows });
    const row = summary.rows[0]!;

    expect(v105FinalGaiaArtEnhancementCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:final-gaia-art-enhancement",
      finalGaiaArtVerifyCommand: "npm run verify:atlas:final-gaia-art",
      defaultFreshCommand: "npm run test:atlas:browser:fresh",
      screenshotArtifactDirectory: "test-results/v105-final-gaia-art-enhancement-lock/",
      gaiaSelectionPolicy: "deterministic-bright-near-color-spread-sky-binned",
    });
    expect(packageJson.scripts["test:atlas:final-gaia-art-enhancement"]).toBe(
      "vitest run app/lib/atlasFinalGaiaArtEnhancementLock.horizons.test.ts",
    );
    expect(packageJson.scripts["verify:atlas:final-gaia-art"]).toBe(
      "npm run test:atlas:final-gaia-art-enhancement && npm run verify:atlas:browser-acceptance-runtime",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      [
        "v104-browser-acceptance-runtime-cost",
        "ready",
        "ready-browser-acceptance-runtime-cost-locked; browser-acceptance-runtime-cost-pass",
      ],
      ["gaia-selection-lock", "ready", "deterministic ranking used before maxInstances slice"],
      ["gaia-visual-mapping-lock", "ready", "budget-preserved brightness/color mapping applied"],
      [
        "constellation-nebula-readability-lock",
        "ready",
        "overview/dense readability improved while closeup/mobile restraint remains",
      ],
      ["browser-qa-lock", "ready", "v105 browser QA markers present"],
      ["budget-boundary-lock", "ready", "v97 budgets and v99 opacity caps preserved"],
      ["docs-surface-lock", "ready", "v105 docs and surface markers present"],
      [
        "protected-mutation-lock",
        "ready",
        "protected mutation flags not-applied; budget-preserved Gaia art polish applied",
      ],
    ]);
    expect(summary.status).toBe("ready-final-gaia-art-locked");
    expect(summary.classification).toBe("final-gaia-art-pass");
    expect(row.status).toBe("complete");
    expect(row.v104Status).toBe("pass");
    expect(row.gaiaSelectionStatus).toBe("pass");
    expect(row.gaiaVisualMappingStatus).toBe("pass");
    expect(row.constellationNebulaReadabilityStatus).toBe("pass");
    expect(row.browserQaStatus).toBe("pass");
    expect(row.budgetBoundaryStatus).toBe("pass");
    expect(row.docsSurfaceStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(summary.gaiaRenderBudget).toEqual({ mobile: 1000, balanced: 1800, dense: 3000 });
    expect(summary.opacityCaps).toEqual({ mobile: 0.62, balanced: 1.05, dense: 1.2, closeup: 0.18 });
    expect(summary.budgetMutation).toBe("not-applied");
    expect(summary.fixtureDataMutation).toBe("not-applied");
    expect(summary.skyAssetMutation).toBe("not-applied");
    expect(summary.v9SkyDirectionMutation).toBe("not-applied");
    expect(summary.certificationClaimMutation).toBe("not-applied");
    expect(summary.trustedBoundary).toContain("V9 sky/background direction");
  }, 420_000);
});
