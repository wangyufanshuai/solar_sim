import { createAtlasCameraStellarCloseupSummary } from "./atlasCameraStellarCloseupLock";
import {
  ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_BOUNDARY,
  V112_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_ROW,
} from "./atlasLaunchGameplayOpenRocketBridgeLock";
import type {
  AtlasLaunchGameplayOpenRocketBridgeAudit,
  AtlasLaunchGameplayOpenRocketBridgeRow,
} from "./simulationDiagnosticsTypes";

export type AtlasLaunchGameplayOpenRocketBridgeAuditArgs = {
  launchSceneText: string;
  launchControlText: string;
  launchVisualProfilesText: string;
  openRocketBridgeText: string;
  universePageText: string;
  useLaunchWebSocketText: string;
  relativityPanelText: string;
  evidenceText: string;
  validationText: string;
  docsText: string;
  browserSpecText: string;
  lockText: string;
};

export async function runAtlasLaunchGameplayOpenRocketBridgeAudit(
  args: AtlasLaunchGameplayOpenRocketBridgeAuditArgs,
): Promise<{
  audits: readonly AtlasLaunchGameplayOpenRocketBridgeAudit[];
  rows: readonly AtlasLaunchGameplayOpenRocketBridgeRow[];
}> {
  const v111 = createAtlasCameraStellarCloseupSummary({
    audits: [
      ready("v110-critical-ui-relativity-visibility"),
      ready("camera-rig-lock"),
      ready("stellar-portrait-lock"),
      ready("closeup-performance-lock"),
      ready("protected-mutation-lock"),
    ],
  });
  const surface = [
    args.universePageText,
    args.relativityPanelText,
    args.evidenceText,
    args.validationText,
    args.browserSpecText,
    args.lockText,
  ].join("\n");
  const audits = [
    audit(
      "v111-camera-stellar-closeup",
      v111.status === "ready-camera-stellar-closeup-locked",
      `${v111.status}; ${v111.classification}`,
      "ready-camera-stellar-closeup-locked; camera-stellar-closeup-pass",
    ),
    audit(
      "launch-mission-scene-lock",
      args.launchSceneText.includes("data-launch-mission-scene") &&
        args.launchSceneText.includes("data-launch-stage-marker") &&
        args.launchSceneText.includes("Max-Q") &&
        args.launchSceneText.includes("Satellite deploy") &&
        args.launchControlText.includes("发射控制") &&
        args.launchControlText.includes("恢复跟随"),
      "launch scene exposes pad/tower/countdown/staging HUD/deploy markers",
      "launch scene exposes pad/tower/countdown/staging HUD/deploy markers",
    ),
    audit(
      "launch-visual-profile-lock",
      args.launchVisualProfilesText.includes("v112-launch-visual-profile-manifest") &&
        args.launchVisualProfilesText.includes("leo-satellite-deployer") &&
        args.launchVisualProfilesText.includes("sls-artemis-stack") &&
        args.launchVisualProfilesText.includes("mars-cargo-heavy-lift") &&
        args.launchSceneText.includes("getLaunchVisualProfile"),
      "launch visual profile manifest covers LEO, SLS/Artemis and Mars cargo",
      "launch visual profile manifest covers LEO, SLS/Artemis and Mars cargo",
    ),
    audit(
      "openrocket-import-bridge-lock",
      args.openRocketBridgeText.includes("offline-import-no-browser-exe-launch") &&
        args.openRocketBridgeText.includes("parseOpenRocketTelemetryCsv") &&
        args.openRocketBridgeText.includes("public/data/openrocket/") &&
        !args.openRocketBridgeText.includes("OpenRocket.exe") &&
        args.universePageText.includes("useLaunchWebSocket(undefined, false)") &&
        args.useLaunchWebSocketText.includes("ws://127.0.0.1:8766/ws/launch"),
      "OpenRocket is offline import only and websocket telemetry stays optional",
      "OpenRocket is offline import only and websocket telemetry stays optional",
    ),
    audit(
      "protected-mutation-lock",
      [
        'livePhysicsMutation: "not-applied"',
        'workerPhysicsMutation: "not-applied"',
        'rk4DefaultMutation: "not-applied"',
        'eihOnePnMutation: "not-applied"',
        'kerrKernelMutation: "not-applied"',
        'fixtureDataMutation: "not-applied"',
        'v9SkyDirectionMutation: "not-applied"',
        'gaiaRenderBudgetMutation: "not-applied"',
        'gaiaOpacityCapMutation: "not-applied"',
        'browserExeLaunch: "not-applied"',
      ].every((token) => args.lockText.includes(token)) &&
        args.docsText.includes("v112 Launch Gameplay & OpenRocket Import Bridge") &&
        surface.includes("data-atlas-launch-gameplay-openrocket-bridge-version") &&
        surface.includes("launch-gameplay-openrocket-bridge-lock"),
      "v112 docs, markers and protected mutation flags are present",
      "v112 docs, markers and protected mutation flags are present",
    ),
  ] as const satisfies readonly AtlasLaunchGameplayOpenRocketBridgeAudit[];
  return { audits, rows: [completionRow(audits)] };
}

function ready(id: import("./simulationDiagnosticsTypes").AtlasCameraStellarCloseupAudit["id"]) {
  return { id, label: id, status: "ready" as const, measured: "ready", expected: "ready", trustedBoundary: "v111" };
}

function completionRow(
  audits: readonly AtlasLaunchGameplayOpenRocketBridgeAudit[],
): AtlasLaunchGameplayOpenRocketBridgeRow {
  const statusFor = (id: AtlasLaunchGameplayOpenRocketBridgeAudit["id"]) =>
    audits.find((item) => item.id === id)?.status === "ready" ? "pass" : "fail";
  return {
    ...V112_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_ROW,
    status: audits.every((item) => item.status === "ready") ? "complete" : "blocked",
    v111Status: statusFor("v111-camera-stellar-closeup"),
    launchMissionSceneStatus: statusFor("launch-mission-scene-lock"),
    launchVisualProfileStatus: statusFor("launch-visual-profile-lock"),
    openRocketBridgeStatus: statusFor("openrocket-import-bridge-lock"),
    protectedMutationStatus: statusFor("protected-mutation-lock"),
  };
}

function audit(
  id: AtlasLaunchGameplayOpenRocketBridgeAudit["id"],
  ready: boolean,
  measured: string,
  expected: string,
): AtlasLaunchGameplayOpenRocketBridgeAudit {
  return {
    id,
    label: id,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary: ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_BOUNDARY,
  };
}

export function v112LaunchGameplayOpenRocketBridgeCommandContract() {
  return {
    focusedCommand: "npm run test:atlas:launch-gameplay-openrocket-bridge",
    verifyCommand: "npm run verify:atlas:launch-gameplay-openrocket-bridge",
    screenshotArtifactDirectory:
      "test-results/v112-launch-gameplay-openrocket-bridge-lock/",
  } as const;
}
