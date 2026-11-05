import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v379 measured authority readiness surface", () => {
  it("separates contract qualification from missing measured authority", () => {
    const source = readFileSync(
      "app/components/MeasuredAuthorityReadinessSurfaceV379.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377");
    expect(source).toContain("tokens.metrologyGridOpacity");
    expect(source).toContain("tokens.shaRailOpacity");
    expect(source).toContain("tokens.authorityGateLuminance");
    expect(source).toContain("/api/atlas/relativity-evidence/v379/measured-authority-readiness");
    expect(source).toContain('data-atlas-v379-automatic-promotion="false"');
    expect(source).toContain('data-atlas-v379-science-buffer-mutation="false"');
    expect(source).toContain('data-atlas-v379-cinematic-consumer="false"');
    expect(source).toContain("contract qualification never grants measured authority");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<MeasuredAuthorityReadinessSurfaceV379 />");
  });
});
