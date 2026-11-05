import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrCostLawRobustnessV529.tsx", "utf8");
describe("v529 V7.8 cost-law robustness HUD", () => {
  it("renders all 68 traceable scientific geometry inputs", () => {
    expect(source).toContain("stochasticExponentRatioSurface");
    expect(source).toContain("deterministicExponentRatioSurface");
    expect(source).toContain("stochasticFloorEnvelope");
    expect(source).toContain("deterministicOverheadTranslation");
    expect(source).toContain("scientificGeometryInputCount");
  });
  it("states the model firewall and remains scene-neutral", () => {
    expect(source).toContain("这些坐标用于压力测试，不是实测成本模型");
    expect(source).toContain("禁止自动选型");
    expect(source).toContain('data-atlas-v529-canvas-created="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("锟");
  });
});
