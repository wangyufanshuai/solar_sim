import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v374 observation geometry publication surface", () => {
  it("is V10-gated and reports publication separately from expectation", () => {
    const source = readFileSync(
      "app/components/ObservationGeometryRuntimePublicationSurfaceV374.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    expect(source).toContain("profile !== ATLAS_VISUAL_PROFILE_CANDIDATE_V370");
    expect(source).toContain('data-atlas-v374-publication-executed="false"');
    expect(source).toContain('data-atlas-v374-runtime-geometry-published="false"');
    expect(source).toContain('data-atlas-v374-expectation-available="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain(
      "<ObservationGeometryRuntimePublicationSurfaceV374 />",
    );
  });
});
