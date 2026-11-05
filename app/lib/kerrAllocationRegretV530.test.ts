import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrAllocationRegretV530,
  compareKerrAllocationRegretHudEncodingsV530,
  createKerrAllocationRegretHudEncodingV530,
  createKerrAllocationRegretSummaryV530,
  parseKerrAllocationRegretArtifactV530,
  resolveKerrAllocationRegretHudProfileV530,
} from "./kerrAllocationRegretV530";

const artifact = parseKerrAllocationRegretArtifactV530(
  JSON.parse(readFileSync("dist/science/kerr-allocation-regret-v530/atlas.json", "utf8")),
);
describe("v530 allocation regret and V7.9", () => {
  it("has canonical 160-digit regret identity", () => {
    expect(
      createHash("sha256").update(canonicalKerrAllocationRegretV530(artifact)).digest("hex"),
    ).toBe(artifact.artifactSha256);
    expect(artifact.counts).toMatchObject({
      regretEvaluationCount: 49000,
      scientificGeometryInputCount: 148,
    });
  });
  it("distinguishes absolute and relative overhead behavior", () => {
    expect(artifact.regretDefinition.absoluteRegretIndependentOfAdditiveOverhead).toBe(true);
    expect(artifact.regretDefinition.relativeRegretDependsOnAdditiveOverheadNormalization).toBe(
      true,
    );
    expect(artifact.regretAudits).toMatchObject({
      overheadAbsoluteRegretInvarianceComparisons: 36750,
      relativeRegretOverheadMonotonicityComparisons: 36750,
    });
  });
  it("keeps descriptive minimax outside operational selection", () => {
    expect(artifact.stochasticRegretAtlas.descriptiveAbsoluteMinimax.recommended).toBe(false);
    expect(artifact.deterministicRegretAtlas.descriptiveRelativeMinimax.recommended).toBe(false);
    expect(artifact.selectionBoundary.modelPriorAvailable).toBe(false);
    expect(artifact.selectionBoundary.recommendedAllocationAvailable).toBe(false);
  });
  it("keeps 148 scientific inputs stable across modes", () => {
    const summary = createKerrAllocationRegretSummaryV530(artifact);
    const science = createKerrAllocationRegretHudEncodingV530(summary, "science");
    const cinematic = createKerrAllocationRegretHudEncodingV530(summary, "cinematic");
    expect(compareKerrAllocationRegretHudEncodingsV530(science, cinematic)).toMatchObject({
      scientificGeometryStable: true,
      scientificGeometryInputCount: 148,
      numericScientificStyleInputCount: 0,
    });
    expect(resolveKerrAllocationRegretHudProfileV530("science")).toBe(
      resolveKerrAllocationRegretHudProfileV530("science"),
    );
  });
});
