import { describe, expect, it } from "vitest";
import {
  ATLAS_RELATIVITY_RESEARCH_STATUS_V230,
} from "./relativityResearchEvidenceV230";

describe("v230 compact relativity evidence", () => {
  it("fails closed until dense Kerr and the full STM qualification run pass", () => {
    const evidence = ATLAS_RELATIVITY_RESEARCH_STATUS_V230;
    expect(evidence.defaultSolarKernel).toBe("legacy-eih-1pn");
    expect(evidence.runtimePromotionApplied).toBe(false);
    expect(evidence.denseKerr.completedReleaseShardCount).toBe(0);
    expect(evidence.denseKerr.shortGatePassed).toBe(true);
    expect(evidence.denseKerr.partialResultsAggregated).toBe(false);
    expect(evidence.denseKerr.gatePassed).toBe(false);
    expect(evidence.variationalStm.gatePassed).toBe(false);
    expect(evidence.releaseClassification).toContain("research-candidate-shadow-retained");
  });

  it("freezes the dense manifest and integrated STM dimensions", () => {
    const evidence = ATLAS_RELATIVITY_RESEARCH_STATUS_V230;
    expect(evidence.denseKerr.plannedRayCount).toBe(25 + 2048 + 1024);
    expect(evidence.denseKerr.plannedShardCount).toBe(49);
    expect(evidence.denseKerr.frozenScreenManifestSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(evidence.reproduction.denseKerrRun).toContain("run-kerr-dense-shards-v8.py");
    expect(evidence.variationalStm.integratedStateAndPhiDimension).toBe(72 * (66 + 1));
    expect(evidence.variationalStm.effectiveRank).toBe(66);
    expect(evidence.variationalStm.crossSolverDifferenceM).toBeLessThan(0.001);
  });
});
