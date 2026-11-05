import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const gate = JSON.parse(readFileSync("dist/release/orbit-atlas-active-release-gate-v562.json", "utf8")) as {
  status: string;
  activeCandidate: Record<string, unknown>;
  science: Record<string, unknown>;
  releaseGates: Record<string, unknown>;
  buildGate: Record<string, unknown>;
  browserGate: Record<string, unknown> & {
    desktop: Record<string, unknown>;
    mobile: Record<string, unknown>;
  };
  heroSceneBrowserGate: Record<string, unknown>;
  blocker: null;
  boundary: Record<string, unknown>;
};

describe("v562 active release gate", () => {
  it("admits the visual and sparse transport candidate without promoting release", () => {
    expect(gate.status).toBe("active-candidate-science-art-transport-build-browser-qualified-visual-regression-pending");
    expect(gate.activeCandidate).toMatchObject({ heroSceneCount: 4, sharedScientificGeometry: true, singleCanvas: true, scienceLinearDisplay: true, cinematicScienceWriteback: false });
    expect(gate.science).toMatchObject({ transportQualified: true, measuredAuthorityGranted: false, denseCampaignStatus: "incomplete-0-of-49", gpuShadowRun: false });
    expect(gate.releaseGates).toMatchObject({ standaloneBuild: true, desktopBrowser: true, mobileBrowser: true, heroSceneBrowser: true, visualRegression: false, scientificScenePerformance: false, publicPreview: false });
  });

  it("records the qualified 8 GiB standalone topology and preserves frozen boundaries", () => {
    expect(gate.buildGate).toMatchObject({ status: "qualified", profile: "standalone-full", heapMb: 8192, standaloneTopologyQualified: true, rollbackSlotAvailable: true, browserStarted: false, denseStarted: false, gpuStarted: false });
    expect(gate.blocker).toBeNull();
    expect(gate.boundary).toMatchObject({ formalProductPointer: "v263", formalDefaultKernel: "legacy-eih-1pn", v559EvidenceRewritten: false, productionPromotionAllowed: false, publicDeploymentAllowed: false });
  });

  it("admits hardware desktop/mobile overview evidence without claiming visual regression", () => {
    expect(gate.browserGate).toMatchObject({ status: "qualified-overview-only", consoleErrors: 0, pageErrors: 0, rendererErrors: 0, canvasCount: 1, hardwareRenderer: true, resourcesReturned: true, visualRegressionQualified: false, scientificScenePerformanceQualified: false, soakQualified: false });
    expect(gate.browserGate.desktop).toMatchObject({ width: 1440, height: 900, medianFps: 166.8, frameP95Ms: 6.3 });
    expect(gate.browserGate.mobile).toMatchObject({ width: 390, height: 844, medianFps: 166.9, frameP95Ms: 6.1 });
  });

  it("admits four hero-scene interactions without claiming unrun performance", () => {
    expect(gate.heroSceneBrowserGate).toMatchObject({ status: "interaction-screenshots-qualified", heroSceneCount: 4, captureCount: 6, desktopQualified: true, mobileQualified: true, scienceCinematicBoundaryQualified: true, additionalCanvasCount: 0, browserErrors: 0, visualRegressionQualified: false, scientificScenePerformanceQualified: false });
  });
});
