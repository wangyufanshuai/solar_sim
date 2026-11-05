import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  "app/components/KerrPolarizationFrequencySensitivityV522.tsx",
  "utf8",
);

describe("v522 polarization frequency sensitivity surface", () => {
  it("renders the full scenario and envelope coverage", () => {
    expect(source).toContain('data-atlas-v522-scenario-count="9"');
    expect(source).toContain('data-atlas-v522-scenario-row-count="216"');
    expect(source).toContain('data-atlas-v522-direct-integral-count="888"');
    expect(source).toContain('data-atlas-v522-envelope-row-count="24"');
    expect(source).toContain("summary.maxima.energyEvpaShiftDeg");
    expect(source).toContain("summary.maxima.normalizedUShift");
  });

  it("does not present stress envelopes as priors or measured authority", () => {
    expect(source).toContain('data-atlas-v522-physical-prior-qualified="false"');
    expect(source).toContain('data-atlas-v522-measured-stokes-row-count="0"');
    expect(source).toContain('data-atlas-v522-scientific-mutation="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("createObjectURL");
    expect(source).not.toContain("�");
  });
});
