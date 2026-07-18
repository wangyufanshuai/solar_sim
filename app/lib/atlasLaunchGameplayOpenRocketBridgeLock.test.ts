import { describe, expect, it } from "vitest";
import {
  ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_VERSION,
  createAtlasLaunchGameplayOpenRocketBridgeSummary,
} from "./atlasLaunchGameplayOpenRocketBridgeLock";
import {
  OPENROCKET_IMPORT_BRIDGE_POLICY,
  parseOpenRocketTelemetryCsv,
  summarizeOpenRocketImport,
} from "./openRocketImportBridge";
import type { AtlasLaunchGameplayOpenRocketBridgeAudit } from "./simulationDiagnosticsTypes";

const audit = (
  id: AtlasLaunchGameplayOpenRocketBridgeAudit["id"],
  status: AtlasLaunchGameplayOpenRocketBridgeAudit["status"] = "ready",
): AtlasLaunchGameplayOpenRocketBridgeAudit => ({
  id,
  label: id,
  status,
  measured: status,
  expected: "ready",
  trustedBoundary: "test",
});

describe("v112 launch gameplay and OpenRocket bridge lock summary", () => {
  it("exposes deterministic pending metadata by default", () => {
    const summary = createAtlasLaunchGameplayOpenRocketBridgeSummary();
    expect(summary.version).toBe(ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_VERSION);
    expect(summary.launchScenePolicy).toBe("mission-scene-pad-tower-countdown-staging-hud-deploy");
    expect(summary.launchVisualProfilePolicy).toBe("deterministic-profile-manifest-leo-sls-mars");
    expect(summary.openRocketBridgePolicy).toBe("offline-import-no-browser-exe-launch");
    expect(summary.telemetryProviderPolicy).toBe("local-default-websocket-optional");
    expect(summary.browserExeLaunch).toBe("not-applied");
  });

  it("classifies focused audit results", () => {
    const ready = createAtlasLaunchGameplayOpenRocketBridgeSummary({
      audits: [
        audit("v111-camera-stellar-closeup"),
        audit("launch-mission-scene-lock"),
        audit("launch-visual-profile-lock"),
        audit("openrocket-import-bridge-lock"),
        audit("protected-mutation-lock"),
      ],
    });
    expect(ready.status).toBe("ready-launch-gameplay-openrocket-bridge-locked");
    expect(ready.classification).toBe("launch-gameplay-openrocket-bridge-pass");
  });

  it("parses OpenRocket CSV/JSON/ORK-like input without exe launch", () => {
    const samples = parseOpenRocketTelemetryCsv(
      "time (s),altitude (m),velocity (m/s),mach,dynamic pressure (Pa)\n0,0,0,0,0\n1,120,85,0.25,2200",
    );
    expect(samples).toHaveLength(2);
    expect(samples[1]).toMatchObject({ timeS: 1, altitudeM: 120, velocityMs: 85, mach: 0.25 });
    expect(summarizeOpenRocketImport(JSON.stringify({ name: "Demo", telemetry: samples }))).toMatchObject({
      policy: OPENROCKET_IMPORT_BRIDGE_POLICY,
      sourceType: "json",
      designName: "Demo",
      sampleCount: 2,
      browserExeLaunch: "not-applied",
    });
    expect(summarizeOpenRocketImport("<openrocket><rocket><name>Test ORK</name></rocket></openrocket>")).toMatchObject({
      sourceType: "ork-xml",
      designName: "Test ORK",
      browserExeLaunch: "not-applied",
    });
  });
});
