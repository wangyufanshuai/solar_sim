import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v425 spectral admission runtime surface", () => {
  it("renders after v424 as a fail-closed domain firewall without creating a Canvas", () => {
    const source = readFileSync("app/components/KerrInstrumentSpectralAdmissionV425.tsx", "utf8"), observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Instrument applicability firewall");
    expect(source).toContain('data-atlas-v425-response-eligible-count="0"');
    expect(source).toContain('data-atlas-v425-response-matrix-applications="0"');
    expect(source).toContain('data-atlas-v425-extrapolation="forbidden"');
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrInstrumentSpectralAdmissionV425 />")).toBeGreaterThan(observatory.indexOf("<KerrPredictedPolarimeterV424 />"));
  });
});
