import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V362, ATLAS_VISUAL_PROFILE_CANDIDATE_V370, resolveAtlasInitialVisualProfileV299, resolveAtlasVisualProfileV299 } from "./atlasVisualProfileV299";

describe("Science Cinematic V10 Observatory", () => {
  it("freezes V9 and exposes stable V10 observatory tokens without science grading", () => {
    const v9 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V362); const v9Snapshot = JSON.stringify(v9);
    const v10 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V370);
    expect(resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V370)).toBe(v10);
    expect(v10).toMatchObject({ id: "science-cinematic-v10-v370", v9TokensApplied: false, v10TokensApplied: true, defaultApplied: false, localShadowDefaultEligible: false, scienceBufferIsolation: "immutable-ray-payload", cinematicDecoration: "seeded-only" });
    expect(v10.runtimeTokens.hud.observatoryHudV10).toMatchObject({ detailSeed: 370, apertureArcOpacity: 0.68, photonTraceOpacity: 0.58 });
    expect(v10.runtimeTokens.strongGravityV10).toMatchObject({ scienceExposure: 1, scienceBloom: 0, scienceNoise: 0, diskDetailSeed: 370 });
    expect(JSON.stringify(resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V362))).toBe(v9Snapshot);
  });

  it("keeps Legacy V9 default and exposes V10 only as local-shadow manual A/B", () => {
    expect(resolveAtlasInitialVisualProfileV299({ build: "formal" })).toMatchObject({ profile: "legacy-v9", v10ObservatoryManualAbAvailable: false, localShadowDefaultApplied: false });
    expect(resolveAtlasInitialVisualProfileV299({ build: "local-shadow" })).toMatchObject({ profile: "legacy-v9", v10ObservatoryManualAbAvailable: true, localShadowDefaultApplied: false });
    const source = readFileSync("app/components/AtlasVisualABControlV261.tsx", "utf8");
    expect(source).toContain("V10 Observatory · Shadow");
    expect(source).toContain("data-atlas-v10-observatory-default-applied=\"false\"");
  });
});
