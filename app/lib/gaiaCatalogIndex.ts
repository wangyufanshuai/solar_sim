import { AU_TO_SCENE } from "../data/planetsJ2000";
import {
  gaiaOverlayColorToRgb,
  gaiaStarToGalacticPc,
  rankGaiaStarsForOverlay,
  type GaiaStarRecord,
} from "../data/gaiaStarCatalog";
import {
  CELESTIAL_CATALOG_ENTRIES,
  celestialDisplayNameZh,
  celestialSearchAliasesZh,
} from "./celestialCatalog";
import type { CelestialCatalogEntry } from "./simulationDiagnosticsTypes";

const GAIA_LABEL_DESKTOP_BUDGET = 24;
const GAIA_LABEL_MOBILE_BUDGET = 8;
const GAIA_NAME_MATCH_MAX_DEG = 0.2;
const GAIA_NAME_MATCH_MAX_MAG_DELTA = 1.5;
const GAIA_OVERLAY_SCENE_SCALE = 1.5 * AU_TO_SCENE;

export type GaiaIndexedStar = {
  id: string;
  sourceId: string;
  star: GaiaStarRecord;
  displayName: string;
  shortLabel: string;
  aliases: readonly string[];
  searchText: string;
  namedCatalogId: string | null;
  stellarParameters?: {
    teffK: number | null;
    teffLowerK?: number | null;
    teffUpperK?: number | null;
    logg: number | null;
    radiusSolar: number | null;
    metallicityDex?: number | null;
    luminositySolar?: number | null;
    dataTier?: "parameter-rich" | "photometric-derived" | "catalog-basic" | null;
    variable: boolean;
    spectralType?: string | null;
  };
};

const NAMED_STAR_ENTRIES = CELESTIAL_CATALOG_ENTRIES.filter(
  (entry) =>
    (entry.kind === "nearby-star" || entry.kind === "bright-star") &&
    entry.raHours != null &&
    entry.decDeg != null,
);
let cachedStars: readonly GaiaStarRecord[] | null = null;
let cachedIndex: readonly GaiaIndexedStar[] = [];
const sourceMapCache = new WeakMap<readonly GaiaIndexedStar[], ReadonlyMap<string, GaiaIndexedStar>>();
const pickEntriesCache = new WeakMap<readonly GaiaIndexedStar[], Map<number, readonly GaiaIndexedStar[]>>();
const labelEntriesCache = new WeakMap<readonly GaiaIndexedStar[], Map<string, readonly GaiaIndexedStar[]>>();
const searchEntriesCache = new WeakMap<readonly GaiaIndexedStar[], Map<string, readonly GaiaIndexedStar[]>>();

export function getGaiaStarIndex(
  stars: readonly GaiaStarRecord[],
): readonly GaiaIndexedStar[] {
  if (stars === cachedStars) return cachedIndex;
  cachedStars = stars;
  cachedIndex = buildGaiaStarIndex(stars);
  return cachedIndex;
}

function getSourceMap(index: readonly GaiaIndexedStar[]): ReadonlyMap<string, GaiaIndexedStar> {
  const cached = sourceMapCache.get(index);
  if (cached) return cached;
  const map = new Map(index.map((entry) => [entry.sourceId, entry] as const));
  sourceMapCache.set(index, map);
  return map;
}

/** Reuses bounded pick candidates across scene-mode mounts for one immutable index. */
export function getGaiaPickEntries(
  index: readonly GaiaIndexedStar[],
  maxResults: number,
): readonly GaiaIndexedStar[] {
  if (maxResults <= 0 || index.length === 0) return [];
  let byBudget = pickEntriesCache.get(index);
  if (!byBudget) {
    byBudget = new Map();
    pickEntriesCache.set(index, byBudget);
  }
  const cached = byBudget.get(maxResults);
  if (cached) return cached;
  const sourceMap = getSourceMap(index);
  const entries = rankGaiaStarsForOverlay(index.map((entry) => entry.star), maxResults)
    .map((star) => sourceMap.get(star.sourceId))
    .filter((entry): entry is GaiaIndexedStar => Boolean(entry));
  byBudget.set(maxResults, entries);
  return entries;
}

