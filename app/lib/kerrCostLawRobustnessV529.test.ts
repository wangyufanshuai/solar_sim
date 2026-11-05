import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrCostLawRobustnessV529,
  compareKerrCostLawHudEncodingsV529,
  createKerrCostLawHudEncodingV529,
  createKerrCostLawRobustnessSummaryV529,
  parseKerrCostLawRobustnessArtifactV529,
  resolveKerrCostLawHudProfileV529,
} from "./kerrCostLawRobustnessV529";

const artifact = parseKerrCostLawRobustnessArtifactV529(
  JSON.parse(
    readFileSync("dist/science/kerr-cost-law-robustness-v529/envelope.json", "utf8"),
  ),
);

describe("v529 cost-law robustness and V7.8", () => {
  it("has canonical 160-digit full-factorial identity", () => {
    expect(
      createHash("sha256").update(canonicalKerrCostLawRobustnessV529(artifact)).digest("hex"),
    ).toBe(artifact.artifactSha256);
    expect(artifact.counts).toMatchObject({
      fullFactorialCellCount: 1000,
      optimizerIterationCount: 512000,
      scientificGeometryInputCount: 68,
    });
  });
  it("proves allocation-independent overhead and monotonic floor stress", () => {
    expect(artifact.robustnessAudits).toMatchObject({
      overheadAllocationInvarianceComparisons: 750,
      overheadAllocationInvariant: true,
      floorMonotonicityComparisons: 800,
      floorCostStrictlyIncreasing: true,
    });
  });
  it("keeps model selection and operational authority unavailable", () => {
    expect(artifact.parameterGrid.precisionExponentMeasured).toBe(false);
    expect(artifact.costLaw.stressModelOnlyNotOperationalCost).toBe(true);
    expect(artifact.selectionBoundary.recommendedModelAvailable).toBe(false);
    expect(artifact.selectionBoundary.recommendedAllocationAvailable).toBe(false);
    expect(artifact.qualification.operationalCostModelQualified).toBe(false);
  });
  it("keeps 68 scientific inputs stable across modes", () => {
    const summary = createKerrCostLawRobustnessSummaryV529(artifact);
    const science = createKerrCostLawHudEncodingV529(summary, "science");
    const cinematic = createKerrCostLawHudEncodingV529(summary, "cinematic");
    expect(compareKerrCostLawHudEncodingsV529(science, cinematic)).toMatchObject({
      scientificGeometryStable: true,
      scientificGeometryInputCount: 68,
      numericScientificStyleInputCount: 0,
    });
    expect(resolveKerrCostLawHudProfileV529("science")).toBe(
      resolveKerrCostLawHudProfileV529("science"),
    );
  });
});
