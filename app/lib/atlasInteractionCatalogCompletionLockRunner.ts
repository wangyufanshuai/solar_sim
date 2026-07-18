import { createAtlasRcEvidenceClosureSummary } from "./atlasRcEvidenceClosureLock";
import {
  runAtlasRcEvidenceClosureAudit,
  type AtlasRcEvidenceClosureAuditArgs,
} from "./atlasRcEvidenceClosureLockRunner";
import {
  ATLAS_INTERACTION_CATALOG_COMPLETION_BOUNDARY,
  V107_INTERACTION_CATALOG_COMPLETION_ROW,
} from "./atlasInteractionCatalogCompletionLock";
import type {
  AtlasInteractionCatalogCompletionAudit,
  AtlasInteractionCatalogCompletionRow,
} from "./simulationDiagnosticsTypes";

export type AtlasInteractionCatalogCompletionAuditArgs =
  AtlasRcEvidenceClosureAuditArgs & {
    cameraText?: string;
    launchText?: string;
    gaiaText?: string;
    docsText?: string;
    surfaceText?: string;
    browserSpecText?: string;
    constellationCount?: number;
    nebulaCount?: number;
  };

export async function runAtlasInteractionCatalogCompletionAudit(
  args: AtlasInteractionCatalogCompletionAuditArgs,
): Promise<{
  audits: readonly AtlasInteractionCatalogCompletionAudit[];
  rows: readonly AtlasInteractionCatalogCompletionRow[];
}> {
  const v106 = createAtlasRcEvidenceClosureSummary(
    await runAtlasRcEvidenceClosureAudit(args),
  );
  const docs = args.docsText ?? "";
  const surface = `${args.surfaceText ?? ""}\n${args.browserSpecText ?? ""}`;
  const camera = args.cameraText ?? "";
  const launch = args.launchText ?? "";
  const gaia = args.gaiaText ?? "";
  const audits = [
    audit(
      "v106-rc-evidence-closure",
      v106.status === "ready-rc-evidence-closed" &&
        v106.classification === "rc-evidence-closure-pass",
      `${v106.status}; ${v106.classification}`,
      "ready-rc-evidence-closed; rc-evidence-closure-pass",
    ),
    audit(
      "camera-transition-lock",
      camera.includes("adaptiveCameraFocusDurationMs") &&
        camera.includes("smootherstep01") &&
        camera.includes("kind: \"direction\"") &&
        !camera.includes("function CameraFocusDirectionBridge"),
      "single cancellable body/direction/origin focus coordinator",
      "single cancellable body/direction/origin focus coordinator",
    ),
    audit(
      "launch-entry-lock",
      launch.includes('data-atlas-launch-entry="orbit-atlas"') &&
        launch.includes('id: "leo_satellite"') &&
        launch.includes("targetAltitudeM: 550_000") &&
        launch.includes("cargoMassKg: 1_200"),
      "Orbit Atlas launch entry and single LEO satellite profile",
      "Orbit Atlas launch entry and single LEO satellite profile",
    ),
    audit(
      "gaia-navigation-lock",
      gaia.includes("ensureGaiaCatalogLoaded") &&
        gaia.includes("searchGaiaStarIndex") &&
        gaia.includes("focus-gaia-star") &&
        gaia.includes("gaiaIndexedStarToDirection"),
      "shared packaged Gaia catalog, bounded search and celestial-direction focus",
      "shared packaged Gaia catalog, bounded search and celestial-direction focus",
    ),
    audit(
      "label-budget-lock",
      gaia.includes("GAIA_LABEL_DESKTOP_BUDGET = 24") &&
        gaia.includes("GAIA_LABEL_MOBILE_BUDGET = 8") &&
        gaia.includes("selectedSourceId"),
      "Gaia labels desktop 24, mobile 8, selected always",
      "Gaia labels desktop 24, mobile 8, selected always",
    ),
    audit(
      "constellation-nebula-lock",
      args.constellationCount === 88 &&
        args.nebulaCount === 80 &&
        gaia.includes("ConstellationLabels"),
      `constellations ${args.constellationCount ?? 0}; nebulae ${args.nebulaCount ?? 0}`,
      "constellations 88; nebulae 80",
    ),
    audit(
      "docs-surface-lock",
      docs.includes("v107 Interaction & Catalog Completion Lock") &&
        surface.includes("data-atlas-interaction-catalog-completion-version") &&
        surface.includes("interaction-catalog-completion-lock") &&
        surface.includes("v107-interaction-catalog-completion-lock"),
      "v107 docs and root/Observable/Evidence/Validation/browser markers",
      "v107 docs and root/Observable/Evidence/Validation/browser markers",
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
  ] as const satisfies readonly AtlasInteractionCatalogCompletionAudit[];
  return { audits, rows: [completionRow(audits)] };
}

function completionRow(
  audits: readonly AtlasInteractionCatalogCompletionAudit[],
): AtlasInteractionCatalogCompletionRow {
  const statusFor = (id: AtlasInteractionCatalogCompletionAudit["id"]) =>
    audits.find((item) => item.id === id)?.status === "ready" ? "pass" : "fail";
  return {
    ...V107_INTERACTION_CATALOG_COMPLETION_ROW,
    status: audits.every((item) => item.status === "ready") ? "complete" : "blocked",
    cameraStatus: statusFor("camera-transition-lock"),
    launchStatus: statusFor("launch-entry-lock"),
    gaiaNavigationStatus: statusFor("gaia-navigation-lock"),
    labelBudgetStatus: statusFor("label-budget-lock"),
    constellationNebulaStatus: statusFor("constellation-nebula-lock"),
    docsSurfaceStatus: statusFor("docs-surface-lock"),
    protectedMutationStatus: statusFor("protected-mutation-lock"),
  };
}

function audit(
  id: AtlasInteractionCatalogCompletionAudit["id"],
  ready: boolean,
  measured: string,
  expected: string,
): AtlasInteractionCatalogCompletionAudit {
  return {
    id,
    label: id,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary: ATLAS_INTERACTION_CATALOG_COMPLETION_BOUNDARY,
  };
}

export function v107InteractionCatalogCommandContract() {
  return {
    focusedCommand: "npm run test:atlas:interaction-catalog-completion",
    verifyCommand: "npm run verify:atlas:interaction-catalog",
    rcEvidenceVerifyCommand: "npm run verify:atlas:rc-evidence",
    screenshotArtifactDirectory:
      "test-results/v107-interaction-catalog-completion-lock/",
  } as const;
}
