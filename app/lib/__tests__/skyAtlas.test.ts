import { describe, expect, it } from "vitest";
import {
  buildSkyAtlasCatalog,
  clusterSkyAtlasObjects,
  compareSkyAtlasObjects,
  createSkyAtlasCustomRoute,
  defaultSkyAtlasRoute,
  nearestSkyAtlasObject,
  projectSkyAtlasObject,
  rankSkyAtlasObjects,
  searchSkyAtlasObjects,
  skyAtlasObjectToDirection,
  skyAtlasRouteToJson,
  skyAtlasRouteToMarkdown,
} from "../skyAtlas";
import {
  EMPTY_SKY_ATLAS_STORAGE,
  sanitizeSkyAtlasStorage,
  toggleFavorite,
  upsertCustomRoute,
  withRecent,
} from "../skyAtlasStorage";
import {
  INITIAL_SKY_ATLAS_PLAYBACK,
  skyAtlasPlaybackHoldMs,
  skyAtlasPlaybackReducer,
} from "../skyAtlasPlayback";

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

  it("ranks exact names, favorites, and route targets with reasons", () => {
    const orion = catalog.find((object) => object.name.toLowerCase().includes("orion"))!;
    const ranked = rankSkyAtlasObjects(catalog, orion.name, {}, {
      favoriteIds: [orion.id],
      routeObjectIds: [orion.id],
    });
    expect(ranked[0]?.object.id).toBe(orion.id);
    expect(ranked[0]?.reasons).toContain("exact name");
    expect(ranked[0]?.reasons).toContain("favorite");
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

  it("projects and hit-tests atlas map targets deterministically", () => {
    const target = searchSkyAtlasObjects(catalog, "alpha centauri")[0] ?? catalog[0]!;
    const viewport = { width: 420, height: 188 };
    const equatorial = projectSkyAtlasObject(target, "equatorial", viewport);
    const galactic = projectSkyAtlasObject(target, "galactic", viewport);
    expect([equatorial.x, equatorial.y, galactic.x, galactic.y].every(Number.isFinite)).toBe(true);
    expect(nearestSkyAtlasObject(catalog, { x: galactic.x, y: galactic.y }, "galactic", viewport)?.id).toBe(target.id);
  });

  it("clusters projected objects deterministically and preserves selected priority", () => {
    const viewport = { width: 420, height: 188 };
    const selected = catalog.find((object) => object.type === "nebula")!;
    const first = clusterSkyAtlasObjects(catalog, "galactic", viewport, {
      cellSize: 30,
      selectedObjectId: selected.id,
    });
    const second = clusterSkyAtlasObjects(catalog, "galactic", viewport, {
      cellSize: 30,
      selectedObjectId: selected.id,
    });
    expect(first.map((cluster) => cluster.id)).toEqual(second.map((cluster) => cluster.id));
    expect(first.some((cluster) => cluster.representative.id === selected.id)).toBe(true);
  });

  it("compares targets and marks missing fields unavailable", () => {
    const left = catalog.find((object) => object.distancePc != null && object.magnitude != null)!;
    const right = catalog.find((object) => object.type === "constellation")!;
    const comparison = compareSkyAtlasObjects(left, right);
    expect(comparison.fields.find((field) => field.id === "distance")?.right).toBe("unavailable");
    expect(comparison.fields.find((field) => field.id === "coordinates")?.left).toContain("RA");
  });

  it("creates and exports custom routes with provenance", () => {
    const stops = searchSkyAtlasObjects(catalog, "orion").slice(0, 2).map((object) => object.id);
    const route = createSkyAtlasCustomRoute(stops, "Review Route", "2026-01-01T00:00:00.000Z");
    expect(route.name).toBe("Review Route");
    expect(route.stops.map((stop) => stop.objectId)).toEqual(Array.from(new Set(stops)));

    const exported = skyAtlasRouteToJson(route, catalog);
    expect(exported.boundary).toContain("Curated Sky Atlas");
    expect(exported.stops[0]?.credit).toBeTruthy();
    expect(skyAtlasRouteToMarkdown(route, catalog)).toContain("Review Route");
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
        customRoutes: [],
        comparisonIds: [],
        preferredMode: "panel",
      });
  });

  it("tracks favorites and recent targets without duplicates", () => {
    const recent = withRecent(withRecent(EMPTY_SKY_ATLAS_STORAGE, "nebula:m42"), "nebula:m42");
    expect(recent.recent).toEqual(["nebula:m42"]);

    const favorite = toggleFavorite(EMPTY_SKY_ATLAS_STORAGE, "nebula:m42");
    expect(favorite.favorites).toEqual(["nebula:m42"]);
    expect(toggleFavorite(favorite, "nebula:m42").favorites).toEqual([]);
  });

  it("persists custom routes while dropping malformed route data", () => {
    const route = createSkyAtlasCustomRoute(["nebula:m42", "cluster:m45"], "Custom", "2026-01-01T00:00:00.000Z");
    const stored = upsertCustomRoute(EMPTY_SKY_ATLAS_STORAGE, route);
    expect(stored.customRoutes?.[0]?.stops).toHaveLength(2);
    expect(
      sanitizeSkyAtlasStorage({
        schemaVersion: 1,
        customRoutes: [route, { id: "bad", name: "Bad", stops: [{ nope: true }] }],
      }).customRoutes,
    ).toHaveLength(1);
  });
});

describe("sky atlas playback", () => {
  const route = {
    id: "test-route",
    name: "Test",
    stops: [
      { id: "one", objectId: "nebula:m42", holdMs: 4000, note: "one" },
      { id: "two", objectId: "cluster:m45", holdMs: 6000, note: "two" },
    ],
  };

  it("supports play, pause, jump, speed, and wrapped navigation", () => {
    let state = skyAtlasPlaybackReducer(INITIAL_SKY_ATLAS_PLAYBACK, { type: "play", route, startIndex: 1 });
    expect(state.status).toBe("playing");
    expect(state.stopIndex).toBe(1);
    state = skyAtlasPlaybackReducer(state, { type: "pause" });
    expect(state.status).toBe("paused");
    state = skyAtlasPlaybackReducer(state, { type: "next" });
    expect(state.stopIndex).toBe(0);
    state = skyAtlasPlaybackReducer(state, { type: "speed", speed: 2 });
    expect(skyAtlasPlaybackHoldMs(state.route, state.stopIndex, state.speed)).toBe(2000);
    state = skyAtlasPlaybackReducer(state, { type: "previous" });
    expect(state.stopIndex).toBe(1);
  });
});