export function buildGaiaStarIndex(
  stars: readonly GaiaStarRecord[],
): readonly GaiaIndexedStar[] {
  return stars.map((star) => {
    const named = closestNamedStar(star);
    const knownAlias = named ? celestialSearchAliasesZh(named) : "";
    const knownName = knownAlias.split(" ")[0] || (named ? celestialDisplayNameZh(named) : "");
    const englishName = named?.primaryName ?? "";
    const shortId = shortenGaiaSourceId(star.sourceId);
    const displayName = knownName || englishName || shortId;
    const aliases = [
      star.sourceId,
      `Gaia DR3 ${star.sourceId}`,
      knownName,
      knownAlias,
      englishName,
      named?.sourceId ?? "",
    ].filter(Boolean);
    return {
      id: `gaia-dr3:${star.sourceId}`,
      sourceId: star.sourceId,
      star,
      displayName,
      shortLabel: knownName || englishName || shortId,
      aliases,
      searchText: aliases.join(" ").toLocaleLowerCase(),
      namedCatalogId: named?.id ?? null,
    };
  });
}

export function searchGaiaStarIndex(
  index: readonly GaiaIndexedStar[],
  query: string,
  maxResults = 12,
): readonly GaiaIndexedStar[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (normalized.length < 2 || maxResults <= 0) return [];
  const cacheKey = `${normalized}\u0000${maxResults}`;
  let byQuery = searchEntriesCache.get(index);
  if (!byQuery) {
    byQuery = new Map();
    searchEntriesCache.set(index, byQuery);
  }
  const cached = byQuery.get(cacheKey);
  if (cached) return cached;
  const results = index
    .flatMap((entry) => {
      if (!entry.searchText.includes(normalized)) return [];
      let score = 0;
      if (entry.sourceId === normalized) score += 1000;
      if (entry.displayName.toLocaleLowerCase() === normalized) score += 900;
      if (entry.searchText.startsWith(normalized)) score += 300;
      if (entry.namedCatalogId) score += 120;
      score += Math.max(0, 20 - entry.star.magG);
      return [{ entry, score }];
    })
    .sort((a, b) => b.score - a.score || a.entry.sourceId.localeCompare(b.entry.sourceId))
    .slice(0, maxResults)
    .map(({ entry }) => entry);
  byQuery.set(cacheKey, results);
  return results;
}

export function selectGaiaLabelStars(
  index: readonly GaiaIndexedStar[],
  mobile: boolean,
  selectedSourceId = "",
): readonly GaiaIndexedStar[] {
  const budget = mobile ? GAIA_LABEL_MOBILE_BUDGET : GAIA_LABEL_DESKTOP_BUDGET;
  const cacheKey = `${mobile ? "mobile" : "desktop"}\u0000${selectedSourceId}`;
  let bySelection = labelEntriesCache.get(index);
  if (!bySelection) {
    bySelection = new Map();
    labelEntriesCache.set(index, bySelection);
  }
  const cached = bySelection.get(cacheKey);
  if (cached) return cached;
  const bySourceId = getSourceMap(index);
  const ranked = rankGaiaStarsForOverlay(
    index.map((entry) => entry.star),
    budget,
  )
    .map((star) => bySourceId.get(star.sourceId))
    .filter((entry): entry is GaiaIndexedStar => Boolean(entry));
  const selected = bySourceId.get(selectedSourceId);
  if (!selected || ranked.some((entry) => entry.sourceId === selected.sourceId)) {
    bySelection.set(cacheKey, ranked);
    return ranked;
  }
  const result = [selected, ...ranked.slice(0, Math.max(0, budget - 1))];
  bySelection.set(cacheKey, result);
  return result;
}

export function gaiaStarToOverlayScenePosition(
  star: GaiaStarRecord,
): readonly [number, number, number] {
  const [x, y, z] = gaiaStarToGalacticPc(star);
  return [
    x * GAIA_OVERLAY_SCENE_SCALE,
    y * GAIA_OVERLAY_SCENE_SCALE,
    z * GAIA_OVERLAY_SCENE_SCALE,
  ];
}

