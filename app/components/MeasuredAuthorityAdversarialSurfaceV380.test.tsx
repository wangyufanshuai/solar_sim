import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
describe("v380 measured authority adversarial surface", () => {
  it("shows fixture-only rejection outcomes without science or cinematic mutation", () => {
    const source = readFileSync("app/components/MeasuredAuthorityAdversarialSurfaceV380.tsx", "utf8"); const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377"); expect(source).toContain("tokens.metrologyGridOpacity"); expect(source).toContain("tokens.authorityGateLuminance"); expect(source).toContain("tokens.unavailableScanOpacity"); expect(source).toContain("/api/atlas/relativity-evidence/v380/measured-authority-adversarial"); expect(source).toContain('data-atlas-v380-authority-promotion="false"'); expect(source).toContain('data-atlas-v380-observed-counts="false"'); expect(source).toContain('data-atlas-v380-science-buffer-mutation="false"'); expect(source).toContain('data-atlas-v380-cinematic-consumer="false"'); expect(source).toContain("negative fixtures never become measured evidence"); expect(source).not.toContain("Math.random"); expect(source).not.toContain("<canvas"); expect(workbench).toContain("<MeasuredAuthorityAdversarialSurfaceV380 />");
  });
});
