import { readProjectSourceBundle } from "../test-utils/sourceBundles";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE } from "../data/nebulaCatalog";
import {
  createAtlasInteractionCatalogCompletionSummary,
} from "./atlasInteractionCatalogCompletionLock";
import {
  runAtlasInteractionCatalogCompletionAudit,
  v107InteractionCatalogCommandContract,
} from "./atlasInteractionCatalogCompletionLockRunner";
import { readAtlasHorizonsFixtureFileAudit } from "./atlasHorizonsProvenanceFreezeRunner";
import {
  V87_CANDIDATE_FIXTURE_PATH,
  V87_CURRENT_STRICT_FIXTURE_PATH,
} from "./atlasStrictHorizonsMigrationDryRun";
import { loadHorizonsValidationDatasetFromJson } from "./relativityValidation";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v107 interaction and catalog completion heavy audit", () => {
  it("reuses v106 and locks camera, launch, Gaia labels and local catalog boundaries", async () => {
    const packageJson = JSON.parse(read("package.json")) as {
      scripts: Record<string, string>;
    };
    const priorSurfaceFiles = [
      "app/UniverseRuntimeController.tsx",
      "app/components/GaiaStarOverlay.tsx",
      "app/components/GaiaStarField.tsx",
      "app/components/ConstellationLines.tsx",
      "app/components/NebulaMarkers.tsx",
      "app/components/UniverseScene.tsx",
      "app/components/RelativityObservableAtlasPanel.tsx",
      "app/components/KerrBlackHolePanel.tsx",
      "app/components/PhysicsPerformanceHud.tsx",
      "app/lib/evidenceLedger.ts",
      "app/lib/atlasValidationConsole.ts",
      "app/lib/atlasOfflineRuntimeBoundaryAudit.ts",
      "app/lib/atlasScientificGateMaintenanceRunbook.ts",
      "app/lib/atlasScientificGateReleaseEvidence.ts",
      "app/lib/atlasBrowserCiStabilityLock.ts",
      "app/lib/atlasReleaseArtifactManifestLock.ts",
      "app/lib/atlasFinalMaintenanceBaseline.ts",
      "app/lib/atlasGaiaStarfieldEnhancement.ts",
      "app/lib/atlasRelativitySimulationOptimization.ts",
      "app/lib/atlasArtPolish.ts",
      "app/lib/atlasPostEnhancementMaintenanceBaseline.ts",
      "app/lib/atlasBrowserResourcePerformanceLock.ts",
      "app/lib/atlasMaintenanceEvidenceIndex.ts",
      "app/lib/atlasPresentationRuntimePerformanceLock.ts",
      "app/lib/atlasBrowserAcceptanceRuntimeCostLock.ts",
      "app/lib/atlasFinalGaiaArtEnhancementLock.ts",
      "app/lib/atlasRcEvidenceClosureLock.ts",
      "app/lib/atlasInteractionCatalogCompletionLock.ts",
    ];
    const surfaceText = priorSurfaceFiles.map((file) => readProjectSourceBundle(file)).join("\n");
    const docsText = `${read("README.md")}\n${read("docs/TECHNICAL_OVERVIEW.md")}`;
    const browserSpecText = read("tests/atlas-browser/atlas-browser-acceptance.spec.ts");
    const baselineDataset = loadHorizonsValidationDatasetFromJson(
      read(V87_CURRENT_STRICT_FIXTURE_PATH),
    );
    const v82HierarchyDataset = loadHorizonsValidationDatasetFromJson(
      read("public/data/horizons-validation-j2000-barycenter-candidate.json"),
    );
    const v84OuterSystemDataset = loadHorizonsValidationDatasetFromJson(
      read(V87_CANDIDATE_FIXTURE_PATH),
    );
    const gaiaBright = JSON.parse(read("dist/content-packs/files/core/data/gaia-dr3-bright-5000.json")) as unknown[];
    const gaiaKinematics = JSON.parse(read("dist/content-packs/files/core/data/gaia-dr3-kinematics-2000.json")) as unknown[];
    const cameraText = `${read("app/lib/cameraFocusCommand.ts")}\n${read("app/components/UniverseScene.tsx")}`;
    const launchText = `${read("app/components/OrbitAtlasHud.tsx")}\n${read("app/lib/launchMissionProfiles.ts")}`;
    const gaiaText = [
      read("app/lib/gaiaCatalogStore.ts"),
      read("app/lib/gaiaCatalogIndex.ts"),
      read("app/lib/atlasNavigator.ts"),
      read("app/components/GaiaStarLabels.tsx"),
      read("app/components/ConstellationLabels.tsx"),
    ].join("\n");

    const result = await runAtlasInteractionCatalogCompletionAudit({
      baselineDataset,
      v82HierarchyDataset,
      v84OuterSystemDataset,
      packageScripts: packageJson.scripts,
      migratedFixtureAudit: readAtlasHorizonsFixtureFileAudit(V87_CANDIDATE_FIXTURE_PATH),
      legacyFixtureAudit: readAtlasHorizonsFixtureFileAudit(V87_CURRENT_STRICT_FIXTURE_PATH),
      docsText,
      surfaceText,
      browserSpecText,
      freshConfigText: read("playwright.atlas.fresh.config.ts"),
      freshTeardownText: read("tests/atlas-browser/atlas-browser-fresh-teardown.ts"),
      gaiaBrightRowCount: gaiaBright.length,
      gaiaKinematicsRowCount: gaiaKinematics.length,
      constellationRenderGroupCount: CONSTELLATION_LINES.length,
      normalizedIauConstellationCount: 88,
      nebulaMarkerCount: NEBULAE.length,
      gaiaStarCatalogText: read("app/data/gaiaStarCatalog.ts"),
      gaiaStarFieldText: read("app/components/GaiaStarField.tsx"),
      constellationLinesText: read("app/components/ConstellationLines.tsx"),
      nebulaMarkersText: read("app/components/NebulaMarkers.tsx"),
      bodyLabelText: read("app/components/BodyLabel.tsx"),
      celestialCatalogLabelsText: read("app/components/CelestialCatalogLabels.tsx"),
      cameraText,
      launchText,
      gaiaText,
      constellationCount: CONSTELLATION_LINES.length,
      nebulaCount: NEBULAE.length,
    });
    const summary = createAtlasInteractionCatalogCompletionSummary(result);

    expect(v107InteractionCatalogCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:interaction-catalog-completion",
      verifyCommand: "npm run verify:atlas:interaction-catalog",
      rcEvidenceVerifyCommand: "npm run verify:atlas:rc-evidence",
      screenshotArtifactDirectory:
        "test-results/v107-interaction-catalog-completion-lock/",
    });
    expect(summary.status).toBe("ready-interaction-catalog-locked");
    expect(summary.classification).toBe("interaction-catalog-completion-pass");
    expect(summary.audits.every((audit) => audit.status === "ready")).toBe(true);
    expect(NEBULAE).toHaveLength(80);
    expect(CONSTELLATION_LINES).toHaveLength(88);
  }, 420_000);
});
