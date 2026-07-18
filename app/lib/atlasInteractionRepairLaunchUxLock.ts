import type {
  AtlasInteractionRepairLaunchUxAudit,
  AtlasInteractionRepairLaunchUxClassification,
  AtlasInteractionRepairLaunchUxProfile,
  AtlasInteractionRepairLaunchUxRow,
  AtlasInteractionRepairLaunchUxStatus,
  AtlasInteractionRepairLaunchUxSummary,
  AtlasInteractionRepairLaunchUxVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_INTERACTION_REPAIR_LAUNCH_UX_VERSION: AtlasInteractionRepairLaunchUxVersion =
  "v108-interaction-repair-launch-ux-lock";
export const ATLAS_INTERACTION_REPAIR_LAUNCH_UX_PROFILE: AtlasInteractionRepairLaunchUxProfile =
  "v108-sky-target-zoom-launch-ux-repair";
export const ATLAS_INTERACTION_REPAIR_LAUNCH_UX_BOUNDARY =
  "v108 repairs presentation interaction and local launch UX only. It adds a zoomable visual proxy for selected catalog/Gaia sky targets, preserves body zoom during camera locks, and improves the local launch panel while preserving scientific gates, fixtures, live and worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, Gaia render budgets, v99 opacity caps, release packaging, staging and commit boundaries.";

export const V108_INTERACTION_REPAIR_LAUNCH_UX_ROW: AtlasInteractionRepairLaunchUxRow = {
  id: "v108-lock-interaction-repair-launch-ux",
  label: "Interaction repair and launch UX",
  status: "not-run",
  skyTargetProxyStatus: "not-run",
  skyTargetZoomStatus: "not-run",
  bodyZoomStatus: "not-run",
  launchUxStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
};

export function createAtlasInteractionRepairLaunchUxSummary(args: {
  audits?: readonly AtlasInteractionRepairLaunchUxAudit[];
  rows?: readonly AtlasInteractionRepairLaunchUxRow[];
} = {}): AtlasInteractionRepairLaunchUxSummary {
  const audits = args.audits ?? [];
  const rows = args.rows ?? [V108_INTERACTION_REPAIR_LAUNCH_UX_ROW];
  const allReady = audits.length > 0 && audits.every((item) => item.status === "ready");
  const status: AtlasInteractionRepairLaunchUxStatus = allReady
    ? "ready-interaction-repair-launch-ux-locked"
    : audits.length > 0
      ? "ready-interaction-repair-launch-ux-blocked"
      : "pending-runtime-run";
  return {
    version: ATLAS_INTERACTION_REPAIR_LAUNCH_UX_VERSION,
    profile: ATLAS_INTERACTION_REPAIR_LAUNCH_UX_PROFILE,
    status,
    classification: classify(audits),
    interactionCatalogCompletionVersion: "v107-interaction-catalog-completion-lock",
    skyTargetPolicy: "zoomable-visual-proxy-no-physics-body",
    skyTargetZoomPolicy: "camera-target-distance-only-clamped",
    bodyZoomPolicy: "native-wheel-distance-preserved-during-body-lock",
    focusExitPolicy: "passport-reset-escape-clears-body-and-sky-target",
    launchUxPolicy: "leo-satellite-default-cards-countdown-timeline-local-physics",
    focusedCommand: "npm run test:atlas:interaction-repair-launch-ux",
    verifyCommand: "npm run verify:atlas:interaction-repair-launch-ux",
    screenshotArtifactDirectory: "test-results/v108-interaction-repair-launch-ux-lock/",
    audits,
    rows,
    readyRowId: allReady ? "v108-lock-interaction-repair-launch-ux" : "",
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
    releasePackagingMutation: "not-applied",
    stagingMutation: "not-applied",
    commitMutation: "not-applied",
    trustedBoundary: ATLAS_INTERACTION_REPAIR_LAUNCH_UX_BOUNDARY,
  };
}

function classify(
  audits: readonly AtlasInteractionRepairLaunchUxAudit[],
): AtlasInteractionRepairLaunchUxClassification {
  const regressed = audits.filter((item) => item.status !== "ready").map((item) => item.id);
  if (audits.length > 0 && regressed.length === 0) return "interaction-repair-launch-ux-pass";
  if (regressed.length !== 1) return "mixed";
  const map: Record<string, AtlasInteractionRepairLaunchUxClassification> = {
    "v107-interaction-catalog-completion": "v107-regression",
    "sky-target-proxy-lock": "sky-target-proxy-regression",
    "sky-target-zoom-lock": "sky-target-zoom-regression",
    "body-zoom-lock": "body-zoom-regression",
    "launch-ux-lock": "launch-ux-regression",
    "docs-surface-lock": "docs-surface-regression",
    "protected-mutation-lock": "protected-mutation-regression",
  };
  return map[regressed[0]!] ?? "mixed";
}
