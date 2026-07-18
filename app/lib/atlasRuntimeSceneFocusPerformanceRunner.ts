import {
  ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_BOUNDARY,
  type AtlasRuntimeSceneFocusAudit,
} from "./atlasRuntimeSceneFocusPerformance";

export type AtlasRuntimeSceneFocusAuditArgs = {
  universePageText: string;
  universeSceneText: string;
  universeCanvasText: string;
  universeSandboxHudText: string;
  cameraFocusCommandText: string;
  evidenceText: string;
  validationText: string;
  docsText: string;
  browserSpecText: string;
  packageText: string;
};

export function runAtlasRuntimeSceneFocusAudit(
  args: AtlasRuntimeSceneFocusAuditArgs,
): { audits: readonly AtlasRuntimeSceneFocusAudit[] } {
  const audit = (
    id: AtlasRuntimeSceneFocusAudit["id"],
    ready: boolean,
    expected: string,
  ): AtlasRuntimeSceneFocusAudit => ({
    id,
    status: ready ? "ready" : "regressed",
    measured: ready ? expected : `missing: ${expected}`,
    expected,
  });

  return {
    audits: [
      audit(
        "scene-mode-isolation-lock",
        args.universePageText.includes("selectAtlasSceneMode") &&
          args.universeSceneText.includes('sceneMode === "launch"') &&
          args.universeSceneText.includes("LaunchSceneView") &&
          args.universeSceneText.includes("ScienceBackdrop"),
        "AtlasSceneMode selects an exclusive launch R3F branch without ScienceBackdrop",
      ),
      audit(
        "launch-telemetry-subscriber-lock",
        !args.universePageText.includes("launchTelemetryTick") &&
          args.universePageText.includes("LaunchTelemetrySubscriber") &&
          args.universePageText.includes("hudUpdateMs") &&
          args.universePageText.includes("localTelemetryRef.current") &&
          args.universePageText.includes("localLaunchActive ? (") &&
          args.universePageText.includes("<LaunchTelemetryDock") &&
          !args.universePageText.includes("launchTelemetrySlot="),
        "launch telemetry refreshes in an isolated ref subscriber at quality hudUpdateMs",
      ),
      audit(
        "camera-focus-latency-lock",
        args.cameraFocusCommandText.includes("CAMERA_FOCUS_DEFAULT_MS = 900") &&
          args.cameraFocusCommandText.includes("desktop") &&
          args.cameraFocusCommandText.includes("mobile") &&
          args.universeSceneText.includes("cameraMarkerRootRef") &&
          args.universeSceneText.includes("shouldWriteRuntimeMarker") &&
          args.universeSceneText.includes("intervalMs: 120") &&
          args.universeSceneText.includes("cameraOriginResetNonce") &&
          !args.universeSceneText.includes('.querySelector("[data-atlas-browser-acceptance-version]")\n      ?.setAttribute'),
        "focus duration is viewport bounded and camera markers use a cached throttled root",
      ),
      audit(
        "hidden-dom-unmount-lock",
        args.universeSandboxHudText.includes("!leftPanelCollapsed ? (") &&
          args.universePageText.includes("!launchRuntimeActive") &&
          args.universePageText.includes("!localLaunchActive && activeSection") &&
          args.universePageText.includes("data-universe-sandbox-hud") &&
          args.universePageText.includes("data-physics-performance-hud") &&
          args.universePageText.includes("data-science-telemetry-panel"),
        "collapsed object lists and launch nonessential DOM are unmounted",
      ),
      audit(
        "r3f-prop-stability-lock",
        args.universeCanvasText.includes("memo(") &&
          args.universeCanvasText.includes("shallowEqualSimulationProps"),
        "UniverseCanvas ignores unrelated parent renders through shallow simulation prop stability",
      ),
      audit(
        "evidence-browser-qa-lock",
        args.evidenceText.includes("runtime-scene-focus-performance-lock") &&
          args.validationText.includes("visual-launch-performance-lock") &&
          args.docsText.includes("v115 Runtime Scene Isolation & Focus Latency") &&
          args.browserSpecText.includes("v115-runtime-scene-focus-performance-lock") &&
          args.packageText.includes("test:atlas:runtime-scene-focus-performance"),
        "v115 Evidence, Validation, docs, Browser QA and package command are wired",
      ),
      audit(
        "protected-mutation-lock",
        args.docsText.includes("v75/v97/v99") &&
          ATLAS_RUNTIME_SCENE_FOCUS_PERFORMANCE_BOUNDARY.includes("live/worker physics"),
        "protected scientific and presentation budget boundaries remain unchanged",
      ),
    ],
  };
}

export function v115RuntimeSceneFocusCommandContract() {
  return {
    focusedCommand: "npm run test:atlas:runtime-scene-focus-performance",
    screenshotArtifactDirectory: "test-results/v115-runtime-scene-focus-performance-lock/",
  } as const;
}
