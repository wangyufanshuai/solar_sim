import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v407 scattering atmosphere workbench surface", () => {
  it("renders a local-angle approximation audit without Canvas or science mutation", () => {
    const source = readFileSync("app/components/KerrScatteringAtmosphereSurfaceV407.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Emission-angle polarimeter");
    expect(source).toContain("p(μ) = 0.1171");
    expect(source).toContain("它不是观测者倾角，也不是 screen β");
    expect(source).toContain("NOT QUALIFIED");
    expect(source).toContain('data-atlas-v407-summary-only-in-react-state="true"');
    expect(source).toContain('data-atlas-v407-angle-executions-in-react-state="false"');
    expect(source).toContain('data-atlas-v407-observer-inclination-substituted="false"');
    expect(source).toContain('data-atlas-v407-science-buffer-mutation="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(observatory).toContain("<KerrScatteringAtmosphereSurfaceV407 />");
  });
});
