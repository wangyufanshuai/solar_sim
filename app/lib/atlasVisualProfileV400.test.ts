import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import {
  ATLAS_VISUAL_PROFILE_CANDIDATE_V377,
  ATLAS_VISUAL_PROFILE_CANDIDATE_V400,
  resolveAtlasInitialVisualProfileV299,
  resolveAtlasVisualProfileV299,
} from "./atlasVisualProfileV299";

const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

describe("Science Cinematic V12 Observation Hub", () => {
  it("freezes V11 while exposing stable V12 tokens", () => {
    const v11 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V377);
    const v12 = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V400);
    expect(digest(v11)).toBe("8e8ac9dd5d1bd7a8446349211d90ac311b27755c01edf03aa97aab904d30ea9c");
    expect(resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V400)).toBe(v12);
    expect(v12).toMatchObject({ id: "science-cinematic-v12-v400", v11TokensApplied: false, v12TokensApplied: true, defaultApplied: false, localShadowDefaultEligible: false, scienceBufferIsolation: "immutable-ray-payload", cinematicDecoration: "seeded-only" });
    expect(v12.runtimeTokens.hud.observationHubV12).toEqual({ panelOpacity: 0.96, topologyTraceOpacity: 0.68, sourceBayOpacity: 0.74, boundaryLuminance: 0.95, missingPulseOpacity: 0.46, dockingGridOpacity: 0.3, stageRailOpacity: 0.72, detailSeed: 400 });
    expect(v12.runtimeTokens.strongGravityV12).toMatchObject({ scienceExposure: 1, scienceBloom: 0, scienceNoise: 0, diskDetailSeed: 400, provenanceRailOpacity: 0.68 });
    expect(v12.runtimeTokens.strongGravity.scienceDisplayTransform).toBe("linear-no-grade");
  });

  it("keeps V12 local-shadow manual-only and sceneRevision-stable", () => {
    expect(resolveAtlasInitialVisualProfileV299({ build: "formal" })).toMatchObject({ profile: "legacy-v9", v12ObservationHubManualAbAvailable: false, localShadowDefaultApplied: false });
    expect(resolveAtlasInitialVisualProfileV299({ build: "standalone-full" }).v12ObservationHubManualAbAvailable).toBe(false);
    expect(resolveAtlasInitialVisualProfileV299({ build: "vercel-lite" }).v12ObservationHubManualAbAvailable).toBe(false);
    expect(resolveAtlasInitialVisualProfileV299({ build: "local-shadow" })).toMatchObject({ profile: "legacy-v9", v12ObservationHubManualAbAvailable: true, localShadowDefaultApplied: false });
    const before = atlasRuntimeStore.getSnapshot();
    atlasRuntimeStore.setVisualProfile(ATLAS_VISUAL_PROFILE_CANDIDATE_V400);
    const after = atlasRuntimeStore.getSnapshot();
    expect(after.sceneRevision).toBe(before.sceneRevision);
    atlasRuntimeStore.setVisualProfile("legacy-v9");
    const control = readFileSync("app/components/AtlasVisualABControlV261.tsx", "utf8");
    expect(control).toContain("V12 Observation Hub · Shadow");
    expect(control).toContain('data-atlas-v12-observation-hub-default-applied="false"');
    expect(control).toContain("id !== ATLAS_VISUAL_PROFILE_CANDIDATE_V400 || localShadow");
  });
});
