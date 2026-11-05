import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("v364 calibration pack surface", () => {
  it("is V9 intent gated and exposes only whitelisted SHA downloads", () => {
    const source = readFileSync("app/components/DetectorCalibrationPackSurfaceV364.tsx", "utf8"); const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V362"); expect(source).toContain("0 measured rows"); expect(source).toContain("data-atlas-v364-admissible-as-measured=\"false\""); expect(source).toContain("data-atlas-v364-science-buffer-mutation=\"false\""); expect(source).not.toContain("Math.random"); expect(source).not.toContain("<canvas"); expect(source).not.toContain("URL.createObjectURL"); expect(workbench).toContain("<DetectorCalibrationPackSurfaceV364 />");
  });
});
