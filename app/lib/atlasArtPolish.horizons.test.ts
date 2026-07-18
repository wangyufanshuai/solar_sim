import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAtlasArtPolishSummary } from "./atlasArtPolish";
import { runAtlasArtPolishAudit, v99ArtPolishCommandContract } from "./atlasArtPolishRunner";

describe("v99 art polish audit", () => {
  it("locks Gaia, constellation, nebula, closeup, mobile, V9 sky, docs and protected mutation boundaries", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
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
      readFileSync(resolve(process.cwd(), "app/lib/evidenceLedger.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasValidationConsole.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasArtPolish.ts"), "utf8"),
    ].join("\n");
    const browserSpecText = readFileSync(
      resolve(process.cwd(), "tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      "utf8",
    );

    const { audits, rows } = runAtlasArtPolishAudit({
      packageScripts: packageJson.scripts,
      docsText,
      surfaceText,
      browserSpecText,
    });
    const summary = createAtlasArtPolishSummary({ audits, rows });
    const row = summary.rows[0]!;

    expect(v99ArtPolishCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:art-polish",
      browserFreshCommand: "npm run test:atlas:browser:fresh",
      mobileOpacityCap: 0.62,
      balancedOpacityCap: 1.05,
      denseOpacityCap: 1.2,
      closeupOpacityCap: 0.18,
    });
    expect(packageJson.scripts["test:atlas:art-polish"]).toBe(
      "vitest run app/lib/atlasArtPolish.horizons.test.ts",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      ["gaia-layer-lock", "ready", "Gaia opacity caps and v97 dependency present"],
      ["constellation-layer-lock", "ready", "constellation overview/closeup/mobile restraint present"],
      ["nebula-layer-lock", "ready", "nebula overview enhancement and closeup/mobile restraint present"],
      ["closeup-readability-lock", "ready", "selected-body closeup background deemphasis present"],
      ["mobile-budget-lock", "ready", "mobile 1000; balanced 1800; dense 3000"],
      ["v9-sky-boundary-lock", "ready", "V9 sky identity and legacy background boundary preserved"],
      ["docs-surface-lock", "ready", "v99 docs and surface markers present"],
      ["protected-mutation-lock", "ready", "all protected art polish mutation flags not-applied"],
    ]);
    expect(summary.status).toBe("ready-art-polish-locked");
    expect(summary.classification).toBe("art-polish-pass");
    expect(row.status).toBe("complete");
    expect(row.gaiaLayerStatus).toBe("pass");
    expect(row.constellationLayerStatus).toBe("pass");
    expect(row.nebulaLayerStatus).toBe("pass");
    expect(row.closeupReadabilityStatus).toBe("pass");
    expect(row.mobileBudgetStatus).toBe("pass");
    expect(row.v9SkyBoundaryStatus).toBe("pass");
    expect(row.docsSurfaceStatus).toBe("pass");
    expect(row.protectedMutationStatus).toBe("pass");
    expect(summary.officialCertificationPolicy).toBe("not-nasa-jpl-gaia-universe-sandbox-certified");
    expect(summary.livePhysicsMutation).toBe("not-applied");
    expect(summary.workerPhysicsMutation).toBe("not-applied");
    expect(summary.rk4DefaultMutation).toBe("not-applied");
    expect(summary.eihOnePnMutation).toBe("not-applied");
    expect(summary.kerrKernelMutation).toBe("not-applied");
    expect(summary.skyAssetMutation).toBe("not-applied");
    expect(summary.v9SkyDirectionMutation).toBe("not-applied");
    expect(summary.fixtureDataMutation).toBe("not-applied");
    expect(summary.budgetMutation).toBe("not-applied");
  });
});
