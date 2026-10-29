import { ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION } from "./atlasFinalGaiaArtEnhancementLock";
import type {
  AtlasRcEvidenceClosureAudit,
  AtlasRcEvidenceClosureClassification,
  AtlasRcEvidenceClosureRow,
  AtlasRcEvidenceClosureSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_RC_EVIDENCE_CLOSURE_VERSION =
  "v106-release-candidate-evidence-closure-lock" as const;

export const ATLAS_RC_EVIDENCE_CLOSURE_PROFILE =
  "v106-v93-v105-final-rc-evidence-closure" as const;

export const ATLAS_RC_EVIDENCE_CLOSURE_SCREENSHOT_DIRECTORIES = [
  "test-results/v93-scientific-gate-release-evidence/",
  "test-results/v94-browser-ci-stability-lock/",
  "test-results/v95-release-artifact-manifest-lock/",
  "test-results/v97-gaia-starfield-enhancement/",
  "test-results/v98-relativity-simulation-optimization/",
  "test-results/v99-art-polish/",
  "test-results/v100-post-enhancement-maintenance-baseline/",
  "test-results/v101-browser-resource-performance-lock/",
  "test-results/v102-maintenance-evidence-index/",
  "test-results/v103-presentation-runtime-performance-lock/",
  "test-results/v104-browser-acceptance-runtime-cost-lock/",
  "test-results/v105-final-gaia-art-enhancement-lock/",
] as const;

export const ATLAS_RC_EVIDENCE_CLOSURE_BOUNDARY =
  "Local v106 release-candidate evidence closure lock over v105. It indexes v93-v105 evidence, commands, Browser QA screenshot artifact directories, dirty worktree policy and Windows Watchpack known non-failure noise while preserving scientific gates, fixtures, live runtime physics, worker physics, RK4/DP, EIH 1PN, Kerr, V9 sky/background direction, v97 Gaia budgets, v99 opacity caps, release archive, staging, commit and official certification boundaries.";

export const V106_RC_EVIDENCE_CLOSURE_ROW: AtlasRcEvidenceClosureRow = {
  id: "v106-lock-release-candidate-evidence-closure",
  label: "Lock final release-candidate evidence closure",
  status: "not-run",
  v105Status: "not-run",
  commandMatrixStatus: "not-run",
  browserQaStatus: "not-run",
  artifactIndexStatus: "not-run",
  dirtyWorktreePolicyStatus: "not-run",
  watchpackNoisePolicyStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
  rcEvidenceClosure: "applied-rc-evidence-closure-only",
} as const;

export function createAtlasRcEvidenceClosureSummary(
  args: {
    audits?: readonly AtlasRcEvidenceClosureAudit[];
    rows?: readonly AtlasRcEvidenceClosureRow[];
  } = {},
): AtlasRcEvidenceClosureSummary {
  const audits = args.audits ?? [];
  const rows = [
    args.rows?.find((row) => row.id === V106_RC_EVIDENCE_CLOSURE_ROW.id) ??
      V106_RC_EVIDENCE_CLOSURE_ROW,
  ];
  const completed = rows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.v105Status === "pass" &&
        row.commandMatrixStatus === "pass" &&
        row.browserQaStatus === "pass" &&
        row.artifactIndexStatus === "pass" &&
        row.dirtyWorktreePolicyStatus === "pass" &&
        row.watchpackNoisePolicyStatus === "pass" &&
        row.docsSurfaceStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.v105Status !== "pass" ||
      row.commandMatrixStatus !== "pass" ||
      row.browserQaStatus !== "pass" ||
      row.artifactIndexStatus !== "pass" ||
      row.dirtyWorktreePolicyStatus !== "pass" ||
      row.watchpackNoisePolicyStatus !== "pass" ||
      row.docsSurfaceStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-rc-evidence-blocked"
        : ready
          ? "ready-rc-evidence-closed"
          : "ready-rc-handoff-indexed";

  return {
    version: ATLAS_RC_EVIDENCE_CLOSURE_VERSION,
    rcEvidenceClosureProfile: ATLAS_RC_EVIDENCE_CLOSURE_PROFILE,
    status,
    classification: classifyRcEvidenceClosure({ status, audits, ready }),
    finalGaiaArtEnhancementVersion: ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION,
    commandMatrixPolicy: "v93-v105-focused-and-verify-commands-indexed",
    browserQaPolicy: "root-observable-evidence-validation-v106-markers-console-zero-fresh-teardown",
    artifactIndexPolicy: "v93-v105-browser-screenshot-directories-indexed",
    dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit",
    watchpackNoisePolicy: "DumpStack.log.tmp-pagefile.sys-known-non-failure-noise",
    focusedCommand: "npm run test:atlas:rc-evidence-closure",
    rcEvidenceVerifyCommand: "npm run verify:atlas:rc-evidence",
    finalGaiaArtVerifyCommand: "npm run verify:atlas:final-gaia-art",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    screenshotArtifactDirectory: "test-results/v106-release-candidate-evidence-closure-lock/",
    indexedScreenshotArtifactDirectories: ATLAS_RC_EVIDENCE_CLOSURE_SCREENSHOT_DIRECTORIES,
    rowCount: rows.length,
    completedRowCount: completed.length,
    audits,
    rows,
    readyRowId: ready?.id ?? "",
    rcEvidenceClosure: "applied-rc-evidence-closure-only",
    livePhysicsMutation: "not-applied",
    workerPhysicsMutation: "not-applied",
    rk4DefaultMutation: "not-applied",
    eihOnePnMutation: "not-applied",
    kerrKernelMutation: "not-applied",
    skyAssetMutation: "not-applied",
    backgroundMutation: "not-applied",
    v9SkyDirectionMutation: "not-applied",
    materialMutation: "not-applied",
    fixtureDataMutation: "not-applied",
    budgetMutation: "not-applied",
    defaultGateConfigMutation: "not-applied",
    releaseArchiveMutation: "not-applied",
    releasePackagingMutation: "not-applied",
    stagingMutation: "not-applied",
    commitMutation: "not-applied",
    certificationClaimMutation: "not-applied",
    trustedBoundary: ATLAS_RC_EVIDENCE_CLOSURE_BOUNDARY,
  };
}

function classifyRcEvidenceClosure(args: {
  status: AtlasRcEvidenceClosureSummary["status"];
  audits: readonly AtlasRcEvidenceClosureAudit[];
  ready: AtlasRcEvidenceClosureRow | null;
}): AtlasRcEvidenceClosureClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (args.audits.some((audit) => audit.id === "v105-final-gaia-art-enhancement" && audit.status !== "ready")) {
    return "v105-regression";
  }
  if (args.audits.some((audit) => audit.id === "command-matrix-lock" && audit.status !== "ready")) {
    return "command-matrix-regression";
  }
  if (args.audits.some((audit) => audit.id === "browser-qa-lock" && audit.status !== "ready")) {
    return "browser-qa-regression";
  }
  if (args.audits.some((audit) => audit.id === "artifact-index-lock" && audit.status !== "ready")) {
    return "artifact-index-regression";
  }
  if (args.audits.some((audit) => audit.id === "dirty-worktree-policy-lock" && audit.status !== "ready")) {
    return "dirty-worktree-policy-regression";
  }
  if (args.audits.some((audit) => audit.id === "watchpack-noise-policy-lock" && audit.status !== "ready")) {
    return "dirty-worktree-policy-regression";
  }
  if (args.audits.some((audit) => audit.id === "docs-surface-lock" && audit.status !== "ready")) {
    return "docs-surface-regression";
  }
  if (args.audits.some((audit) => audit.id === "protected-mutation-lock" && audit.status !== "ready")) {
    return "protected-mutation-regression";
  }
  if (args.ready) return "rc-evidence-closure-pass";
  return "mixed";
}
