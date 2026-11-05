import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v363 calibration plan surface", () => {
  it("is V9/local-shadow intent gated and labels planning versus measurement", () => {
    const source = readFileSync("app/components/DetectorCalibrationPlanSurfaceV363.tsx", "utf8");
    const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V362");
    expect(source).toContain("plan only · no measurements");
    expect(source).toContain("planning floor");
    expect(source).toContain("data-atlas-v363-science-buffer-mutation=\"false\"");
    expect(source).toContain("data-atlas-v363-cinematic-color-input=\"false\"");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<DetectorCalibrationPlanSurfaceV363 />");
  });
});
