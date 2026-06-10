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

export type SkyAtlasUiState = {
  selectedObjectId: string | null;
  routePlaying: boolean;
  routeStopIndex: number;
};

export type SkyAtlasStorageV1 = {
  schemaVersion: 1;
  favorites: string[];
  recent: string[];
};

export type SkyAtlasSearchFilters = {
  types?: SkyAtlasObjectType[];
  maxDistancePc?: number;
  maxMagnitude?: number;
  renderTier?: string;
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

export function skyAtlasObjectToDirection(object: SkyAtlasObject): [number, number, number] {
  return starToDirection(object.raHours, object.decDeg);
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
