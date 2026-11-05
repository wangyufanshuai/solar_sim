import { describe, expect, it } from "vitest";
import { resolveAtlasVisualProfileV269 } from "./atlasVisualProfileV269";
import { ATLAS_VISUAL_PROFILE_LEGACY_V261 } from "./atlasVisualProfileV261";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V274, createAtlasVisualCandidateSummaryV274, resolveAtlasVisualProfileV274 } from "./atlasVisualProfileV274";

describe("v274 Science Cinematic V3", () => {
  it("preserves every legacy v269 renderer scalar", () => {
    const legacy = resolveAtlasVisualProfileV274(ATLAS_VISUAL_PROFILE_LEGACY_V261);
    const previous = resolveAtlasVisualProfileV269(ATLAS_VISUAL_PROFILE_LEGACY_V261);
    for (const key of Object.keys(previous) as (keyof typeof previous)[]) expect(legacy[key]).toEqual(previous[key]);
    expect(legacy.groups.sky.starLuminance).toBe(1);
    expect(legacy.defaultApplied).toBe(true);
  });

  it("adds bounded full-scene groups without promoting formal defaults", () => {
    const candidate = resolveAtlasVisualProfileV274(ATLAS_VISUAL_PROFILE_CANDIDATE_V274);
    expect(candidate.groups.solar.ringOpticalDepth).toBeGreaterThan(1);
    expect(candidate.groups.catalog.faintStarOpacity).toBeLessThan(1);
    expect(candidate.groups.postFx.bloomThreshold).toBeGreaterThan(1);
    expect(candidate.localShadowDefaultEligible).toBe(true);
    expect(createAtlasVisualCandidateSummaryV274(candidate.id)).toMatchObject({ formalDefault: "legacy-v9", localShadowDefaultApplied: false });
  });
});
