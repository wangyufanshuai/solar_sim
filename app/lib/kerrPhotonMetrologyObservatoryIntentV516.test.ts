import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV516 } from "./kerrPhotonMetrologyObservatoryIntentV516";

describe("v516 photon metrology observatory intent", () => {
  it("authorizes one of eighteen details only for active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV516("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      automaticComponentImportBudget: 1,
      detailComponentCatalogSize: 18,
      concurrentDetailSurfaceBudget: 1,
      witnessTransitionCount: 512,
      witnessCheckpointCount: 8,
      staticStatusNetworkRequestBudget: 0,
      staticStatusScientificWriteback: false,
    });
  });

  it("keeps standalone, Lite and inactive research outside the witness surface", () => {
    expect(
      resolveKerrPhotonMetrologyObservatoryIntentV516("standalone-full", true),
    ).toMatchObject({ observatoryImportAuthorized: false, reason: "standalone-boundary" });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV516("vercel-lite", true)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "lite-boundary",
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV516("local-shadow", false)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "inactive",
    });
  });
});
