import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v376 expected electron science image surface", () => {
  it("is V10-gated and never substitutes zero or cinematic imagery", () => {
    const source = readFileSync(
      "app/components/ExpectedElectronScienceImageSurfaceV376.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V370");
    expect(source).toContain('data-atlas-v376-zero-image-fallback="false"');
    expect(source).toContain('data-atlas-v376-cinematic-consumer="false"');
    expect(source).toContain('data-atlas-v376-observed-counts="unavailable"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<ExpectedElectronScienceImageSurfaceV376 />");
  });
});
