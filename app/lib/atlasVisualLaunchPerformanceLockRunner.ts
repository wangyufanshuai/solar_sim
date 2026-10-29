import { createAtlasScientificModelUpgradeContractSummary } from "./atlasScientificModelUpgradeContract";
import {
  ATLAS_VISUAL_LAUNCH_PERFORMANCE_BOUNDARY,
  V114_VISUAL_LAUNCH_PERFORMANCE_ROW,
} from "./atlasVisualLaunchPerformanceLock";
import type {
  AtlasVisualLaunchPerformanceAudit,
  AtlasVisualLaunchPerformanceRow,
} from "./simulationDiagnosticsTypes";

const MOJIBAKE_TOKENS = [
  "鍙戝",
  "鎺у",
  "鏈",
  "璺熼",
  "鎭㈠",
  "浠诲",
  "杞藉",
  "鐐圭",
  "鐩稿",
  "鈹€",
];

export type AtlasVisualLaunchPerformanceAuditArgs = {
  launchControlText: string;
  launchSceneText: string;
  launchSequenceDirectorText: string;
  universeSceneText: string;
  universePageText: string;
  evidenceText: string;
  evidencePanelText: string;
  validationText: string;
  docsText: string;
  browserSpecText: string;
  packageText: string;
  openRocketBridgeText: string;
  lockText: string;
};

export async function runAtlasVisualLaunchPerformanceAudit(
  args: AtlasVisualLaunchPerformanceAuditArgs,
): Promise<{
  audits: readonly AtlasVisualLaunchPerformanceAudit[];
  rows: readonly AtlasVisualLaunchPerformanceRow[];
}> {
  const v113 = createAtlasScientificModelUpgradeContractSummary({ ready: true });
  const surface = [
    args.universePageText,
    args.evidenceText,
    args.evidencePanelText,
    args.validationText,
    args.browserSpecText,
    args.packageText,
    args.lockText,
  ].join("\n");
  const visiblePriorityText = [
    args.launchControlText,
    args.launchSceneText,
    args.evidencePanelText,
  ].join("\n");
  const audits = [
    audit(
      "v113-scientific-model-upgrade-contract",
      v113.status === "ready-scientific-model-upgrade-contract-locked" &&
        v113.scientificUpgradePolicy === "contract-only-no-core-mutation",
      `${v113.status}; ${v113.scientificUpgradePolicy}`,
      "ready-scientific-model-upgrade-contract-locked; contract-only-no-core-mutation",
    ),
    audit(
      "visible-copy-lock",
      !MOJIBAKE_TOKENS.some((token) => visiblePriorityText.includes(token)) &&
        args.launchControlText.includes("发射控制") &&
        args.launchControlText.includes("恢复跟随") &&
        args.launchControlText.includes("任务时间线") &&
        args.evidencePanelText.includes("Chinese interface and deep-space fidelity"),
      "Launch Control and priority evidence labels use readable copy without known mojibake",
      "Launch Control and priority evidence labels use readable copy without known mojibake",
    ),
    audit(
      "launch-sequence-director-lock",
      args.launchSequenceDirectorText.includes("LAUNCH_SEQUENCE_DIRECTOR_VERSION") &&
        args.launchSequenceDirectorText.includes("getLaunchSequenceDirectorPhase") &&
        args.launchSequenceDirectorText.includes("prelaunch") &&
        args.launchSequenceDirectorText.includes("max-q") &&
        args.launchSequenceDirectorText.includes("stage-separation") &&
        args.launchSequenceDirectorText.includes("payload-deploy") &&
        args.launchSceneText.includes("launchDirectorPhaseLabel") &&
        args.launchSceneText.includes("data-launch-director-phase"),
      "LaunchSequenceDirector exposes Prelaunch/Liftoff/Max-Q/stage/coast/deploy phases and HUD markers",
      "LaunchSequenceDirector exposes Prelaunch/Liftoff/Max-Q/stage/coast/deploy phases and HUD markers",
    ),
    audit(
      "runtime-quality-governor-lock",
      args.launchSequenceDirectorText.includes("selectAtlasRuntimeQualityTier") &&
        args.launchSequenceDirectorText.includes("getAtlasRuntimeQualityProfile") &&
        args.launchSceneText.includes("data-launch-runtime-quality") &&
        args.launchSceneText.includes("data-launch-plume-budget") &&
        args.launchSceneText.includes("particleUpdateStride") &&
        args.launchSceneText.includes("trajectorySampleSeconds") &&
        args.universeSceneText.includes("runtimeQualityTier") &&
        args.universeSceneText.includes("!launchRuntimeActive") &&
        (
          !args.launchSceneText.includes("document.querySelector") ||
          (args.launchSceneText.includes("runtimeMarkerRootRef") &&
            args.launchSceneText.includes("lastRuntimeMarkerWriteRef"))
        ),
      "presentation-only quality governor throttles launch particles, trajectory, HUD markers and nonessential layers",
      "presentation-only quality governor throttles launch particles, trajectory, HUD markers and nonessential layers",
    ),
    audit(
      "openrocket-offline-bridge-lock",
      args.openRocketBridgeText.includes("offline-import-no-browser-exe-launch") &&
        args.lockText.includes('openRocketBridgePolicy: "offline-import-no-browser-exe-launch"') &&
        args.lockText.includes('browserExeLaunch: "not-applied"') &&
        args.lockText.includes('guiAutomationMutation: "not-applied"') &&
        !args.openRocketBridgeText.includes("OpenRocket.exe"),
      "OpenRocket remains offline import only with no browser exe launch or GUI automation",
      "OpenRocket remains offline import only with no browser exe launch or GUI automation",
    ),
    audit(
      "browser-qa-marker-lock",
      args.packageText.includes("test:atlas:visual-launch-performance") &&
        args.packageText.includes("verify:atlas:visual-launch-performance") &&
        surface.includes("data-atlas-visual-launch-performance-version") &&
        surface.includes("data-atlas-visual-launch-performance-quality-tier") &&
        surface.includes("visual-launch-performance-lock") &&
        args.docsText.includes("v114 Visual Launch Performance Upgrade") &&
        args.browserSpecText.includes("v114-visual-launch-performance-lock"),
      "v114 scripts, docs, root markers, Evidence/Validation and Browser QA are wired",
      "v114 scripts, docs, root markers, Evidence/Validation and Browser QA are wired",
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
        'guiAutomationMutation: "not-applied"',
      ].every((token) => args.lockText.includes(token)),
      "protected mutation flags remain not-applied",
      "protected mutation flags remain not-applied",
    ),
  ] as const satisfies readonly AtlasVisualLaunchPerformanceAudit[];
  return { audits, rows: [completionRow(audits)] };
}

