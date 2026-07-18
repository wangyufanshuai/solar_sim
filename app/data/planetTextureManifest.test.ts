import { existsSync } from "node:fs";
import { join } from "node:path";
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
  it("keeps v49 generated local material assets available with HD fallback intact", () => {
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

    for (const entry of [earth, jupiter, saturn, sun]) {
      for (const url of Object.values(entry)) {
        expect(existsSync(publicPath(url))).toBe(true);
      }
    }

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
