import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const artifact = JSON.parse(readFileSync("dist/release/orbit-atlas-active-release-gate-v567.json", "utf8"));

describe("v567 active release gate", () => {
  it("promotes runtime validation without promoting blocked science lanes", () => {
    expect(artifact.status).toBe("lite-scientific-performance-soak-qualified-hero-visual-regression-blocked");
    expect(artifact.releaseGates).toMatchObject({ standaloneBuild: true, liteBuild: true, desktopBrowser: true, mobileBrowser: true, heroSceneBrowser: true, overviewVisualRegression: true, heroVisualRegression: false, visualRegression: false, scientificScenePerformance: true, soak: true, publicPreview: false });
    expect(artifact.scienceAdmission).toMatchObject({ transportQualified: true, radiativeTransferQualified: false, measuredAuthorityGranted: false, denseCpuAuthorityQualified: false, denseCampaignStatus: "incomplete-0-of-49", denseControllerPreflight: "blocked-v313-source-manifest-drift", gpuShadowQualified: false, publicResearchRelease: false });
    expect(artifact.boundary).toMatchObject({ formalProductPointer: "v263", priorV562GateRewritten: false, productionPromotionAllowed: false, publicDeploymentAllowed: false, denseRunAllowed: false, gpuRunAllowed: false });
  });
});
