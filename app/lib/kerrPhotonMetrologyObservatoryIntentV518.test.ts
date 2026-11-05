import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV518 } from "./kerrPhotonMetrologyObservatoryIntentV518";

describe("v518 photon metrology observatory intent", () => {
  it("authorizes one of twenty details only in active local-shadow research", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV518("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      detailComponentCatalogSize: 20,
      concurrentDetailSurfaceBudget: 1,
      provenanceNodeCount: 8,
      provenanceEdgeCount: 7,
      visualModeCount: 2,
      staticStatusNetworkRequestBudget: 0,
      staticStatusScientificWriteback: false,
    });
  });

  it("keeps standalone, Lite and inactive workbenches outside V7.2", () => {
    expect(
      resolveKerrPhotonMetrologyObservatoryIntentV518("standalone-full", true),
    ).toMatchObject({ observatoryImportAuthorized: false, reason: "standalone-boundary" });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV518("vercel-lite", true)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "lite-boundary",
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV518("local-shadow", false)).toMatchObject({
      observatoryImportAuthorized: false,
      reason: "inactive",
    });
  });
});
