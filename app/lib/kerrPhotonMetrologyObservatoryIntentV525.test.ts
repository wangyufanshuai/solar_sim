import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV525 } from "./kerrPhotonMetrologyObservatoryIntentV525";

describe("v525 photon metrology observatory intent", () => {
  it("authorizes one of twenty-seven details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV525("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 27,
      concurrentDetailSurfaceBudget: 1,
      candidateConstraintCount: 8,
      candidatePairCount: 28,
      fullRankPairCount: 9,
      selectedConstraintCount: 2,
      measuredCalibrationFileCount: 0,
      requiredMeasuredCalibrationFileCount: 6,
    });
  });
  it("keeps standalone, Lite and inactive workbenches outside the artifact", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV525("standalone-full", true).reason).toBe("standalone-boundary");
    expect(resolveKerrPhotonMetrologyObservatoryIntentV525("vercel-lite", true).reason).toBe("lite-boundary");
    expect(resolveKerrPhotonMetrologyObservatoryIntentV525("local-shadow", false).reason).toBe("inactive");
  });
});
