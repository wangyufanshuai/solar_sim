import type {
  AtlasLaunchGameplayOpenRocketBridgeAudit,
  AtlasLaunchGameplayOpenRocketBridgeClassification,
  AtlasLaunchGameplayOpenRocketBridgeProfile,
  AtlasLaunchGameplayOpenRocketBridgeRow,
  AtlasLaunchGameplayOpenRocketBridgeStatus,
  AtlasLaunchGameplayOpenRocketBridgeSummary,
  AtlasLaunchGameplayOpenRocketBridgeVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_VERSION: AtlasLaunchGameplayOpenRocketBridgeVersion =
  "v112-launch-gameplay-openrocket-bridge-lock";
export const ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_PROFILE: AtlasLaunchGameplayOpenRocketBridgeProfile =
  "v112-mission-scene-openrocket-import-bridge";
export const ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_BOUNDARY =
  "v112 upgrades launch presentation and offline import tooling only. It keeps the reliable local launch path as default, treats useLaunchWebSocket/launch_server.py as optional telemetry, imports OpenRocket files or exports as local JSON data, and never starts D:\\86137\\OpenRocket\\OpenRocket.exe from the browser. It does not change scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75/v97/v99 budgets, staging or commits.";

export const V112_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_ROW: AtlasLaunchGameplayOpenRocketBridgeRow = {
  id: "v112-lock-launch-gameplay-openrocket-bridge",
  label: "Launch gameplay scene and OpenRocket import bridge",
  status: "not-run",
  v111Status: "not-run",
  launchMissionSceneStatus: "not-run",
  launchVisualProfileStatus: "not-run",
  openRocketBridgeStatus: "not-run",
  protectedMutationStatus: "not-run",
};

export function createAtlasLaunchGameplayOpenRocketBridgeSummary(args: {
  audits?: readonly AtlasLaunchGameplayOpenRocketBridgeAudit[];
  rows?: readonly AtlasLaunchGameplayOpenRocketBridgeRow[];
} = {}): AtlasLaunchGameplayOpenRocketBridgeSummary {
  const audits = args.audits ?? [];
  const rows = args.rows ?? [V112_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_ROW];
  const allReady = audits.length > 0 && audits.every((item) => item.status === "ready");
  const status: AtlasLaunchGameplayOpenRocketBridgeStatus = allReady
    ? "ready-launch-gameplay-openrocket-bridge-locked"
    : audits.length > 0
      ? "ready-launch-gameplay-openrocket-bridge-blocked"
      : "pending-runtime-run";
  return {
    version: ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_VERSION,
    profile: ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_PROFILE,
    status,
    classification: classify(audits),
    cameraStellarCloseupVersion: "v111-camera-stellar-closeup-lock",
    launchScenePolicy: "mission-scene-pad-tower-countdown-staging-hud-deploy",
    launchVisualProfilePolicy: "deterministic-profile-manifest-leo-sls-mars",
    openRocketBridgePolicy: "offline-import-no-browser-exe-launch",
    telemetryProviderPolicy: "local-default-websocket-optional",
    focusedCommand: "npm run test:atlas:launch-gameplay-openrocket-bridge",
    verifyCommand: "npm run verify:atlas:launch-gameplay-openrocket-bridge",
    screenshotArtifactDirectory: "test-results/v112-launch-gameplay-openrocket-bridge-lock/",
    audits,
    rows,
    readyRowId: allReady ? "v112-lock-launch-gameplay-openrocket-bridge" : "",
    livePhysicsMutation: "not-applied",
    workerPhysicsMutation: "not-applied",
    rk4DefaultMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    fixtureDataMutation: "not-applied",
    skyAssetMutation: "not-applied",
    v9SkyDirectionMutation: "not-applied",
    gaiaRenderBudgetMutation: "not-applied",
    gaiaOpacityCapMutation: "not-applied",
    browserExeLaunch: "not-applied",
    stagingMutation: "not-applied",
    commitMutation: "not-applied",
    trustedBoundary: ATLAS_LAUNCH_GAMEPLAY_OPENROCKET_BRIDGE_BOUNDARY,
  };
}

function classify(
  audits: readonly AtlasLaunchGameplayOpenRocketBridgeAudit[],
): AtlasLaunchGameplayOpenRocketBridgeClassification {
  const regressed = audits.filter((item) => item.status !== "ready").map((item) => item.id);
  if (audits.length > 0 && regressed.length === 0) return "launch-gameplay-openrocket-bridge-pass";
  if (regressed.length !== 1) return "mixed";
  const map: Record<string, AtlasLaunchGameplayOpenRocketBridgeClassification> = {
    "v111-camera-stellar-closeup": "v111-regression",
    "launch-mission-scene-lock": "launch-mission-scene-regression",
    "launch-visual-profile-lock": "launch-visual-profile-regression",
    "openrocket-import-bridge-lock": "openrocket-import-bridge-regression",
    "protected-mutation-lock": "protected-mutation-regression",
  };
  return map[regressed[0]!] ?? "mixed";
}
