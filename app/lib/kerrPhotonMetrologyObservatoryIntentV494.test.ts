import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV494 } from "./kerrPhotonMetrologyObservatoryIntentV494";

describe("v494 metrology observatory intent", () => {
  it("loads only the Cockpit automatically and budgets one of four details", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV494("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      automaticComponentImportBudget: 1,
      automaticSummaryRequestBudget: 1,
      detailComponentCatalogSize: 4,
      concurrentDetailSurfaceBudget: 1,
      explicitDetailDataRequestCatalogSize: 4,
      detailDataRequestAuthorizedByWrapper: false,
      detailDataRequiresSecondExplicitIntent: true,
      publicPanelIdAdded: false,
      canvasCreated: false,
      sceneRevisionDelta: 0,
      physicsMutationAllowed: false,
    });
  });

  it.each([
    ["standalone-full", true, "standalone-boundary"],
    ["vercel-lite", true, "lite-boundary"],
    ["local-shadow", false, "inactive"],
  ] as const)("keeps %s active=%s at zero automatic and detail budgets", (profile, active, reason) => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV494(profile, active)).toMatchObject({
      observatoryImportAuthorized: false,
      automaticComponentImportBudget: 0,
      automaticSummaryRequestBudget: 0,
      concurrentDetailSurfaceBudget: 0,
      reason,
    });
  });
});
