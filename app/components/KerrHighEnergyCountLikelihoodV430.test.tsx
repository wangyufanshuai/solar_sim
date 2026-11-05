import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v430 count-likelihood runtime surface", () => {
  it("renders after v429 while keeping measured and dense authority unavailable", () => {
    const source = readFileSync("app/components/KerrHighEnergyCountLikelihoodV430.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Residual &amp; whitening interferometer");
    expect(source).toContain('data-atlas-v430-measured-observed-counts="0"');
    expect(source).toContain('data-atlas-v430-measured-residual-metrics="0"');
    expect(source).toContain('data-atlas-v430-measured-response-authority="false"');
    expect(source).toContain("fixture goodness-of-fit ≠ instrument performance");
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrHighEnergyCountLikelihoodV430 />")).toBeGreaterThan(observatory.indexOf("<KerrHighEnergyResponseUncertaintyV429 />"));
  });
});
