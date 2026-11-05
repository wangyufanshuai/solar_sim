import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v408 scattering oracle workbench surface", () => {
  it("renders a bounded numerical error observatory after v407 without Canvas or science mutation", () => {
    const source = readFileSync("app/components/KerrScatteringOracleSurfaceV408.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Numerical error envelope");
    expect(source).toContain("6.77%–9.02%");
    expect(source).toContain("NOT QUALIFIED");
    expect(source).toContain('data-atlas-v408-summary-only-in-react-state="true"');
    expect(source).toContain('data-atlas-v408-curve-samples-in-react-state="false"');
    expect(source).toContain('data-atlas-v408-exact-h-function-table-authority="false"');
    expect(source).toContain('data-atlas-v408-science-buffer-mutation="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrScatteringOracleSurfaceV408 />")).toBeGreaterThan(observatory.indexOf("<KerrScatteringAtmosphereSurfaceV407 />"));
  });
});
