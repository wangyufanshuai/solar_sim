import { describe, expect, it } from "vitest";
import { resolveAtlasInitialVisualProfileV280, ATLAS_VISUAL_PROFILE_CANDIDATE_V280 } from "./atlasVisualProfileV280";
import {
  createDefaultRelativityWorkbenchScenarioV280,
  createWorkbenchProvenanceV280,
  normalizeRelativityWorkbenchScenarioV280,
} from "./relativityWorkbenchV280";

describe("v280 unified relativity workbench", () => {
  it("keeps default kernel and bounded preview boundary explicit", () => {
    const scenario = createDefaultRelativityWorkbenchScenarioV280();
    const provenance = createWorkbenchProvenanceV280({ scenario, v276EvidenceSha256: null, v277EvidenceSha256: null, v278EvidenceSha256: null });
    expect(scenario.kernel).toBe("legacy-eih-1pn");
    expect(provenance.boundary).toContain("no-arbitrary-code");
    expect(provenance.surveyCompleteness).toBe("unavailable");
  });

  it("normalizes signed spin and rejects non-canonical artifact ids", () => {
    const scenario = normalizeRelativityWorkbenchScenarioV280({ spinA: 2, observerRadiusM: 1, artifactSha256: "bad" });
    expect(scenario.spinA).toBe(0.998);
    expect(scenario.observerRadiusM).toBe(3);
    expect(scenario.artifactSha256).toBeNull();
  });

  it("only local-shadow can select V4 after qualification", () => {
    expect(resolveAtlasInitialVisualProfileV280({ build: "standalone", qualified: true }).profile).toBe("legacy-v9");
    expect(resolveAtlasInitialVisualProfileV280({ build: "local-shadow", qualified: false }).profile).toBe("legacy-v9");
    expect(resolveAtlasInitialVisualProfileV280({ build: "local-shadow", qualified: true }).profile).toBe(ATLAS_VISUAL_PROFILE_CANDIDATE_V280);
  });
});
