import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV509 } from "./kerrPhotonMetrologyObservatoryIntentV509";

describe("v509 detector timeline observatory intent", () => {
  it("budgets one automatic cockpit and one of eleven details", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV509("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      automaticComponentImportBudget: 1,
      automaticSummaryRequestBudget: 1,
      detailComponentCatalogSize: 11,
      concurrentDetailSurfaceBudget: 1,
      explicitDetailDataRequestCatalogSize: 11,
      detailDataRequestAuthorizedByWrapper: false,
      detailDataRequiresSecondExplicitIntent: true,
      staticAuthorityStageCount: 9,
      staticStatusNetworkRequestBudget: 0,
      staticStatusScientificWriteback: false,
      canvasCreated: false,
      sceneRevisionDelta: 0,
      physicsMutationAllowed: false,
    });
  });

  it.each([
    ["standalone-full", true, "standalone-boundary"],
    ["vercel-lite", true, "lite-boundary"],
    ["local-shadow", false, "inactive"],
  ] as const)("keeps %s active=%s outside the observatory", (profile, active, reason) => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV509(profile, active)).toMatchObject({
      observatoryImportAuthorized: false,
      automaticComponentImportBudget: 0,
      automaticSummaryRequestBudget: 0,
      concurrentDetailSurfaceBudget: 0,
      reason,
    });
  });
});
