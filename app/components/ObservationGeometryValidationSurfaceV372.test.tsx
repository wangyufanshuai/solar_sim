import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v372 observation geometry validation surface", () => {
  it("is V10-gated and exposes validation without authority promotion", () => {
    const source = readFileSync(
      "app/components/ObservationGeometryValidationSurfaceV372.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V370");
    expect(source).toContain('data-atlas-v372-validation-executed="false"');
    expect(source).toContain('data-atlas-v372-runtime-geometry-published="false"');
    expect(source).toContain('data-atlas-v372-authority-granted="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<ObservationGeometryValidationSurfaceV372 />");
  });
});
