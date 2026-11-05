import {
  ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION,
} from "./atlasBrowserResourcePerformanceLock";
import type {
  AtlasMaintenanceEvidenceIndexAudit,
  AtlasMaintenanceEvidenceIndexClassification,
  AtlasMaintenanceEvidenceIndexRow,
  AtlasMaintenanceEvidenceIndexSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION =
  "v102-maintenance-evidence-index" as const;

export const ATLAS_MAINTENANCE_EVIDENCE_INDEX_PROFILE =
  "v102-v93-v101-maintenance-evidence-index" as const;

export const ATLAS_MAINTENANCE_EVIDENCE_INDEX_BOUNDARY =
  "Local v102 maintenance evidence index over v93-v101. It indexes command evidence, browser screenshot artifact directories, Browser QA result policy, dirty worktree hygiene and Windows Watchpack DumpStack.log.tmp/pagefile.sys known non-failure noise without cleaning, resetting, reverting, staging, committing, release packaging, scientific gate mutation, fixture mutation, runtime physics mutation, worker physics mutation, RK4/DP mutation, EIH 1PN mutation, Kerr mutation, V9 sky/background mutation, v97 Gaia budget mutation or v99 opacity cap mutation.";

export const V102_MAINTENANCE_EVIDENCE_INDEX_ROW: AtlasMaintenanceEvidenceIndexRow = {
  id: "v102-lock-maintenance-evidence-index",
  label: "Lock v93-v101 maintenance evidence index and repo hygiene policy",
  status: "not-run",
  v101Status: "not-run",
  commandIndexStatus: "not-run",
  screenshotArtifactStatus: "not-run",
  dirtyWorktreePolicyStatus: "not-run",
  watchpackNoisePolicyStatus: "not-run",
  browserQaIndexStatus: "not-run",
  docsSurfaceStatus: "not-run",
  protectedMutationStatus: "not-run",
  maintenanceEvidenceIndex: "applied-maintenance-index-only",
} as const;

export function createAtlasMaintenanceEvidenceIndexSummary(
  args: {
    audits?: readonly AtlasMaintenanceEvidenceIndexAudit[];
    rows?: readonly AtlasMaintenanceEvidenceIndexRow[];
  } = {},
): AtlasMaintenanceEvidenceIndexSummary {
  const audits = args.audits ?? [];
  const rows = [
    args.rows?.find((row) => row.id === V102_MAINTENANCE_EVIDENCE_INDEX_ROW.id) ??
      V102_MAINTENANCE_EVIDENCE_INDEX_ROW,
  ];
  const completed = rows.filter((row) => row.status === "complete");
  const ready =
    completed.find(
      (row) =>
        row.v101Status === "pass" &&
        row.commandIndexStatus === "pass" &&
        row.screenshotArtifactStatus === "pass" &&
        row.dirtyWorktreePolicyStatus === "pass" &&
        row.watchpackNoisePolicyStatus === "pass" &&
        row.browserQaIndexStatus === "pass" &&
        row.docsSurfaceStatus === "pass" &&
        row.protectedMutationStatus === "pass",
    ) ?? null;
  const hasAuditRegression = audits.some((audit) => audit.status !== "ready");
  const hasRowRegression = completed.some(
    (row) =>
      row.v101Status !== "pass" ||
      row.commandIndexStatus !== "pass" ||
      row.screenshotArtifactStatus !== "pass" ||
      row.dirtyWorktreePolicyStatus !== "pass" ||
      row.watchpackNoisePolicyStatus !== "pass" ||
      row.browserQaIndexStatus !== "pass" ||
      row.docsSurfaceStatus !== "pass" ||
      row.protectedMutationStatus !== "pass",
  );
  const status =
    completed.length === 0 && audits.length === 0
      ? "pending-runtime-run"
      : hasAuditRegression || hasRowRegression
        ? "ready-maintenance-evidence-blocked"
        : ready
          ? "ready-maintenance-evidence-indexed"
          : "ready-repo-hygiene-policy-locked";

  return {
    version: ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION,
    maintenanceEvidenceIndexProfile: ATLAS_MAINTENANCE_EVIDENCE_INDEX_PROFILE,
    status,
    classification: classifyMaintenanceEvidenceIndex({ status, audits, ready }),
    browserResourcePerformanceVersion: ATLAS_BROWSER_RESOURCE_PERFORMANCE_VERSION,
    rowCount: rows.length,
    completedRowCount: completed.length,
    audits,
    rows,
    readyRowId: ready?.id ?? "",
    focusedCommand: "npm run test:atlas:maintenance-evidence-index",
    maintenanceEvidenceVerifyCommand: "npm run verify:atlas:maintenance-evidence",
    browserResourceVerifyCommand: "npm run verify:atlas:browser-resource",
    postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement",
    scientificVerifyCommand: "npm run verify:atlas:scientific",
    commandIndexPolicy: "v93-v101-focused-and-verify-commands-indexed",
    screenshotArtifactPolicy: "v93-v95-v97-v101-browser-screenshot-directories-indexed",
    dirtyWorktreePolicy: "no-reset-no-revert-no-clean-no-stage-no-commit",
    watchpackNoisePolicy: "dumpstack-pagefile-known-non-failure-noise",
    browserQaPolicy: "root-observable-evidence-validation-console-errors-zero-teardown-clear",
    maintenanceEvidenceIndex: "applied-maintenance-index-only",
    runtimePerformanceMutation: "not-applied",
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
    releasePackagingMutation: "not-applied",
    certificationClaimMutation: "not-applied",
    trustedBoundary: ATLAS_MAINTENANCE_EVIDENCE_INDEX_BOUNDARY,
  };
}

function classifyMaintenanceEvidenceIndex(args: {
  status: AtlasMaintenanceEvidenceIndexSummary["status"];
  audits: readonly AtlasMaintenanceEvidenceIndexAudit[];
  ready: AtlasMaintenanceEvidenceIndexRow | null;
}): AtlasMaintenanceEvidenceIndexClassification {
  if (args.status === "pending-runtime-run") return "mixed";
  if (args.audits.some((audit) => audit.id === "v101-browser-resource-performance-lock" && audit.status !== "ready")) {
    return "v101-regression";
  }
  if (args.audits.some((audit) => audit.id === "command-index-lock" && audit.status !== "ready")) {
    return "command-index-regression";
  }
  if (args.audits.some((audit) => audit.id === "screenshot-artifact-index-lock" && audit.status !== "ready")) {
    return "browser-qa-index-regression";
  }
  if (args.audits.some((audit) => audit.id === "dirty-worktree-policy-lock" && audit.status !== "ready")) {
    return "dirty-worktree-policy-regression";
  }
  if (args.audits.some((audit) => audit.id === "watchpack-noise-policy-lock" && audit.status !== "ready")) {
    return "watchpack-noise-policy-regression";
  }
  if (args.audits.some((audit) => audit.id === "browser-qa-index-lock" && audit.status !== "ready")) {
    return "browser-qa-index-regression";
  }
  if (args.audits.some((audit) => audit.id === "docs-surface-lock" && audit.status !== "ready")) {
    return "docs-surface-regression";
  }
  if (args.audits.some((audit) => audit.id === "protected-mutation-lock" && audit.status !== "ready")) {
    return "protected-mutation-regression";
  }
  if (args.ready) return "maintenance-evidence-index-pass";
  return "mixed";
}
