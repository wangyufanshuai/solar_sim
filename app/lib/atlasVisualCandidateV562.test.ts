import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { atlasContentPackTestPath } from "./atlasContentPackTestPath";
import { ATLAS_VISUAL_CANDIDATE_ASSETS_V562, loadAtlasVisualCandidateManifestV562, visualCandidateAssetPathV562 } from "./atlasVisualCandidateV562";
import { ATLAS_VISUAL_RUNTIME_SKY_V562 } from "./atlasVisualRuntimeCandidateV562";
import { planetAlbedoUrlIfExists } from "./planetAlbedoUrl";
import { planetDiffuseUrlForBody } from "../data/planetTextureManifest";

describe("v562 KTX2-first visual candidate", () => {
  it("loads a content-addressed candidate without claiming legacy authority", () => {
    const manifest = loadAtlasVisualCandidateManifestV562();
    expect(manifest.visualAuthority).toBe("candidate-only-not-v263-not-legacy-v9");
    expect(manifest.assets).toHaveLength(ATLAS_VISUAL_CANDIDATE_ASSETS_V562.length);
    expect(manifest.assets.filter((asset) => asset.format === "ktx2").length).toBeGreaterThan(0);
  });

  it("resolves only existing KTX2/2K source assets", () => {
    const manifest = loadAtlasVisualCandidateManifestV562();
    for (const asset of manifest.assets) {
      expect(existsSync(resolve(process.cwd(), asset.sourcePath)), asset.id).toBe(true);
      expect(existsSync(atlasContentPackTestPath(asset.path)), asset.id).toBe(true);
      expect(readFileSync(resolve(process.cwd(), asset.sourcePath)).byteLength).toBe(asset.bytes);
      expect(visualCandidateAssetPathV562(asset.id)).toBe(asset.path);
    }
  });

  it("rejects a candidate promotion mutation", () => {
    const manifest = loadAtlasVisualCandidateManifestV562();
    expect(manifest.visualAuthority).not.toBe("v263");
  });

  it("drives the active sky only from candidate-admitted sources", () => {
    const admitted = new Set(ATLAS_VISUAL_CANDIDATE_ASSETS_V562.map((asset) => asset.path));
    expect(admitted.has(ATLAS_VISUAL_RUNTIME_SKY_V562.desktopBase)).toBe(true);
    expect(admitted.has(ATLAS_VISUAL_RUNTIME_SKY_V562.mobileBase)).toBe(true);
    expect(admitted.has(ATLAS_VISUAL_RUNTIME_SKY_V562.desktopStars)).toBe(true);
    expect(admitted.has(ATLAS_VISUAL_RUNTIME_SKY_V562.mobileStars)).toBe(true);
    expect(admitted.has(ATLAS_VISUAL_RUNTIME_SKY_V562.dustMask)).toBe(true);
    expect(Object.values(ATLAS_VISUAL_RUNTIME_SKY_V562)).not.toContain(
      "/textures/sky/orbit-atlas-v9-base-8k.jpg",
    );
  });

  it("does not request the absent historical Moon JPEG in production fallback", () => {
    expect(planetAlbedoUrlIfExists("moon")).toBeUndefined();
    expect(planetDiffuseUrlForBody("moon")).toBeUndefined();
  });
});
