import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrGridAxisInfluenceV533,
  compareKerrGridAxisInfluenceHudEncodingsV533,
  createKerrGridAxisInfluenceHudEncodingV533,
  createKerrGridAxisInfluenceSummaryV533,
  parseKerrGridAxisInfluenceArtifactV533,
} from "./kerrGridAxisInfluenceV533";

const artifact = parseKerrGridAxisInfluenceArtifactV533(
  JSON.parse(readFileSync("dist/science/kerr-grid-axis-influence-v533/atlas.json", "utf8")),
);

describe("v533 grid-axis influence and V8.2", () => {
  it("is canonical and complete", () => {
    expect(createHash("sha256").update(canonicalKerrGridAxisInfluenceV533(artifact)).digest("hex"))
      .toBe(artifact.artifactSha256);
    expect(artifact.counts).toMatchObject({
      axisSummaryRowCount: 8,
      directedAxisComparisonCount: 24,
      scientificGeometryInputCount: 46,
    });
  });

  it("finds deterministic multi-metric dominance without making a recommendation", () => {
    expect(artifact.stochasticInfluence.singleDominantAxis).toBe("cost-ratio");
    expect(artifact.deterministicInfluence.singleDominantAxis).toBe("cost-ratio");
    expect(artifact.selectionBoundary.axisPriorAvailable).toBe(false);
    expect(artifact.selectionBoundary.recommendedAxisAvailable).toBe(false);
    expect(artifact.influenceDefinition.singleScoreComputed).toBe(false);
    expect(artifact.influenceDefinition.aggregationIsProbability).toBe(false);
  });

  it("keeps all 46 scientific geometry inputs identical across HUD modes", () => {
    const summary = createKerrGridAxisInfluenceSummaryV533(artifact);
    expect(compareKerrGridAxisInfluenceHudEncodingsV533(
      createKerrGridAxisInfluenceHudEncodingV533(summary, "science"),
      createKerrGridAxisInfluenceHudEncodingV533(summary, "cinematic"),
    )).toMatchObject({
      scientificGeometryInputCount: 46,
      numericScientificStyleInputCount: 0,
      scientificFieldMutation: false,
    });
  });
});
