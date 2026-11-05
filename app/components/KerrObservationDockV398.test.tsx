import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v398 observation dock", () => {
  it("shows the empty local intake without implying authority", () => {
    const source = readFileSync("app/components/KerrObservationDockV398.tsx", "utf8");
    const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    const hub = readFileSync("app/components/KerrObservationHubV400.tsx", "utf8");
    const cache = readFileSync("app/lib/atlasObservationEvidenceCacheV401.ts", "utf8");
    expect(cache).toContain("/api/atlas/relativity-evidence/v398/observation-intake");
    expect(source).toContain('loadAtlasObservationEvidenceStageV401("intake")');
    expect(source).toContain("Observation dock");
    expect(source).toContain('data-atlas-v398-staging-manifest="absent"');
    expect(source).toContain('data-atlas-v398-present-files="0"');
    expect(source).toContain('data-atlas-v398-expected-files="13"');
    expect(source).toContain('data-atlas-v398-compile-executed="false"');
    expect(source).toContain('data-atlas-v398-measured-authority="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<KerrObservationHubV400 />");
    expect(hub).toContain("<KerrObservationDockV398 />");
  });
});
