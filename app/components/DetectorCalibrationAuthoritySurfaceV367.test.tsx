import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v367 authority surface", () => {
  it("is V9 gated, read-only, fail-closed and wired into the shared workbench", () => {
    const source = readFileSync("app/components/DetectorCalibrationAuthoritySurfaceV367.tsx", "utf8");
    const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V362");
    expect(source).toContain("data-atlas-v367-authority-granted=\"false\"");
    expect(source).toContain("data-atlas-v367-automatic-promotion=\"false\"");
    expect(source).not.toContain("onClick");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<DetectorCalibrationAuthoritySurfaceV367 />");
  });
});
