import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v397 observation airlock", () => {
  it("renders the admission boundary without promoting physical authority", () => {
    const source = readFileSync("app/components/KerrObservationAirlockV397.tsx", "utf8");
    const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    const hub = readFileSync("app/components/KerrObservationHubV400.tsx", "utf8");
    const cache = readFileSync("app/lib/atlasObservationEvidenceCacheV401.ts", "utf8");
    expect(cache).toContain("/api/atlas/relativity-evidence/v397/observation-admission");
    expect(source).toContain('loadAtlasObservationEvidenceStageV401("admission")');
    expect(source).toContain("Observation airlock");
    expect(source).toContain('data-atlas-v397-physical-pack="unavailable"');
    expect(source).toContain('data-atlas-v397-available-sources="0"');
    expect(source).toContain('data-atlas-v397-publication-allowed="false"');
    expect(source).toContain('data-atlas-v397-measured-authority="false"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<KerrObservationHubV400 />");
    expect(hub).toContain("<KerrObservationAirlockV397 />");
  });
});
