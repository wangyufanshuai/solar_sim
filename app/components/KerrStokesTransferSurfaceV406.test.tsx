import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("v406 Stokes workbench surface", () => {
  it("renders summary-only I/Q/U diagnostics without Canvas or buffer mutation", () => {
    const source = readFileSync("app/components/KerrStokesTransferSurfaceV406.tsx", "utf8"); const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Stokes interferometer"); expect(source).toContain("Q/I"); expect(source).toContain("U/I"); expect(source).toContain("I/ν³"); expect(source).toContain("L/ν³");
    expect(source).toContain('data-atlas-v406-summary-only-in-react-state="true"'); expect(source).toContain('data-atlas-v406-full-sample-array-in-react-state="false"'); expect(source).toContain('data-atlas-v406-science-buffer-mutation="false"');
    expect(source).toContain("Stokes V unavailable"); expect(source).toContain("Faraday unavailable"); expect(source).not.toContain("Math.random"); expect(source).not.toContain("<canvas");
    expect(observatory).toContain("<KerrStokesTransferSurfaceV406 />");
  });
});
