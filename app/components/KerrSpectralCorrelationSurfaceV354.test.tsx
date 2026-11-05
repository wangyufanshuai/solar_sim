import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v354 spectral-correlation surface", () => {
  it("labels synthetic covariance and measured-calibration boundaries", () => {
    const source = readFileSync("app/components/KerrSpectralCorrelationSurfaceV354.tsx", "utf8");
    expect(source).toContain("Correlated basis response matrix");
    expect(source).toContain("not RSS independence");
    expect(source).toContain("not measured calibration");
    expect(source).toContain("never cinematic input");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
  });
});