function completionRow(
  audits: readonly AtlasVisualLaunchPerformanceAudit[],
): AtlasVisualLaunchPerformanceRow {
  const statusFor = (id: AtlasVisualLaunchPerformanceAudit["id"]) =>
    audits.find((item) => item.id === id)?.status === "ready" ? "pass" : "fail";
  return {
    ...V114_VISUAL_LAUNCH_PERFORMANCE_ROW,
    status: audits.every((item) => item.status === "ready") ? "complete" : "blocked",
    v113Status: statusFor("v113-scientific-model-upgrade-contract"),
    visibleCopyStatus: statusFor("visible-copy-lock"),
    launchDirectorStatus: statusFor("launch-sequence-director-lock"),
    runtimeQualityStatus: statusFor("runtime-quality-governor-lock"),
    openRocketStatus: statusFor("openrocket-offline-bridge-lock"),
    browserQaStatus: statusFor("browser-qa-marker-lock"),
    protectedMutationStatus: statusFor("protected-mutation-lock"),
  };
}

function audit(
  id: AtlasVisualLaunchPerformanceAudit["id"],
  ready: boolean,
  measured: string,
  expected: string,
): AtlasVisualLaunchPerformanceAudit {
  return {
    id,
    label: id,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary: ATLAS_VISUAL_LAUNCH_PERFORMANCE_BOUNDARY,
  };
}

export function v114VisualLaunchPerformanceCommandContract() {
  return {
    focusedCommand: "npm run test:atlas:visual-launch-performance",
    verifyCommand: "npm run verify:atlas:visual-launch-performance",
    screenshotArtifactDirectory: "test-results/v114-visual-launch-performance-lock/",
  } as const;
}
