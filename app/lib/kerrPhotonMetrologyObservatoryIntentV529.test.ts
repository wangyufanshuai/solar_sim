import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV529 } from "./kerrPhotonMetrologyObservatoryIntentV529";

describe("v529 photon metrology observatory intent", () => {
  it("authorizes one of thirty-one details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV529("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 31,
      concurrentDetailSurfaceBudget: 1,
      fullFactorialCellCount: 1000,
      scientificGeometryInputCount: 68,
      optimizerIterationCount: 512000,
      selectedModelCount: 0,
      measuredCalibrationFileCount: 0,
      requiredMeasuredCalibrationFileCount: 6,
    });
  });
  it("keeps other profiles outside", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV529("standalone-full", true).reason).toBe(
      "standalone-boundary",
    );
    expect(resolveKerrPhotonMetrologyObservatoryIntentV529("vercel-lite", true).reason).toBe(
      "lite-boundary",
    );
    expect(resolveKerrPhotonMetrologyObservatoryIntentV529("local-shadow", false).reason).toBe(
      "inactive",
    );
  });
});
