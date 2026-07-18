import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAtlasVisualLaunchPerformanceSummary } from "./atlasVisualLaunchPerformanceLock";
import {
  runAtlasVisualLaunchPerformanceAudit,
  v114VisualLaunchPerformanceCommandContract,
} from "./atlasVisualLaunchPerformanceLockRunner";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v114 visual launch performance heavy audit", () => {
  it("locks visible launch copy, director phases, runtime quality and protected boundaries", async () => {
    const result = await runAtlasVisualLaunchPerformanceAudit({
      launchControlText: read("app/components/LaunchControlPanel.tsx"),
      launchSceneText: read("app/components/LaunchSceneView.tsx"),
      launchSequenceDirectorText: read("app/lib/launchSequenceDirector.ts"),
      universeSceneText: read("app/components/UniverseScene.tsx"),
      universePageText: read("app/UniverseRuntimeController.tsx"),
      evidenceText: read("app/lib/evidenceLedger.ts"),
      evidencePanelText: read("app/components/EvidenceLedgerPanel.tsx"),
      validationText: read("app/lib/atlasValidationConsole.ts"),
      docsText: `${read("README.md")}\n${read("docs/TECHNICAL_OVERVIEW.md")}`,
      browserSpecText: read("tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      packageText: read("package.json"),
      openRocketBridgeText: read("app/lib/openRocketImportBridge.ts"),
      lockText: read("app/lib/atlasVisualLaunchPerformanceLock.ts"),
    });
    const summary = createAtlasVisualLaunchPerformanceSummary(result);

    expect(v114VisualLaunchPerformanceCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:visual-launch-performance",
      verifyCommand: "npm run verify:atlas:visual-launch-performance",
      screenshotArtifactDirectory: "test-results/v114-visual-launch-performance-lock/",
    });
    expect(
      summary.status,
      JSON.stringify(summary.audits.filter((audit) => audit.status !== "ready")),
    ).toBe("ready-visual-launch-performance-locked");
    expect(summary.classification).toBe("visual-launch-performance-pass");
  }, 120_000);
});
