import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v411 polarimeter calibration surface", () => {
  it("renders after v410 with schema-ready and measured-authority boundaries visible", () => {
    const source = readFileSync("app/components/KerrPolarimeterCalibrationSurfaceV411.tsx", "utf8");
    const observatory = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    expect(source).toContain("Polarimeter admission lattice");
    expect(source).toContain("BLOCKED · INPUT ABSENT");
    expect(source).toContain('data-atlas-v411-measured-pack-present="false"');
    expect(source).toContain('data-atlas-v411-authority-granted="false"');
    expect(source).toContain('data-atlas-v411-science-buffer-mutation="false"');
    expect(source).toContain("不共享 HWP 假设");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(observatory.indexOf("<KerrPolarimeterCalibrationSurfaceV411 />")).toBeGreaterThan(observatory.indexOf("<KerrIdealPolarimeterSurfaceV410 />"));
  });
});
