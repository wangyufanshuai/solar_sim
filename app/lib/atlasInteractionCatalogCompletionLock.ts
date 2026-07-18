import type {
  AtlasInteractionCatalogCompletionAudit,
  AtlasInteractionCatalogCompletionClassification,
  AtlasInteractionCatalogCompletionProfile,
  AtlasInteractionCatalogCompletionRow,
  AtlasInteractionCatalogCompletionStatus,
  AtlasInteractionCatalogCompletionSummary,
  AtlasInteractionCatalogCompletionVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_INTERACTION_CATALOG_COMPLETION_VERSION: AtlasInteractionCatalogCompletionVersion =
  "v107-interaction-catalog-completion-lock";
export const ATLAS_INTERACTION_CATALOG_COMPLETION_PROFILE: AtlasInteractionCatalogCompletionProfile =
  "v107-camera-launch-gaia-navigation-catalog-completion";
export const ATLAS_INTERACTION_CATALOG_COMPLETION_BOUNDARY =
  "v107 changes presentation interaction, local Gaia navigation, labels, curated nebula markers and launch entry only. It does not change scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, Gaia render budgets or v99 opacity caps.";

export const V107_INTERACTION_CATALOG_COMPLETION_ROW: AtlasInteractionCatalogCompletionRow = {
  id: "v107-lock-interaction-catalog-completion",
  label: "Interaction and catalog completion",
  status: "not-run",
  cameraStatus: "not-run",
  launchStatus: "not-run",
  gaiaNavigationStatus: "not-run",
  labelBudgetStatus: "not-run",
  constellationNebulaStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
};

export function createAtlasInteractionCatalogCompletionSummary(args: {
  audits?: readonly AtlasInteractionCatalogCompletionAudit[];
  rows?: readonly AtlasInteractionCatalogCompletionRow[];
} = {}): AtlasInteractionCatalogCompletionSummary {
  const audits = args.audits ?? [];
  const rows = args.rows ?? [V107_INTERACTION_CATALOG_COMPLETION_ROW];
  const allReady = audits.length > 0 && audits.every((item) => item.status === "ready");
  const status: AtlasInteractionCatalogCompletionStatus = allReady
    ? "ready-interaction-catalog-locked"
    : audits.length > 0
      ? "ready-interaction-catalog-blocked"
      : "pending-runtime-run";
  return {
    version: ATLAS_INTERACTION_CATALOG_COMPLETION_VERSION,
    profile: ATLAS_INTERACTION_CATALOG_COMPLETION_PROFILE,
    status,
    classification: classify(audits),
    rcEvidenceClosureVersion: "v106-release-candidate-evidence-closure-lock",
    cameraPolicy: "single-cancellable-command-adaptive-smootherstep-1200-1800ms",
    starFocusPolicy: "celestial-direction-center-not-physical-flyby",
    focusExitPolicy: "passport-reset-escape",
    launchPolicy: "orbit-atlas-entry-sandbox-single-leo-satellite-existing-spacecraft-handoff",
    gaiaSearchPolicy: "packaged-5000-query-min-2-max-12",
    gaiaLabelPolicy: "desktop-24-mobile-8-selected-always",
    constellationCount: 88,
    nebulaCount: 80,
    focusedCommand: "npm run test:atlas:interaction-catalog-completion",
    verifyCommand: "npm run verify:atlas:interaction-catalog",
    screenshotArtifactDirectory: "test-results/v107-interaction-catalog-completion-lock/",
    audits,
    rows,
    readyRowId: allReady ? "v107-lock-interaction-catalog-completion" : "",
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
    trustedBoundary: ATLAS_INTERACTION_CATALOG_COMPLETION_BOUNDARY,
  };
}

function classify(
  audits: readonly AtlasInteractionCatalogCompletionAudit[],
): AtlasInteractionCatalogCompletionClassification {
  const regressed = audits.filter((item) => item.status !== "ready").map((item) => item.id);
  if (audits.length > 0 && regressed.length === 0) return "interaction-catalog-completion-pass";
  if (regressed.length !== 1) return "mixed";
  const map: Record<string, AtlasInteractionCatalogCompletionClassification> = {
    "v106-rc-evidence-closure": "v106-regression",
    "camera-transition-lock": "camera-transition-regression",
    "launch-entry-lock": "launch-entry-regression",
    "gaia-navigation-lock": "gaia-navigation-regression",
    "label-budget-lock": "label-budget-regression",
    "constellation-nebula-lock": "constellation-nebula-regression",
    "docs-surface-lock": "docs-surface-regression",
    "protected-mutation-lock": "protected-mutation-regression",
  };
  return map[regressed[0]!] ?? "mixed";
}
