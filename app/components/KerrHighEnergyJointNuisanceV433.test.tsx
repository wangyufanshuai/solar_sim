import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v433 joint nuisance runtime surface", () => {
  it("renders after v432 with an explicit implemented/not-admitted boundary", () => {
    const source = readFileSync("app/components/KerrHighEnergyJointNuisanceV433.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Response × likelihood boundary");
    expect(source).toContain('data-atlas-v433-covariance-dimension="24"');
    expect(source).toContain('data-atlas-v433-measured-authority="false"');
    expect(source).toContain('data-atlas-v433-science-admitted="false"');
    expect(source).toContain("Implemented");
    expect(source).toContain("not admitted");
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrHighEnergyJointNuisanceV433 />")).toBeGreaterThan(observatory.indexOf("<KerrHighEnergyLikelihoodAuthorityV432 />"));
  });
});
