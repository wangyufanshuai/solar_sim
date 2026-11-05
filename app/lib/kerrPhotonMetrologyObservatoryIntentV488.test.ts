import { describe, expect, it } from "vitest";

import { resolveKerrPhotonMetrologyObservatoryIntentV488 } from "./kerrPhotonMetrologyObservatoryIntentV488";

describe("v488 photon metrology observatory intent", () => {
  it("authorizes both component chunks only for active local-shadow campaign evidence", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV488("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      cockpitSummaryRequestAuthorized: true,
      coordinateAtlasComponentImportAuthorized: true,
      coordinateAtlasDataRequestAuthorizedByWrapper: false,
      coordinateAtlasDataRequiresExplicitUserIntent: true,
      publicPanelIdAdded: false,
      canvasCreated: false,
      sceneRevisionDelta: 0,
      physicsMutationAllowed: false,
      reason: "enabled-local-shadow-campaign-evidence",
    });
  });

  it.each([
    ["standalone-full", true, "standalone-boundary"],
    ["vercel-lite", true, "lite-boundary"],
    ["local-shadow", false, "inactive-campaign-evidence"],
  ] as const)("keeps %s active=%s outside the observatory boundary", (profile, active, reason) => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV488(profile, active)).toMatchObject({
      observatoryImportAuthorized: false,
      cockpitSummaryRequestAuthorized: false,
      coordinateAtlasComponentImportAuthorized: false,
      coordinateAtlasDataRequestAuthorizedByWrapper: false,
      reason,
    });
  });
});
