import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v421 axial-vector runtime surface", () => {
  it("renders after v420 with corrected orientation and no raster or Canvas claims", () => {
    const source = readFileSync("app/components/KerrAxialPolarizationVectorsV421.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("WCS-aware polarization vectors");
    expect(source).toContain('data-atlas-v421-evpa-zero="plus-beta"');
    expect(source).toContain('data-atlas-v421-world-direction="dAlpha=sin-chi-dBeta=cos-chi"');
    expect(source).toContain('data-atlas-v421-prior-png-orientation="withdrawn"');
    expect(source).toContain('data-atlas-v421-intensity="unavailable"');
    expect(source).toContain('data-atlas-v421-stokes-amplitude="unavailable"');
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrAxialPolarizationVectorsV421 />")).toBeGreaterThan(observatory.indexOf("<KerrObserverWcsGridV420 />"));
  });
});
