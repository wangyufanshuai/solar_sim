import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v424 predicted polarimeter runtime surface", () => {
  it("renders after v423 with an explicit model/measurement firewall and no Canvas", () => {
    const source = readFileSync("app/components/KerrPredictedPolarimeterV424.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("HWP × Wollaston modulation vault");
    expect(source).toContain('data-atlas-v424-model-prediction="qualified"');
    expect(source).toContain('data-atlas-v424-measurement-authority="false"');
    expect(source).toContain('data-atlas-v424-counts-produced="false"');
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrPredictedPolarimeterV424 />")).toBeGreaterThan(observatory.indexOf("<KerrPredictedStokesAdmissionV423 />"));
  });
});
