import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV492 } from "./kerrPhotonMetrologyObservatoryIntentV492";

describe("v492 metrology observatory intent", () => {
  it("loads only the Cockpit automatically and budgets one mutually exclusive detail", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV492("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      automaticComponentImportBudget: 1,
      automaticSummaryRequestBudget: 1,
      detailComponentCatalogSize: 3,
      concurrentDetailSurfaceBudget: 1,
      explicitDetailDataRequestCatalogSize: 3,
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
    expect(resolveKerrPhotonMetrologyObservatoryIntentV492(profile, active)).toMatchObject({
      observatoryImportAuthorized: false,
      automaticComponentImportBudget: 0,
      automaticSummaryRequestBudget: 0,
      concurrentDetailSurfaceBudget: 0,
      reason,
    });
  });
});
