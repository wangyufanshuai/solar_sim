import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V261, ATLAS_VISUAL_PROFILE_LEGACY_V261 } from "./atlasVisualProfileV261";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V269 } from "./atlasVisualProfileV269";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V274, ATLAS_VISUAL_PROFILE_CANDIDATE_V285, resolveAtlasVisualProfileV274 } from "./atlasVisualProfileV274";
import { resolveAtlasVisualProfileV285 } from "./atlasVisualProfileV285";
import { ATLAS_VISUAL_PROFILE_CANDIDATE_V300, resolveAtlasVisualProfileV299 } from "./atlasVisualProfileV299";
import { resolveAtlasVisualShellPropsV285R1 } from "./atlasVisualShellV285R1";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("v285.1 visual runtime token audit", () => {
  it("preserves every prior renderer field", () => {
    for (const id of [ATLAS_VISUAL_PROFILE_LEGACY_V261, ATLAS_VISUAL_PROFILE_CANDIDATE_V261, ATLAS_VISUAL_PROFILE_CANDIDATE_V269, ATLAS_VISUAL_PROFILE_CANDIDATE_V274] as const) {
      const previous = resolveAtlasVisualProfileV274(id);
      const next = resolveAtlasVisualProfileV285(id);
      for (const key of Object.keys(previous) as (keyof typeof previous)[]) expect(next[key]).toEqual(previous[key]);
      expect(next.v4TokensApplied).toBe(false);
    }
  });

  it("has a concrete runtime consumer for all eight V4 groups", () => {
    const consumers = {
      sky: ["app/components/GalaxyEnvironmentSphere.tsx", "groups.sky"],
      solar: ["app/components/Planet.tsx", "groups.solar"],
      catalog: ["app/components/GaiaStarField.tsx", "groups.catalog"],
      postFx: ["app/components/UniversePmndrsPostProcessing.tsx", "groups.postFx"],
      strongGravity: ["app/components/KerrBlackHole.tsx", "runtimeTokens.strongGravity"],
      launch: ["app/components/LaunchSceneView.tsx", "runtimeTokens.launch"],
      exoplanet: ["app/components/ExoplanetSystemScene.tsx", "runtimeTokens.exoplanet"],
      hud: ["app/components/AtlasRuntimeWorkbenchSurface.tsx", "resolveAtlasVisualShellPropsV285R1"],
    } as const;
    for (const [path, token] of Object.values(consumers)) expect(read(path)).toContain(token);
    expect(resolveAtlasVisualShellPropsV285R1(ATLAS_VISUAL_PROFILE_CANDIDATE_V285)["data-atlas-v4-runtime-token-groups"]?.split(" ")).toHaveLength(8);
  });

  it("keeps V4 hidden from Lite and available only as a local A/B candidate", () => {
    const source = read("app/components/AtlasVisualABControlV261.tsx");
    expect(source).toContain('deliveryProfile !== "vercel-lite"');
    expect(source).toContain("V4 Shadow");
    expect(source).toContain("data-atlas-v4-ab-visible");
  });

  it("routes all eight V6 groups through concrete runtime consumers", () => {
    const shell = resolveAtlasVisualShellPropsV285R1(ATLAS_VISUAL_PROFILE_CANDIDATE_V300);
    const profile = resolveAtlasVisualProfileV299(ATLAS_VISUAL_PROFILE_CANDIDATE_V300);
    expect(shell["data-atlas-v6-runtime-token-groups"]?.split(" ")).toHaveLength(8);
    expect(shell["data-atlas-v6-runtime-profile"]).toBe(ATLAS_VISUAL_PROFILE_CANDIDATE_V300);
    expect(shell.style?.["--atlas-v4-measurement" as keyof typeof shell.style]).toBe(profile.runtimeTokens.hud.scienceMeasurementColor);
    expect(read("app/lib/kerrStrongGravityVisualV305.ts")).toContain("runtimeTokens.strongGravityV6");
    expect(read("app/components/KerrStrongGravityRendererV299.tsx")).toContain("resolveKerrStrongGravityVisualContractV305");
    expect(read("app/components/useLaunchSceneResources.ts")).toContain("runtimeTokens.launch.detailSeed");
    expect(read("app/components/ExoplanetSystemScene.tsx")).toContain("runtimeTokens.exoplanet.temperatureColorMix");
    expect(read("app/components/ExoplanetSystemScene.tsx")).toContain("runtimeTokens.exoplanet.orbitOpacity");
    expect(read("app/components/AtlasVisualABControlV261.tsx")).toContain("data-atlas-v6-ab-visible");
  });
});
