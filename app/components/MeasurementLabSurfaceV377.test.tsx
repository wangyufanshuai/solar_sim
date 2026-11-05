import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v377 measurement lab surface", () => {
  it("consumes V11 tokens while keeping decorative scans separate from science", () => {
    const source = readFileSync("app/components/MeasurementLabSurfaceV377.tsx", "utf8");
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V377");
    expect(source).toContain("tokens.electronColumnOpacity");
    expect(source).toContain("tokens.uncertaintyHaloOpacity");
    expect(source).toContain("tokens.shaRailOpacity");
    expect(source).toContain('data-atlas-v377-science-buffer-mutation="false"');
    expect(source).toContain('data-atlas-v377-cinematic-buffer-mutation="false"');
    expect(source).toContain("decorative scan / no pixel payload");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<MeasurementLabSurfaceV377 />");
  });
});
