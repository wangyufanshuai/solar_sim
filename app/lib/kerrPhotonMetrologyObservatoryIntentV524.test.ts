import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV524 } from "./kerrPhotonMetrologyObservatoryIntentV524";

describe("v524 photon metrology observatory intent", () => {
  it("authorizes one of twenty-six details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV524("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 26,
      concurrentDetailSurfaceBudget: 1,
      analyzerMatrixCount: 3,
      analyzerSvdCount: 3,
      singularValueCount: 9,
      calibrationNullspaceDimension: 2,
      measuredCalibrationFileCount: 0,
      staticStatusNetworkRequestBudget: 0,
    });
  });

  it("keeps standalone, Lite and inactive workbenches outside the artifact", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV524("standalone-full", true).reason).toBe("standalone-boundary");
    expect(resolveKerrPhotonMetrologyObservatoryIntentV524("vercel-lite", true).reason).toBe("lite-boundary");
    expect(resolveKerrPhotonMetrologyObservatoryIntentV524("local-shadow", false).reason).toBe("inactive");
  });
});
