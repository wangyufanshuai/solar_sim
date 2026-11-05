import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV517 } from "./kerrPhotonMetrologyObservatoryIntentV517";

describe("v517 photon metrology observatory intent", () => {
  it("authorizes one of nineteen details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV517("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 19,
      concurrentDetailSurfaceBudget: 1,
      recomputedWitnessCount: 512,
      matchedCheckpointCount: 8,
      staticStatusNetworkRequestBudget: 0,
      staticStatusScientificWriteback: false,
    });
  });

  it("keeps standalone, Lite and inactive workbenches outside the verifier", () => {
    expect(
      resolveKerrPhotonMetrologyObservatoryIntentV517("standalone-full", true),
    ).toMatchObject({ observatoryImportAuthorized: false, reason: "standalone-boundary" });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV517("vercel-lite", true)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "lite-boundary",
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV517("local-shadow", false)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "inactive",
    });
  });
});
