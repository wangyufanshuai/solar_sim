import { describe, expect, it } from "vitest";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V285 } from "./atlasVisualProfileV274";
import { atlasRuntimeStore } from "./atlasRuntimeStore";
import { createAtlasVisualRuntimeTokenAuditV285R1, resolveAtlasInitialVisualProfileV285, resolveAtlasVisualProfileV285 } from "./atlasVisualProfileV285";

describe("v285 Science Cinematic V4 resolver", () => {
  it("keeps formal and Lite on Legacy while allowing only a qualified local shadow", () => {
    expect(resolveAtlasInitialVisualProfileV285({ build: "formal", qualified: true }).profile).toBe("legacy-v9");
    expect(resolveAtlasInitialVisualProfileV285({ build: "vercel-lite", qualified: true }).profile).toBe("legacy-v9");
    expect(resolveAtlasInitialVisualProfileV285({ build: "local-shadow", qualified: false }).profile).toBe("legacy-v9");
    expect(resolveAtlasInitialVisualProfileV285({ build: "local-shadow", qualified: true }).profile).toBe(ATLAS_VISUAL_PROFILE_CANDIDATE_V285);
  });

  it("exposes shared science/cinematic buffer boundaries", () => {
    const profile = resolveAtlasVisualProfileV285(ATLAS_VISUAL_PROFILE_CANDIDATE_V285);
    expect(resolveAtlasVisualProfileV285(ATLAS_VISUAL_PROFILE_CANDIDATE_V285)).toBe(profile);
    expect(resolveAtlasVisualProfileV285("legacy-v9")).toBe(resolveAtlasVisualProfileV285("legacy-v9"));
    expect(profile.v4TokensApplied).toBe(true);
    expect(profile.scienceBufferIsolation).toBe("immutable-ray-payload");
    expect(profile.cinematicDecoration).toBe("seeded-only");
    expect(Object.keys(profile.runtimeTokens)).toEqual(["strongGravity", "launch", "exoplanet", "hud"]);
    expect(Object.keys(createAtlasVisualRuntimeTokenAuditV285R1(ATLAS_VISUAL_PROFILE_CANDIDATE_V285).groups)).toHaveLength(8);
  });

  it("switches the local candidate without changing scene revision", () => {
    const before = atlasRuntimeStore.getSnapshot();
    atlasRuntimeStore.setVisualProfile(ATLAS_VISUAL_PROFILE_CANDIDATE_V285);
    expect(atlasRuntimeStore.getSnapshot().sceneRevision).toBe(before.sceneRevision);
    atlasRuntimeStore.setVisualProfile("legacy-v9");
  });
});
