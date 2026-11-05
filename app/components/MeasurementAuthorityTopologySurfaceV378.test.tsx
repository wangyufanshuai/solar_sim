import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v378 measurement authority topology surface", () => {
  it("renders the real V11 DAG without observed-count or cinematic substitution", () => {
    const source = readFileSync(
      "app/components/MeasurementAuthorityTopologySurfaceV378.tsx",
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
    expect(source).toContain("/api/atlas/relativity-evidence/v378/measurement-authority-topology");
    expect(source).toContain('data-atlas-v378-observed-counts-node="false"');
    expect(source).toContain('data-atlas-v378-synthetic-fallback="false"');
    expect(source).toContain('data-atlas-v378-science-buffer-mutation="false"');
    expect(source).toContain('data-atlas-v378-cinematic-consumer="false"');
    expect(source).toContain("observed counts are outside this graph");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<MeasurementAuthorityTopologySurfaceV378 />");
  });
});
