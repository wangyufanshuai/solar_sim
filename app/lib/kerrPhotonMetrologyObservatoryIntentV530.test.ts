import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV530 } from "./kerrPhotonMetrologyObservatoryIntentV530";

describe("v530 photon metrology observatory intent", () => {
  it("authorizes one of thirty-two details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV530("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 32,
      concurrentDetailSurfaceBudget: 1,
      regretEvaluationCount: 49000,
      scientificGeometryInputCount: 148,
      overheadAuditCount: 36750,
      selectedRecommendationCount: 0,
      measuredCalibrationFileCount: 0,
      requiredMeasuredCalibrationFileCount: 6,
    });
  });
  it("keeps other profiles outside", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV530("standalone-full", true).reason).toBe(
      "standalone-boundary",
    );
    expect(resolveKerrPhotonMetrologyObservatoryIntentV530("vercel-lite", true).reason).toBe(
      "lite-boundary",
    );
    expect(resolveKerrPhotonMetrologyObservatoryIntentV530("local-shadow", false).reason).toBe(
      "inactive",
    );
  });
});
