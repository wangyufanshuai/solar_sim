import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V285 } from "./atlasVisualProfileV274";
import { resolveAtlasVisualProfileV285 } from "./atlasVisualProfileV285";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V299, ATLAS_VISUAL_PROFILE_CANDIDATE_V300, ATLAS_VISUAL_PROFILE_CANDIDATE_V340, ATLAS_VISUAL_PROFILE_CANDIDATE_V349, ATLAS_VISUAL_PROFILE_CANDIDATE_V362, resolveAtlasInitialVisualProfileV299, resolveAtlasVisualProfileV299, sampleAtlasCinematicDetailV299 } from "./atlasVisualProfileV299";

describe("v299 Science Cinematic V5 profile", () => {
  it("preserves every pre-V5 renderer field", () => {
    const previous = resolveAtlasVisualProfileV285(ATLAS_VISUAL_PROFILE_CANDIDATE_V285);
    const compatible = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V285);
    for (const key of Object.keys(previous) as Array<keyof typeof previous>) {
      expect(compatible[key]).toEqual(previous[key]);
    }
    expect(compatible.v5TokensApplied).toBe(false);
  });

  it("keeps V5/V6/V7/V8/V9 manual and local-shadow only", () => {
    expect(resolveAtlasInitialVisualProfileV299({ build: "formal" })).toMatchObject({ profile: "legacy-v9", v5ManualAbAvailable: false, localShadowDefaultApplied: false });
    expect(resolveAtlasInitialVisualProfileV299({ build: "standalone-full" }).v5ManualAbAvailable).toBe(false);
    expect(resolveAtlasInitialVisualProfileV299({ build: "vercel-lite" }).v5ManualAbAvailable).toBe(false);
    expect(resolveAtlasInitialVisualProfileV299({ build: "local-shadow" }).v5ManualAbAvailable).toBe(true);
    expect(resolveAtlasInitialVisualProfileV299({ build: "local-shadow" }).v6ManualAbAvailable).toBe(true);
    expect(resolveAtlasInitialVisualProfileV299({ build: "local-shadow" }).v7ManualAbAvailable).toBe(true);
    expect(resolveAtlasInitialVisualProfileV299({ build: "local-shadow" }).v8ManualAbAvailable).toBe(true);
    expect(resolveAtlasInitialVisualProfileV299({ build: "local-shadow" }).v9InstrumentLabManualAbAvailable).toBe(true);
    expect(resolveAtlasInitialVisualProfileV299({ build: "formal" }).v9InstrumentLabManualAbAvailable).toBe(false);
    const source = readFileSync(resolve(process.cwd(), "app/components/AtlasVisualABControlV261.tsx"), "utf8");
    expect(source).toContain('const localShadow = deliveryProfile === "local-shadow"');
    expect(source).toContain("V9 Instrument Lab · Shadow");
    expect(source).toContain("Local visual A/B: Legacy, V1-V12 and V12 Observation Hub Shadow");
    expect(source).not.toContain("\uFFFD");
  });

  it("switches V5 without changing sceneRevision or physics", () => {
    const before = atlasRuntimeStore.getSnapshot();
    atlasRuntimeStore.setVisualProfile(ATLAS_VISUAL_PROFILE_CANDIDATE_V299);
    const after = atlasRuntimeStore.getSnapshot();
    expect(after.sceneRevision).toBe(before.sceneRevision);
    expect(resolveAtlasVisualProfileV299(after.visualProfile).v5TokensApplied).toBe(true);
    atlasRuntimeStore.setVisualProfile("legacy-v9");
  });

  it("keeps V6 local-shadow-only with distinct deterministic scene tokens", () => {
    const v5 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V299);
    const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V300);
    expect(profile.v6TokensApplied).toBe(true);
    expect(profile.runtimeTokens.strongGravityV6?.diskDetailSeed).toBe(300);
    expect(profile.runtimeTokens.launch).not.toEqual(v5.runtimeTokens.launch);
    expect(profile.runtimeTokens.exoplanet).not.toEqual(v5.runtimeTokens.exoplanet);
    expect(profile.runtimeTokens.launch.detailSeed).toBe(300);
    const replay = Array.from({ length: 8 }, (_, index) => sampleAtlasCinematicDetailV299(300, 12, index));
    expect(replay).toEqual(Array.from({ length: 8 }, (_, index) => sampleAtlasCinematicDetailV299(300, 12, index)));
    expect(replay.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(replay).not.toEqual(Array.from({ length: 8 }, (_, index) => sampleAtlasCinematicDetailV299(299, 12, index)));
    expect(resolveAtlasInitialVisualProfileV299({ build: "formal" }).v6ManualAbAvailable).toBe(false);
  });

  it("keeps V7 Science frozen while applying a distinct precision-observatory presentation", () => {
    const v6 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V300);
    const v7 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V340);
    expect(v7.v7TokensApplied).toBe(true);
    expect(v7.v6TokensApplied).toBe(false);
    expect(v7.runtimeTokens.strongGravityV7).toMatchObject({ scienceExposure: 1, scienceBloom: 0, scienceNoise: 0, diskDetailSeed: 340 });
    expect(v7.runtimeTokens.strongGravity.scienceDisplayTransform).toBe("linear-no-grade");
    expect(v7.groups.sky).not.toEqual(v6.groups.sky);
    expect(v7.groups.solar).not.toEqual(v6.groups.solar);
    expect(v7.groups.catalog).not.toEqual(v6.groups.catalog);
    expect(v7.groups.postFx).not.toEqual(v6.groups.postFx);
    expect(v7.runtimeTokens.launch.detailSeed).toBe(340);
    expect(v7.runtimeTokens.hud.scienceMeasurementColor).toBe("#a7edf2");
    expect(resolveAtlasInitialVisualProfileV299({ build: "formal" }).v7ManualAbAvailable).toBe(false);
  });

  it("keeps V8 Science frozen while applying spectral-observatory presentation tokens", () => {
    const v7 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V340);
    const v8 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V349);
    expect(v8.v8TokensApplied).toBe(true);
    expect(v8.v7TokensApplied).toBe(false);
    expect(v8.runtimeTokens.strongGravityV8).toMatchObject({ scienceExposure: 1, scienceBloom: 0, scienceNoise: 0, diskDetailSeed: 349, spectralRibbonOpacity: 0.72, reticleLuminance: 0.82, channelSeparation: 0.64 });
    expect(v8.runtimeTokens.strongGravity.scienceDisplayTransform).toBe("linear-no-grade");
    expect(v8.groups.sky).not.toEqual(v7.groups.sky);
    expect(v8.groups.hud).not.toEqual(v7.groups.hud);
    expect(v8.runtimeTokens.launch.detailSeed).toBe(349);
    expect(resolveAtlasInitialVisualProfileV299({ build: "formal" }).v8ManualAbAvailable).toBe(false);
  });

  it("adds a stable V9 Instrument Lab candidate without mutating V8", () => {
    const v8 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V349);
    const v8Snapshot = JSON.stringify(v8);
    const v9 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V362);
    expect(resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V362)).toBe(v9);
    expect(v9).toMatchObject({ id: "science-cinematic-v9-v362", v8TokensApplied: false, v9TokensApplied: true, defaultApplied: false, localShadowDefaultEligible: false });
    expect(v9.runtimeTokens.strongGravityV9).toMatchObject({ scienceExposure: 1, scienceBloom: 0, scienceNoise: 0, diskDetailSeed: 362, uncertaintyContourOpacity: 0.48, detectorGridOpacity: 0.34 });
    expect(v9.runtimeTokens.hud.instrumentLabV9).toMatchObject({ detailSeed: 362, calibrationAlertOpacity: 0.88 });
    expect(v9.runtimeTokens.strongGravity.scienceDisplayTransform).toBe("linear-no-grade");
    expect(JSON.stringify(resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V349))).toBe(v8Snapshot);
  });
});
