import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v399 provenance rail", () => {
  it("renders required topology and value-free download boundaries", () => {
    const source = readFileSync("app/components/KerrProvenanceRailV399.tsx", "utf8");
    const workbench = readFileSync("app/components/RelativityResearchWorkbenchV280.tsx", "utf8");
    const hub = readFileSync("app/components/KerrObservationHubV400.tsx", "utf8");
    const cache = readFileSync("app/lib/atlasObservationEvidenceCacheV401.ts", "utf8");
    expect(cache).toContain("/api/atlas/relativity-evidence/v399/provenance-template");
    expect(source).toContain('loadAtlasObservationEvidenceStageV401("provenance")');
    expect(source).toContain("/api/atlas/relativity-evidence/v399/intake-template");
    expect(source).toContain("Provenance rail");
    expect(source).toContain('data-atlas-v399-template-only="true"');
    expect(source).toContain('data-atlas-v399-observation-values="false"');
    expect(source).toContain('data-atlas-v399-compile-eligible="false"');
    expect(source).toContain('data-atlas-v399-actual-sources="0"');
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(workbench).toContain("<KerrObservationHubV400 />");
    expect(hub).toContain("<KerrProvenanceRailV399 />");
  });
});
