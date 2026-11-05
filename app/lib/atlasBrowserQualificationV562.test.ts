import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type BrowserQualificationReceipt = {
  status: string;
  qualification: Record<string, unknown>;
  observations: {
    desktop: Record<string, unknown>;
    mobile: Record<string, unknown>;
  };
  boundary: Record<string, unknown>;
};

const receipt = JSON.parse(readFileSync("dist/release/atlas-browser-qualification-v562.json", "utf8")) as BrowserQualificationReceipt;

describe("v562 standalone desktop/mobile browser qualification", () => {
  it("qualifies both overview viewports on hardware without runtime errors", () => {
    expect(receipt.status).toBe("passed-standalone-desktop-mobile-visual-regression-pending");
    expect(receipt.qualification).toMatchObject({ desktopBrowser: true, mobileBrowser: true, hardwareRenderer: true, singleCanvas: true, consoleErrorsZero: true, pageErrorsZero: true, rendererErrorsZero: true, resourceLifecycleReturned: true, overviewPerformanceQualified: true });
    expect(receipt.observations.desktop).toMatchObject({ canvasCount: 1, medianFps: 166.8, frameP95Ms: 6.3, sampleStatus: "ready" });
    expect(receipt.observations.mobile).toMatchObject({ canvasCount: 1, medianFps: 166.9, frameP95Ms: 6.1, sampleStatus: "ready" });
  });

  it("keeps unrun visual, science-scene, soak, dense and GPU gates blocked", () => {
    expect(receipt.qualification).toMatchObject({ visualRegressionQualified: false, scientificScenePerformanceQualified: false, soakQualified: false });
    expect(receipt.boundary).toMatchObject({ formalProductPointer: "v263", formalDefaultKernel: "legacy-eih-1pn", historicalVisualAssetsRestored: false, historicalEvidenceRewritten: false, measuredAuthorityGranted: false, denseCampaignStatus: "incomplete-0-of-49", gpuRun: false, productionPromotionAllowed: false, publicDeploymentAllowed: false });
  });
});
