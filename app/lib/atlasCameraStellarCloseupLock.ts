import type {
  AtlasCameraStellarCloseupAudit,
  AtlasCameraStellarCloseupClassification,
  AtlasCameraStellarCloseupProfile,
  AtlasCameraStellarCloseupRow,
  AtlasCameraStellarCloseupStatus,
  AtlasCameraStellarCloseupSummary,
  AtlasCameraStellarCloseupVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION: AtlasCameraStellarCloseupVersion =
  "v111-camera-stellar-closeup-lock";
export const ATLAS_CAMERA_STELLAR_CLOSEUP_PROFILE: AtlasCameraStellarCloseupProfile =
  "v111-camera-rig-stellar-portrait-closeup";
export const ATLAS_CAMERA_STELLAR_CLOSEUP_BOUNDARY =
  "v111 is a presentation and camera-control pass only. It preserves user orbit/zoom state while target anchors move, adds Gaia/local stellar portrait rendering from catalog-derived visual material, and suppresses nonessential close-up layers without changing scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75/v97/v99 budgets, staging or commits.";

export const V111_CAMERA_STELLAR_CLOSEUP_ROW: AtlasCameraStellarCloseupRow = {
  id: "v111-lock-camera-stellar-closeup",
  label: "Camera anchor rig and stellar portrait close-up",
  status: "not-run",
  v110Status: "not-run",
  cameraRigStatus: "not-run",
  stellarPortraitStatus: "not-run",
  closeupPerformanceStatus: "not-run",
  protectedMutationStatus: "not-run",
};

export function createAtlasCameraStellarCloseupSummary(args: {
  audits?: readonly AtlasCameraStellarCloseupAudit[];
  rows?: readonly AtlasCameraStellarCloseupRow[];
} = {}): AtlasCameraStellarCloseupSummary {
  const audits = args.audits ?? [];
  const rows = args.rows ?? [V111_CAMERA_STELLAR_CLOSEUP_ROW];
  const allReady = audits.length > 0 && audits.every((item) => item.status === "ready");
  const status: AtlasCameraStellarCloseupStatus = allReady
    ? "ready-camera-stellar-closeup-locked"
    : audits.length > 0
      ? "ready-camera-stellar-closeup-blocked"
      : "pending-runtime-run";
  return {
    version: ATLAS_CAMERA_STELLAR_CLOSEUP_VERSION,
    profile: ATLAS_CAMERA_STELLAR_CLOSEUP_PROFILE,
    status,
    classification: classify(audits),
    criticalUiRelativityVisibilityVersion: "v110-critical-ui-relativity-visibility-lock",
    cameraRigPolicy: "target-anchor-user-orbit-distance-state",
    focusExitPolicy: "body-gaia-local-star-escape-passport-reset-clear",
    stellarPortraitPolicy: "gaia-derived-offline-curated-presentation-portrait",
    closeupPerformancePolicy: "selected-closeup-nonessential-layer-suppression",
    gaiaBudgetPolicy: "v97-1000-1800-3000-preserved",
    focusedCommand: "npm run test:atlas:camera-stellar-closeup",
    verifyCommand: "npm run verify:atlas:camera-stellar-closeup",
    screenshotArtifactDirectory: "test-results/v111-camera-stellar-closeup-lock/",
    audits,
    rows,
    readyRowId: allReady ? "v111-lock-camera-stellar-closeup" : "",
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
    stagingMutation: "not-applied",
    commitMutation: "not-applied",
    trustedBoundary: ATLAS_CAMERA_STELLAR_CLOSEUP_BOUNDARY,
  };
}

function classify(
  audits: readonly AtlasCameraStellarCloseupAudit[],
): AtlasCameraStellarCloseupClassification {
  const regressed = audits.filter((item) => item.status !== "ready").map((item) => item.id);
  if (audits.length > 0 && regressed.length === 0) return "camera-stellar-closeup-pass";
  if (regressed.length !== 1) return "mixed";
  const map: Record<string, AtlasCameraStellarCloseupClassification> = {
    "v110-critical-ui-relativity-visibility": "v110-regression",
    "camera-rig-lock": "camera-rig-regression",
    "stellar-portrait-lock": "stellar-portrait-regression",
    "closeup-performance-lock": "closeup-performance-regression",
    "protected-mutation-lock": "protected-mutation-regression",
  };
  return map[regressed[0]!] ?? "mixed";
}