export function gaiaIndexedStarToCatalogEntry(
  indexed: GaiaIndexedStar,
): CelestialCatalogEntry {
  const isGaiaSource = /^\d{10,22}$/.test(indexed.sourceId);
  const distancePc = 1000 / Math.max(indexed.star.parallaxMas, 0.001);
  const [r, g, b] = gaiaOverlayColorToRgb(indexed.star.colorBpRp);
  const color = `#${[r, g, b]
    .map((channel) => Math.round(channel * 255).toString(16).padStart(2, "0"))
    .join("")}`;
  return {
    id: indexed.id,
    sourceId: indexed.sourceId,
    kind: "bright-star",
    source: isGaiaSource ? "gaia-dr3" : "curated-local-v22",
    primaryName: indexed.displayName,
    catalogName: isGaiaSource
      ? `Gaia DR3 ${indexed.sourceId}`
      : indexed.sourceId.startsWith("hyg:")
        ? `HYG ${indexed.sourceId.slice(4)}`
        : indexed.sourceId,
    subtitle: isGaiaSource ? "Gaia presentation star" : "Offline stellar catalog star",
    color,
    raHours: indexed.star.raDeg / 15,
    decDeg: indexed.star.decDeg,
    galLonDeg: null,
    galLatDeg: null,
    distancePc,
    magV: indexed.star.magG,
    angularSizeArcmin: null,
    metadata: `G ${indexed.star.magG.toFixed(2)}; ${distancePc.toFixed(2)} pc; BP-RP ${indexed.star.colorBpRp.toFixed(2)}`,
    searchText: indexed.searchText,
    labelPriority: null,
    boundary: isGaiaSource
      ? "Packaged Gaia DR3 presentation row; not a full Gaia archive record and not inserted into the live physics state."
      : "Offline catalog presentation row; no Gaia source ID is claimed and the object is not inserted into the live physics state.",
  };
}

export function gaiaIndexedStarToDirection(
  indexed: GaiaIndexedStar,
): [number, number, number] {
  const ra = (indexed.star.raDeg * Math.PI) / 180;
  const dec = (indexed.star.decDeg * Math.PI) / 180;
  return [
    Math.cos(dec) * Math.cos(ra),
    Math.sin(dec),
    Math.cos(dec) * Math.sin(ra),
  ];
}

export function shortenGaiaSourceId(sourceId: string): string {
  return `Gaia ...${sourceId.slice(-8)}`;
}

export const GAIA_LABEL_BUDGETS = {
  desktop: GAIA_LABEL_DESKTOP_BUDGET,
  mobile: GAIA_LABEL_MOBILE_BUDGET,
} as const;

function closestNamedStar(star: GaiaStarRecord): CelestialCatalogEntry | null {
  let best: CelestialCatalogEntry | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const entry of NAMED_STAR_ENTRIES) {
    const angularDistance = angularDistanceDeg(
      star.raDeg,
      star.decDeg,
      entry.raHours! * 15,
      entry.decDeg!,
    );
    if (angularDistance > GAIA_NAME_MATCH_MAX_DEG || angularDistance >= bestDistance) {
      continue;
    }
    if (
      entry.magV != null &&
      Math.abs(entry.magV - star.magG) > GAIA_NAME_MATCH_MAX_MAG_DELTA
    ) {
      continue;
    }
    best = entry;
    bestDistance = angularDistance;
  }
  return best;
}

function angularDistanceDeg(
  raADeg: number,
  decADeg: number,
  raBDeg: number,
  decBDeg: number,
): number {
  const toRad = Math.PI / 180;
  const decA = decADeg * toRad;
  const decB = decBDeg * toRad;
  const deltaRa = (raADeg - raBDeg) * toRad;
  const cosine =
    Math.sin(decA) * Math.sin(decB) +
    Math.cos(decA) * Math.cos(decB) * Math.cos(deltaRa);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) / toRad;
}
