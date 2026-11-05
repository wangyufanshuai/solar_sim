import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV490 } from "./kerrPhotonMetrologyObservatoryIntentV490";

describe("v490 metrology observatory intent", () => {
  it("allocates three lazy components, one automatic summary and two explicit details", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV490("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      componentImportBudget: 3,
      automaticSummaryRequestBudget: 1,
      coordinateAtlasDataRequestAuthorizedByWrapper: false,
      contrastLatticeDataRequestAuthorizedByWrapper: false,
      explicitDetailRequestBudget: 2,
      explicitDetailIntentRequired: true,
      publicPanelIdAdded: false,
      canvasCreated: false,
      sceneRevisionDelta: 0,
      physicsMutationAllowed: false,
    });
  });

  it.each([
    ["standalone-full", true, "standalone-boundary"],
    ["vercel-lite", true, "lite-boundary"],
    ["local-shadow", false, "inactive-campaign-evidence"],
  ] as const)("gives %s active=%s a zero request and import budget", (profile, active, reason) => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV490(profile, active)).toMatchObject({
      observatoryImportAuthorized: false,
      componentImportBudget: 0,
      automaticSummaryRequestBudget: 0,
      explicitDetailRequestBudget: 0,
      reason,
    });
  });
});
