import { readProjectSourceBundle } from "../test-utils/sourceBundles";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAtlasRelativitySimulationOptimizationSummary } from "./atlasRelativitySimulationOptimization";
import {
  runAtlasRelativitySimulationOptimizationAudit,
  v98RelativitySimulationOptimizationCommandContract,
} from "./atlasRelativitySimulationOptimizationRunner";

describe("v98 relativity simulation optimization audit", () => {
  it("locks Observable Atlas, Kerr Studio, weak-field readouts, HUD policy, docs and protected physics flags", () => {
    const packageJson = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };
    const docsText = [
      readFileSync(resolve(process.cwd(), "README.md"), "utf8"),
      readFileSync(resolve(process.cwd(), "docs/TECHNICAL_OVERVIEW.md"), "utf8"),
    ].join("\n");
    const surfaceText = [
      readFileSync(resolve(process.cwd(), "app/UniverseRuntimeController.tsx"), "utf8"),
      readProjectSourceBundle("app/components/RelativityObservableAtlasPanel.tsx"),
      readFileSync(resolve(process.cwd(), "app/components/KerrBlackHolePanel.tsx"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/components/PhysicsPerformanceHud.tsx"), "utf8"),
      readProjectSourceBundle("app/lib/evidenceLedger.ts"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasValidationConsole.ts"), "utf8"),
      readFileSync(resolve(process.cwd(), "app/lib/atlasRelativitySimulationOptimization.ts"), "utf8"),
    ].join("\n");
    const browserSpecText = readFileSync(
      resolve(process.cwd(), "tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      "utf8",
    );

    const { audits, rows } = runAtlasRelativitySimulationOptimizationAudit({
      packageScripts: packageJson.scripts,
      docsText,
      surfaceText,
      browserSpecText,
    });
    const summary = createAtlasRelativitySimulationOptimizationSummary({ audits, rows });
    const row = summary.rows[0]!;

    expect(v98RelativitySimulationOptimizationCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:relativity-simulation-optimization",
      browserFreshCommand: "npm run test:atlas:browser:fresh",
      teachingOverlayPolicy: "observable-atlas-and-kerr-studio-default",
      performanceHudPolicy: "optional-collapsed-read-only-main-canvas",
      scientificModelUpgradePolicy: "not-scientific-model-upgrade",
    });
    expect(packageJson.scripts["test:atlas:relativity-simulation-optimization"]).toBe(
      "vitest run app/lib/atlasRelativitySimulationOptimization.horizons.test.ts",
    );
    expect(summary.audits.map((audit) => [audit.id, audit.status, audit.measured])).toEqual([
      ["observable-atlas-lock", "ready", "v37/v39/v40/v73/v74 observable chain indexed"],
      ["kerr-studio-lock", "ready", "v35 Kerr Studio and kernel boundary indexed"],
      ["weak-field-readout-lock", "ready", "weak/Kerr/numerical readout split present"],
      ["performance-hud-lock", "ready", "optional collapsed read-only HUD policy present"],
      ["docs-surface-lock", "ready", "v98 docs and surface markers present"],
      ["protected-physics-lock", "ready", "all protected relativity mutation flags not-applied"],
    ]);
    expect(summary.status).toBe("ready-relativity-optimization-locked");
    expect(summary.classification).toBe("relativity-optimization-pass");
    expect(row.status).toBe("complete");
    expect(row.observableAtlasStatus).toBe("pass");
    expect(row.kerrStudioStatus).toBe("pass");
    expect(row.weakFieldReadoutStatus).toBe("pass");
    expect(row.performanceHudStatus).toBe("pass");
    expect(row.docsSurfaceStatus).toBe("pass");
    expect(row.protectedPhysicsStatus).toBe("pass");
    expect(summary.scientificModelUpgradePolicy).toBe("not-scientific-model-upgrade");
    expect(summary.livePhysicsMutation).toBe("not-applied");
    expect(summary.workerPhysicsMutation).toBe("not-applied");
    expect(summary.rk4DefaultMutation).toBe("not-applied");
    expect(summary.eihOnePnMutation).toBe("not-applied");
    expect(summary.kerrKernelMutation).toBe("not-applied");
    expect(summary.fixtureDataMutation).toBe("not-applied");
    expect(summary.budgetMutation).toBe("not-applied");
  });
});
