import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV519 } from "./kerrPhotonMetrologyObservatoryIntentV519";

describe("v519 photon metrology observatory intent", () => {
  it("authorizes one of twenty-one details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV519("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 21,
      concurrentDetailSurfaceBudget: 1,
      radiometryRayCount: 4,
      radiometryBandCount: 3,
      radiometryRowCount: 12,
      staticStatusNetworkRequestBudget: 0,
      staticStatusScientificWriteback: false,
    });
  });

  it("keeps standalone, Lite and inactive workbenches outside the oracle", () => {
    expect(
      resolveKerrPhotonMetrologyObservatoryIntentV519("standalone-full", true),
    ).toMatchObject({ observatoryImportAuthorized: false, reason: "standalone-boundary" });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV519("vercel-lite", true)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "lite-boundary",
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV519("local-shadow", false)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "inactive",
    });
  });
});
