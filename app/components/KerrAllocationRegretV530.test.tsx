import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrAllocationRegretV530.tsx", "utf8");
describe("v530 V7.9 allocation regret HUD", () => {
  it("renders all 148 traceable scientific geometry inputs", () => {
    expect(source).toContain("stochasticCandidateEnvelope");
    expect(source).toContain("deterministicCandidateEnvelope");
    expect(source).toContain("stochasticOptimalFractionLattice");
    expect(source).toContain("deterministicOptimalFractionLattice");
    expect(source).toContain("scientificGeometryInputCount");
  });
  it("exposes normalization fragility and remains scene-neutral", () => {
    expect(source).toContain("数学 minimax");
    expect(source).toContain("网格覆盖率不是概率");
    expect(source).toContain('data-atlas-v530-canvas-created="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("锟");
  });
});
