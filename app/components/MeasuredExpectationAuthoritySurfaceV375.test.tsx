import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v375 measured expectation authority surface", () => {
  it("is V10-gated and separates expectation from observed counts", () => {
    const source = readFileSync(
      "app/components/MeasuredExpectationAuthoritySurfaceV375.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V370");
    expect(source).toContain('data-atlas-v375-detector-authority="false"');
    expect(source).toContain('data-atlas-v375-geometry-authority="false"');
    expect(source).toContain('data-atlas-v375-observed-counts="unavailable"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<MeasuredExpectationAuthoritySurfaceV375 />");
  });
});
