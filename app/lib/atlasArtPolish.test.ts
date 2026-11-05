import { describe, expect, it } from "vitest";
import {
  ATLAS_ART_POLISH_OPACITY_CAPS,
  ATLAS_ART_POLISH_PROFILE,
  ATLAS_ART_POLISH_VERSION,
  V99_ART_POLISH_ROW,
  artPolishV9SkyBoundaryPreserved,
  createAtlasArtPolishSummary,
} from "./atlasArtPolish";
import type { AtlasArtPolishAudit, AtlasArtPolishRow } from "./simulationDiagnosticsTypes";

describe("v99 art polish", () => {
  it("returns deterministic pending metadata for the presentation-only polish layer", () => {
    const summary = createAtlasArtPolishSummary();

    expect(summary).toMatchObject({
      version: ATLAS_ART_POLISH_VERSION,
      artPolishProfile: ATLAS_ART_POLISH_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      opacityCaps: ATLAS_ART_POLISH_OPACITY_CAPS,
      gaiaRenderBudget: { mobile: 1000, balanced: 1800, dense: 3000 },
      gaiaEnhancementVersion: "v97-gaia-starfield-enhancement",
      relativityOptimizationVersion: "v98-relativity-simulation-optimization",
      constellationLinePolicy: "lighter-overview-closeup-mobile-density",
      nebulaMarkerPolicy: "overview-enhanced-closeup-mobile-restrained",
      closeupReadabilityPolicy: "selected-body-background-deemphasized",
      mobileDensityPolicy: "mobile-label-line-nebula-density-restrained",
      officialCertificationPolicy: "not-nasa-jpl-gaia-universe-sandbox-certified",
      artPolish: "applied-presentation-layer-only",
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
    expect(summary.rows).toEqual([V99_ART_POLISH_ROW]);
    expect(summary.trustedBoundary).toContain("presentation-only art polish");
  });

  it("locks opacity caps, Gaia render budgets and V9 sky identity", () => {
    expect(ATLAS_ART_POLISH_OPACITY_CAPS).toEqual({
      mobile: 0.62,
      balanced: 1.05,
      dense: 1.2,
      closeup: 0.18,
    });
    expect(createAtlasArtPolishSummary().gaiaRenderBudget).toEqual({
      mobile: 1000,
      balanced: 1800,
      dense: 3000,
    });
    expect(artPolishV9SkyBoundaryPreserved()).toBe(true);
  });

  it("reports ready only when every art polish lock passes", () => {
    const summary = createAtlasArtPolishSummary({
      audits: readyAudits(),
      rows: [completedRow()],
    });

    expect(summary.status).toBe("ready-art-polish-locked");
    expect(summary.classification).toBe("art-polish-pass");
    expect(summary.completedRowCount).toBe(1);
    expect(summary.readyRowId).toBe("v99-lock-art-polish");
  });

  it("classifies Gaia, constellation, nebula, closeup, mobile, sky, mutation and docs regressions", () => {
    expect(createAtlasArtPolishSummary({ audits: [audit("gaia-layer-lock", "regressed")] }).classification).toBe("gaia-layer-regression");
    expect(createAtlasArtPolishSummary({ audits: [audit("constellation-layer-lock", "regressed")] }).classification).toBe("constellation-layer-regression");
    expect(createAtlasArtPolishSummary({ audits: [audit("nebula-layer-lock", "regressed")] }).classification).toBe("nebula-layer-regression");
    expect(createAtlasArtPolishSummary({ audits: [audit("closeup-readability-lock", "regressed")] }).classification).toBe("closeup-readability-regression");
    expect(createAtlasArtPolishSummary({ audits: [audit("mobile-budget-lock", "regressed")] }).classification).toBe("mobile-budget-regression");
    expect(createAtlasArtPolishSummary({ audits: [audit("v9-sky-boundary-lock", "regressed")] }).classification).toBe("v9-sky-boundary-regression");
    expect(createAtlasArtPolishSummary({ audits: [audit("protected-mutation-lock", "regressed")] }).classification).toBe("protected-mutation-regression");
    expect(createAtlasArtPolishSummary({ audits: [audit("docs-surface-lock", "regressed")] }).classification).toBe("docs-surface-regression");
  });
});

function readyAudits(): readonly AtlasArtPolishAudit[] {
  return [
    audit("gaia-layer-lock", "ready"),
    audit("constellation-layer-lock", "ready"),
    audit("nebula-layer-lock", "ready"),
    audit("closeup-readability-lock", "ready"),
    audit("mobile-budget-lock", "ready"),
    audit("v9-sky-boundary-lock", "ready"),
    audit("docs-surface-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(id: AtlasArtPolishAudit["id"], status: AtlasArtPolishAudit["status"]): AtlasArtPolishAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v99 test art polish audit",
  };
}

function completedRow(): AtlasArtPolishRow {
  return {
    ...V99_ART_POLISH_ROW,
    status: "complete",
    gaiaLayerStatus: "pass",
    constellationLayerStatus: "pass",
    nebulaLayerStatus: "pass",
    closeupReadabilityStatus: "pass",
    mobileBudgetStatus: "pass",
    v9SkyBoundaryStatus: "pass",
    docsSurfaceStatus: "pass",
    protectedMutationStatus: "pass",
    artPolish: "applied-presentation-layer-only",
  };
}
