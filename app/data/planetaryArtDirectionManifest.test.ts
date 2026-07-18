import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ATLAS_V55_ART_ASSET_BASE,
  ATLAS_V55_ART_ASSET_MANIFEST,
  atlasV55ArtAssetPathFor,
} from "./planetaryArtDirectionManifest";
import { atlasContentPackTestPath } from "../lib/atlasContentPackTestPath";

describe("v55 planetary art-direction asset manifest", () => {
  it("retains the historical v55 manifest without claiming current runtime delivery", () => {
    expect(ATLAS_V55_ART_ASSET_BASE).toBe("/textures/planets/v55");
    expect(ATLAS_V55_ART_ASSET_MANIFEST.map((entry) => entry.id)).toEqual([
      "earth-cloud-alpha",
      "earth-night-mask",
      "gas-band-contrast",
      "saturn-ring-opacity",
      "sky-noise-matte",
      "cinematic-color-lut",
    ]);
    for (const entry of ATLAS_V55_ART_ASSET_MANIFEST) {
      expect(entry.runtimePolicy).toBe("historical-build-source-not-shipped");
      expect(entry.path).toMatch(/^\/textures\/planets\/v55\/.+-v55\.png$/);
      expect(entry.role).toBeTruthy();
    }
  });

  it("keeps the old logical paths while current packs provide v49 and sky assets", () => {
    for (const entry of ATLAS_V55_ART_ASSET_MANIFEST) {
      expect(existsSync(atlasContentPackTestPath(entry.path))).toBe(false);
    }
    expect(atlasV55ArtAssetPathFor("gas-band-contrast")).toBe(
      "/textures/planets/v55/gas-band-contrast-v55.png",
    );
    expect(existsSync(atlasContentPackTestPath("/textures/sky/orbit-atlas-v48-base-4k.jpg"))).toBe(true);
    expect(existsSync(atlasContentPackTestPath("/textures/planets/v49/earth-albedo.jpg"))).toBe(true);
  });
});
