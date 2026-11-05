import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v373 observation geometry authority surface", () => {
  it("is V10-gated and keeps admission separate from runtime publication", () => {
    const source = readFileSync(
      "app/components/ObservationGeometryAuthoritySurfaceV373.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V370");
    expect(source).toContain('data-atlas-v373-admission-executed="false"');
    expect(source).toContain('data-atlas-v373-authority-pointer-published="false"');
    expect(source).toContain('data-atlas-v373-runtime-geometry-published="false"');
    expect(source).toContain('data-atlas-v373-authority-granted="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<ObservationGeometryAuthoritySurfaceV373 />");
  });
});
