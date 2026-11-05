import { describe, expect, it } from "vitest";
import {
  ATLAS_RC_EVIDENCE_CLOSURE_PROFILE,
  ATLAS_RC_EVIDENCE_CLOSURE_VERSION,
  V106_RC_EVIDENCE_CLOSURE_ROW,
  createAtlasRcEvidenceClosureSummary,
} from "./atlasRcEvidenceClosureLock";
import type {
  AtlasRcEvidenceClosureAudit,
  AtlasRcEvidenceClosureRow,
} from "./simulationDiagnosticsTypes";

describe("v106 release candidate evidence closure lock", () => {
  it("returns deterministic pending metadata for RC evidence closure", () => {
    const summary = createAtlasRcEvidenceClosureSummary();

    expect(summary).toMatchObject({
      version: ATLAS_RC_EVIDENCE_CLOSURE_VERSION,
      rcEvidenceClosureProfile: ATLAS_RC_EVIDENCE_CLOSURE_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      finalGaiaArtEnhancementVersion: "v105-final-gaia-art-enhancement-lock",
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
    });
    expect(summary.rows).toEqual([V106_RC_EVIDENCE_CLOSURE_ROW]);
    expect(summary.indexedScreenshotArtifactDirectories).toHaveLength(12);
    expect(summary.indexedScreenshotArtifactDirectories).toContain("test-results/v105-final-gaia-art-enhancement-lock/");
    expect(summary.trustedBoundary).toContain("release-candidate evidence closure");
  });

  it("reports ready only when every RC evidence closure lock passes", () => {
    const summary = createAtlasRcEvidenceClosureSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-rc-evidence-closed");
    expect(summary.classification).toBe("rc-evidence-closure-pass");
    expect(summary.completedRowCount).toBe(1);
    expect(summary.readyRowId).toBe("v106-lock-release-candidate-evidence-closure");
  });

  it("classifies v105, command, browser, artifact, dirty, docs and mutation regressions", () => {
    expect(createAtlasRcEvidenceClosureSummary({ audits: [audit("v105-final-gaia-art-enhancement", "regressed")] }).classification).toBe("v105-regression");
    expect(createAtlasRcEvidenceClosureSummary({ audits: [audit("command-matrix-lock", "regressed")] }).classification).toBe("command-matrix-regression");
    expect(createAtlasRcEvidenceClosureSummary({ audits: [audit("browser-qa-lock", "regressed")] }).classification).toBe("browser-qa-regression");
    expect(createAtlasRcEvidenceClosureSummary({ audits: [audit("artifact-index-lock", "regressed")] }).classification).toBe("artifact-index-regression");
    expect(createAtlasRcEvidenceClosureSummary({ audits: [audit("dirty-worktree-policy-lock", "regressed")] }).classification).toBe("dirty-worktree-policy-regression");
    expect(createAtlasRcEvidenceClosureSummary({ audits: [audit("docs-surface-lock", "regressed")] }).classification).toBe("docs-surface-regression");
    expect(createAtlasRcEvidenceClosureSummary({ audits: [audit("protected-mutation-lock", "regressed")] }).classification).toBe("protected-mutation-regression");
  });
});

function readyAudits(): readonly AtlasRcEvidenceClosureAudit[] {
  return [
    audit("v105-final-gaia-art-enhancement", "ready"),
    audit("command-matrix-lock", "ready"),
    audit("browser-qa-lock", "ready"),
    audit("artifact-index-lock", "ready"),
    audit("dirty-worktree-policy-lock", "ready"),
    audit("watchpack-noise-policy-lock", "ready"),
    audit("docs-surface-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasRcEvidenceClosureAudit["id"],
  status: AtlasRcEvidenceClosureAudit["status"],
): AtlasRcEvidenceClosureAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v106 test RC evidence closure",
  };
}

function completedRow(): AtlasRcEvidenceClosureRow {
  return {
    ...V106_RC_EVIDENCE_CLOSURE_ROW,
    status: "complete",
    v105Status: "pass",
    commandMatrixStatus: "pass",
    browserQaStatus: "pass",
    artifactIndexStatus: "pass",
    dirtyWorktreePolicyStatus: "pass",
    watchpackNoisePolicyStatus: "pass",
    docsSurfaceStatus: "pass",
    protectedMutationStatus: "pass",
    rcEvidenceClosure: "applied-rc-evidence-closure-only",
  };
}
