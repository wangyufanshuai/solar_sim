import type {
  AtlasRuntimeQualityTier,
  AtlasVisualLaunchPerformanceAudit,
  AtlasVisualLaunchPerformanceClassification,
  AtlasVisualLaunchPerformanceProfile,
  AtlasVisualLaunchPerformanceRow,
  AtlasVisualLaunchPerformanceStatus,
  AtlasVisualLaunchPerformanceSummary,
  AtlasVisualLaunchPerformanceVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_VISUAL_LAUNCH_PERFORMANCE_VERSION: AtlasVisualLaunchPerformanceVersion =
  "v114-visual-launch-performance-lock";
export const ATLAS_VISUAL_LAUNCH_PERFORMANCE_PROFILE: AtlasVisualLaunchPerformanceProfile =
  "v114-scene-director-runtime-quality";
export const ATLAS_VISUAL_LAUNCH_PERFORMANCE_BOUNDARY =
  "v114 upgrades visible UI copy, launch sequence presentation and presentation-layer runtime scheduling only. It keeps OpenRocket on offline import, never starts D:\\86137\\OpenRocket\\OpenRocket.exe from the browser, and does not modify scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75/v97/v99 budgets, release packaging, staging or commits.";

export const V114_VISUAL_LAUNCH_PERFORMANCE_ROW: AtlasVisualLaunchPerformanceRow = {
  id: "v114-lock-visual-launch-performance",
  label: "Visual launch performance upgrade",
  status: "not-run",
  v113Status: "not-run",
  visibleCopyStatus: "not-run",
  launchDirectorStatus: "not-run",
  runtimeQualityStatus: "not-run",
  openRocketStatus: "not-run",
  browserQaStatus: "not-run",
  protectedMutationStatus: "not-run",
};

export function createAtlasVisualLaunchPerformanceSummary(args: {
  qualityTier?: AtlasRuntimeQualityTier;
  audits?: readonly AtlasVisualLaunchPerformanceAudit[];
  rows?: readonly AtlasVisualLaunchPerformanceRow[];
} = {}): AtlasVisualLaunchPerformanceSummary {
  const audits = args.audits ?? [];
  const rows = args.rows ?? [V114_VISUAL_LAUNCH_PERFORMANCE_ROW];
  const allReady = audits.length > 0 && audits.every((item) => item.status === "ready");
  const status: AtlasVisualLaunchPerformanceStatus = allReady
    ? "ready-visual-launch-performance-locked"
    : audits.length > 0
      ? "ready-visual-launch-performance-blocked"
      : "pending-runtime-run";
  return {
    version: ATLAS_VISUAL_LAUNCH_PERFORMANCE_VERSION,
    profile: ATLAS_VISUAL_LAUNCH_PERFORMANCE_PROFILE,
    status,
    classification: classifyVisualLaunchPerformance(audits),
    scientificModelUpgradeContractVersion: "v113-scientific-model-upgrade-contract",
    qualityTier: args.qualityTier ?? "balanced",
    launchDirectorPolicy: "prelaunch-liftoff-maxq-staging-coast-deploy",
    runtimeQualityPolicy: "presentation-only-quality-tier-scheduling",
    launchScenePerformancePolicy: "no-per-frame-dom-query-reuse-three-temporaries",
    openRocketBridgePolicy: "offline-import-no-browser-exe-launch",
    telemetryProviderPolicy: "local-default-websocket-optional",
    stellarCloseupPolicy: "gaia-derived-portrait-preserved-no-surface-resolution-claim",
    budgetPolicy: "v75-v97-v99-budgets-preserved",
    focusedCommand: "npm run test:atlas:visual-launch-performance",
    verifyCommand: "npm run verify:atlas:visual-launch-performance",
    screenshotArtifactDirectory: "test-results/v114-visual-launch-performance-lock/",
    audits,
    rows,
    readyRowId: allReady ? "v114-lock-visual-launch-performance" : "",
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
    guiAutomationMutation: "not-applied",
    stagingMutation: "not-applied",
    commitMutation: "not-applied",
    trustedBoundary: ATLAS_VISUAL_LAUNCH_PERFORMANCE_BOUNDARY,
  };
}

function classifyVisualLaunchPerformance(
  audits: readonly AtlasVisualLaunchPerformanceAudit[],
): AtlasVisualLaunchPerformanceClassification {
  const regressed = audits.filter((item) => item.status !== "ready").map((item) => item.id);
  if (audits.length > 0 && regressed.length === 0) return "visual-launch-performance-pass";
  if (regressed.length !== 1) return "mixed";
  const map: Record<string, AtlasVisualLaunchPerformanceClassification> = {
    "v113-scientific-model-upgrade-contract": "v113-regression",
    "visible-copy-lock": "visible-copy-regression",
    "launch-sequence-director-lock": "launch-director-regression",
    "runtime-quality-governor-lock": "runtime-quality-regression",
    "openrocket-offline-bridge-lock": "openrocket-boundary-regression",
    "browser-qa-marker-lock": "browser-qa-regression",
    "protected-mutation-lock": "protected-mutation-regression",
  };
  return map[regressed[0]!] ?? "mixed";
}
