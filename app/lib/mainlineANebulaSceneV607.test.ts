import { describe, expect, it } from "vitest";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS } from "../data/mainlineANebulaVisualAssetsV607.generated";
import { MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL } from "../data/mainlineANebulaVisualAssetsV607.all.generated";
import { createAtlasNavigatorSummary } from "./atlasNavigator";
import { SKY_TARGET_DISTANCE_SCENE } from "./skyTargetFocus";
import {
  isMainlineANebulaSceneAssetV607,
  mainlineANebulaSceneEnabledV607,
  mainlineANebulaSceneSizeV607,
  MAINLINE_A_NEBULA_MAX_EDGE_V607,
  MAINLINE_A_NEBULA_MAX_SCENE_EDGE_V607,
  resolveMainlineANebulaSceneTargetV607,
  type MainlineANebulaSceneGateV607,
} from "./mainlineANebulaSceneV607";

const gate: MainlineANebulaSceneGateV607 = {
  enabled: true, research: false, closeupSuppressed: false, launchActive: false, kerrActive: false, sceneMode: "atlas",
};

describe("mainline A selected nebula observation plane", () => {
  it("resolves every local candidate JPEG through the catalog selection anchor", () => {
    for (const asset of MAINLINE_A3_NEBULA_VISUAL_ASSETS) {
      const target = resolveMainlineANebulaSceneTargetV607(`nebula:${asset.objectId}`);
      expect(target?.asset).toBe(asset);
      expect(Math.hypot(...target!.position)).toBeCloseTo(SKY_TARGET_DISTANCE_SCENE, 6);
      expect(target?.title.length).toBeGreaterThan(0);
    }
    for (const id of ["", "m42", "nebula:unknown", "galaxy:m31", "stellar-hero:sirius-a", "gaia-dr3:123456789012"]) {
      expect(resolveMainlineANebulaSceneTargetV607(id)).toBeNull();
    }
  });

  it("unmounts image ownership in science, closeup, launch, Kerr and unrelated scenes", () => {
    expect(mainlineANebulaSceneEnabledV607(gate)).toBe(true);
    expect(mainlineANebulaSceneEnabledV607({ ...gate, sceneMode: "inspect" })).toBe(true);
    const suppressed: Partial<MainlineANebulaSceneGateV607>[] = [
      { enabled: false }, { research: true }, { closeupSuppressed: true }, { launchActive: true }, { kerrActive: true },
      { sceneMode: "launch" }, { sceneMode: "kerr" }, { sceneMode: "exoplanet-system" }, { sceneMode: "unknown" },
    ];
    for (const state of suppressed) expect(mainlineANebulaSceneEnabledV607({ ...gate, ...state })).toBe(false);
  });

  it("resolves all twelve canonical assets from real navigation results without candidate admission", () => {
    expect(MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL).toHaveLength(12);
    for (const asset of MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL) {
      const catalogId = `nebula:${asset.objectId}`;
      const item = createAtlasNavigatorSummary({ query: catalogId }).results.find((row) => row.catalogObjectId === catalogId);
      expect(item?.action).toBe("focus-catalog-object");
      const target = resolveMainlineANebulaSceneTargetV607(item!.catalogObjectId!);
      expect(target?.catalogId).toBe(catalogId);
      expect(target?.asset.sha256).toBe(asset.sha256);
      expect(target?.asset.src).toBe(asset.src);
      expect(Math.hypot(...target!.position)).toBeCloseTo(SKY_TARGET_DISTANCE_SCENE, 6);
    }
    for (const catalogId of ["nebula:ic1805", "nebula:ic1848", "nebula:ngc2024", "nebula:ngc281"]) {
      expect(resolveMainlineANebulaSceneTargetV607(catalogId)).toBeNull();
    }
  });

  it("keeps all supported aspect ratios inside the viewport and world bounds", () => {
    for (const asset of MAINLINE_A3_NEBULA_VISUAL_ASSETS_ALL) {
      for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }, { width: 1e12, height: 1e12 }]) {
        const size = mainlineANebulaSceneSizeV607(asset.dimensions, viewport);
        expect(size.width / size.height).toBeCloseTo(asset.dimensions.width / asset.dimensions.height, 8);
        expect(size.width).toBeLessThanOrEqual(viewport.width * 0.62 + 1e-8);
        expect(size.height).toBeLessThanOrEqual(viewport.height * 0.42 + 1e-8);
        expect(Math.max(size.width, size.height)).toBeLessThanOrEqual(MAINLINE_A_NEBULA_MAX_SCENE_EDGE_V607 + 1e-8);
      }
    }
    for (const value of [0, -1, NaN, Infinity]) {
      expect(mainlineANebulaSceneSizeV607({ width: value, height: 100 }, { width: 1000, height: 1000 })).toEqual({ width: 0, height: 0 });
      expect(mainlineANebulaSceneSizeV607({ width: 100, height: 100 }, { width: 1000, height: value })).toEqual({ width: 0, height: 0 });
    }
  });

  it("refuses oversized, uncredited, unverified or nonlocal assets before decoding", () => {
    const asset = MAINLINE_A3_NEBULA_VISUAL_ASSETS[0];
    expect(isMainlineANebulaSceneAssetV607(asset)).toBe(true);
    expect(isMainlineANebulaSceneAssetV607({ ...asset, credit: " " })).toBe(false);
    expect(isMainlineANebulaSceneAssetV607({ ...asset, sourcePage: "https://example.org/forged" })).toBe(false);
    expect(isMainlineANebulaSceneAssetV607({ ...asset, license: "CC0" } as unknown as typeof asset)).toBe(false);
    expect(isMainlineANebulaSceneAssetV607({ ...asset, imageId: "different" })).toBe(false);
    expect(isMainlineANebulaSceneAssetV607({ ...asset, src: "https://example.com/image.jpg" })).toBe(false);
    expect(isMainlineANebulaSceneAssetV607({ ...asset, sha256: "unknown" })).toBe(false);
    expect(isMainlineANebulaSceneAssetV607({ ...asset, byteSize: 9 * 1024 * 1024 })).toBe(false);
    expect(isMainlineANebulaSceneAssetV607({ ...asset, dimensions: { width: MAINLINE_A_NEBULA_MAX_EDGE_V607 + 1, height: 1280 } })).toBe(false);
  });
});
