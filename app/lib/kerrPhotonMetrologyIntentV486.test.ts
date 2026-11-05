import { describe, expect, it } from "vitest";

import { resolveKerrPhotonMetrologyIntentV486 } from "./kerrPhotonMetrologyIntentV486";

describe("v486 photon metrology intent", () => {
  it("authorizes the Cockpit only for active local-shadow campaign evidence", () => {
    const active = resolveKerrPhotonMetrologyIntentV486("local-shadow", true);
    expect(active).toMatchObject({
      componentImportAuthorized: true,
      summaryRequestAuthorized: true,
      reason: "enabled-local-shadow-campaign-evidence",
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
    ["standalone-full", false, "inactive-campaign-evidence"],
    ["vercel-lite", false, "inactive-campaign-evidence"],
  ] as const)("keeps %s active=%s outside the import and request boundary", (profile, active, reason) => {
    expect(resolveKerrPhotonMetrologyIntentV486(profile, active)).toMatchObject({
      componentImportAuthorized: false,
      summaryRequestAuthorized: false,
      reason,
    });
  });
});
