import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAtlasCameraStellarCloseupSummary } from "./atlasCameraStellarCloseupLock";
import {
  runAtlasCameraStellarCloseupAudit,
  v111CameraStellarCloseupCommandContract,
} from "./atlasCameraStellarCloseupLockRunner";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v111 camera and stellar close-up heavy audit", () => {
  it("locks target-anchor camera behavior and Gaia/local stellar portraits", async () => {
    const result = await runAtlasCameraStellarCloseupAudit({
      universeSceneText: read("app/components/UniverseScene.tsx"),
      selectedSkyTargetProxyText: read("app/components/SelectedSkyTargetProxy.tsx"),
      gaiaStarLabelsText: read("app/components/GaiaStarLabels.tsx"),
      gaiaStarFieldText: read("app/components/GaiaStarField.tsx"),
      universePageText: read("app/UniverseRuntimeController.tsx"),
      relativityPanelText: read("app/components/RelativityObservableAtlasPanel.tsx"),
      evidenceText: read("app/lib/evidenceLedger.ts"),
      validationText: read("app/lib/atlasValidationConsole.ts"),
      docsText: `${read("README.md")}\n${read("docs/TECHNICAL_OVERVIEW.md")}`,
      browserSpecText: read("tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      lockText: read("app/lib/atlasCameraStellarCloseupLock.ts"),
    });
    const summary = createAtlasCameraStellarCloseupSummary(result);

    expect(v111CameraStellarCloseupCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:camera-stellar-closeup",
      verifyCommand: "npm run verify:atlas:camera-stellar-closeup",
      screenshotArtifactDirectory: "test-results/v111-camera-stellar-closeup-lock/",
    });
    expect(
      summary.status,
      JSON.stringify(summary.audits.filter((audit) => audit.status !== "ready")),
    ).toBe("ready-camera-stellar-closeup-locked");
    expect(summary.classification).toBe("camera-stellar-closeup-pass");
  }, 120_000);
});
