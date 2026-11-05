import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("v415 detector likelihood surface", () => {
  it("renders after v414 with strict synthetic and measured-data boundaries", () => {
    const source = readFileSync("app/components/KerrPolarimeterDetectorLikelihoodSurfaceV415.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Residual metrology bench");
    expect(source).toContain("高计数率近似");
    expect(source).toContain("小 λ Poisson");
    expect(source).toContain("measured authority unavailable");
    expect(source).toContain('data-atlas-v415-likelihood-rows-in-react-state="false"');
    expect(source).toContain('data-atlas-v415-observed-counts="false"');
    expect(source).toContain('data-atlas-v415-exact-source-poisson-integer="false"');
    expect(source).toContain('data-atlas-v415-science-buffer-mutation="false"');
    expect(source).not.toContain("Math.random(");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrPolarimeterDetectorLikelihoodSurfaceV415 />")).toBeGreaterThan(
      observatory.indexOf("<KerrPolarimeterDetectorSurfaceV414 />"),
    );
  });
});
