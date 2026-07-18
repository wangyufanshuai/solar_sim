import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createAtlasLaunchGameplayOpenRocketBridgeSummary } from "./atlasLaunchGameplayOpenRocketBridgeLock";
import {
  runAtlasLaunchGameplayOpenRocketBridgeAudit,
  v112LaunchGameplayOpenRocketBridgeCommandContract,
} from "./atlasLaunchGameplayOpenRocketBridgeLockRunner";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v112 launch gameplay and OpenRocket bridge heavy audit", () => {
  it("locks mission-scene launch visuals and offline OpenRocket import policy", async () => {
    const result = await runAtlasLaunchGameplayOpenRocketBridgeAudit({
      launchSceneText: read("app/components/LaunchSceneView.tsx"),
      launchControlText: read("app/components/LaunchControlPanel.tsx"),
      launchVisualProfilesText: read("app/lib/launchVisualProfiles.ts"),
      openRocketBridgeText: read("app/lib/openRocketImportBridge.ts"),
      universePageText: read("app/UniverseRuntimeController.tsx"),
      useLaunchWebSocketText: read("app/lib/useLaunchWebSocket.ts"),
      relativityPanelText: read("app/components/RelativityObservableAtlasPanel.tsx"),
      evidenceText: read("app/lib/evidenceLedger.ts"),
      validationText: read("app/lib/atlasValidationConsole.ts"),
      docsText: `${read("README.md")}\n${read("docs/TECHNICAL_OVERVIEW.md")}`,
      browserSpecText: read("tests/atlas-browser/atlas-browser-acceptance.spec.ts"),
      lockText: read("app/lib/atlasLaunchGameplayOpenRocketBridgeLock.ts"),
    });
    const summary = createAtlasLaunchGameplayOpenRocketBridgeSummary(result);

    expect(v112LaunchGameplayOpenRocketBridgeCommandContract()).toEqual({
      focusedCommand: "npm run test:atlas:launch-gameplay-openrocket-bridge",
      verifyCommand: "npm run verify:atlas:launch-gameplay-openrocket-bridge",
      screenshotArtifactDirectory:
        "test-results/v112-launch-gameplay-openrocket-bridge-lock/",
    });
    expect(
      summary.status,
      JSON.stringify(summary.audits.filter((audit) => audit.status !== "ready")),
    ).toBe("ready-launch-gameplay-openrocket-bridge-locked");
    expect(summary.classification).toBe("launch-gameplay-openrocket-bridge-pass");
  }, 120_000);
});
