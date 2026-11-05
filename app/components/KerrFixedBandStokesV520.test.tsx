import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("app/components/KerrFixedBandStokesV520.tsx", "utf8");

describe("v520 fixed-band Stokes surface", () => {
  it("renders the complete 4 x 3 x 2 authority and transport comparisons", () => {
    expect(source).toContain('data-atlas-v520-ray-count="4"');
    expect(source).toContain('data-atlas-v520-band-count="3"');
    expect(source).toContain('data-atlas-v520-transport-method-count="2"');
    expect(source).toContain('data-atlas-v520-row-count="24"');
    expect(source).toContain("summary.maxima.wpKsEvpaDifferenceDeg");
    expect(source).toContain("summary.maxima.wpKsNormalizedUDifference");
  });

  it("keeps predicted linear Stokes outside measured and cinematic authority", () => {
    expect(source).toContain('data-atlas-v520-measured-stokes-row-count="0"');
    expect(source).toContain('data-atlas-v520-circular-stokes-row-count="0"');
    expect(source).toContain('data-atlas-v520-detector-projected-row-count="0"');
    expect(source).toContain('data-atlas-v520-scientific-mutation="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(source).not.toContain("createObjectURL");
    expect(source).not.toContain("�");
  });
});
