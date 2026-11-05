import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v416 Stokes ensemble surface", () => {
  it("renders after v415 with streaming and measured-authority boundaries", () => {
    const source = readFileSync("app/components/KerrPolarimeterStokesEnsembleSurfaceV416.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Stokes coverage interferometer");
    expect(source).toContain("Welford");
    expect(source).toContain("counting/calibration isolated");
    expect(source).toContain('data-atlas-v416-ray-matrices-in-react-state="false"');
    expect(source).toContain('data-atlas-v416-trial-vectors-in-react-state="false"');
    expect(source).toContain('data-atlas-v416-observed-counts="false"');
    expect(source).toContain('data-atlas-v416-science-buffer-mutation="false"');
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrPolarimeterStokesEnsembleSurfaceV416 />")).toBeGreaterThan(
      observatory.indexOf("<KerrPolarimeterDetectorLikelihoodSurfaceV415 />"),
    );
  });
});
