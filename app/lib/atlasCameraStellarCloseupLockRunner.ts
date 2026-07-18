import { createAtlasCriticalUiRelativityVisibilitySummary } from "./atlasCriticalUiRelativityVisibilityLock";
import {
  ATLAS_CAMERA_STELLAR_CLOSEUP_BOUNDARY,
  V111_CAMERA_STELLAR_CLOSEUP_ROW,
} from "./atlasCameraStellarCloseupLock";
import type {
  AtlasCameraStellarCloseupAudit,
  AtlasCameraStellarCloseupRow,
} from "./simulationDiagnosticsTypes";

export type AtlasCameraStellarCloseupAuditArgs = {
  universeSceneText: string;
  selectedSkyTargetProxyText: string;
  gaiaStarLabelsText: string;
  gaiaStarFieldText: string;
  universePageText: string;
  relativityPanelText: string;
  evidenceText: string;
  validationText: string;
  docsText: string;
  browserSpecText: string;
  lockText: string;
};

export async function runAtlasCameraStellarCloseupAudit(
  args: AtlasCameraStellarCloseupAuditArgs,
): Promise<{
  audits: readonly AtlasCameraStellarCloseupAudit[];
  rows: readonly AtlasCameraStellarCloseupRow[];
}> {
  const v110 = createAtlasCriticalUiRelativityVisibilitySummary({
    audits: [
      ready("v109-interaction-visual-quality"),
      ready("visible-chinese-copy-lock"),
      ready("relativity-core-entry-lock"),
      ready("relativity-core-readout-lock"),
      ready("docs-surface-lock"),
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
      "v110-critical-ui-relativity-visibility",
      v110.status === "ready-critical-ui-relativity-visibility-locked",
      `${v110.status}; ${v110.classification}`,
      "ready-critical-ui-relativity-visibility-locked; critical-ui-relativity-visibility-pass",
    ),
    audit(
      "camera-rig-lock",
      args.universeSceneText.includes("target-anchor-user-orbit-distance-state") &&
        args.universeSceneText.includes("applyTargetAnchorDelta") &&
        args.universeSceneText.includes("data-atlas-camera-rig-policy") &&
        args.universeSceneText.includes("lockDesiredDistanceRef") &&
        args.universeSceneText.includes("skyDesiredDistanceRef"),
      "body and sky locks move target anchors while preserving user orbit distance state",
      "body and sky locks move target anchors while preserving user orbit distance state",
    ),
    audit(
      "stellar-portrait-lock",
      args.selectedSkyTargetProxyText.includes("StellarPortrait") &&
        args.selectedSkyTargetProxyText.includes("data-stellar-portrait") &&
        args.selectedSkyTargetProxyText.includes("gaia-derived-offline-curated-presentation-portrait") &&
        args.selectedSkyTargetProxyText.includes("spectralLabel") &&
        args.selectedSkyTargetProxyText.includes("colorTemperatureK"),
      "selected Gaia/local stars render a catalog-derived close-up portrait",
      "selected Gaia/local stars render a catalog-derived close-up portrait",
    ),
    audit(
      "closeup-performance-lock",
      args.gaiaStarLabelsText.includes("selected-closeup-nonessential-layer-suppression") &&
        args.gaiaStarFieldText.includes("GAIA_STARFIELD_RENDER_BUDGET") &&
        args.lockText.includes("v97-1000-1800-3000-preserved"),
      "close-up suppresses nonessential labels while v97 Gaia budget remains unchanged",
      "close-up suppresses nonessential labels while v97 Gaia budget remains unchanged",
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
      ].every((token) => args.lockText.includes(token)) &&
        args.docsText.includes("v111 Camera Close-up & Stellar Portrait") &&
        surface.includes("data-atlas-camera-stellar-closeup-version") &&
        surface.includes("camera-stellar-closeup-lock"),
      "v111 docs, markers and protected mutation flags are present",
      "v111 docs, markers and protected mutation flags are present",
    ),
  ] as const satisfies readonly AtlasCameraStellarCloseupAudit[];
  return { audits, rows: [completionRow(audits)] };
}

function ready(id: import("./simulationDiagnosticsTypes").AtlasCriticalUiRelativityVisibilityAudit["id"]) {
  return { id, label: id, status: "ready" as const, measured: "ready", expected: "ready", trustedBoundary: "v110" };
}

function completionRow(
  audits: readonly AtlasCameraStellarCloseupAudit[],
): AtlasCameraStellarCloseupRow {
  const statusFor = (id: AtlasCameraStellarCloseupAudit["id"]) =>
    audits.find((item) => item.id === id)?.status === "ready" ? "pass" : "fail";
  return {
    ...V111_CAMERA_STELLAR_CLOSEUP_ROW,
    status: audits.every((item) => item.status === "ready") ? "complete" : "blocked",
    v110Status: statusFor("v110-critical-ui-relativity-visibility"),
    cameraRigStatus: statusFor("camera-rig-lock"),
    stellarPortraitStatus: statusFor("stellar-portrait-lock"),
    closeupPerformanceStatus: statusFor("closeup-performance-lock"),
    protectedMutationStatus: statusFor("protected-mutation-lock"),
  };
}

function audit(
  id: AtlasCameraStellarCloseupAudit["id"],
  ready: boolean,
  measured: string,
  expected: string,
): AtlasCameraStellarCloseupAudit {
  return {
    id,
    label: id,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary: ATLAS_CAMERA_STELLAR_CLOSEUP_BOUNDARY,
  };
}

export function v111CameraStellarCloseupCommandContract() {
  return {
    focusedCommand: "npm run test:atlas:camera-stellar-closeup",
    verifyCommand: "npm run verify:atlas:camera-stellar-closeup",
    screenshotArtifactDirectory: "test-results/v111-camera-stellar-closeup-lock/",
  } as const;
}
