import { describe, expect, it } from "vitest";
import {
  atlasDeliveryCapabilities,
  atlasPublicAssetUrl,
  getAtlasDeliveryProfile,
} from "./atlasDeliveryProfile";

describe("v171 dual web delivery", () => {
  it("defaults to the full standalone profile", () => {
    expect(getAtlasDeliveryProfile(undefined)).toBe("standalone-full");
    expect(atlasPublicAssetUrl("/textures/planets/earth.jpg", "standalone-full"))
      .toBe("/textures/planets/earth.jpg");
  });

  it("routes the Vercel Lite profile only to its self-contained asset root", () => {
    expect(getAtlasDeliveryProfile("vercel-lite")).toBe("vercel-lite");
    expect(atlasPublicAssetUrl("/textures/planets/earth.jpg", "vercel-lite"))
      .toBe("/atlas-lite/textures/planets/earth.jpg");
    expect(atlasPublicAssetUrl("/atlas-lite/data/catalog-lite-v6/manifest.json", "vercel-lite"))
      .toBe("/atlas-lite/data/catalog-lite-v6/manifest.json");
    expect(atlasDeliveryCapabilities("vercel-lite")).toMatchObject({
      localContentPacks: false,
      millionStarCatalog: false,
      overview: true,
      launchDemo: true,
    });
  });

  it("keeps local-shadow on full local capabilities without promoting formal defaults", () => {
    expect(getAtlasDeliveryProfile("local-shadow")).toBe("local-shadow");
    expect(atlasPublicAssetUrl("/textures/planets/earth.jpg", "local-shadow")).toBe("/textures/planets/earth.jpg");
    expect(atlasDeliveryCapabilities("local-shadow")).toMatchObject({ localContentPacks: true, millionStarCatalog: true });
  });
});
