import { describe, expect, it } from "vitest";
import { resolveKerrPhotonMetrologyObservatoryIntentV510 } from "./kerrPhotonMetrologyObservatoryIntentV510";

describe("v510 portable provenance observatory intent", () => {
  it("authorizes one of twelve exclusive details only for active local shadow", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV510("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      automaticComponentImportBudget: 1,
      automaticSummaryRequestBudget: 1,
      detailComponentCatalogSize: 12,
      concurrentDetailSurfaceBudget: 1,
      explicitDetailDataRequestCatalogSize: 12,
      portableProvenanceStageCount: 1,
      staticStatusNetworkRequestBudget: 0,
      staticStatusScientificWriteback: false,
      canvasCreated: false,
      sceneRevisionDelta: 0,
      physicsMutationAllowed: false,
      reason: "enabled",
    });
  });

  it("keeps standalone, Lite, and inactive workbench paths closed", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV510("standalone-full", true)).toMatchObject({
      observatoryImportAuthorized: false,
      automaticComponentImportBudget: 0,
      concurrentDetailSurfaceBudget: 0,
      reason: "standalone-boundary",
    });
    expect(resolveKerrPhotonMetrologyObservatoryIntentV510("vercel-lite", true).reason).toBe(
      "lite-boundary",
    );
    expect(resolveKerrPhotonMetrologyObservatoryIntentV510("local-shadow", false).reason).toBe(
      "inactive",
    );
  });
});
