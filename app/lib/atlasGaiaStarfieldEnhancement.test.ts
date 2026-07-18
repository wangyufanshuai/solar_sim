import { describe, expect, it } from "vitest";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEBULAE } from "../data/nebulaCatalog";
import {
  ATLAS_GAIA_STARFIELD_ENHANCEMENT_PROFILE,
  ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
  ATLAS_GAIA_STARFIELD_RENDER_BUDGET,
  V97_GAIA_STARFIELD_ENHANCEMENT_ROW,
  createAtlasGaiaStarfieldEnhancementSummary,
  orbitAtlasV9SkyBoundaryPreserved,
} from "./atlasGaiaStarfieldEnhancement";
import type {
  AtlasGaiaStarfieldEnhancementAudit,
  AtlasGaiaStarfieldEnhancementRow,
} from "./simulationDiagnosticsTypes";

describe("v97 Gaia starfield enhancement", () => {
  it("returns deterministic pending metadata for the visual overlay", () => {
    const summary = createAtlasGaiaStarfieldEnhancementSummary();

    expect(summary).toMatchObject({
      version: ATLAS_GAIA_STARFIELD_ENHANCEMENT_VERSION,
      overlayProfile: ATLAS_GAIA_STARFIELD_ENHANCEMENT_PROFILE,
      status: "pending-runtime-run",
      classification: "mixed",
      qualityTier: "balanced",
      renderBudget: ATLAS_GAIA_STARFIELD_RENDER_BUDGET,
      activeGaiaRenderBudget: 1800,
      packagedGaiaBrightRowCount: 5000,
      packagedGaiaKinematicsRowCount: 2000,
      normalizedIauConstellationCount: 88,
      constellationRenderGroupCount: CONSTELLATION_LINES.length,
      nebulaMarkerCount: NEBULAE.length,
      defaultActivationPolicy: "sandbox-deep-space-and-orbit-atlas-dense",
      mobileDowngradePolicy: "mobile-uses-1000-star-budget",
      closeupSuppressionPolicy: "selected-body-closeup-opacity-suppressed",
      fullGaiaArchivePolicy: "not-full-gaia-archive",
      officialCertificationPolicy: "not-gaia-nasa-jpl-certified",
      gaiaStarfieldEnhancement: "applied-overlay-only",
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
    expect(summary.overlayRows).toEqual([V97_GAIA_STARFIELD_ENHANCEMENT_ROW]);
    expect(summary.trustedBoundary).toContain("not the full Gaia archive");
  });

  it("locks fixed Gaia render budgets and V9 sky identity", () => {
    expect(ATLAS_GAIA_STARFIELD_RENDER_BUDGET).toEqual({
      mobile: 1000,
      balanced: 1800,
      dense: 3000,
    });
    expect(createAtlasGaiaStarfieldEnhancementSummary({ qualityTier: "mobile" }).activeGaiaRenderBudget).toBe(1000);
    expect(createAtlasGaiaStarfieldEnhancementSummary({ qualityTier: "dense" }).activeGaiaRenderBudget).toBe(3000);
    expect(orbitAtlasV9SkyBoundaryPreserved()).toBe(true);
  });

  it("reports ready only when every Gaia overlay lock passes", () => {
    const summary = createAtlasGaiaStarfieldEnhancementSummary({
      audits: readyAudits(),
      rows: [completedRow()],
      qualityTier: "dense",
    });

    expect(summary.status).toBe("ready-gaia-overlay-locked");
    expect(summary.classification).toBe("gaia-overlay-pass");
    expect(summary.completedOverlayRowCount).toBe(1);
    expect(summary.readyOverlayRowId).toBe("v97-lock-gaia-starfield-enhancement");
    expect(summary.activeGaiaRenderBudget).toBe(3000);
  });

  it("classifies Gaia, constellation, nebula, budget, sky and mutation regressions", () => {
    expect(
      createAtlasGaiaStarfieldEnhancementSummary({
        audits: [audit("gaia-catalog-lock", "regressed")],
      }).classification,
    ).toBe("gaia-catalog-regression");
    expect(
      createAtlasGaiaStarfieldEnhancementSummary({
        audits: [audit("constellation-catalog-lock", "regressed")],
      }).classification,
    ).toBe("constellation-catalog-regression");
    expect(
      createAtlasGaiaStarfieldEnhancementSummary({
        audits: [audit("nebula-catalog-lock", "regressed")],
      }).classification,
    ).toBe("nebula-catalog-regression");
    expect(
      createAtlasGaiaStarfieldEnhancementSummary({
        audits: [audit("overlay-budget-lock", "regressed")],
      }).classification,
    ).toBe("overlay-budget-regression");
    expect(
      createAtlasGaiaStarfieldEnhancementSummary({
        audits: [audit("v9-sky-boundary-lock", "regressed")],
      }).classification,
    ).toBe("v9-sky-boundary-regression");
    expect(
      createAtlasGaiaStarfieldEnhancementSummary({
        audits: [audit("protected-mutation-lock", "regressed")],
      }).classification,
    ).toBe("protected-mutation-regression");
  });
});

function readyAudits(): readonly AtlasGaiaStarfieldEnhancementAudit[] {
  return [
    audit("gaia-catalog-lock", "ready"),
    audit("constellation-catalog-lock", "ready"),
    audit("nebula-catalog-lock", "ready"),
    audit("overlay-budget-lock", "ready"),
    audit("v9-sky-boundary-lock", "ready"),
    audit("docs-overlay-lock", "ready"),
    audit("browser-surface-lock", "ready"),
    audit("protected-mutation-lock", "ready"),
  ];
}

function audit(
  id: AtlasGaiaStarfieldEnhancementAudit["id"],
  status: AtlasGaiaStarfieldEnhancementAudit["status"],
): AtlasGaiaStarfieldEnhancementAudit {
  return {
    id,
    label: id,
    status,
    measured: status,
    expected: "ready",
    trustedBoundary: "v97 test Gaia overlay audit",
  };
}

function completedRow(): AtlasGaiaStarfieldEnhancementRow {
  return {
    ...V97_GAIA_STARFIELD_ENHANCEMENT_ROW,
    status: "complete",
    gaiaCatalogStatus: "pass",
    constellationCatalogStatus: "pass",
    nebulaCatalogStatus: "pass",
    overlayBudgetStatus: "pass",
    v9SkyBoundaryStatus: "pass",
    docsOverlayStatus: "pass",
    browserSurfaceStatus: "pass",
    protectedMutationStatus: "pass",
    gaiaStarfieldEnhancement: "applied-overlay-only",
  };
}
