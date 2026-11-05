import { createAtlasInteractionCatalogCompletionSummary } from "./atlasInteractionCatalogCompletionLock";
import {
  runAtlasInteractionCatalogCompletionAudit,
  type AtlasInteractionCatalogCompletionAuditArgs,
} from "./atlasInteractionCatalogCompletionLockRunner";
import {
  ATLAS_INTERACTION_REPAIR_LAUNCH_UX_BOUNDARY,
  V108_INTERACTION_REPAIR_LAUNCH_UX_ROW,
} from "./atlasInteractionRepairLaunchUxLock";
import type {
  AtlasInteractionRepairLaunchUxAudit,
  AtlasInteractionRepairLaunchUxRow,
} from "./simulationDiagnosticsTypes";

export type AtlasInteractionRepairLaunchUxAuditArgs =
  AtlasInteractionCatalogCompletionAuditArgs & {
    skyTargetText?: string;
    cameraText?: string;
    launchText?: string;
    docsText?: string;
    surfaceText?: string;
    browserSpecText?: string;
  };

export async function runAtlasInteractionRepairLaunchUxAudit(
  args: AtlasInteractionRepairLaunchUxAuditArgs,
): Promise<{
  audits: readonly AtlasInteractionRepairLaunchUxAudit[];
  rows: readonly AtlasInteractionRepairLaunchUxRow[];
}> {
  const v107 = createAtlasInteractionCatalogCompletionSummary(
    await runAtlasInteractionCatalogCompletionAudit(args),
  );
  const skyTarget = args.skyTargetText ?? "";
  const camera = args.cameraText ?? "";
  const launch = args.launchText ?? "";
  const docs = args.docsText ?? "";
  const surface = `${args.surfaceText ?? ""}\n${args.browserSpecText ?? ""}`;
  const audits = [
    audit(
      "v107-interaction-catalog-completion",
      v107.status === "ready-interaction-catalog-locked" &&
        v107.classification === "interaction-catalog-completion-pass",
      `${v107.status}; ${v107.classification}`,
      "ready-interaction-catalog-locked; interaction-catalog-completion-pass",
    ),
    audit(
      "sky-target-proxy-lock",
      skyTarget.includes("SelectedSkyTargetProxy") &&
        skyTarget.includes("data-sky-target-proxy") &&
        skyTarget.includes("skyTargetPosition") &&
        skyTarget.includes("gaiaIndexedStarToDirection"),
      "selected catalog/Gaia visual proxy",
      "selected catalog/Gaia visual proxy",
    ),
    audit(
      "sky-target-zoom-lock",
      camera.includes("SKY_TARGET_ZOOM_MIN_DISTANCE_SCENE") &&
        camera.includes("SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE") &&
        camera.includes("SKY_TARGET_CAMERA_DISTANCE_SCENE") &&
        camera.includes("controls.maxDistance = SKY_TARGET_ZOOM_MAX_DISTANCE_SCENE"),
      "sky target distance clamps for camera-target zoom",
      "sky target distance clamps for camera-target zoom",
    ),
    audit(
      "body-zoom-lock",
      (
        camera.includes("userControllingRef.current && currentDist") &&
        camera.includes("lockDesiredDistanceRef.current = THREE.MathUtils.clamp(currentDist")
      ) ||
        (
          camera.includes("userControllingRef.current && anchoredDist") &&
          camera.includes("lockDesiredDistanceRef.current = THREE.MathUtils.clamp(anchoredDist")
        ),
      "body lock preserves native wheel distance changes",
      "body lock preserves native wheel distance changes",
    ),
    audit(
      "launch-ux-lock",
      launch.includes('defaultProfileId = "leo_satellite"') &&
        launch.includes("data-launch-profile-card") &&
        launch.includes('"leo_satellite"') &&
        launch.includes("data-launch-mission-timeline") &&
        launch.includes("选择任务") &&
        launch.includes("恢复跟随") &&
        launch.includes("max={600_000}"),
      "LEO default launch cards, clear instructions and timeline",
      "LEO default launch cards, clear instructions and timeline",
    ),
    audit(
      "docs-surface-lock",
      docs.includes("v108 Interaction Repair & Launch UX Upgrade Lock") &&
        surface.includes("data-atlas-interaction-repair-launch-ux-version") &&
        surface.includes("interaction-repair-launch-ux-lock") &&
        surface.includes("v108-interaction-repair-launch-ux-lock"),
      "v108 docs and root/Observable/Evidence/Validation/browser markers",
      "v108 docs and root/Observable/Evidence/Validation/browser markers",
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
  ] as const satisfies readonly AtlasInteractionRepairLaunchUxAudit[];
  return { audits, rows: [completionRow(audits)] };
}

function completionRow(
  audits: readonly AtlasInteractionRepairLaunchUxAudit[],
): AtlasInteractionRepairLaunchUxRow {
  const statusFor = (id: AtlasInteractionRepairLaunchUxAudit["id"]) =>
    audits.find((item) => item.id === id)?.status === "ready" ? "pass" : "fail";
  return {
    ...V108_INTERACTION_REPAIR_LAUNCH_UX_ROW,
    status: audits.every((item) => item.status === "ready") ? "complete" : "blocked",
    skyTargetProxyStatus: statusFor("sky-target-proxy-lock"),
    skyTargetZoomStatus: statusFor("sky-target-zoom-lock"),
    bodyZoomStatus: statusFor("body-zoom-lock"),
    launchUxStatus: statusFor("launch-ux-lock"),
    docsSurfaceStatus: statusFor("docs-surface-lock"),
    protectedMutationStatus: statusFor("protected-mutation-lock"),
  };
}

function audit(
  id: AtlasInteractionRepairLaunchUxAudit["id"],
  ready: boolean,
  measured: string,
  expected: string,
): AtlasInteractionRepairLaunchUxAudit {
  return {
    id,
    label: id,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary: ATLAS_INTERACTION_REPAIR_LAUNCH_UX_BOUNDARY,
  };
}

export function v108InteractionRepairLaunchUxCommandContract() {
  return {
    focusedCommand: "npm run test:atlas:interaction-repair-launch-ux",
    verifyCommand: "npm run verify:atlas:interaction-repair-launch-ux",
    interactionCatalogVerifyCommand: "npm run verify:atlas:interaction-catalog",
    screenshotArtifactDirectory:
      "test-results/v108-interaction-repair-launch-ux-lock/",
  } as const;
}
