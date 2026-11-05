import { createAtlasInteractionRepairLaunchUxSummary } from "./atlasInteractionRepairLaunchUxLock";
import {
  runAtlasInteractionRepairLaunchUxAudit,
  type AtlasInteractionRepairLaunchUxAuditArgs,
} from "./atlasInteractionRepairLaunchUxLockRunner";
import {
  ATLAS_INTERACTION_VISUAL_QUALITY_BOUNDARY,
  V109_INTERACTION_VISUAL_QUALITY_ROW,
} from "./atlasInteractionVisualQualityLock";
import type {
  AtlasInteractionVisualQualityAudit,
  AtlasInteractionVisualQualityRow,
} from "./simulationDiagnosticsTypes";

export type AtlasInteractionVisualQualityAuditArgs =
  AtlasInteractionRepairLaunchUxAuditArgs & {
    stellarMaterialText?: string;
    selectedSkyTargetText?: string;
  };

export async function runAtlasInteractionVisualQualityAudit(
  args: AtlasInteractionVisualQualityAuditArgs,
): Promise<{
  audits: readonly AtlasInteractionVisualQualityAudit[];
  rows: readonly AtlasInteractionVisualQualityRow[];
}> {
  const v108 = createAtlasInteractionRepairLaunchUxSummary(
    await runAtlasInteractionRepairLaunchUxAudit(args),
  );
  const camera = args.cameraText ?? "";
  const launch = args.launchText ?? "";
  const stellar = `${args.stellarMaterialText ?? ""}\n${args.gaiaStarFieldText ?? ""}\n${args.selectedSkyTargetText ?? ""}`;
  const docs = args.docsText ?? "";
  const surface = `${args.surfaceText ?? ""}\n${args.browserSpecText ?? ""}`;
  const audits = [
    audit(
      "v108-interaction-repair-launch-ux",
      v108.status === "ready-interaction-repair-launch-ux-locked" &&
        v108.classification === "interaction-repair-launch-ux-pass",
      `${v108.status}; ${v108.classification}`,
      "ready-interaction-repair-launch-ux-locked; interaction-repair-launch-ux-pass",
    ),
    audit(
      "camera-freedom-lock",
      camera.includes("target-follow-user-orbit-override") ||
        (
          camera.includes("userControllingRef.current") &&
          camera.includes("controls.target.copy(lockTargetSmooth.current)") &&
          camera.includes("controls.target.copy(tmpTarget.current)") &&
          camera.includes('focus?.kind === "body"')
        ),
      "body and sky locks yield camera position while user controls orbit",
      "body and sky locks yield camera position while user controls orbit",
    ),
    audit(
      "launch-camera-lock",
      launch.includes("LAUNCH_CAMERA_FOLLOW_EVENT") &&
        launch.includes("manualCameraRef") &&
        launch.includes("data-launch-camera-controls") &&
        launch.includes("data-atlas-launch-camera-mode") &&
        launch.includes("controls.target.lerp(scPos"),
      "launch auto-follow/manual-orbit/restore-follow controls",
      "launch auto-follow/manual-orbit/restore-follow controls",
    ),
    audit(
      "launch-visual-lock",
      launch.includes("data-launch-visual-profile-manifest") &&
        launch.includes("V109_LAUNCH_VISUAL_COMPAT_PROFILE") &&
        launch.includes("isLeoSatellite") &&
        launch.includes("heavy-lift-rocket") &&
        launch.includes("solar") &&
        launch.includes("engineBellGlow"),
      "budget procedural rocket and satellite visuals",
      "budget procedural rocket and satellite visuals",
    ),
    audit(
      "stellar-material-lock",
      stellar.includes("stellarMaterialProfile") &&
        stellar.includes("bpRpToTemperatureK") &&
        stellar.includes("spectralLabel") &&
        stellar.includes("data-sky-target-proxy-spectral-label") &&
        stellar.includes("gaiaOverlayVisualBrightness"),
      "Gaia/local stellar material profile feeds overlay and selected proxy",
      "Gaia/local stellar material profile feeds overlay and selected proxy",
    ),
    audit(
      "docs-surface-lock",
      docs.includes("v109 Interaction Freedom / Launch Visual Upgrade / Gaia Stellar Material Lock") &&
        surface.includes("data-atlas-interaction-visual-quality-version") &&
        surface.includes("interaction-visual-quality-lock") &&
        surface.includes("v109-interaction-visual-quality-lock"),
      "v109 docs and root/Observable/Evidence/Validation/browser markers",
      "v109 docs and root/Observable/Evidence/Validation/browser markers",
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
        'skyAssetMutation: "not-applied"',
        'v9SkyDirectionMutation: "not-applied"',
        'gaiaRenderBudgetMutation: "not-applied"',
        'gaiaOpacityCapMutation: "not-applied"',
        'releasePackagingMutation: "not-applied"',
        'stagingMutation: "not-applied"',
        'commitMutation: "not-applied"',
      ].every((token) => surface.includes(token)),
      "protected mutation flags not-applied",
      "protected mutation flags not-applied",
    ),
  ] as const satisfies readonly AtlasInteractionVisualQualityAudit[];
  return { audits, rows: [completionRow(audits)] };
}

function completionRow(
  audits: readonly AtlasInteractionVisualQualityAudit[],
): AtlasInteractionVisualQualityRow {
  const statusFor = (id: AtlasInteractionVisualQualityAudit["id"]) =>
    audits.find((item) => item.id === id)?.status === "ready" ? "pass" : "fail";
  return {
    ...V109_INTERACTION_VISUAL_QUALITY_ROW,
    status: audits.every((item) => item.status === "ready") ? "complete" : "blocked",
    v108Status: statusFor("v108-interaction-repair-launch-ux"),
    cameraFreedomStatus: statusFor("camera-freedom-lock"),
    launchCameraStatus: statusFor("launch-camera-lock"),
    launchVisualStatus: statusFor("launch-visual-lock"),
    stellarMaterialStatus: statusFor("stellar-material-lock"),
    docsSurfaceStatus: statusFor("docs-surface-lock"),
    protectedMutationStatus: statusFor("protected-mutation-lock"),
  };
}

function audit(
  id: AtlasInteractionVisualQualityAudit["id"],
  ready: boolean,
  measured: string,
  expected: string,
): AtlasInteractionVisualQualityAudit {
  return {
    id,
    label: id,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary: ATLAS_INTERACTION_VISUAL_QUALITY_BOUNDARY,
  };
}

export function v109InteractionVisualQualityCommandContract() {
  return {
    focusedCommand: "npm run test:atlas:interaction-visual-quality",
    verifyCommand: "npm run verify:atlas:interaction-visual-quality",
    interactionRepairVerifyCommand: "npm run verify:atlas:interaction-repair-launch-ux",
    screenshotArtifactDirectory:
      "test-results/v109-interaction-visual-quality-lock/",
  } as const;
}
