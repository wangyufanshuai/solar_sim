import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  hdTextureManifestEntryForBodyId,
  textureManifestEntryForBodyId,
  v49TextureManifestEntryForBodyId,
} from "./planetTextureManifest";
import { atlasContentPackTestPath } from "../lib/atlasContentPackTestPath";

function publicPath(url: string): string {
  return atlasContentPackTestPath(url);
}

describe("planet texture manifest", () => {
  it("keeps v49 logical identity while the active candidate is KTX2-first", () => {
    const earth = v49TextureManifestEntryForBodyId("earth");
    const jupiter = v49TextureManifestEntryForBodyId("jupiter");
    const saturn = v49TextureManifestEntryForBodyId("saturn");
    const sun = v49TextureManifestEntryForBodyId("sun");

    expect(earth).toEqual(
      expect.objectContaining({
        albedo: "/textures/planets/v49/earth-albedo.jpg",
        clouds: "/textures/planets/v49/earth-clouds.jpg",
        cloudAlpha: "/textures/planets/v49/earth-cloud-alpha.jpg",
        night: "/textures/planets/v49/earth-night.jpg",
        nightMask: "/textures/planets/v49/earth-night-mask.jpg",
        roughness: "/textures/planets/v49/earth-roughness.jpg",
      }),
    );
    expect(jupiter).toEqual(
      expect.objectContaining({
        bandMask: "/textures/planets/v49/jupiter-band-mask.jpg",
        roughness: "/textures/planets/v49/jupiter-roughness.jpg",
      }),
    );
    expect(saturn).toEqual(
      expect.objectContaining({
        bandMask: "/textures/planets/v49/saturn-band-mask.jpg",
        ringColorMap: "/textures/planets/v49/saturn-ring-color.jpg",
        ringAlphaMap: "/textures/planets/v49/saturn-ring-alpha.jpg",
      }),
    );
    expect(sun).toEqual(
      expect.objectContaining({
        albedo: "/textures/planets/v49/sun-albedo.jpg",
        roughness: "/textures/planets/v49/sun-roughness.jpg",
      }),
    );

    const ktx2Manifest = JSON.parse(
      readFileSync(publicPath("/data/planet-textures-v2.json"), "utf8").replace(/^\uFEFF/, ""),
    ) as { assets: Array<{ source: string; ktx2: string }> };
    for (const entry of [earth, jupiter, saturn]) {
      for (const url of Object.values(entry)) {
        const compressed = ktx2Manifest.assets.find((asset) => asset.source === url);
        expect(compressed, `KTX2 candidate missing for ${url}`).toBeDefined();
        expect(existsSync(publicPath(compressed?.ktx2 ?? ""))).toBe(true);
      }
    }
    for (const url of Object.values(sun)) expect(existsSync(publicPath(url))).toBe(false);

    expect(hdTextureManifestEntryForBodyId("earth")).toEqual(
      expect.objectContaining({
        albedo: "/textures/planets/hd/earth.jpg",
        clouds: "/textures/planets/hd/earth-clouds.jpg",
        night: "/textures/planets/hd/earth-night.jpg",
      }),
    );
    expect(textureManifestEntryForBodyId("mars").albedo).toMatch(/\/textures\/planets\//);
  });
});
