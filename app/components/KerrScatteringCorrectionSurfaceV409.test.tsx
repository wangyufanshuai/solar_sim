import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("v409 corrected Stokes workbench surface", () => {
  it("renders after v408 as a summary-only immutable science payload", () => {
    const source = readFileSync("app/components/KerrScatteringCorrectionSurfaceV409.tsx", "utf8"); const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Stokes correction matrix"); expect(source).toContain("NOT APPLIED"); expect(source).toContain("NOT QUALIFIED");
    expect(source).toContain('data-atlas-v409-summary-only-in-react-state="true"'); expect(source).toContain('data-atlas-v409-sample-array-in-react-state="false"'); expect(source).toContain('data-atlas-v409-interpolation-applied="false"'); expect(source).toContain('data-atlas-v409-science-buffer-mutation="false"');
    expect(source).not.toContain("Math.random"); expect(source).not.toContain("<canvas"); expect(observatory.indexOf("<KerrScatteringCorrectionSurfaceV409 />")).toBeGreaterThan(observatory.indexOf("<KerrScatteringOracleSurfaceV408 />"));
  });
});
