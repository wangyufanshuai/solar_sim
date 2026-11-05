import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  canonicalKerrRegretRankingV531,
  compareKerrRegretRankingHudEncodingsV531,
  createKerrRegretRankingHudEncodingV531,
  createKerrRegretRankingSummaryV531,
  parseKerrRegretRankingArtifactV531,
  resolveKerrRegretRankingHudProfileV531,
} from "./kerrRegretRankingV531";

const artifact = parseKerrRegretRankingArtifactV531(
  JSON.parse(readFileSync("dist/science/kerr-regret-ranking-v531/atlas.json", "utf8")),
);
describe("v531 regret ranking and V8.0", () => {
  it("has canonical 160-digit ranking identity", () => {
    expect(
      createHash("sha256").update(canonicalKerrRegretRankingV531(artifact)).digest("hex"),
    ).toBe(artifact.artifactSha256);
    expect(artifact.counts).toMatchObject({
      dominanceComparisonCount: 4704,
      scalarizationEvaluationCount: 9898,
      scientificGeometryInputCount: 300,
    });
  });
  it("proves nontrivial Pareto fronts and ranking disagreement", () => {
    expect(artifact.stochasticRanking.paretoFront.candidateCount).toBe(16);
    expect(artifact.deterministicRanking.paretoFront.candidateCount).toBe(10);
    expect(artifact.stochasticRanking.rankingAgreement.winnerAgreement).toBe(false);
    expect(artifact.deterministicRanking.rankingAgreement.topSetOverlap.top10).toBe(0);
  });
  it("keeps scalarization outside operational preference", () => {
    expect(artifact.stochasticRanking.scalarizationPath.selectedWeightIndex).toBeNull();
    expect(artifact.deterministicRanking.selectionBoundary.utilityAvailable).toBe(false);
    expect(artifact.selectionBoundary.recommendedAllocationAvailable).toBe(false);
  });
  it("keeps 300 scientific inputs stable across modes", () => {
    const summary = createKerrRegretRankingSummaryV531(artifact);
    const science = createKerrRegretRankingHudEncodingV531(summary, "science");
    const cinematic = createKerrRegretRankingHudEncodingV531(summary, "cinematic");
    expect(compareKerrRegretRankingHudEncodingsV531(science, cinematic)).toMatchObject({
      scientificGeometryStable: true,
      scientificGeometryInputCount: 300,
      numericScientificStyleInputCount: 0,
    });
    expect(resolveKerrRegretRankingHudProfileV531("science")).toBe(
      resolveKerrRegretRankingHudProfileV531("science"),
    );
  });
});
