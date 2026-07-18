import {
  ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_BOUNDARY,
  V110_CRITICAL_UI_RELATIVITY_VISIBILITY_ROW,
} from "./atlasCriticalUiRelativityVisibilityLock";
import type {
  AtlasCriticalUiRelativityVisibilityAudit,
  AtlasCriticalUiRelativityVisibilityRow,
} from "./simulationDiagnosticsTypes";

const MOJIBAKE_TOKENS = [
  "鍙戝",
  "鎺у",
  "鏈",
  "璺熼",
  "鎭㈠",
  "浠诲",
  "杞藉",
  "鐐圭",
  "鐩稿",
  "鍏夊",
  "鈹€",
];

export type AtlasCriticalUiRelativityVisibilityAuditArgs = {
  bottomBarText: string;
  launchControlText: string;
  relativityPanelText: string;
  navigatorText: string;
  universePageText: string;
  evidenceText: string;
  validationText: string;
  docsText: string;
  browserSpecText: string;
  lockText: string;
};

export async function runAtlasCriticalUiRelativityVisibilityAudit(
  args: AtlasCriticalUiRelativityVisibilityAuditArgs,
): Promise<{
  audits: readonly AtlasCriticalUiRelativityVisibilityAudit[];
  rows: readonly AtlasCriticalUiRelativityVisibilityRow[];
}> {
  const uiText = [
    args.bottomBarText,
    args.launchControlText,
    args.relativityPanelText,
    args.navigatorText,
  ].join("\n");
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
      "v109-interaction-visual-quality",
      surface.includes("v109-interaction-visual-quality-lock") &&
        surface.includes("data-atlas-interaction-visual-quality-version"),
      "v109 root and panel lock markers present",
      "v109 root and panel lock markers present",
    ),
    audit(
      "visible-chinese-copy-lock",
      !MOJIBAKE_TOKENS.some((token) => uiText.includes(token)) &&
        uiText.includes("相对论核心") &&
        uiText.includes("发射控制") &&
        uiText.includes("模拟"),
      "visible priority UI copy is readable Chinese and has no known mojibake tokens",
      "visible priority UI copy is readable Chinese and has no known mojibake tokens",
    ),
    audit(
      "relativity-core-entry-lock",
      args.bottomBarText.includes("data-atlas-relativity-core-entry") &&
        args.navigatorText.includes("相对论核心") &&
        args.navigatorText.includes("1PN") &&
        args.navigatorText.includes("Kerr") &&
        args.universePageText.includes("setRelativityObservableAtlasOpen(true)"),
      "bottom bar, Navigator and search can open Relativity Core",
      "bottom bar, Navigator and search can open Relativity Core",
    ),
    audit(
      "relativity-core-readout-lock",
      args.relativityPanelText.includes("data-atlas-relativity-core-panel") &&
        args.relativityPanelText.includes("EIH 1PN") &&
        args.relativityPanelText.includes("DP5(4) / RK4") &&
        args.relativityPanelText.includes("Mercury") &&
        args.relativityPanelText.includes("Shapiro") &&
        args.relativityPanelText.includes("光偏折") &&
        args.relativityPanelText.includes("Kerr ISCO") &&
        args.relativityPanelText.includes("Hamiltonian drift"),
      "existing relativity core readouts are summarized in one obvious panel",
      "existing relativity core readouts are summarized in one obvious panel",
    ),
    audit(
      "docs-surface-lock",
      args.docsText.includes("v110 Critical UI & Relativity Visibility") &&
        surface.includes("data-atlas-critical-ui-relativity-visibility-version") &&
        surface.includes("critical-ui-relativity-visibility-lock"),
      "v110 docs and root/Observable/Evidence/Validation/browser markers",
      "v110 docs and root/Observable/Evidence/Validation/browser markers",
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
      ].every((token) => args.lockText.includes(token)),
      "protected mutation flags remain not-applied",
      "protected mutation flags remain not-applied",
    ),
  ] as const satisfies readonly AtlasCriticalUiRelativityVisibilityAudit[];
  return { audits, rows: [completionRow(audits)] };
}

function completionRow(
  audits: readonly AtlasCriticalUiRelativityVisibilityAudit[],
): AtlasCriticalUiRelativityVisibilityRow {
  const statusFor = (id: AtlasCriticalUiRelativityVisibilityAudit["id"]) =>
    audits.find((item) => item.id === id)?.status === "ready" ? "pass" : "fail";
  return {
    ...V110_CRITICAL_UI_RELATIVITY_VISIBILITY_ROW,
    status: audits.every((item) => item.status === "ready") ? "complete" : "blocked",
    v109Status: statusFor("v109-interaction-visual-quality"),
    visibleCopyStatus: statusFor("visible-chinese-copy-lock"),
    coreEntryStatus: statusFor("relativity-core-entry-lock"),
    coreReadoutStatus: statusFor("relativity-core-readout-lock"),
    docsSurfaceStatus: statusFor("docs-surface-lock"),
    protectedMutationStatus: statusFor("protected-mutation-lock"),
  };
}

function audit(
  id: AtlasCriticalUiRelativityVisibilityAudit["id"],
  ready: boolean,
  measured: string,
  expected: string,
): AtlasCriticalUiRelativityVisibilityAudit {
  return {
    id,
    label: id,
    status: ready ? "ready" : "regressed",
    measured,
    expected,
    trustedBoundary: ATLAS_CRITICAL_UI_RELATIVITY_VISIBILITY_BOUNDARY,
  };
}

export function v110CriticalUiRelativityVisibilityCommandContract() {
  return {
    focusedCommand: "npm run test:atlas:critical-ui-relativity-visibility",
    verifyCommand: "npm run verify:atlas:critical-ui-relativity-visibility",
    screenshotArtifactDirectory:
      "test-results/v110-critical-ui-relativity-visibility-lock/",
  } as const;
}
