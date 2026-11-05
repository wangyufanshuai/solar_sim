import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV523 } from "./kerrPhotonMetrologyObservatoryIntentV523";

describe("v523 photon metrology observatory intent", () => {
  it("authorizes one of twenty-five details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV523("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 25,
      concurrentDetailSurfaceBudget: 1,
      analyzerStateCount: 4,
      modulationRowCount: 864,
      reconstructionCount: 216,
      channelEnvelopeCount: 96,
      expectedElectronCountRowCount: 0,
      measuredCalibrationFileCount: 0,
      staticStatusNetworkRequestBudget: 0,
    });
  });

  it("keeps standalone, Lite and inactive workbenches outside the projection", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV523("standalone-full", true)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "standalone-boundary",
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV523("vercel-lite", true)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "lite-boundary",
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV523("local-shadow", false)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "inactive",
    });
  });
});
