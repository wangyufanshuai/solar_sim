export const ATLAS_LAUNCH_SCENE_OPENROCKET_REPLAY_VERSION =
  "v118-launch-scene-openrocket-replay-lock" as const;
export const ATLAS_LAUNCH_SCENE_OPENROCKET_REPLAY_PROFILE =
  "v118-screen-overlay-nasa-assets-offline-replay" as const;
export const ATLAS_LAUNCH_SCENE_OPENROCKET_REPLAY_BOUNDARY =
  "v118 changes launch presentation, local assets and offline replay import only. The browser never starts or automates OpenRocket.exe; scientific gates, fixtures, integrators, live/worker physics, Kerr, V9 sky and v75/v97/v99 budgets remain unchanged.";

export function createAtlasLaunchSceneOpenRocketReplaySummary() {
  return {
    version: ATLAS_LAUNCH_SCENE_OPENROCKET_REPLAY_VERSION,
    profile: ATLAS_LAUNCH_SCENE_OPENROCKET_REPLAY_PROFILE,
    status: "ready-launch-scene-offline-replay" as const,
    hudPolicy: "fixed-screen-space-overlay" as const,
    phasePolicy: "prelaunch-ignition-tower-clear-maxq-meco-coast-insertion-deploy" as const,
    assetPolicy: "local-nasa-provenance-lazy-deferred" as const,
    initialAssetLimitBytes: 25 * 1024 * 1024,
    replayPolicy: "structured-ork-csv-json-offline-manifest" as const,
    browserExeLaunch: "not-applied" as const,
    focusedCommand: "npm run test:atlas:launch-scene-openrocket-replay" as const,
    trustedBoundary: ATLAS_LAUNCH_SCENE_OPENROCKET_REPLAY_BOUNDARY,
  };
}
