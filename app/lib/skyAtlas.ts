import combinedDeepSkyManifest from "../../public/textures/deep-sky/combined-resource-manifest.json";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { MAJOR_GAIA_STARS } from "../data/majorGaiaStars";
import { NEARBY_STARS, starToDirection } from "../data/nearbyStars";
import { NEBULAE } from "../data/nebulaCatalog";
import { PULSARS } from "../data/pulsarCatalog";
import { STAR_CLUSTERS } from "../data/starClusterCatalog";
import { galacticToEquatorial } from "./galacticToEquatorial";

export type SkyAtlasObjectType =
  | "star"
  | "gaia-star"
  | "constellation"
  | "nebula"
  | "cluster"
  | "pulsar"
  | "deep-sky-image";

export type SkyAtlasObject = {
  id: string;
  sourceId: string;
  type: SkyAtlasObjectType;
  name: string;
  subtitle?: string;
  catalogId?: string;
  raHours: number;
  decDeg: number;
  galacticLonDeg?: number;
  galacticLatDeg?: number;
  distancePc?: number;
  magnitude?: number;
  color: string;
  previewUrl?: string;
  credit?: string;
  renderTier?: "core" | "deferred" | "highQuality" | string;
  source: string;
  searchText: string;
};

export type SkyAtlasProjection = "equatorial" | "galactic";
export type SkyAtlasMode = "panel" | "immersive";

export type SkyAtlasMapState = {
  projection: SkyAtlasProjection;
  selectedObjectId: string | null;
};

export type SkyAtlasProjectedObject = {
  object: SkyAtlasObject;
  x: number;
  y: number;
  visible: boolean;
};

export type SkyAtlasMapCluster = {
  id: string;
  x: number;
  y: number;
  representative: SkyAtlasObject;
  members: SkyAtlasObject[];
};

export type SkyAtlasSearchScore = {
  object: SkyAtlasObject;
  score: number;
  reasons: string[];
};

export type SkyAtlasRouteStop = {
  id: string;
  objectId: string;
  holdMs: number;
  note: string;
};

export type SkyAtlasRoute = {
  id: string;
  name: string;
  stops: SkyAtlasRouteStop[];
};

export type SkyAtlasCustomRoute = SkyAtlasRoute & {
  createdAt: string;
  updatedAt: string;
};

export type SkyAtlasRouteExport = {
  schemaVersion: 1;
  generatedAt: string;
  route: SkyAtlasRoute;
  stops: Array<{
    index: number;
    objectId: string;
    name: string;
    type: SkyAtlasObjectType;
    raHours: number;
    decDeg: number;
    galacticLonDeg?: number;
    galacticLatDeg?: number;
    distancePc?: number;
    magnitude?: number;
    credit: string;
    source: string;
    note: string;
  }>;
  boundary: string;
};

export type SkyAtlasTargetNarrative = {
  headline: string;
  whyVisit: string;
  sourceLine: string;
};

export type SkyAtlasCoverMetadata = {
  targetId: string | null;
  targetName: string | null;
  routeId: string | null;
  routeStopIndex: number | null;
  projection: SkyAtlasProjection;
  postProfile: string;
  timestamp: string;
};

export type SkyAtlasUiState = {
  selectedObjectId: string | null;
  routePlaying: boolean;
  routeStopIndex: number;
};

export type SkyAtlasPlaybackStatus = "idle" | "playing" | "paused";

export type SkyAtlasPlaybackState = {
  status: SkyAtlasPlaybackStatus;
  route: SkyAtlasRoute | null;
  stopIndex: number;
  speed: 0.5 | 1 | 2;
  progress: number;
};

export type SkyAtlasComparison = {
  left: SkyAtlasObject;
  right: SkyAtlasObject;
  fields: Array<{
    id: "type" | "distance" | "magnitude" | "coordinates" | "source";
    label: string;
    left: string;
    right: string;
  }>;
};

export type SkyAtlasStorageV1 = {
  schemaVersion: 1;
  favorites: string[];
  recent: string[];
  customRoutes?: SkyAtlasCustomRoute[];
  comparisonIds?: string[];
  preferredMode?: SkyAtlasMode;
};

export type SkyAtlasSearchFilters = {
  types?: SkyAtlasObjectType[];
  maxDistancePc?: number;
  maxMagnitude?: number;
  renderTier?: string;
};

