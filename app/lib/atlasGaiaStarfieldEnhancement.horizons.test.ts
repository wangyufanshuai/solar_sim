import { readProjectSourceBundle } from "../test-utils/sourceBundles";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE } from "../data/nebulaCatalog";
import {
  createAtlasGaiaStarfieldEnhancementSummary,
} from "./atlasGaiaStarfieldEnhancement";
import {
  runAtlasGaiaStarfieldEnhancementAudit,
  v97GaiaStarfieldEnhancementCommandContract,
} from "./atlasGaiaStarfieldEnhancementRunner";

describe("v97 Gaia starfield enhancement", () => {
  it("locks Gaia catalog, overlay budgets, V9 sky boundary, docs and browser surface", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const gaiaBrightRows = JSON.parse(
      readFileSync(resolve(process.cwd(), "dist/content-packs/files/core/data/gaia-dr3-bright-5000.json"), "utf8"),
    ) as unknown[];
    const gaiaKinematicsRows = JSON.parse(
      readFileSync(resolve(process.cwd(), "dist/content-packs/files/core/data/gaia-dr3-kinematics-2000.json"), "utf8"),
    ) as unknown[];
    const docsText = [
      readFileSync(resolve(process.cwd(), "README.md"), "utf8"),
      readFileSync(resolve(process.cwd(), "docs/TECHNICAL_OVERVIEW.md"), "utf8"),
    ].join("\n");
    const surfaceText = [
      readFileSync(resolve(process.cwd(), "app/UniverseRuntimeController.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/UniverseScene.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/GaiaStarOverlay.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/GaiaStarField.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/ConstellationLines.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/NebulaMarkers.tsx"), "utf8"),
      readProjectSourceBundle("app/components/RelativityObservableAtlasPanel.tsx"),
      readProjectSourceBundle("app/lib/evidenceLedger.ts"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasValidationConsole.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasGaiaStarfieldEnhancement.ts"), "utf8"),
    ].join("\n");
    const browserSpecText = readFileSync(
      resolve(process.cwd(), "tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      "utf8",
    );

    const { audits, rows } = runAtlasGaiaStarfieldEnhancementAudit({
      packageScripts: packageJson.scripts,
      docsText,
      surfaceText,
      browserSpecText,
      gaiaBrightRowCount: gaiaBrightRows.length,
      gaiaKinematicsRowCount: gaiaKinematicsRows.length,
      constellationRenderGroupCount: CONSTELLATION_LINES.length,
      normalizedIauConstellationCount: 88,
      nebulaMarkerCount: NEBULAE.length,
    });
    const summary = createAtlasGaiaStarfieldEnhancementSummary({ audits, rows });
    const row = summary.overlayRows[0]!;

    expect(v97GaiaStarfieldEnhancementCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:gaia-starfield-enhancement",
      browserFreshCommand: "npm run test:atlas:browser:fresh",
      mobileRenderBudget: 1000,
      balancedRenderBudget: 1800,
      denseRenderBudget: 3000,
      defaultActivationPolicy: "sandbox-deep-space-and-orbit-atlas-dense",
      closeupSuppressionPolicy: "selected-body-closeup-opacity-suppressed",
    });
    expect(packageJson.scripts["test:atlas:gaia-starfield-enhancement"]).toBe(
      "vitest run app/lib/atlasGaiaStarfieldEnhancement.horizons.test.ts",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      ["gaia-catalog-lock", "ready", "bright 5000; kinematics 2000"],
      ["constellation-catalog-lock", "ready", expect.stringContaining("normalized 88")],
      ["nebula-catalog-lock", "ready", `nebula markers ${NEBULAE.length}`],
      ["overlay-budget-lock", "ready", expect.stringContaining("mobile 1000; balanced 1800; dense 3000")],
      ["v9-sky-boundary-lock", "ready", "V9 sky identity and legacy background boundary preserved"],
      ["docs-overlay-lock", "ready", "v97 Gaia overlay docs present"],
      ["browser-surface-lock", "ready", "v97 Gaia overlay surface present"],
      ["protected-mutation-lock", "ready", "all protected Gaia overlay mutation flags not-applied"],
    ]);
    expect(summary.status).toBe("ready-gaia-overlay-locked");
    expect(summary.classification).toBe("gaia-overlay-pass");
    expect(row.status).toBe("complete");
    expect(row.gaiaCatalogStatus).toBe("pass");
    expect(row.constellationCatalogStatus).toBe("pass");
    expect(row.nebulaCatalogStatus).toBe("pass");
    expect(row.overlayBudgetStatus).toBe("pass");
    expect(row.v9SkyBoundaryStatus).toBe("pass");
    expect(row.docsOverlayStatus).toBe("pass");
    expect(row.browserSurfaceStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(summary.fullGaiaArchivePolicy).toBe("not-full-gaia-archive");
    expect(summary.officialCertificationPolicy).toBe("not-gaia-nasa-jpl-certified");
    expect(summary.livePhysicsMutation).toBe("not-applied");
    expect(summary.workerPhysicsMutation).toBe("not-applied");
    expect(summary.rk4DefaultMutation).toBe("not-applied");
    expect(summary.eihOnePnMutation).toBe("not-applied");
    expect(summary.kerrKernelMutation).toBe("not-applied");
    expect(summary.skyAssetMutation).toBe("not-applied");
    expect(summary.backgroundMutation).toBe("not-applied");
    expect(summary.v9SkyDirectionMutation).toBe("not-applied");
    expect(summary.fixtureDataMutation).toBe("not-applied");
  });
});
