import { describe, expect, it } from "vitest";
import {
  ATLAS_POST_ENHANCEMENT_BASELINE_PROFILE,
  ATLAS_POST_ENHANCEMENT_BASELINE_VERSION,
  V100_POST_ENHANCEMENT_BASELINE_ROW,
  createAtlasPostEnhancementMaintenanceBaselineSummary,
} from "./atlasPostEnhancementMaintenanceBaseline";
import type {
  AtlasPostEnhancementMaintenanceBaselineAudit,
  AtlasPostEnhancementMaintenanceBaselineRow,
} from "./simulationDiagnosticsTypes";

describe("v100 post-enhancement maintenance baseline", () => {
  it("returns deterministic pending metadata for the pure maintenance lock", () => {
    const summary = createAtlasPostEnhancementMaintenanceBaselineSummary();

    expect(summary).toMatchObject({
      version: ATLAS_POST_ENHANCEMENT_BASELINE_VERSION,
      postEnhancementBaselineProfile: ATLAS_POST_ENHANCEMENT_BASELINE_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      finalMaintenanceBaselineVersion: "v96-final-maintenance-baseline",
      gaiaEnhancementVersion: "v97-gaia-starfield-enhancement",
      relativityOptimizationVersion: "v98-relativity-simulation-optimization",
      artPolishVersion: "v99-art-polish",
      gaiaRenderBudget: { mobile: 1000, balanced: 1800, dense: 3000 },
      artOpacityCaps: { mobile: 0.62, balanced: 1.05, dense: 1.2, closeup: 0.18 },
      focusedCommand: "npm run test:atlas:post-enhancement-baseline",
      postEnhancementVerifyCommand: "npm run verify:atlas:post-enhancement",
      scientificVerifyCommand: "npm run verify:atlas:scientific",
      browserFreshCommand: "npm run test:atlas:browser:fresh",
      constellationCatalogPolicy: "normalized-88-iau-presentation-contract",
      nebulaMarkerPolicy: "curated-local-presentation-marker-only",
      relativityTeachingPolicy: "v98-teaching-observability-not-scientific-upgrade",
      browserResourcePolicy: "about-blank-unload-imagebitmap-close-screenshot-retry-3015-teardown-watchpack-noise",
      postEnhancementBaseline: "applied-maintenance-lock-only",
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
      performanceOptimizationMutation: "not-applied",
      certificationClaimMutation: "not-applied",
    });
    expect(summary.rows).toEqual([V100_POST_ENHANCEMENT_BASELINE_ROW]);
    expect(summary.trustedBoundary).toContain("post-enhancement maintenance baseline");
  });

  it("reports ready only when every post-enhancement baseline lock passes", () => {
    const summary = createAtlasPostEnhancementMaintenanceBaselineSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-post-enhancement-baseline-locked");
    expect(summary.classification).toBe("post-enhancement-baseline-pass");
    expect(summary.completedRowCount).toBe(1);
    expect(summary.readyRowId).toBe("v100-lock-post-enhancement-maintenance-baseline");
  });

  it("classifies baseline, overlay, observability, polish, browser, entrypoint, docs and mutation regressions", () => {
    expect(createAtlasPostEnhancementMaintenanceBaselineSummary({ audits: [audit("v96-baseline-lock", "regressed")] }).classification).toBe("v96-baseline-regression");
    expect(createAtlasPostEnhancementMaintenanceBaselineSummary({ audits: [audit("v97-gaia-overlay-lock", "regressed")] }).classification).toBe("gaia-overlay-regression");
    expect(createAtlasPostEnhancementMaintenanceBaselineSummary({ audits: [audit("v98-relativity-observability-lock", "regressed")] }).classification).toBe("relativity-observability-regression");
    expect(createAtlasPostEnhancementMaintenanceBaselineSummary({ audits: [audit("v99-art-polish-lock", "regressed")] }).classification).toBe("art-polish-regression");
    expect(createAtlasPostEnhancementMaintenanceBaselineSummary({ audits: [audit("browser-resource-lifecycle-lock", "regressed")] }).classification).toBe("browser-resource-regression");
    expect(createAtlasPostEnhancementMaintenanceBaselineSummary({ audits: [audit("verification-entrypoint-lock", "regressed")] }).classification).toBe("verification-entrypoint-regression");
    expect(createAtlasPostEnhancementMaintenanceBaselineSummary({ audits: [audit("docs-surface-lock", "regressed")] }).classification).toBe("docs-surface-regression");
    expect(createAtlasPostEnhancementMaintenanceBaselineSummary({ audits: [audit("protected-mutation-lock", "regressed")] }).classification).toBe("protected-mutation-regression");
  });
});

function readyAudits(): readonly AtlasPostEnhancementMaintenanceBaselineAudit[] {
  return [
    audit("v96-baseline-lock", "ready"),
    audit("v97-gaia-overlay-lock", "ready"),
    audit("v98-relativity-observability-lock", "ready"),
    audit("v99-art-polish-lock", "ready"),
    audit("browser-resource-lifecycle-lock", "ready"),
    audit("verification-entrypoint-lock", "ready"),
    audit("docs-surface-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasPostEnhancementMaintenanceBaselineAudit["id"],
  status: AtlasPostEnhancementMaintenanceBaselineAudit["status"],
): AtlasPostEnhancementMaintenanceBaselineAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v100 test post-enhancement maintenance baseline audit",
  };
}

function completedRow(): AtlasPostEnhancementMaintenanceBaselineRow {
  return {
    ...V100_POST_ENHANCEMENT_BASELINE_ROW,
    status: "complete",
    finalBaselineStatus: "pass",
    gaiaOverlayStatus: "pass",
    relativityObservabilityStatus: "pass",
    artPolishStatus: "pass",
    browserResourceStatus: "pass",
    verificationEntrypointStatus: "pass",
    docsSurfaceStatus: "pass",
    protectedMutationStatus: "pass",
    postEnhancementBaseline: "applied-maintenance-lock-only",
  };
}
