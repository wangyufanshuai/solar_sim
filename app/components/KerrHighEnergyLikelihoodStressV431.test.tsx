import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v431 likelihood stress runtime surface", () => {
  it("renders after v430 with provenance-first selection and zero measured authority", () => {
    const source = readFileSync("app/components/KerrHighEnergyLikelihoodStressV431.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Provenance-first routing firewall");
    expect(source).toContain('data-atlas-v431-scenarios="6"');
    expect(source).toContain('data-atlas-v431-synthetic-count-cells="73728"');
    expect(source).toContain('data-atlas-v431-alternative-likelihoods-qualified="0"');
    expect(source).toContain('data-atlas-v431-measured-authority="false"');
    expect(source).toContain("残差只能审计，不能事后替模型做选择");
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrHighEnergyLikelihoodStressV431 />")).toBeGreaterThan(observatory.indexOf("<KerrHighEnergyCountLikelihoodV430 />"));
  });
});
