import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runtime = JSON.parse(readFileSync("dist/release/atlas-runtime-release-qualification-v567.json", "utf8"));
const science = JSON.parse(readFileSync("dist/release/atlas-science-admission-v567.json", "utf8"));

describe("v567 runtime release qualification", () => {
  it("qualifies Lite, overview regression, named scientific performance and soak", () => {
    expect(runtime.status).toBe("qualified-lite-overview-visual-scientific-performance-soak-hero-transition-blocked");
    expect(runtime.qualification).toMatchObject({ liteBuild: true, liteDesktopMobile: true, overviewVisualRegression: true, heroVisualRegression: false, visualRegression: false, scientificScenePerformance: true, soak: true, productionPromotionAllowed: false });
    expect(runtime.visualRegression.comparisonCount).toBe(8);
    expect(runtime.visualRegression.minimumPerceptualSimilarity).toBeGreaterThanOrEqual(0.94);
    expect(runtime.visualRegression).toMatchObject({ overviewQualified: true, heroScreenshotSimilarityQualified: true, heroInteractionTransitionQualified: false, qualified: false });
    expect(runtime.scientificPerformance.samples.earth.medianFps).toBeGreaterThanOrEqual(45);
    expect(runtime.scientificPerformance.samples.kerr.medianFps).toBeGreaterThanOrEqual(45);
    expect(runtime.soak).toMatchObject({ cycles: 10, resourcesReturnedEveryCycle: true, heapStrictlyGrowing: false, finalHeapBelowBaseline: true });
  });

  it("keeps science promotion fail-closed while recording the exact blockers", () => {
    expect(science.status).toBe("blocked-radiative-measured-dense-gpu-public-promotion");
    expect(science.qualification).toMatchObject({ runtimeReleaseValidation: false, productionRadiativeTransfer: false, measuredAuthority: false, denseCpuAuthority: false, gpuShadow: false, publicResearchRelease: false });
    expect(science.dense).toMatchObject({ executed: false, completedShardCount: 0, plannedShardCount: 49, controllerPreflight: "blocked-v313-source-manifest-drift", stateMutationApplied: false });
    expect(science.dense.sourceDrift.map((entry: { path: string }) => entry.path).sort()).toEqual(["app/components/RelativityResearchWorkbenchV280.tsx", "scripts/atlas.mjs"]);
    expect(science.measuredAuthority).toMatchObject({ granted: false, currentProbeStatus: "blocked-metadata-identity-conflict", payloadRead: false, automaticRetry: false });
    expect(science.boundary).toMatchObject({ formalProductPointer: "v263", historicalEvidenceRewritten: false, denseStateMutated: false, gpuRun: false, metadataNetworkAttempted: true, sciencePayloadNetworkAttempted: false, productionDeploymentAttempted: false });
  });
});
