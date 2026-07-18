import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE } from "../data/nebulaCatalog";
import {
  createAtlasPostEnhancementMaintenanceBaselineSummary,
} from "./atlasPostEnhancementMaintenanceBaseline";
import {
  runAtlasPostEnhancementMaintenanceBaselineAudit,
  v100PostEnhancementMaintenanceBaselineCommandContract,
} from "./atlasPostEnhancementMaintenanceBaselineRunner";
import {
  readAtlasHorizonsFixtureFileAudit,
} from "./atlasHorizonsProvenanceFreezeRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

describe("v100 post-enhancement maintenance baseline audit", () => {
  it("locks v96, v97, v98, v99, browser resources, entrypoints, docs and protected mutations", async () => {
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
    ].join("\n");
    const browserSpecText = readFileSync(
      resolve(process.cwd(), "tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      "utf8",
    );
    const freshConfigText = readFileSync(
      resolve(process.cwd(), "playwright.atlas.fresh.config.ts"),
      "utf8",
    );
    const gaiaBright = JSON.parse(
      readFileSync(resolve(process.cwd(), "dist/content-packs/files/core/data/gaia-dr3-bright-5000.json"), "utf8"),
    ) as unknown[];
    const gaiaKinematics = JSON.parse(
      readFileSync(resolve(process.cwd(), "dist/content-packs/files/core/data/gaia-dr3-kinematics-2000.json"), "utf8"),
    ) as unknown[];

    const { audits, rows } = await runAtlasPostEnhancementMaintenanceBaselineAudit({
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
      gaiaBrightRowCount: gaiaBright.length,
      gaiaKinematicsRowCount: gaiaKinematics.length,
      constellationRenderGroupCount: CONSTELLATION_LINES.length,
      normalizedIauConstellationCount: 88,
      nebulaMarkerCount: NEBULAE.length,
    });
    const summary = createAtlasPostEnhancementMaintenanceBaselineSummary({ audits, rows });
    const row = summary.rows[0]!;

    expect(v100PostEnhancementMaintenanceBaselineCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:post-enhancement-baseline",
      postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement",
      scientificVerifyCommand: "npm run verify:atlas:scientific",
      browserFreshCommand: "npm run test:atlas:browser:fresh",
      mobileRenderBudget: 1000,
      balancedRenderBudget: 1800,
      denseRenderBudget: 3000,
      mobileOpacityCap: 0.62,
      balancedOpacityCap: 1.05,
      denseOpacityCap: 1.2,
      closeupOpacityCap: 0.18,
      baselinePolicy: "pure-maintenance-lock-no-performance-optimization",
    });
    expect(packageJson.scripts["test:atlas:post-enhancement-baseline"]).toBe(
      "vitest run app/lib/atlasPostEnhancementMaintenanceBaseline.horizons.test.ts",
    );
    expect(packageJson.scripts["verify:atlas:post-enhancement"]).toBe(
      "npm run test:atlas:post-enhancement-baseline && npm run verify:atlas:scientific",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      ["v96-baseline-lock", "ready", "ready-maintenance-baseline-locked; final-maintenance-baseline-pass"],
      ["v97-gaia-overlay-lock", "ready", "ready-gaia-overlay-locked; gaia-overlay-pass"],
      ["v98-relativity-observability-lock", "ready", "ready-relativity-optimization-locked; relativity-optimization-pass"],
      ["v99-art-polish-lock", "ready", "ready-art-polish-locked; art-polish-pass"],
      [
        "browser-resource-lifecycle-lock",
        "ready",
        "about:blank unload; ImageBitmap.close; screenshot retry; 3015 teardown; Watchpack noise documented",
      ],
      ["verification-entrypoint-lock", "ready", expect.any(String)],
      ["docs-surface-lock", "ready", "v100 docs and surface markers present"],
      [
        "protected-mutation-lock",
        "ready",
        "all protected post-enhancement mutation flags not-applied; Gaia budgets and opacity caps locked",
      ],
    ]);
    expect(summary.status).toBe("ready-post-enhancement-baseline-locked");
    expect(summary.classification).toBe("post-enhancement-baseline-pass");
    expect(row.status).toBe("complete");
    expect(row.finalBaselineStatus).toBe("pass");
    expect(row.gaiaOverlayStatus).toBe("pass");
    expect(row.relativityObservabilityStatus).toBe("pass");
    expect(row.artPolishStatus).toBe("pass");
    expect(row.browserResourceStatus).toBe("pass");
    expect(row.verificationEntrypointStatus).toBe("pass");
    expect(row.docsSurfaceStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(summary.postEnhancementBaseline).toBe("applied-maintenance-lock-only");
    expect(summary.gaiaRenderBudget).toEqual({ mobile: 1000, balanced: 1800, dense: 3000 });
    expect(summary.artOpacityCaps).toEqual({ mobile: 0.62, balanced: 1.05, dense: 1.2, closeup: 0.18 });
    expect(summary.relativityTeachingPolicy).toBe("v98-teaching-observability-not-scientific-upgrade");
    expect(summary.performanceOptimizationMutation).toBe("not-applied");
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
