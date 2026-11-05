import { describe, expect, it } from "vitest";
import {
  KERR_CALIBRATION_READINESS_STATUS_V503,
  resolveKerrPhotonMetrologyObservatoryIntentV503,
} from "./kerrPhotonMetrologyObservatoryIntentV503";

describe("v503 calibration-readiness observatory intent", () => {
  it("budgets one automatic cockpit and one of nine explicit details", () => {
    expect(
      resolveKerrPhotonMetrologyObservatoryIntentV503("local-shadow", true),
    ).toMatchObject({
      observatoryImportAuthorized: true,
      automaticComponentImportBudget: 1,
      automaticSummaryRequestBudget: 1,
      detailComponentCatalogSize: 9,
      concurrentDetailSurfaceBudget: 1,
      explicitDetailDataRequestCatalogSize: 9,
      detailDataRequestAuthorizedByWrapper: false,
      detailDataRequiresSecondExplicitIntent: true,
      staticAuthorityStageCount: 7,
      staticStatusNetworkRequestBudget: 0,
      staticStatusScientificWriteback: false,
      canvasCreated: false,
      sceneRevisionDelta: 0,
      physicsMutationAllowed: false,
    });
  });

  it("locks the real missing measured calibration boundary", () => {
    expect(KERR_CALIBRATION_READINESS_STATUS_V503).toEqual({
      sourceVersion: "v503",
      requiredFiles: 6,
      readyFiles: 0,
      packReady: false,
      detectorAuthorityGranted: false,
      reason: "measured-files-missing",
      detectorResponseAvailable: false,
      observedIntensityAvailable: false,
      scienceRasterAvailable: false,
    });
  });

  it.each([
    ["standalone-full", true, "standalone-boundary"],
    ["vercel-lite", true, "lite-boundary"],
    ["local-shadow", false, "inactive"],
  ] as const)("keeps %s active=%s outside the local-shadow intent", (profile, active, reason) => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV503(profile, active)).toMatchObject({
      observatoryImportAuthorized: false,
      automaticComponentImportBudget: 0,
      automaticSummaryRequestBudget: 0,
      concurrentDetailSurfaceBudget: 0,
      reason,
    });
  });
});
