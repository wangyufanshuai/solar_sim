import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV520 } from "./kerrPhotonMetrologyObservatoryIntentV520";

describe("v520 photon metrology observatory intent", () => {
  it("authorizes one of twenty-two details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV520("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 22,
      concurrentDetailSurfaceBudget: 1,
      stokesRayCount: 4,
      stokesBandCount: 3,
      stokesTransportMethodCount: 2,
      stokesRowCount: 24,
      measuredStokesRowCount: 0,
      circularStokesRowCount: 0,
      staticStatusNetworkRequestBudget: 0,
      staticStatusScientificWriteback: false,
    });
  });

  it("keeps standalone, Lite and inactive workbenches outside the payload", () => {
    expect(
      resolveKerrPhotonMetrologyObservatoryIntentV520("standalone-full", true),
    ).toMatchObject({ observatoryImportAuthorized: false, reason: "standalone-boundary" });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV520("vercel-lite", true)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "lite-boundary",
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV520("local-shadow", false)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "inactive",
    });
  });
});
