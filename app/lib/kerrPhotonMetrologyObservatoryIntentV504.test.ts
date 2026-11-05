import { describe, expect, it } from "vitest";
import {
  KERR_CALIBRATION_PREFLIGHT_STATUS_V504,
  resolveKerrPhotonMetrologyObservatoryIntentV504,
} from "./kerrPhotonMetrologyObservatoryIntentV504";

describe("v504 candidate-preflight observatory intent", () => {
  it("budgets one automatic cockpit and one of ten details", () => {
    expect(resolveKerrPhotonMetrologyObservatoryIntentV504("local-shadow", true)).toMatchObject({
      observatoryImportAuthorized: true,
      automaticComponentImportBudget: 1,
      automaticSummaryRequestBudget: 1,
      detailComponentCatalogSize: 10,
      concurrentDetailSurfaceBudget: 1,
      explicitDetailDataRequestCatalogSize: 10,
      detailDataRequestAuthorizedByWrapper: false,
      staticAuthorityStageCount: 8,
      staticStatusNetworkRequestBudget: 0,
      canvasCreated: false,
      sceneRevisionDelta: 0,
      physicsMutationAllowed: false,
    });
  });

  it("locks the current zero-read preflight", () => {
    expect(KERR_CALIBRATION_PREFLIGHT_STATUS_V504).toEqual({
      sourceVersion: "v504",
      status: "blocked-inputs-missing",
      stagingRootPresent: false,
      stagingRootSafe: true,
      readyFiles: 0,
      requiredFiles: 6,
      bytesRead: 0,
      candidateReadyForIndependentValidation: false,
      authorityGranted: false,
    });
  });
});
