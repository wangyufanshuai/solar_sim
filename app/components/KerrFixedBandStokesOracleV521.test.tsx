import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrFixedBandStokesOracleV521.tsx", "utf8");

describe("v521 direct Stokes oracle surface", () => {
  it("renders all direct integrations and six component comparisons", () => {
    expect(source).toContain('data-atlas-v521-row-count="24"');
    expect(source).toContain('data-atlas-v521-direct-integral-count="144"');
    expect(source).toContain('data-atlas-v521-component-envelope-count="24"');
    expect(source).toContain("summary.maxima.directVsV520EnergyQRelative");
    expect(source).toContain("summary.maxima.directVsV520PhotonURelative");
  });

  it("keeps measurements and scientific mutation closed", () => {
    expect(source).toContain('data-atlas-v521-measured-stokes-row-count="0"');
    expect(source).toContain('data-atlas-v521-circular-stokes-row-count="0"');
    expect(source).toContain('data-atlas-v521-scientific-mutation="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("createObjectURL");
    expect(source).not.toContain("�");
  });
});
