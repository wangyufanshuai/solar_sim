import { describe, expect, it } from "vitest";
import { ATLAS_VISUAL_PROFILE_LEGACY_V261 } from "./atlasVisualProfileV261";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V269, createAtlasVisualCandidateSummaryV269, resolveAtlasVisualProfileV269 } from "./atlasVisualProfileV269";

describe("v269 Science Cinematic V2 shadow profile", () => {
  it("keeps Legacy V9 default and bounds every presentation multiplier", () => {
    expect(createAtlasVisualCandidateSummaryV269()).toMatchObject({ defaultProfile: "legacy-v9", candidateAppliedAsDefault: false, physicsMutation: "not-applied" });
    const legacy = resolveAtlasVisualProfileV269(ATLAS_VISUAL_PROFILE_LEGACY_V261);
    const candidate = resolveAtlasVisualProfileV269(ATLAS_VISUAL_PROFILE_CANDIDATE_V269);
    expect(legacy.exposureMultiplier.atlas).toBe(1);
    expect(candidate.exposureMultiplier.atlas).toBeGreaterThan(0.8);
    expect(candidate.catalogOpacityMultiplier).toBeLessThan(1);
    expect(candidate.kerrFlowStrength).toBeLessThan(1);
  });
});
