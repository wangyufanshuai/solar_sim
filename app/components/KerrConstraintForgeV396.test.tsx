import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v396 constraint forge", () => {
  it("shows structural candidates and controls without physical promotion", () => {
    const source = readFileSync(
      "app/components/KerrConstraintForgeV396.tsx",
      "utf8",
    );
    const workbench = readFileSync(
      "app/components/RelativityResearchWorkbenchV280.tsx",
      "utf8",
    );
    const hub = readFileSync("app/components/KerrObservationHubV400.tsx", "utf8");
    const cache = readFileSync("app/lib/atlasObservationEvidenceCacheV401.ts", "utf8");
    expect(cache).toContain(
      "/api/atlas/relativity-evidence/v396/constraint-design",
    );
    expect(source).toContain('loadAtlasObservationEvidenceStageV401("constraints")');
    expect(source).toContain("Constraint forge");
    expect(source).toContain('data-atlas-v396-baseline-rank="24"');
    expect(source).toContain('data-atlas-v396-full-rank="36"');
    expect(source).toContain('data-atlas-v396-minimum-constraints="12"');
    expect(source).toContain('data-atlas-v396-instrument-feasibility="false"');
    expect(source).toContain('data-atlas-v396-physical-recommendation="false"');
    expect(source).toContain("NEGATIVE CONTROL");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<KerrObservationHubV400 />");
    expect(hub).toContain("<KerrConstraintForgeV396 />");
  });
});
