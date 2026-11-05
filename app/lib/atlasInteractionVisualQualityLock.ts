import type {
  AtlasInteractionVisualQualityAudit,
  AtlasInteractionVisualQualityClassification,
  AtlasInteractionVisualQualityProfile,
  AtlasInteractionVisualQualityRow,
  AtlasInteractionVisualQualityStatus,
  AtlasInteractionVisualQualitySummary,
  AtlasInteractionVisualQualityVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_INTERACTION_VISUAL_QUALITY_VERSION: AtlasInteractionVisualQualityVersion =
  "v109-interaction-visual-quality-lock";
export const ATLAS_INTERACTION_VISUAL_QUALITY_PROFILE: AtlasInteractionVisualQualityProfile =
  "v109-launch-camera-gaia-material-quality";
export const ATLAS_INTERACTION_VISUAL_QUALITY_BOUNDARY =
  "v109 upgrades presentation interaction and visual quality only. It makes body and sky-target focus locks user-orbit friendly, upgrades local launch camera/rocket/satellite presentation, and maps Gaia/local stellar catalog data into visual materials while preserving scientific gates, fixtures, live and worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75 budgets, v97 Gaia render budgets, v99 opacity caps, release packaging, staging and commit boundaries.";

export const V109_INTERACTION_VISUAL_QUALITY_ROW: AtlasInteractionVisualQualityRow = {
  id: "v109-lock-interaction-visual-quality",
  label: "Interaction freedom, launch visuals and Gaia stellar material",
  status: "not-run",
  v108Status: "not-run",
  cameraFreedomStatus: "not-run",
  launchCameraStatus: "not-run",
  launchVisualStatus: "not-run",
  stellarMaterialStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
};

export function createAtlasInteractionVisualQualitySummary(args: {
  audits?: readonly AtlasInteractionVisualQualityAudit[];
  rows?: readonly AtlasInteractionVisualQualityRow[];
} = {}): AtlasInteractionVisualQualitySummary {
  const audits = args.audits ?? [];
  const rows = args.rows ?? [V109_INTERACTION_VISUAL_QUALITY_ROW];
  const allReady = audits.length > 0 && audits.every((item) => item.status === "ready");
  const status: AtlasInteractionVisualQualityStatus = allReady
    ? "ready-interaction-visual-quality-locked"
    : audits.length > 0
      ? "ready-interaction-visual-quality-blocked"
      : "pending-runtime-run";
  return {
    version: ATLAS_INTERACTION_VISUAL_QUALITY_VERSION,
    profile: ATLAS_INTERACTION_VISUAL_QUALITY_PROFILE,
    status,
    classification: classify(audits),
    interactionRepairLaunchUxVersion: "v108-interaction-repair-launch-ux-lock",
    cameraFreedomPolicy: "target-follow-user-orbit-override",
    launchCameraPolicy: "auto-follow-manual-orbit-restore-follow",
    launchVisualPolicy: "procedural-budget-rocket-satellite-no-physics-mutation",
    stellarMaterialPolicy: "gaia-bp-rp-gmag-parallax-presentation-material",
    gaiaBudgetPolicy: "v97-1000-1800-3000-preserved",
    focusedCommand: "npm run test:atlas:interaction-visual-quality",
    verifyCommand: "npm run verify:atlas:interaction-visual-quality",
    screenshotArtifactDirectory: "test-results/v109-interaction-visual-quality-lock/",
    audits,
    rows,
    readyRowId: allReady ? "v109-lock-interaction-visual-quality" : "",
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
    trustedBoundary: ATLAS_INTERACTION_VISUAL_QUALITY_BOUNDARY,
  };
}

function classify(
  audits: readonly AtlasInteractionVisualQualityAudit[],
): AtlasInteractionVisualQualityClassification {
  const regressed = audits.filter((item) => item.status !== "ready").map((item) => item.id);
  if (audits.length > 0 && regressed.length === 0) return "interaction-visual-quality-pass";
  if (regressed.length !== 1) return "mixed";
  const map: Record<string, AtlasInteractionVisualQualityClassification> = {
    "v108-interaction-repair-launch-ux": "v108-regression",
    "camera-freedom-lock": "camera-freedom-regression",
    "launch-camera-lock": "launch-camera-regression",
    "launch-visual-lock": "launch-visual-regression",
    "stellar-material-lock": "stellar-material-regression",
    "docs-surface-lock": "docs-surface-regression",
    "protected-mutation-lock": "protected-mutation-regression",
  };
  return map[regressed[0]!] ?? "mixed";
}
