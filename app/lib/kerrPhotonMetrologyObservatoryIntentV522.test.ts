import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV522 } from "./kerrPhotonMetrologyObservatoryIntentV522";

describe("v522 photon metrology observatory intent", () => {
  it("authorizes one of twenty-four details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV522("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 24,
      concurrentDetailSurfaceBudget: 1,
      sensitivityScenarioCount: 9,
      sensitivityScenarioRowCount: 216,
      directAdaptiveIntegralCount: 888,
      envelopeRowCount: 24,
      physicalPriorCount: 0,
      measuredStokesRowCount: 0,
      staticStatusNetworkRequestBudget: 0,
    });
  });

  it("keeps standalone, Lite and inactive workbenches outside the envelope", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV522("standalone-full", true)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "standalone-boundary",
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV522("vercel-lite", true)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "lite-boundary",
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV522("local-shadow", false)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "inactive",
    });
  });
});
