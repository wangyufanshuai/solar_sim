import { describe, expect, it } from "vitest";
import {
  ATLAS_PERFORMANCE_BUDGET_VERSION,
  createAtlasPerformanceBudgetSummary,
} from "./atlasPerformanceBudget";
import {
  celestialCatalogLabelEntries,
  createCelestialVisualLayerSummary,
} from "./celestialCatalog";

describe("Atlas Performance Budget v34", () => {
  it("creates a deterministic local render budget summary without a trust score", () => {
    const first = createAtlasPerformanceBudgetSummary();
    const second = createAtlasPerformanceBudgetSummary({});

    expect(first.version).toBe(ATLAS_PERFORMANCE_BUDGET_VERSION);
    expect(first).toEqual(second);
    expect(first.renderStability).toBe("warming");
    expect(first.deepSkyLabelBudget).toBeGreaterThan(0);
    expect(first.trustedBoundary).toContain("not a scientific accuracy score");
    expect("trustScore" in first).toBe(false);
  });

  it("uses mobile-safe tier and constrains deep-sky labels on 390px-class viewports", () => {
    const summary = createAtlasPerformanceBudgetSummary({
      presentationMode: "orbit-atlas",
      renderBudget: "dense",
      viewportWidth: 390,
      devicePixelRatio: 3,
      showDeepSkyObjects: true,
      showCatalogLabels: true,
      catalogLabelCount: 18,
      showKerrBlackHole: true,
      canvasReady: true,
      skyReady: true,
      coreBodiesReady: true,
    });

    expect(summary.tier).toBe("mobile-safe");
    expect(summary.renderStability).toBe("constrained");
    expect(summary.deepSkyLabelBudget).toBe(6);
    expect(summary.recommendedRenderBudget).toBe("balanced");
    expect(summary.recommendations.map((recommendation) => recommendation.id)).toEqual(
      expect.arrayContaining(["mobile-balanced-budget", "deep-sky-label-budget", "kerr-visual-cost"]),
    );
  });

  it("keeps desktop dense Orbit Atlas as dense when the render path is ready", () => {
    const summary = createAtlasPerformanceBudgetSummary({
      presentationMode: "orbit-atlas",
      renderBudget: "dense",
      viewportWidth: 1440,
      devicePixelRatio: 1.25,
      canvasReady: true,
      skyReady: true,
      coreBodiesReady: true,
    });

    expect(summary.tier).toBe("dense");
    expect(summary.renderStability).toBe("ready");
    expect(summary.deepSkyLabelBudget).toBe(12);
    expect(summary.recommendedRenderBudget).toBe("dense");
  });

  it("maps readiness fallback and workbench overlays into conservative recommendations", () => {
    const summary = createAtlasPerformanceBudgetSummary({
      presentationMode: "sandbox",
      renderBudget: "balanced",
      viewportWidth: 1280,
      devicePixelRatio: 2,
      showCatalogLabels: true,
      catalogLabelCount: 20,
      workbenchOpen: true,
      readinessFallback: true,
      canvasReady: true,
      skyReady: true,
      coreBodiesReady: true,
    });

    expect(summary.renderStability).toBe("fallback");
    expect(summary.deepSkyLabelBudget).toBe(16);
    expect(summary.recommendations.map((recommendation) => recommendation.id)).toEqual(
      expect.arrayContaining(["readiness-fallback", "workbench-overlay-budget"]),
    );
  });

  it("passes v34 label budget into v33 visual layer while preserving selected labels", () => {
    const selectedCatalogId = "galaxy:m83";
    const summary = createCelestialVisualLayerSummary({
      selectedCatalogId,
      showDeepSkyObjects: true,
      showCatalogLabels: true,
      orbitAtlas: false,
      mobile: false,
      labelBudget: 4,
    });
    const labels = celestialCatalogLabelEntries({
      selectedCatalogId,
      orbitAtlas: false,
      mobile: false,
      labelBudget: 4,
    });

    expect(summary.version).toBe("v33-deep-sky-navigation");
    expect(summary.labelBudgetSource).toBe("v34-performance-budget");
    expect(summary.maxLabelCount).toBe(4);
    expect(summary.labelCount).toBeLessThanOrEqual(4);
    expect(labels.some((entry) => entry.id === selectedCatalogId)).toBe(true);
  });
});
