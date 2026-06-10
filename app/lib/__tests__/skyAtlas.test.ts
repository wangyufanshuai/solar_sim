import { describe, expect, it } from "vitest";
import {
  buildSkyAtlasCatalog,
  defaultSkyAtlasRoute,
  searchSkyAtlasObjects,
  skyAtlasObjectToDirection,
} from "../skyAtlas";
import {
  EMPTY_SKY_ATLAS_STORAGE,
  sanitizeSkyAtlasStorage,
  toggleFavorite,
  withRecent,
} from "../skyAtlasStorage";

describe("sky atlas catalog", () => {
  const catalog = buildSkyAtlasCatalog();

  it("normalizes the existing sky catalogs into searchable objects", () => {
    expect(catalog.length).toBeGreaterThan(80);
    expect(catalog.some((object) => object.type === "star")).toBe(true);
    expect(catalog.some((object) => object.type === "gaia-star")).toBe(true);
    expect(catalog.some((object) => object.type === "nebula")).toBe(true);
    expect(catalog.some((object) => object.type === "cluster")).toBe(true);
    expect(catalog.some((object) => object.type === "pulsar")).toBe(true);
    expect(catalog.some((object) => object.type === "deep-sky-image" && object.credit)).toBe(true);
  });

  it("searches and filters deterministically", () => {
    const orion = searchSkyAtlasObjects(catalog, "orion");
    expect(orion[0]?.name.toLowerCase()).toContain("orion");

    const nebulae = searchSkyAtlasObjects(catalog, "", { types: ["nebula"] });
    expect(nebulae.length).toBeGreaterThan(3);
    expect(nebulae.every((object) => object.type === "nebula")).toBe(true);

    const nearby = searchSkyAtlasObjects(catalog, "", { maxDistancePc: 5 });
    expect(nearby.every((object) => object.distancePc != null && object.distancePc <= 5)).toBe(true);
  });

  it("builds a non-empty route with valid stops", () => {
    const route = defaultSkyAtlasRoute(catalog);
    expect(route.id).toBe("deep-sky-flight-route");
    expect(route.stops.length).toBeGreaterThanOrEqual(6);
    for (const stop of route.stops) {
      expect(catalog.find((object) => object.id === stop.objectId)).toBeTruthy();
      expect(stop.holdMs).toBeGreaterThan(0);
    }
  });

  it("converts targets to finite unit directions", () => {
    const target = searchSkyAtlasObjects(catalog, "alpha centauri")[0] ?? catalog[0]!;
    const direction = skyAtlasObjectToDirection(target);
    expect(direction.every(Number.isFinite)).toBe(true);
    expect(Math.hypot(...direction)).toBeCloseTo(1, 5);
  });
});

describe("sky atlas storage", () => {
  it("sanitizes bad persisted data", () => {
    expect(sanitizeSkyAtlasStorage(null)).toEqual(EMPTY_SKY_ATLAS_STORAGE);
    expect(
      sanitizeSkyAtlasStorage({
        schemaVersion: 9,
        favorites: ["nebula:m42", 42],
        recent: [false, "star:alpha-centauri"],
      }),
    ).toEqual({
      schemaVersion: 1,
      favorites: ["nebula:m42"],
      recent: ["star:alpha-centauri"],
    });
  });

  it("tracks favorites and recent targets without duplicates", () => {
    const recent = withRecent(withRecent(EMPTY_SKY_ATLAS_STORAGE, "nebula:m42"), "nebula:m42");
    expect(recent.recent).toEqual(["nebula:m42"]);

    const favorite = toggleFavorite(EMPTY_SKY_ATLAS_STORAGE, "nebula:m42");
    expect(favorite.favorites).toEqual(["nebula:m42"]);
    expect(toggleFavorite(favorite, "nebula:m42").favorites).toEqual([]);
  });
});
