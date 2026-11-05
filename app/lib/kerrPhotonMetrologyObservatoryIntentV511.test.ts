import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV511 } from "./kerrPhotonMetrologyObservatoryIntentV511";

describe("v511 instrument authority observatory intent", () => {
  it("authorizes one of thirteen details only for active local shadow", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV511("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      automaticComponentImportBudget: 1,
      detailComponentCatalogSize: 13,
      concurrentDetailSurfaceBudget: 1,
      explicitDetailDataRequestCatalogSize: 13,
      portableProvenanceStageCount: 1,
      instrumentAuthorityStageCount: 6,
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
    expect(resolveKerrPhotonMetrologyObservatoryIntentV511(profile, active)).toMatchObject({
      observatoryImportAuthorized: false,
      automaticComponentImportBudget: 0,
      concurrentDetailSurfaceBudget: 0,
      reason,
    });
  });
});