export type SkyAtlasSearchContext = {
  favoriteIds?: string[];
  routeObjectIds?: string[];
};

type DeepSkyManifestItem = {
  id: string;
  name: string;
  previewUrl?: string;
  qualityUrl?: string;
  sourceUrl?: string | null;
  credit?: string;
  galactic?: { lonDeg?: number; latDeg?: number };
  renderTier?: string;
};

function objectId(type: SkyAtlasObjectType, id: string) {
  return `${type}:${id}`;
}

function normalizeSearch(...parts: Array<string | number | undefined | null>) {
  return parts.filter((part) => part != null).join(" ").toLowerCase();
}

function normalizeDeg(value: number) {
  return ((value % 360) + 360) % 360;
}

function routeHash(parts: string[]) {
  let hash = 2166136261;
  for (const part of parts.join("|")) {
    hash ^= part.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function galacticObject(
  type: SkyAtlasObjectType,
  sourceId: string,
  name: string,
  subtitle: string | undefined,
  galLonDeg: number,
  galLatDeg: number,
  distancePc: number | undefined,
  magnitude: number | undefined,
  color: string,
  source: string,
  extra?: Partial<SkyAtlasObject>,
): SkyAtlasObject {
  const [raHours, decDeg] = galacticToEquatorial(galLonDeg, galLatDeg);
  return {
    id: objectId(type, sourceId),
    sourceId,
    type,
    name,
    subtitle,
    catalogId: extra?.catalogId,
    raHours,
    decDeg,
    galacticLonDeg: galLonDeg,
    galacticLatDeg: galLatDeg,
    distancePc,
    magnitude,
    color,
    previewUrl: extra?.previewUrl,
    credit: extra?.credit,
    renderTier: extra?.renderTier,
    source,
    searchText: normalizeSearch(name, subtitle, sourceId, extra?.catalogId, source, type),
  };
}

function constellationCentroid(waypoints: Array<[number, number]>) {
  if (!waypoints.length) return [0, 0] as [number, number];
  return waypoints.reduce(
    ([ra, dec], [nextRa, nextDec]) => [ra + nextRa / waypoints.length, dec + nextDec / waypoints.length],
    [0, 0] as [number, number],
  );
}

function deepSkyManifestItems(): DeepSkyManifestItem[] {
  const manifest = combinedDeepSkyManifest as { deepSky?: DeepSkyManifestItem[] };
  return Array.isArray(manifest.deepSky) ? manifest.deepSky : [];
}

export function buildSkyAtlasCatalog(): SkyAtlasObject[] {
  const byId = new Map<string, SkyAtlasObject>();
  const add = (object: SkyAtlasObject) => {
    if (!Number.isFinite(object.raHours) || !Number.isFinite(object.decDeg)) return;
    if (!byId.has(object.id)) byId.set(object.id, object);
  };

  for (const star of NEARBY_STARS) {
    add({
      id: objectId("star", star.id),
      sourceId: star.id,
      type: "star",
      name: star.name,
      subtitle: star.spectralType,
      raHours: star.raHours,
      decDeg: star.decDeg,
      distancePc: star.distancePc,
      magnitude: star.magV,
      color: star.color,
      source: "Nearby star catalog",
      searchText: normalizeSearch(star.name, star.id, star.spectralType, "nearby star"),
    });
  }

  for (const star of MAJOR_GAIA_STARS) {
    add({
      id: objectId("gaia-star", star.id),
      sourceId: star.id,
      type: "gaia-star",
      name: star.name,
      subtitle: `Gaia DR3 ${star.gaiaDr3SourceId}`,
      catalogId: star.gaiaDr3SourceId,
      raHours: star.raDeg / 15,
      decDeg: star.decDeg,
      distancePc: star.gaiaParallaxMas && star.gaiaParallaxMas > 0 ? 1000 / star.gaiaParallaxMas : undefined,
      magnitude: star.visualMag,
      color: "#dbeafe",
      source: "Gaia DR3 bright-star cross-match",
      searchText: normalizeSearch(star.name, star.id, star.gaiaDr3SourceId, "gaia"),
    });
  }

  for (const item of CONSTELLATION_LINES) {
    const [raHours, decDeg] = constellationCentroid(item.waypoints);
    add({
      id: objectId("constellation", item.iauCode.toLowerCase()),
      sourceId: item.iauCode.toLowerCase(),
      type: "constellation",
      name: item.name,
      subtitle: item.nameCn,
      catalogId: item.iauCode,
      raHours: raHours / 15,
      decDeg,
      color: "#6fa8dc",
      source: "IAU constellation guide layer",
      searchText: normalizeSearch(item.name, item.nameCn, item.iauCode, "constellation"),
    });
  }

  for (const nebula of NEBULAE) {
    add(galacticObject(
      "nebula",
      nebula.id,
      nebula.commonName,
      nebula.subtitleCn,
      nebula.galLonDeg,
      nebula.galLatDeg,
      nebula.distancePc,
      undefined,
      nebula.color,
      "Curated nebula catalog",
      { catalogId: nebula.catalogName },
    ));
  }

  for (const cluster of STAR_CLUSTERS) {
    add(galacticObject(
      "cluster",
      cluster.id,
      cluster.commonName,
      cluster.subtitleCn,
      cluster.galLonDeg,
      cluster.galLatDeg,
      cluster.distancePc,
      cluster.magV,
      cluster.color,
      "Curated star-cluster catalog",
      { catalogId: cluster.catalogName },
    ));
  }

  for (const pulsar of PULSARS) {
    add(galacticObject(
      "pulsar",
      pulsar.id,
      pulsar.commonName,
      pulsar.subtitleCn,
      pulsar.galLonDeg,
      pulsar.galLatDeg,
      pulsar.distancePc,
      undefined,
      pulsar.color,
      "Curated pulsar catalog",
      { catalogId: pulsar.name },
    ));
  }

  for (const item of deepSkyManifestItems()) {
    const lon = item.galactic?.lonDeg;
    const lat = item.galactic?.latDeg;
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
    add(galacticObject(
      "deep-sky-image",
      item.id,
      item.name,
      item.renderTier,
      lon!,
      lat!,
      undefined,
      undefined,
      "#9bdcff",
      "NASA/existing deep-sky image manifest",
      {
        catalogId: item.id,
        previewUrl: item.previewUrl ?? item.qualityUrl,
        credit: item.credit,
        renderTier: item.renderTier,
      },
    ));
  }

  return Array.from(byId.values()).sort((a, b) => {
    const typeOrder = a.type.localeCompare(b.type);
    return typeOrder || a.name.localeCompare(b.name);
  });
}

export function searchSkyAtlasObjects(
  catalog: SkyAtlasObject[],
  query: string,
  filters: SkyAtlasSearchFilters = {},
): SkyAtlasObject[] {
  const q = query.trim().toLowerCase();
  const types = filters.types?.length ? new Set(filters.types) : null;
  return catalog
    .filter((object) => {
      if (types && !types.has(object.type)) return false;
      if (q && !object.searchText.includes(q)) return false;
      if (filters.maxDistancePc != null && (object.distancePc == null || object.distancePc > filters.maxDistancePc)) return false;
      if (filters.maxMagnitude != null && (object.magnitude == null || object.magnitude > filters.maxMagnitude)) return false;
      if (filters.renderTier && object.renderTier !== filters.renderTier) return false;
      return true;
    })
    .sort((a, b) =>
      (a.distancePc ?? Number.POSITIVE_INFINITY) - (b.distancePc ?? Number.POSITIVE_INFINITY) ||
      (a.magnitude ?? Number.POSITIVE_INFINITY) - (b.magnitude ?? Number.POSITIVE_INFINITY) ||
      a.name.localeCompare(b.name),
    );
}

export function rankSkyAtlasObjects(
  catalog: SkyAtlasObject[],
  query: string,
  filters: SkyAtlasSearchFilters = {},
  context: SkyAtlasSearchContext = {},
): SkyAtlasSearchScore[] {
  const q = query.trim().toLowerCase();
  const favorites = new Set(context.favoriteIds ?? []);
  const routeIds = new Set(context.routeObjectIds ?? []);
  return searchSkyAtlasObjects(catalog, "", filters)
    .map((object) => {
      const name = object.name.toLowerCase();
      const catalogId = object.catalogId?.toLowerCase() ?? "";
      const sourceId = object.sourceId.toLowerCase();
      const reasons: string[] = [];
      let score = 0;
      if (q) {
        if (name === q) {
          score += 1000;
          reasons.push("exact name");
        } else if (name.startsWith(q)) {
          score += 720;
          reasons.push("name prefix");
        } else if (name.includes(q)) {
          score += 460;
          reasons.push("name match");
        }
        if (catalogId === q || sourceId === q) {
          score += 640;
          reasons.push("catalog id");
        } else if (catalogId.includes(q) || sourceId.includes(q)) {
          score += 300;
          reasons.push("catalog match");
        }
        if (object.type.includes(q)) {
          score += 180;
          reasons.push("type match");
        }
        if (!object.searchText.includes(q) && score === 0) return null;
      } else {
        reasons.push("discover");
      }
      if (favorites.has(object.id)) {
        score += 130;
        reasons.push("favorite");
      }
      if (routeIds.has(object.id)) {
        score += 110;
        reasons.push("current route");
      }
      if (object.magnitude != null) {
        score += Math.max(0, 60 - Math.max(-2, object.magnitude) * 7);
        reasons.push("brightness");
      }
      if (object.distancePc != null) {
        score += Math.max(0, 55 - Math.log10(Math.max(1, object.distancePc)) * 18);
        reasons.push("distance");
      }
      return { object, score, reasons: Array.from(new Set(reasons)).slice(0, 3) };
    })
    .filter(Boolean)
    .sort((a, b) =>
      b!.score - a!.score ||
      (a!.object.magnitude ?? Number.POSITIVE_INFINITY) - (b!.object.magnitude ?? Number.POSITIVE_INFINITY) ||
      a!.object.name.localeCompare(b!.object.name),
    ) as SkyAtlasSearchScore[];
}

export function skyAtlasObjectToDirection(object: SkyAtlasObject): [number, number, number] {
  return starToDirection(object.raHours, object.decDeg);
}

export function projectSkyAtlasObject(
  object: SkyAtlasObject,
  projection: SkyAtlasProjection,
  viewport: { width: number; height: number },
): SkyAtlasProjectedObject {
  const width = Math.max(1, viewport.width);
  const height = Math.max(1, viewport.height);
  const lon = projection === "galactic"
    ? normalizeDeg(object.galacticLonDeg ?? object.raHours * 15)
    : normalizeDeg(object.raHours * 15);
  const lat = projection === "galactic"
    ? Math.max(-90, Math.min(90, object.galacticLatDeg ?? object.decDeg))
    : Math.max(-90, Math.min(90, object.decDeg));
  const x = (lon / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { object, x, y, visible: Number.isFinite(x) && Number.isFinite(y) };
}

export function nearestSkyAtlasObject(
  catalog: SkyAtlasObject[],
  projectedPoint: { x: number; y: number },
  projection: SkyAtlasProjection,
  viewport: { width: number; height: number },
  maxDistancePx = 22,
): SkyAtlasObject | null {
  return catalog
    .map((object) => {
      const projected = projectSkyAtlasObject(object, projection, viewport);
      const dx = projected.x - projectedPoint.x;
      const dy = projected.y - projectedPoint.y;
      return { object, distance: Math.hypot(dx, dy) };
    })
    .filter((item) => item.distance <= maxDistancePx)
    .sort((a, b) =>
      a.distance - b.distance ||
      (a.object.magnitude ?? Number.POSITIVE_INFINITY) - (b.object.magnitude ?? Number.POSITIVE_INFINITY) ||
      a.object.name.localeCompare(b.object.name),
    )[0]?.object ?? null;
}

export function clusterSkyAtlasObjects(
  catalog: SkyAtlasObject[],
  projection: SkyAtlasProjection,
  viewport: { width: number; height: number },
  options: {
    cellSize?: number;
    selectedObjectId?: string | null;
    favoriteIds?: string[];
    routeObjectIds?: string[];
    maxClusters?: number;
  } = {},
): SkyAtlasMapCluster[] {
  const cellSize = Math.max(12, options.cellSize ?? 26);
  const favorites = new Set(options.favoriteIds ?? []);
  const routeIds = new Set(options.routeObjectIds ?? []);
  const selectedId = options.selectedObjectId ?? null;
  const priority = (object: SkyAtlasObject) =>
    (object.id === selectedId ? 10000 : 0) +
    (routeIds.has(object.id) ? 5000 : 0) +
    (favorites.has(object.id) ? 2500 : 0) +
    Math.max(0, 100 - (object.magnitude ?? 10) * 10);
  const cells = new Map<string, SkyAtlasProjectedObject[]>();
  for (const object of catalog) {
    const projected = projectSkyAtlasObject(object, projection, viewport);
    if (!projected.visible) continue;
    const key = `${Math.floor(projected.x / cellSize)}:${Math.floor(projected.y / cellSize)}`;
    const bucket = cells.get(key) ?? [];
    bucket.push(projected);
    cells.set(key, bucket);
  }
  return Array.from(cells.entries())
    .map(([key, bucket]) => {
      const sorted = [...bucket].sort((a, b) =>
        priority(b.object) - priority(a.object) ||
        (a.object.magnitude ?? Number.POSITIVE_INFINITY) - (b.object.magnitude ?? Number.POSITIVE_INFINITY) ||
        a.object.id.localeCompare(b.object.id),
      );
      const representative = sorted[0]!;
      return {
        id: `atlas-cluster-${projection}-${key}`,
        x: representative.x,
        y: representative.y,
        representative: representative.object,
        members: sorted.map((item) => item.object),
      };
    })
    .sort((a, b) =>
      priority(b.representative) - priority(a.representative) ||
      a.id.localeCompare(b.id),
    )
    .slice(0, options.maxClusters ?? 160);
}

function findObject(catalog: SkyAtlasObject[], type: SkyAtlasObjectType, sourceId: string, fallbackName: string) {
  return (
    catalog.find((object) => object.id === objectId(type, sourceId)) ??
    catalog.find((object) => object.name.toLowerCase().includes(fallbackName.toLowerCase()))
  );
}

export function defaultSkyAtlasRoute(catalog: SkyAtlasObject[]): SkyAtlasRoute {
  const specs: Array<[SkyAtlasObjectType, string, string, string]> = [
    ["nebula", "m42", "Orion", "Start in the Orion molecular cloud complex"],
    ["cluster", "m45", "Pleiades", "Bright nearby open cluster"],
    ["nebula", "m1", "Crab", "Supernova remnant and pulsar field"],
    ["nebula", "carina", "Carina", "Massive southern star-forming region"],
    ["nebula", "m57", "Ring Nebula", "Planetary nebula close target"],
    ["pulsar", "b0833-45", "Vela", "Nearby bright pulsar marker"],
    ["star", "alpha-centauri", "Alpha Centauri", "Nearest bright stellar system"],
    ["gaia-star", "vega", "Vega", "Bright Gaia cross-match endpoint"],
  ];
  const stops = specs
    .map(([type, sourceId, fallback, note], index) => {
      const object = findObject(catalog, type, sourceId, fallback);
      if (!object) return null;
      return { id: `atlas-stop-${index + 1}`, objectId: object.id, holdMs: 7500, note };
    })
    .filter(Boolean) as SkyAtlasRouteStop[];
  return {
    id: "deep-sky-flight-route",
    name: "Deep Sky Flight Route",
    stops: stops.length ? stops : catalog.slice(0, 8).map((object, index) => ({
      id: `atlas-stop-${index + 1}`,
      objectId: object.id,
      holdMs: 7500,
      note: "Fallback atlas target",
    })),
  };
}

export function recommendedSkyAtlasObjects(catalog: SkyAtlasObject[]): SkyAtlasObject[] {
  const route = defaultSkyAtlasRoute(catalog);
  return route.stops
    .map((stop) => catalog.find((object) => object.id === stop.objectId))
    .filter(Boolean) as SkyAtlasObject[];
}

export function createSkyAtlasCustomRoute(
  stops: Array<string | SkyAtlasObject | SkyAtlasRouteStop>,
  name = "Custom Atlas Route",
  now = new Date().toISOString(),
): SkyAtlasCustomRoute {
  const normalizedStops = stops
    .map((stop, index) => {
      const objectId = typeof stop === "string"
        ? stop
        : "objectId" in stop
          ? stop.objectId
          : stop.id;
      return {
        id: `custom-stop-${index + 1}-${routeHash([objectId, String(index)]).slice(0, 4)}`,
        objectId,
        holdMs: 7500,
        note: "Custom Sky Atlas stop",
      };
    })
    .filter((stop, index, array) => stop.objectId && array.findIndex((item) => item.objectId === stop.objectId) === index);
  return {
    id: `custom-atlas-route-${routeHash(normalizedStops.map((stop) => stop.objectId))}`,
    name,
    createdAt: now,
    updatedAt: now,
    stops: normalizedStops,
  };
}

export const SKY_ATLAS_ROUTE_BOUNDARY =
  "Curated Sky Atlas visual navigation export. Coordinates and distances are for Solar Sim exploration, not certified astrometry.";

export function skyAtlasRouteToJson(route: SkyAtlasRoute, catalog: SkyAtlasObject[]): SkyAtlasRouteExport {
  const byId = new Map(catalog.map((object) => [object.id, object]));
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    route,
    stops: route.stops
      .map((stop, index) => {
        const object = byId.get(stop.objectId);
        if (!object) return null;
        return {
          index: index + 1,
          objectId: object.id,
          name: object.name,
          type: object.type,
          raHours: object.raHours,
          decDeg: object.decDeg,
          galacticLonDeg: object.galacticLonDeg,
          galacticLatDeg: object.galacticLatDeg,
          distancePc: object.distancePc,
          magnitude: object.magnitude,
          credit: object.credit ?? object.source,
          source: object.source,
          note: stop.note,
        };
      })
      .filter(Boolean) as SkyAtlasRouteExport["stops"],
    boundary: SKY_ATLAS_ROUTE_BOUNDARY,
  };
}

export function skyAtlasRouteToMarkdown(route: SkyAtlasRoute, catalog: SkyAtlasObject[]) {
  const exported = skyAtlasRouteToJson(route, catalog);
  return [
    `# ${exported.route.name}`,
    "",
    exported.boundary,
    "",
    ...exported.stops.map((stop) =>
      `${stop.index}. ${stop.name} (${stop.objectId}) - RA ${stop.raHours.toFixed(2)}h / Dec ${stop.decDeg.toFixed(1)} deg - ${stop.credit}`,
    ),
    "",
  ].join("\n");
}

export function skyAtlasTargetNarrative(object: SkyAtlasObject): SkyAtlasTargetNarrative {
  const typeLine = object.type.replace(/-/g, " ");
  const headline = `${object.name} / ${typeLine}`;
  const whyVisit =
    object.type === "deep-sky-image"
      ? "A real image-backed deep-sky stop that gives the flight route a strong visual anchor."
      : object.type === "nebula"
        ? "A luminous gas-and-dust landmark that makes galactic structure easier to read from the cockpit view."
        : object.type === "cluster"
          ? "A dense stellar waypoint for comparing nearby and distant star populations."
          : object.type === "pulsar"
            ? "A compact high-energy marker that adds scientific contrast to the visual route."
            : object.type === "constellation"
              ? "A familiar sky pattern that helps orient the curated atlas."
              : "A stellar waypoint for scale, distance, and color comparison.";
  return {
    headline,
    whyVisit,
    sourceLine: `${object.credit ?? object.source} / ${object.renderTier ?? object.catalogId ?? "catalog"}`,
  };
}

function comparisonValue(value: string | number | undefined, formatter?: (number: number) => string) {
  if (value == null || value === "" || (typeof value === "number" && !Number.isFinite(value))) return "unavailable";
  return typeof value === "number" && formatter ? formatter(value) : String(value);
}

export function compareSkyAtlasObjects(left: SkyAtlasObject, right: SkyAtlasObject): SkyAtlasComparison {
  const coordinates = (object: SkyAtlasObject) => `RA ${object.raHours.toFixed(2)}h / Dec ${object.decDeg.toFixed(1)} deg`;
  return {
    left,
    right,
    fields: [
      { id: "type", label: "Type", left: left.type, right: right.type },
      {
        id: "distance",
        label: "Distance",
        left: comparisonValue(left.distancePc, (value) => `${value.toFixed(value < 10 ? 2 : 0)} pc`),
        right: comparisonValue(right.distancePc, (value) => `${value.toFixed(value < 10 ? 2 : 0)} pc`),
      },
      {
        id: "magnitude",
        label: "Magnitude",
        left: comparisonValue(left.magnitude, (value) => value.toFixed(2)),
        right: comparisonValue(right.magnitude, (value) => value.toFixed(2)),
      },
      { id: "coordinates", label: "Coordinates", left: coordinates(left), right: coordinates(right) },
      { id: "source", label: "Source", left: left.credit ?? left.source, right: right.credit ?? right.source },
    ],
  };
}
