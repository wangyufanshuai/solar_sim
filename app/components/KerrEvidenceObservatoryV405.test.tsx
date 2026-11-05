import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("v405 Evidence Observatory", () => {
  it("consumes V13 tokens and keeps Science, Canvas and cycle state isolated", () => {
    const source = readFileSync("app/components/KerrEvidenceObservatoryV405.tsx", "utf8");
    const hub = readFileSync("app/components/KerrObservationHubV400.tsx", "utf8");
    const ab = readFileSync("app/components/AtlasVisualABControlV261.tsx", "utf8");
    expect(source).toContain("evidenceObservatoryV13");
    expect(source).toContain("useAtlasVisualRuntimeConsumerV300");
    expect(source).toContain("Evidence observatory");
    expect(source).toContain('data-atlas-v405-cycle-details-in-react-state="false"');
    expect(source).toContain('data-atlas-v405-science-buffer-mutation="false"');
    expect(source).toContain("Export SHA-locked JSON");
    expect(source).not.toContain("Math.random");
    expect(source).not.toContain("<canvas");
    expect(hub).toContain("profile === ATLAS_VISUAL_PROFILE_CANDIDATE_V405");
    expect(hub).toContain("<KerrEvidenceObservatoryV405 />");
    expect(ab).toContain("V13 Evidence Observatory · Shadow");
    expect(ab).toContain('data-atlas-v13-evidence-observatory-default-applied="false"');
  });
});
