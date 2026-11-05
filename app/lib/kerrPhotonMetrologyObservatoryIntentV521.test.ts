import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV521 } from "./kerrPhotonMetrologyObservatoryIntentV521";

describe("v521 photon metrology observatory intent", () => {
  it("authorizes one of twenty-three details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV521("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 23,
      concurrentDetailSurfaceBudget: 1,
      directStokesRowCount: 24,
      directAdaptiveIntegralCount: 144,
      componentwiseEnvelopeCount: 24,
      measuredStokesRowCount: 0,
      scalarUncertaintyTotalCount: 0,
      staticStatusNetworkRequestBudget: 0,
    });
  });

  it("keeps standalone, Lite and inactive workbenches outside the oracle", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV521("standalone-full", true)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "standalone-boundary",
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV521("vercel-lite", true)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "lite-boundary",
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV521("local-shadow", false)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "inactive",
    });
  });
});
