import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV512 } from "./kerrPhotonMetrologyObservatoryIntentV512";

describe("v512 science product observatory intent", () => {
  it("authorizes one of fourteen details only for active local shadow", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV512("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      automaticComponentImportBudget: 1,
      detailComponentCatalogSize: 14,
      concurrentDetailSurfaceBudget: 1,
      instrumentAuthorityStageCount: 6,
      scienceProductNodeCount: 10,
      staticStatusNetworkRequestBudget: 0,
      staticStatusScientificWriteback: false,
      canvasCreated: false,
      sceneRevisionDelta: 0,
      physicsMutationAllowed: false,
      reason: "enabled",
    });
  });

  it.each([
    ["standalone-full", true, "standalone-boundary"],
    ["vercel-lite", true, "lite-boundary"],
    ["local-shadow", false, "inactive"],
  ] as const)("keeps %s active=%s closed", (profile, active, reason) => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV512(profile, active)).toMatchObject({
      observatoryImportAuthorized: false,
      automaticComponentImportBudget: 0,
      concurrentDetailSurfaceBudget: 0,
      reason,
    });
  });
});
