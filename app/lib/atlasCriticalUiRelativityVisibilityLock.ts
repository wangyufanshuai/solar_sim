import type {
  AtlasCriticalUiRelativityVisibilityAudit,
  AtlasCriticalUiRelativityVisibilityClassification,
  AtlasCriticalUiRelativityVisibilityProfile,
  AtlasCriticalUiRelativityVisibilityRow,
  AtlasCriticalUiRelativityVisibilityStatus,
  AtlasCriticalUiRelativityVisibilitySummary,
  AtlasCriticalUiRelativityVisibilityVersion,
} from "./simulationDiagnosticsTypes";

export const ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_VERSION: AtlasCriticalUiRelativityVisibilityVersion =
  "v110-critical-ui-relativity-visibility-lock";
export const ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_PROFILE: AtlasCriticalUiRelativityVisibilityProfile =
  "v110-visible-chinese-copy-relativity-core-entry";
export const ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_BOUNDARY =
  "v110 is a visible UI and observability pass only. It cleans visible Chinese copy, adds direct Relativity Core entry points and summarizes existing EIH 1PN, DP/RK, Mercury, Shapiro, light-deflection and Kerr readouts without changing scientific gates, fixtures, live or worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background, v75/v97/v99 budgets, staging or commits.";

export const V110_CRITICAL_UI_RELATIVITY_VISIBILITY_ROW: AtlasCriticalUiRelativityVisibilityRow = {
  id: "v110-lock-critical-ui-relativity-visibility",
  label: "Critical UI cleanup and Relativity Core visibility",
  status: "not-run",
  v109Status: "not-run",
  visibleCopyStatus: "not-run",
  coreEntryStatus: "not-run",
  coreReadoutStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
};

export function createAtlasCriticalUiRelativityVisibilitySummary(args: {
  audits?: readonly AtlasCriticalUiRelativityVisibilityAudit[];
  rows?: readonly AtlasCriticalUiRelativityVisibilityRow[];
} = {}): AtlasCriticalUiRelativityVisibilitySummary {
  const audits = args.audits ?? [];
  const rows = args.rows ?? [V110_CRITICAL_UI_RELATIVITY_VISIBILITY_ROW];
  const allReady = audits.length > 0 && audits.every((item) => item.status === "ready");
  const status: AtlasCriticalUiRelativityVisibilityStatus = allReady
    ? "ready-critical-ui-relativity-visibility-locked"
    : audits.length > 0
      ? "ready-critical-ui-relativity-visibility-blocked"
      : "pending-runtime-run";
  return {
    version: ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_VERSION,
    profile: ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_PROFILE,
    status,
    classification: classify(audits),
    interactionVisualQualityVersion: "v109-interaction-visual-quality-lock",
    uiCopyPolicy: "visible-chinese-copy-no-mojibake",
    relativityCoreEntryPolicy: "bottom-tools-search-observable-atlas-entry",
    relativityReadoutPolicy: "eih-dp-rk-mercury-shapiro-kerr-boundary-visible",
    focusedCommand: "npm run test:atlas:critical-ui-relativity-visibility",
    verifyCommand: "npm run verify:atlas:critical-ui-relativity-visibility",
    screenshotArtifactDirectory: "test-results/v110-critical-ui-relativity-visibility-lock/",
    audits,
    rows,
    readyRowId: allReady ? "v110-lock-critical-ui-relativity-visibility" : "",
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
    trustedBoundary: ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_BOUNDARY,
  };
}

function classify(
  audits: readonly AtlasCriticalUiRelativityVisibilityAudit[],
): AtlasCriticalUiRelativityVisibilityClassification {
  const regressed = audits.filter((item) => item.status !== "ready").map((item) => item.id);
  if (audits.length > 0 && regressed.length === 0) return "critical-ui-relativity-visibility-pass";
  if (regressed.length !== 1) return "mixed";
  const map: Record<string, AtlasCriticalUiRelativityVisibilityClassification> = {
    "v109-interaction-visual-quality": "v109-regression",
    "visible-chinese-copy-lock": "visible-copy-regression",
    "relativity-core-entry-lock": "relativity-core-entry-regression",
    "relativity-core-readout-lock": "core-readout-regression",
    "docs-surface-lock": "docs-surface-regression",
    "protected-mutation-lock": "protected-mutation-regression",
  };
  return map[regressed[0]!] ?? "mixed";
}
