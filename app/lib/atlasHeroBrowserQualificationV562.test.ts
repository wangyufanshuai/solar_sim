import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type Receipt = { status: string; desktop: Record<string, unknown>; mobile: Record<string, unknown>; captures: unknown[]; qualification: Record<string, unknown>; boundary: Record<string, unknown> };
const receipt = JSON.parse(readFileSync("dist/release/atlas-hero-browser-qualification-v562.json", "utf8")) as Receipt;

describe("v562 hero scenes browser qualification", () => {
  it("records four desktop scenes and responsive Science/Cinematic interaction", () => {
    expect(receipt.status).toBe("passed-interaction-screenshot-visual-regression-performance-pending");
    expect(receipt.desktop).toMatchObject({ uniqueSceneCount: 4, scienceModeObserved: true, cinematicModeObserved: true, sharedGeometry: true, cinematicWriteback: false, additionalCanvasCount: 0, documentHorizontalOverflow: false, browserErrorCount: 0, browserWarningCount: 0 });
    expect(receipt.mobile).toMatchObject({ viewport: { width: 390, height: 844 }, scienceModeObserved: true, cinematicModeObserved: true, sharedGeometry: true, cinematicWriteback: false, additionalCanvasCount: 0, documentHorizontalOverflow: false, browserErrorCount: 0, browserWarningCount: 0 });
    expect(receipt.captures).toHaveLength(6);
  });

  it("does not promote unrun visual regression or science-scene performance", () => {
    expect(receipt.qualification).toMatchObject({ heroSceneInteractionQualified: true, desktopScreenshotQualified: true, mobileScreenshotQualified: true, scienceCinematicBoundaryQualified: true, visualRegressionQualified: false, scientificScenePerformanceQualified: false, productionPromotionAllowed: false });
    expect(receipt.boundary).toMatchObject({ formalProductPointer: "v263", measuredAuthorityGranted: false, denseCampaignStatus: "incomplete-0-of-49", gpuRun: false });
  });
});
