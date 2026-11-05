import { describe, expect, it } from "vitest";
import {
  ATLAS_MAINTENANCE_EVIDENCE_INDEX_PROFILE,
  ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION,
  V102_MAINTENANCE_EVIDENCE_INDEX_ROW,
  createAtlasMaintenanceEvidenceIndexSummary,
} from "./atlasMaintenanceEvidenceIndex";
import type {
  AtlasMaintenanceEvidenceIndexAudit,
  AtlasMaintenanceEvidenceIndexRow,
} from "./simulationDiagnosticsTypes";

describe("v102 maintenance evidence index", () => {
  it("returns deterministic pending metadata for maintenance evidence indexing", () => {
    const summary = createAtlasMaintenanceEvidenceIndexSummary();

    expect(summary).toMatchObject({
      version: ATLAS_MAINTENANCE_EVIDENCE_INDEX_VERSION,
      maintenanceEvidenceIndexProfile: ATLAS_MAINTENANCE_EVIDENCE_INDEX_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      browserResourcePerformanceVersion: "v101-browser-resource-performance-lock",
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
    });
    expect(summary.rows).toEqual([V102_MAINTENANCE_EVIDENCE_INDEX_ROW]);
    expect(summary.trustedBoundary).toContain("dirty worktree hygiene");
    expect(summary.trustedBoundary).toContain("DumpStack.log.tmp/pagefile.sys");
  });

  it("reports ready only when every maintenance evidence lock passes", () => {
    const summary = createAtlasMaintenanceEvidenceIndexSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-maintenance-evidence-indexed");
    expect(summary.classification).toBe("maintenance-evidence-index-pass");
    expect(summary.completedRowCount).toBe(1);
    expect(summary.readyRowId).toBe("v102-lock-maintenance-evidence-index");
  });

  it("classifies v101, command, dirty policy, Watchpack, Browser QA, docs and mutation regressions", () => {
    expect(createAtlasMaintenanceEvidenceIndexSummary({ audits: [audit("v101-browser-resource-performance-lock", "regressed")] }).classification).toBe("v101-regression");
    expect(createAtlasMaintenanceEvidenceIndexSummary({ audits: [audit("command-index-lock", "regressed")] }).classification).toBe("command-index-regression");
    expect(createAtlasMaintenanceEvidenceIndexSummary({ audits: [audit("dirty-worktree-policy-lock", "regressed")] }).classification).toBe("dirty-worktree-policy-regression");
    expect(createAtlasMaintenanceEvidenceIndexSummary({ audits: [audit("watchpack-noise-policy-lock", "regressed")] }).classification).toBe("watchpack-noise-policy-regression");
    expect(createAtlasMaintenanceEvidenceIndexSummary({ audits: [audit("browser-qa-index-lock", "regressed")] }).classification).toBe("browser-qa-index-regression");
    expect(createAtlasMaintenanceEvidenceIndexSummary({ audits: [audit("docs-surface-lock", "regressed")] }).classification).toBe("docs-surface-regression");
    expect(createAtlasMaintenanceEvidenceIndexSummary({ audits: [audit("protected-mutation-lock", "regressed")] }).classification).toBe("protected-mutation-regression");
  });
});

function readyAudits(): readonly AtlasMaintenanceEvidenceIndexAudit[] {
  return [
    audit("v101-browser-resource-performance-lock", "ready"),
    audit("command-index-lock", "ready"),
    audit("screenshot-artifact-index-lock", "ready"),
    audit("dirty-worktree-policy-lock", "ready"),
    audit("watchpack-noise-policy-lock", "ready"),
    audit("browser-qa-index-lock", "ready"),
    audit("docs-surface-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasMaintenanceEvidenceIndexAudit["id"],
  status: AtlasMaintenanceEvidenceIndexAudit["status"],
): AtlasMaintenanceEvidenceIndexAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v102 test maintenance evidence index",
  };
}

function completedRow(): AtlasMaintenanceEvidenceIndexRow {
  return {
    ...V102_MAINTENANCE_EVIDENCE_INDEX_ROW,
    status: "complete",
    v101Status: "pass",
    commandIndexStatus: "pass",
    screenshotArtifactStatus: "pass",
    dirtyWorktreePolicyStatus: "pass",
    watchpackNoisePolicyStatus: "pass",
    browserQaIndexStatus: "pass",
    docsSurfaceStatus: "pass",
    protectedMutationStatus: "pass",
    maintenanceEvidenceIndex: "applied-maintenance-index-only",
  };
}
