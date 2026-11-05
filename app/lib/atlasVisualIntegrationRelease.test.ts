import { readProjectSourceBundle } from "../test-utils/sourceBundles";
import { describe, expect, it } from "vitest";
import { ATLAS_VISUAL_REVIEW_SCENES, createAtlasVisualIntegrationReleaseSummary, percentile } from "./atlasVisualIntegrationRelease";
describe("v119 visual integration release gate", () => {
  it("locks eight review scenes and baseline thresholds", () => {
    const summary = createAtlasVisualIntegrationReleaseSummary();
    expect(ATLAS_VISUAL_REVIEW_SCENES).toHaveLength(8);
    expect(summary.desktopOverviewMedianFpsMin).toBe(55);
    expect(summary.mobileFrameTimeP95MaxMs).toBe(50);
    expect(summary.performancePolicy).toBe("hardware-baseline-gate-ci-observation-only");
  });
  it("computes deterministic percentiles", () => {
    expect(percentile([40, 10, 30, 20], 0.5)).toBe(20);
    expect(percentile([40, 10, 30, 20], 0.95)).toBe(40);
  });
  it("wires root markers, runtime probe, docs, evidence and Browser QA", () => {
    const all = ["app/UniverseRuntimeController.tsx", "app/components/AtlasRuntimePerformanceProbe.tsx", "app/lib/evidenceLedger.ts", "README.md", "docs/TECHNICAL_OVERVIEW.md", "tests/atlas-browser/atlas-browser-acceptance.spec.ts", "package.json", "scripts/atlas-legacy-command-map-v256.json"].map((file) => readProjectSourceBundle(file)).join("\n");
    for (const marker of ["v119-visual-integration-release-gate", "data-atlas-runtime-median-fps", "data-atlas-runtime-frame-p95-ms", "test:atlas:visual-integration-release"]) expect(all).toContain(marker);
  });
});
