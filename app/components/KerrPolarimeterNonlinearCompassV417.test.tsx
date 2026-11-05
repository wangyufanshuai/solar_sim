import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v417 nonlinear polarization compass", () => {
  it("renders after v416 with axial and measured-authority boundaries", () => {
    const source = readFileSync("app/components/KerrPolarimeterNonlinearCompassV417.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Axial polarization compass");
    expect(source).toContain("π-period axial wrap");
    expect(source).toContain("physical Stokes cone");
    expect(source).toContain('data-atlas-v417-ray-covariances-in-react-state="false"');
    expect(source).toContain('data-atlas-v417-trial-observables-in-react-state="false"');
    expect(source).toContain('data-atlas-v417-observed-polarization="false"');
    expect(source).toContain('data-atlas-v417-science-buffer-mutation="false"');
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrPolarimeterNonlinearCompassV417 />")).toBeGreaterThan(
      observatory.indexOf("<KerrPolarimeterStokesEnsembleSurfaceV416 />"),
    );
  });
});
