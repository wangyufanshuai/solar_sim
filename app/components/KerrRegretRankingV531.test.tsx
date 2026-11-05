import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrRegretRankingV531.tsx", "utf8");
describe("v531 V8.0 regret ranking HUD", () => {
  it("renders all 300 traceable scientific geometry inputs", () => {
    expect(source).toContain("stochasticCandidateMap");
    expect(source).toContain("deterministicCandidateMap");
    expect(source).toContain("stochasticScalarizationPath");
    expect(source).toContain("deterministicScalarizationPath");
    expect(source).toContain("scientificGeometryInputCount");
  });
  it("exposes preference fragility and remains scene-neutral", () => {
    expect(source).toContain("top-10 overlap = 0");
    expect(source).toContain("101 个权重都不是偏好");
    expect(source).toContain('data-atlas-v531-canvas-created="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("锟");
  });
});
