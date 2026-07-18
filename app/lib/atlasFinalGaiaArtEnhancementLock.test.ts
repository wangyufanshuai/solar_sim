import { describe, expect, it } from "vitest";
import {
  ATLAS_FINAL_GAIA_ART_ENHANCEMENT_PROFILE,
  ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION,
  V105_FINAL_GAIA_ART_ENHANCEMENT_ROW,
  createAtlasFinalGaiaArtEnhancementSummary,
} from "./atlasFinalGaiaArtEnhancementLock";
import type {
  AtlasFinalGaiaArtEnhancementAudit,
  AtlasFinalGaiaArtEnhancementRow,
} from "./simulationDiagnosticsTypes";

describe("v105 final Gaia art enhancement lock", () => {
  it("returns deterministic pending metadata for budget-preserved Gaia art enhancement", () => {
    const summary = createAtlasFinalGaiaArtEnhancementSummary();

    expect(summary).toMatchObject({
      version: ATLAS_FINAL_GAIA_ART_ENHANCEMENT_VERSION,
      finalGaiaArtEnhancementProfile: ATLAS_FINAL_GAIA_ART_ENHANCEMENT_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      browserAcceptanceRuntimeCostVersion: "v104-browser-acceptance-runtime-cost-lock",
      gaiaEnhancementVersion: "v97-gaia-starfield-enhancement",
      artPolishVersion: "v99-art-polish",
      gaiaRenderBudget: { mobile: 1000, balanced: 1800, dense: 3000 },
      opacityCaps: { mobile: 0.62, balanced: 1.05, dense: 1.2, closeup: 0.18 },
      gaiaSelectionPolicy: "deterministic-bright-near-color-spread-sky-binned",
      gaiaVisualMappingPolicy: "budget-preserved-brightness-color-temperature-layering",
      constellationNebulaReadabilityPolicy: "presentation-only-overview-readable-closeup-mobile-restrained",
      browserQaPolicy: "root-observable-evidence-validation-v105-markers",
      focusedCommand: "npm run test:atlas:final-gaia-art-enhancement",
      finalGaiaArtVerifyCommand: "npm run verify:atlas:final-gaia-art",
      defaultFreshCommand: "npm run test:atlas:browser:fresh",
      screenshotArtifactDirectory: "test-results/v105-final-gaia-art-enhancement-lock/",
      finalGaiaArtEnhancement: "applied-budget-preserved-presentation-data-polish",
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
    expect(summary.rows).toEqual([V105_FINAL_GAIA_ART_ENHANCEMENT_ROW]);
    expect(summary.trustedBoundary).toContain("v97 Gaia render budgets");
    expect(summary.trustedBoundary).toContain("v99 opacity caps");
  });

  it("reports ready only when every v105 lock passes", () => {
    const summary = createAtlasFinalGaiaArtEnhancementSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-final-gaia-art-locked");
    expect(summary.classification).toBe("final-gaia-art-pass");
    expect(summary.completedRowCount).toBe(1);
    expect(summary.readyRowId).toBe("v105-lock-final-gaia-art-enhancement");
  });

  it("classifies v104, Gaia, art, browser, budget, docs and mutation regressions", () => {
    expect(createAtlasFinalGaiaArtEnhancementSummary({ audits: [audit("v104-browser-acceptance-runtime-cost", "regressed")] }).classification).toBe("v104-regression");
    expect(createAtlasFinalGaiaArtEnhancementSummary({ audits: [audit("gaia-selection-lock", "regressed")] }).classification).toBe("gaia-selection-regression");
    expect(createAtlasFinalGaiaArtEnhancementSummary({ audits: [audit("gaia-visual-mapping-lock", "regressed")] }).classification).toBe("gaia-visual-mapping-regression");
    expect(createAtlasFinalGaiaArtEnhancementSummary({ audits: [audit("constellation-nebula-readability-lock", "regressed")] }).classification).toBe("constellation-nebula-readability-regression");
    expect(createAtlasFinalGaiaArtEnhancementSummary({ audits: [audit("browser-qa-lock", "regressed")] }).classification).toBe("browser-qa-regression");
    expect(createAtlasFinalGaiaArtEnhancementSummary({ audits: [audit("budget-boundary-lock", "regressed")] }).classification).toBe("budget-boundary-regression");
    expect(createAtlasFinalGaiaArtEnhancementSummary({ audits: [audit("docs-surface-lock", "regressed")] }).classification).toBe("docs-surface-regression");
    expect(createAtlasFinalGaiaArtEnhancementSummary({ audits: [audit("protected-mutation-lock", "regressed")] }).classification).toBe("protected-mutation-regression");
  });
});

function readyAudits(): readonly AtlasFinalGaiaArtEnhancementAudit[] {
  return [
    audit("v104-browser-acceptance-runtime-cost", "ready"),
    audit("gaia-selection-lock", "ready"),
    audit("gaia-visual-mapping-lock", "ready"),
    audit("constellation-nebula-readability-lock", "ready"),
    audit("browser-qa-lock", "ready"),
    audit("budget-boundary-lock", "ready"),
    audit("docs-surface-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasFinalGaiaArtEnhancementAudit["id"],
  status: AtlasFinalGaiaArtEnhancementAudit["status"],
): AtlasFinalGaiaArtEnhancementAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v105 test final Gaia art enhancement",
  };
}

function completedRow(): AtlasFinalGaiaArtEnhancementRow {
  return {
    ...V105_FINAL_GAIA_ART_ENHANCEMENT_ROW,
    status: "complete",
    v104Status: "pass",
    gaiaSelectionStatus: "pass",
    gaiaVisualMappingStatus: "pass",
    constellationNebulaReadabilityStatus: "pass",
    browserQaStatus: "pass",
    budgetBoundaryStatus: "pass",
    docsSurfaceStatus: "pass",
    protectedMutationStatus: "pass",
    finalGaiaArtEnhancement: "applied-budget-preserved-presentation-data-polish",
  };
}
