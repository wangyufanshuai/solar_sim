import { BRIGHT_GALAXIES } from "../data/brightGalaxyCatalog";
import { BRIGHT_STARS_TIER1, BRIGHT_STARS_TIER2 } from "../data/brightStarCatalog";
import { CONSTELLATION_LINES } from "../data/constellationCatalog";
import { NEARBY_STARS, starToDirection } from "../data/nearbyStars";
import { NEBULAE } from "../data/nebulaCatalog";
import { PULSARS } from "../data/pulsarCatalog";
import { STAR_CLUSTERS } from "../data/starClusterCatalog";
import { galacticToEquatorial } from "./galacticToEquatorial";
import type {
  CelestialCatalogEntry,
  CelestialCatalogSource,
  CelestialCatalogSummary,
  CelestialCatalogVersion,
  CelestialDeepSkyNavigationVersion,
  CelestialObjectKind,
  CelestialObjectPassport,
  CelestialObjectPassportMetric,
  CelestialObjectPassportVersion,
  CelestialVisualLayerSummary,
  EvidenceClaimStatus,
} from "./simulationDiagnosticsTypes";

export const CELESTIAL_CATALOG_VERSION: CelestialCatalogVersion = "v22-celestial-catalog-atlas";
export const CELESTIAL_OBJECT_PASSPORT_VERSION: CelestialObjectPassportVersion = "v23-object-passports";
export const CELESTIAL_DEEP_SKY_NAVIGATION_VERSION: CelestialDeepSkyNavigationVersion =
  "v33-deep-sky-navigation";

const KIND_ORDER: readonly CelestialObjectKind[] = [
  "nearby-star",
  "bright-star",
  "nebula",
  "star-cluster",
  "galaxy",
  "pulsar",
  "constellation",
];

const SOURCE_ORDER: readonly CelestialCatalogSource[] = [
  "curated-local-v22",
  "gaia-dr3",
  "iau-constellation-lines",
  "messier-ngc-curated",
];

const FEATURED_LABEL_IDS = new Map<string, number>([
  ["nearby-star:sirius", 10],
  ["bright-star:vega", 9],
  ["bright-star:betelgeuse", 9],
  ["bright-star:rigel", 8],
  ["bright-star:deneb", 8],
  ["nebula:m42", 10],
  ["nebula:m1", 8],
  ["nebula:ngc1499", 7],
  ["nebula:ic5146", 7],
  ["star-cluster:m45", 10],
  ["star-cluster:m13", 8],
  ["star-cluster:m11", 7],
  ["star-cluster:m67", 7],
  ["galaxy:m31", 10],
  ["galaxy:m33", 8],
  ["galaxy:lmc", 8],
  ["galaxy:m83", 7],
  ["galaxy:m106", 7],
  ["constellation:UMa", 10],
  ["constellation:Ori", 10],
  ["constellation:Cas", 8],
  ["pulsar:b0531+21", 8],
]);

const CELESTIAL_DISPLAY_NAME_ZH = new Map<string, string>([
  ["nearby-star:sirius", "天狼星"],
  ["bright-star:vega", "织女星"],
  ["bright-star:betelgeuse", "参宿四"],
  ["bright-star:rigel", "参宿七"],
  ["bright-star:deneb", "天津四"],
  ["nebula:m42", "猎户座大星云"],
  ["nebula:m16", "鹰状星云"],
  ["nebula:m17", "欧米伽星云"],
  ["nebula:m8", "礁湖星云"],
  ["nebula:m20", "三裂星云"],
  ["nebula:ic434", "马头星云"],
  ["nebula:ngc7000", "北美洲星云"],
  ["nebula:ngc2237", "玫瑰星云"],
  ["nebula:m57", "环状星云"],
  ["nebula:m27", "哑铃星云"],
  ["nebula:ngc7293", "螺旋星云"],
  ["nebula:m1", "蟹状星云"],
  ["nebula:ngc6960", "面纱星云"],
  ["nebula:ngc1499", "加州星云"],
  ["nebula:ic2118", "女巫头星云"],
  ["nebula:ic5146", "茧状星云"],
  ["nebula:ngc6888", "眉月星云"],
  ["star-cluster:m45", "昴星团"],
  ["star-cluster:hyades", "毕星团"],
  ["star-cluster:m44", "蜂巢星团"],
  ["star-cluster:m13", "武仙座大球状星团"],
  ["star-cluster:m11", "野鸭星团"],
  ["star-cluster:m67", "M67 疏散星团"],
  ["galaxy:m31", "仙女座星系"],
  ["galaxy:m33", "三角座星系"],
  ["galaxy:lmc", "大麦哲伦云"],
  ["galaxy:smc", "小麦哲伦云"],
  ["galaxy:m51", "涡状星系"],
  ["galaxy:m81", "波德星系"],
  ["galaxy:m82", "雪茄星系"],
  ["galaxy:m83", "南风车星系"],
  ["galaxy:m101", "风车星系"],
  ["galaxy:m104", "草帽星系"],
  ["galaxy:m106", "M106 星系"],
  ["pulsar:b0531+21", "蟹状星云脉冲星"],
  ["constellation:UMa", "大熊座"],
  ["constellation:UMi", "小熊座"],
  ["constellation:Cas", "仙后座"],
  ["constellation:Cep", "仙王座"],
  ["constellation:Dra", "天龙座"],
  ["constellation:Ori", "猎户座"],
  ["constellation:Cyg", "天鹅座"],
  ["constellation:Lyr", "天琴座"],
  ["constellation:Aql", "天鹰座"],
  ["constellation:Tau", "金牛座"],
  ["constellation:Sco", "天蝎座"],
  ["constellation:Sgr", "人马座"],
]);

const CELESTIAL_SEARCH_ALIASES_ZH = new Map<string, string>([
  ["nearby-star:sirius", "\u5929\u72fc\u661f"],
  ["bright-star:vega", "\u7ec7\u5973\u661f"],
  ["bright-star:betelgeuse", "\u53c2\u5bbf\u56db"],
  ["bright-star:rigel", "\u53c2\u5bbf\u4e03"],
  ["bright-star:deneb", "\u5929\u6d25\u56db"],
  ["bright-star:altair", "\u725b\u90ce\u661f \u6cb3\u9f13\u4e8c"],
  ["bright-star:arcturus", "\u5927\u89d2\u661f"],
  ["bright-star:capella", "\u4e94\u8f66\u4e8c"],
  ["bright-star:procyon", "\u5357\u6cb3\u4e09"],
  ["bright-star:aldebaran", "\u6bd5\u5bbf\u4e94"],
  ["bright-star:antares", "\u5fc3\u5bbf\u4e8c"],
  ["bright-star:spica", "\u89d2\u5bbf\u4e00"],
  ["bright-star:pollux", "\u5317\u6cb3\u4e09"],
  ["bright-star:fomalhaut", "\u5317\u843d\u5e08\u95e8"],
  ["bright-star:canopus", "\u8001\u4eba\u661f"],
]);
const CELESTIAL_SEARCH_ALIASES_BY_SOURCE_ID = new Map<string, string>([
  ["sirius", "\u5929\u72fc\u661f"],
  ["vega", "\u7ec7\u5973\u661f"],
  ["betelgeuse", "\u53c2\u5bbf\u56db"],
  ["rigel", "\u53c2\u5bbf\u4e03"],
  ["deneb", "\u5929\u6d25\u56db"],
  ["altair", "\u725b\u90ce\u661f \u6cb3\u9f13\u4e8c"],
  ["arcturus", "\u5927\u89d2\u661f"],
  ["capella", "\u4e94\u8f66\u4e8c"],
  ["procyon", "\u5357\u6cb3\u4e09"],
  ["aldebaran", "\u6bd5\u5bbf\u4e94"],
  ["antares", "\u5fc3\u5bbf\u4e8c"],
  ["spica", "\u89d2\u5bbf\u4e00"],
  ["pollux", "\u5317\u6cb3\u4e09"],
  ["fomalhaut", "\u5317\u843d\u5e08\u95e8"],
  ["canopus", "\u8001\u4eba\u661f"],
]);

export function celestialDisplayNameZh(entryItem: CelestialCatalogEntry): string {
  return CELESTIAL_DISPLAY_NAME_ZH.get(entryItem.id) ?? entryItem.primaryName;
}

export function celestialKindLabelZh(kind: CelestialObjectKind): string {
  switch (kind) {
    case "nearby-star":
    case "bright-star":
      return "恒星";
    case "nebula":
      return "星云";
    case "star-cluster":
      return "星团";
    case "galaxy":
      return "星系";
    case "pulsar":
      return "脉冲星";
    case "constellation":
      return "星座";
  }
}

export function celestialSearchTextZh(entryItem: CelestialCatalogEntry): string {
  return `${celestialDisplayNameZh(entryItem)} ${celestialSearchAliasesZh(entryItem)} ${celestialKindLabelZh(entryItem.kind)}`;
}

export function celestialSearchAliasesZh(entryItem: CelestialCatalogEntry): string {
  return (
    CELESTIAL_SEARCH_ALIASES_ZH.get(entryItem.id) ??
    CELESTIAL_SEARCH_ALIASES_BY_SOURCE_ID.get(entryItem.sourceId) ??
    ""
  );
}

const nearbyStarIds = new Set(NEARBY_STARS.map((star) => star.id));
const brightStarIds = new Set<string>();
const UNIQUE_BRIGHT_STARS = [...BRIGHT_STARS_TIER1, ...BRIGHT_STARS_TIER2].filter((star) => {
  if (nearbyStarIds.has(star.id) || brightStarIds.has(star.id)) return false;
  brightStarIds.add(star.id);
  return true;
});

export const CELESTIAL_CATALOG_ENTRIES: readonly CelestialCatalogEntry[] = [
  ...NEARBY_STARS.map((star) =>
    entry({
      sourceId: star.id,
      kind: "nearby-star",
      source: "curated-local-v22",
      primaryName: star.name,
      catalogName: star.spectralType,
      subtitle: "Nearby star",
      color: star.color,
      raHours: star.raHours,
      decDeg: star.decDeg,
      distancePc: star.distancePc,
      magV: star.magV,
      angularSizeArcmin: null,
      metadata: `${formatDistance(star.distancePc)}; V ${formatMagnitude(star.magV)}; ${star.spectralType}`,
      boundary: "Curated nearby-star navigation entry; not a complete stellar census.",
    }),
  ),
  ...UNIQUE_BRIGHT_STARS.map((star) =>
      entry({
        sourceId: star.id,
        kind: "bright-star",
        source: "curated-local-v22",
        primaryName: star.name,
        catalogName: "Bright star catalog",
        subtitle: "Bright star",
        color: rgbToHex(star.r, star.g, star.b),
        raHours: star.raHours,
        decDeg: star.decDeg,
        distancePc: null,
        magV: star.magV,
        angularSizeArcmin: null,
        metadata: `V ${formatMagnitude(star.magV)}; J2000 RA/Dec`,
        boundary: "Curated bright-star navigation entry; not Gaia DR3 full archive coverage.",
      }),
    ),
  ...NEBULAE.map((nebula) => {
    const [raHours, decDeg] = galacticToEquatorial(nebula.galLonDeg, nebula.galLatDeg);
    return entry({
      sourceId: nebula.id,
      kind: "nebula",
      source: "messier-ngc-curated",
      primaryName: nebula.commonName,
      catalogName: nebula.catalogName,
      subtitle: nebula.kind,
      color: nebula.color,
      raHours,
      decDeg,
      galLonDeg: nebula.galLonDeg,
      galLatDeg: nebula.galLatDeg,
      distancePc: nebula.distancePc,
      magV: null,
      angularSizeArcmin: nebula.sizeArcmin,
      metadata: `${nebula.catalogName}; ${nebula.kind}; ${formatDistance(nebula.distancePc)}; ${formatAngularSize(nebula.sizeArcmin)}`,
      boundary: "Curated nebula marker with approximate static coordinates and distance.",
    });
  }),
  ...STAR_CLUSTERS.map((cluster) => {
    const [raHours, decDeg] = galacticToEquatorial(cluster.galLonDeg, cluster.galLatDeg);
    return entry({
      sourceId: cluster.id,
      kind: "star-cluster",
      source: "messier-ngc-curated",
      primaryName: cluster.commonName,
      catalogName: cluster.catalogName,
      subtitle: cluster.kind,
      color: cluster.color,
      raHours,
      decDeg,
      galLonDeg: cluster.galLonDeg,
      galLatDeg: cluster.galLatDeg,
      distancePc: cluster.distancePc,
      magV: cluster.magV,
      angularSizeArcmin: cluster.sizeArcmin,
      metadata: `${cluster.catalogName}; ${cluster.kind}; ${formatDistance(cluster.distancePc)}; V ${formatMagnitude(cluster.magV)}`,
      boundary: "Curated star-cluster marker with approximate static coordinates, distance, and magnitude.",
    });
  }),
  ...BRIGHT_GALAXIES.map((galaxy) =>
    entry({
      sourceId: galaxy.id,
      kind: "galaxy",
      source: "messier-ngc-curated",
      primaryName: galaxy.commonName,
      catalogName: galaxy.catalogName,
      subtitle: galaxy.kind,
      color: galaxy.color,
      raHours: galaxy.raHours,
      decDeg: galaxy.decDeg,
      distancePc: galaxy.distancePc,
      magV: galaxy.magV,
      angularSizeArcmin: galaxy.sizeArcmin,
      metadata: `${galaxy.catalogName}; ${galaxy.kind}; ${formatDistance(galaxy.distancePc)}; V ${formatMagnitude(galaxy.magV)}`,
      boundary: "Curated galaxy and Local Group marker; not a complete extragalactic catalog.",
    }),
  ),
  ...PULSARS.map((pulsar) => {
    const [raHours, decDeg] = galacticToEquatorial(pulsar.galLonDeg, pulsar.galLatDeg);
    return entry({
      sourceId: pulsar.id,
      kind: "pulsar",
      source: "curated-local-v22",
      primaryName: pulsar.commonName,
      catalogName: pulsar.name,
      subtitle: "pulsar",
      color: pulsar.color,
      raHours,
      decDeg,
      galLonDeg: pulsar.galLonDeg,
      galLatDeg: pulsar.galLatDeg,
      distancePc: pulsar.distancePc,
      magV: null,
      angularSizeArcmin: null,
      metadata: `${pulsar.name}; period ${pulsar.periodS}s; ${formatDistance(pulsar.distancePc)}`,
      boundary: "Curated pulsar marker with visually normalized pulse timing.",
    });
  }),
  ...CONSTELLATION_LINES.map((constellation) => {
    const [raHours, decDeg] = constellationCentroid(constellation.waypoints);
    return entry({
      sourceId: constellation.iauCode,
      kind: "constellation",
      source: "iau-constellation-lines",
      primaryName: constellation.name,
      catalogName: constellation.iauCode,
      subtitle: constellation.nameCn,
      color: "#7fa3d7",
      raHours,
      decDeg,
      distancePc: null,
      magV: null,
      angularSizeArcmin: null,
      metadata: `${constellation.iauCode}; ${constellation.waypoints.length} guide points; J2000 stick figure`,
      boundary: "IAU constellation navigation overlay; lines are cultural guide figures, not physical structures.",
    });
  }),
];

export const CELESTIAL_CATALOG_SUMMARY = createCelestialCatalogSummary();

export type CelestialVisualLayerArgs = {
  selectedCatalogId?: string | null;
  showConstellations?: boolean;
  showDeepSkyObjects?: boolean;
  showCatalogLabels?: boolean;
  orbitAtlas?: boolean;
  mobile?: boolean;
  labelBudget?: number | null;
};

export function createCelestialCatalogSummary(): CelestialCatalogSummary {
  const kindBreakdown = Object.fromEntries(KIND_ORDER.map((kind) => [kind, 0])) as Record<
    CelestialObjectKind,
    number
  >;
  const sourceBreakdown = Object.fromEntries(SOURCE_ORDER.map((source) => [source, 0])) as Record<
    CelestialCatalogSource,
    number
  >;
  const ids = new Set<string>();
  let finiteCoordinates = true;

  for (const item of CELESTIAL_CATALOG_ENTRIES) {
    kindBreakdown[item.kind] += 1;
    sourceBreakdown[item.source] += 1;
    if (ids.has(item.id)) finiteCoordinates = false;
    ids.add(item.id);
    if (!hasFiniteDirection(item)) finiteCoordinates = false;
  }

  return {
    version: CELESTIAL_CATALOG_VERSION,
    entryCount: CELESTIAL_CATALOG_ENTRIES.length,
    entries: CELESTIAL_CATALOG_ENTRIES,
    kindBreakdown,
    sourceBreakdown,
    coordinateFrames: ["J2000 RA/Dec", "Galactic l/b", "presentation navigation shell"],
    qualityChecks: {
      uniqueIds: ids.size === CELESTIAL_CATALOG_ENTRIES.length,
      finiteCoordinates,
      constellationCount: kindBreakdown.constellation,
    },
    trustedBoundary:
      "Curated local presentation and navigation catalog. Not SIMBAD, VizieR, Gaia full archive, or a deep-sky astrophysical simulation.",
  };
}

export function createCelestialVisualLayerSummary({
  selectedCatalogId = "",
  showConstellations = false,
  showDeepSkyObjects = false,
  showCatalogLabels = false,
  orbitAtlas = false,
  mobile = false,
  labelBudget = null,
}: CelestialVisualLayerArgs = {}): CelestialVisualLayerSummary {
  const selected = selectCelestialCatalogEntry(selectedCatalogId);
  const labelEntries = celestialCatalogLabelEntries({
    selectedCatalogId,
    orbitAtlas,
    mobile,
    labelBudget,
  });
  const maxLabelCount = maxCatalogLabelCount({ orbitAtlas, mobile, labelBudget });
  const layerState = [
    `constellations:${showConstellations ? "on" : "off"}`,
    `deep-sky:${showDeepSkyObjects ? "on" : "off"}`,
    `labels:${showCatalogLabels ? "on" : "off"}`,
    `mode:${orbitAtlas ? "orbit-atlas" : "sandbox"}`,
    `viewport:${mobile ? "mobile" : "desktop"}`,
  ].join("|");

  return {
    version: CELESTIAL_DEEP_SKY_NAVIGATION_VERSION,
    selectedId: selected?.id ?? "",
    selectedKind: selected?.kind ?? "",
    selectedTitle: selected?.primaryName ?? "",
    catalogCount: CELESTIAL_CATALOG_ENTRIES.length,
    labelCount: showCatalogLabels
      ? labelEntries.length
      : selected && selected.raHours != null && selected.decDeg != null
        ? 1
        : 0,
    maxLabelCount,
    deepSkyCount: countDeepSkyEntries(CELESTIAL_CATALOG_ENTRIES),
    kindBreakdown: CELESTIAL_CATALOG_SUMMARY.kindBreakdown,
    layerState,
    showConstellations,
    showDeepSkyObjects,
    showCatalogLabels,
    orbitAtlas,
    mobile,
    labelBudgetSource: labelBudget == null ? "v33-default-density" : "v34-performance-budget",
    trustedBoundary:
      "Deep-sky navigation is a curated local visual/catalog layer. It is not SIMBAD, VizieR, Gaia full archive, N-body insertion, or an astrophysical evolution model.",
  };
}

export function celestialCatalogLabelEntries({
  selectedCatalogId = "",
  orbitAtlas = false,
  mobile = false,
  labelBudget = null,
}: Pick<CelestialVisualLayerArgs, "selectedCatalogId" | "orbitAtlas" | "mobile" | "labelBudget"> = {}): readonly CelestialCatalogEntry[] {
  const maxCount = maxCatalogLabelCount({ orbitAtlas, mobile, labelBudget });
  const selected = selectCelestialCatalogEntry(selectedCatalogId);
  const entries = CELESTIAL_CATALOG_ENTRIES.filter(
    (entryItem) =>
      entryItem.labelPriority != null &&
      entryItem.raHours != null &&
      entryItem.decDeg != null,
  )
    .sort((a, b) => {
      const priorityDelta = (b.labelPriority ?? 0) - (a.labelPriority ?? 0);
      if (priorityDelta !== 0) return priorityDelta;
      return a.primaryName.localeCompare(b.primaryName);
    })
    .slice(0, maxCount);

  if (
    selected &&
    selected.raHours != null &&
    selected.decDeg != null &&
    !entries.some((entryItem) => entryItem.id === selected.id)
  ) {
    return [selected, ...entries.slice(0, Math.max(0, maxCount - 1))];
  }
  return entries;
}

function maxCatalogLabelCount({
  orbitAtlas = false,
  mobile = false,
  labelBudget = null,
}: Pick<CelestialVisualLayerArgs, "orbitAtlas" | "mobile" | "labelBudget">): number {
  if (typeof labelBudget === "number" && Number.isFinite(labelBudget) && labelBudget > 0) {
    return Math.max(1, Math.floor(labelBudget));
  }
  if (mobile) return orbitAtlas ? 6 : 8;
  return orbitAtlas ? 12 : 18;
}

function countDeepSkyEntries(entries: readonly CelestialCatalogEntry[]): number {
  return entries.filter((entryItem) =>
    entryItem.kind === "nebula" ||
    entryItem.kind === "star-cluster" ||
    entryItem.kind === "galaxy" ||
    entryItem.kind === "pulsar",
  ).length;
}

export function celestialEntryToDirection(entryItem: CelestialCatalogEntry): [number, number, number] | null {
  if (entryItem.raHours == null || entryItem.decDeg == null) return null;
  return starToDirection(entryItem.raHours, entryItem.decDeg);
}

export function celestialEntriesForKinds(
  kinds: readonly CelestialObjectKind[],
): readonly CelestialCatalogEntry[] {
  const kindSet = new Set(kinds);
  return CELESTIAL_CATALOG_ENTRIES.filter((item) => kindSet.has(item.kind));
}

export function selectCelestialCatalogEntry(
  objectId: string | null | undefined,
): CelestialCatalogEntry | null {
  if (!objectId) return null;
  return CELESTIAL_CATALOG_ENTRIES.find((item) => item.id === objectId) ?? null;
}

export function createCelestialObjectPassport(
  objectIdOrEntry: string | CelestialCatalogEntry | null | undefined,
): CelestialObjectPassport | null {
  const entryItem =
    typeof objectIdOrEntry === "string"
      ? selectCelestialCatalogEntry(objectIdOrEntry)
      : objectIdOrEntry ?? null;
  if (!entryItem) return null;

  const coordinateFrame = entryItem.galLonDeg != null && entryItem.galLatDeg != null
    ? "J2000 RA/Dec derived from Galactic l/b"
    : "J2000 RA/Dec";
  const sourceChain = [
    sourceLabel(entryItem.source),
    entryItem.catalogName,
    "Celestial Catalog Atlas v22 local summary",
    "Object Passport v23 drilldown",
  ];
  const metrics = objectPassportMetrics(entryItem);
  const metricSummary = metrics.map((item) => `${item.label}: ${item.value}`).join("; ");
  const assumptions = [
    "Catalog rows are static curated approximations for navigation and presentation.",
    "Camera focus uses direction only and does not create a physical simulation body.",
    "Distances, magnitudes, and angular sizes are lightweight metadata for inspection, not a fitted astrophysical model.",
  ];
  const limitations = [
    entryItem.boundary,
    "Not a complete SIMBAD or VizieR object record.",
    "Not the full Gaia archive and not a deep-sky evolution simulation.",
    "Not inserted into SolarSystemIntegrator or the EIH 1PN N-body state.",
  ];
  const confidenceRationale =
    "Catalog-backed for curated local provenance and formula-checked for finite coordinate direction; confidence is limited by the static curated source boundary.";

  return {
    version: CELESTIAL_OBJECT_PASSPORT_VERSION,
    objectId: entryItem.id,
    title: entryItem.primaryName,
    kind: entryItem.kind,
    source: entryItem.source,
    catalogName: entryItem.catalogName,
    subtitle: entryItem.subtitle,
    color: entryItem.color,
    sourceChain,
    coordinateFrame,
    metrics,
    confidenceRationale,
    assumptions,
    limitations,
    relatedEvidenceClaimId: "celestial-catalog-atlas",
    sections: [
      {
        id: "identity",
        title: "Identity",
        body: `${entryItem.primaryName}; ${kindLabel(entryItem.kind)}; ${entryItem.catalogName}; ${entryItem.subtitle}.`,
      },
      {
        id: "source-chain",
        title: "Source chain",
        body: sourceChain.join(" -> "),
      },
      {
        id: "coordinates",
        title: "Coordinates",
        body: coordinateSummary(entryItem, coordinateFrame),
      },
      {
        id: "observables",
        title: "Observables",
        body: metricSummary,
      },
      {
        id: "provenance",
        title: "Confidence rationale",
        body: confidenceRationale,
      },
      {
        id: "trusted-boundary",
        title: "Trusted boundary",
        body: limitations.join(" "),
      },
      {
        id: "related-evidence",
        title: "Related evidence",
        body: "Evidence claim: celestial-catalog-atlas. The object passport inherits catalog-level source, quality checks, and trusted boundary.",
      },
    ],
  };
}

function entry(args: {
  sourceId: string;
  kind: CelestialObjectKind;
  source: CelestialCatalogSource;
  primaryName: string;
  catalogName: string;
  subtitle: string;
  color: string;
  raHours: number | null;
  decDeg: number | null;
  galLonDeg?: number | null;
  galLatDeg?: number | null;
  distancePc: number | null;
  magV: number | null;
  angularSizeArcmin: number | null;
  metadata: string;
  boundary: string;
}): CelestialCatalogEntry {
  const id = `${args.kind}:${args.sourceId}`;
  return {
    id,
    sourceId: args.sourceId,
    kind: args.kind,
    source: args.source,
    primaryName: args.primaryName,
    catalogName: args.catalogName,
    subtitle: args.subtitle,
    color: args.color,
    raHours: args.raHours,
    decDeg: args.decDeg,
    galLonDeg: args.galLonDeg ?? null,
    galLatDeg: args.galLatDeg ?? null,
    distancePc: args.distancePc,
    magV: args.magV,
    angularSizeArcmin: args.angularSizeArcmin,
    metadata: args.metadata,
    searchText: `${args.primaryName} ${args.catalogName} ${args.subtitle} ${args.kind}`.toLowerCase(),
    labelPriority: FEATURED_LABEL_IDS.get(id) ?? null,
    boundary: args.boundary,
  };
}

function constellationCentroid(waypoints: readonly [number, number][]): [number, number] {
  if (waypoints.length === 0) return [0, 0];
  let x = 0;
  let y = 0;
  let z = 0;
  for (const [raDeg, decDeg] of waypoints) {
    const ra = (raDeg * Math.PI) / 180;
    const dec = (decDeg * Math.PI) / 180;
    x += Math.cos(dec) * Math.cos(ra);
    y += Math.cos(dec) * Math.sin(ra);
    z += Math.sin(dec);
  }
  const len = Math.hypot(x, y, z) || 1;
  const raRad = Math.atan2(y / len, x / len);
  const decRad = Math.asin(z / len);
  const raDeg = ((raRad * 180) / Math.PI + 360) % 360;
  return [raDeg / 15, (decRad * 180) / Math.PI];
}

function hasFiniteDirection(entryItem: CelestialCatalogEntry): boolean {
  const hasRaDec =
    entryItem.raHours != null &&
    entryItem.decDeg != null &&
    Number.isFinite(entryItem.raHours) &&
    Number.isFinite(entryItem.decDeg);
  const hasGalactic =
    entryItem.galLonDeg != null &&
    entryItem.galLatDeg != null &&
    Number.isFinite(entryItem.galLonDeg) &&
    Number.isFinite(entryItem.galLatDeg);
  return hasRaDec || hasGalactic;
}

function objectPassportMetrics(entryItem: CelestialCatalogEntry): CelestialObjectPassportMetric[] {
  const status: EvidenceClaimStatus = hasFiniteDirection(entryItem) ? "ready" : "failed";
  const metrics: CelestialObjectPassportMetric[] = [
    passportMetric("object-id", "Object id", entryItem.id, status),
    passportMetric("kind", "Object kind", kindLabel(entryItem.kind), status),
    passportMetric("source", "Catalog source", sourceLabel(entryItem.source), status),
    passportMetric("ra-dec", "RA / Dec", formatRaDec(entryItem), status),
  ];

  if (entryItem.galLonDeg != null && entryItem.galLatDeg != null) {
    metrics.push(
      passportMetric(
        "galactic-lb",
        "Galactic l / b",
        `${entryItem.galLonDeg.toFixed(2)} deg / ${entryItem.galLatDeg.toFixed(2)} deg`,
        status,
      ),
    );
  }
  if (entryItem.distancePc != null) {
    metrics.push(
      passportMetric(
        "distance",
        "Distance",
        `${formatDistance(entryItem.distancePc)} (${(entryItem.distancePc * 3.26156).toLocaleString("en-US", {
          maximumFractionDigits: entryItem.distancePc < 10 ? 2 : 0,
        })} ly)`,
        status,
      ),
    );
  }
  if (entryItem.magV != null) {
    metrics.push(passportMetric("visual-magnitude", "Visual magnitude", formatMagnitude(entryItem.magV), status));
  }
  if (entryItem.angularSizeArcmin != null) {
    metrics.push(
      passportMetric("angular-size", "Angular size", formatAngularSize(entryItem.angularSizeArcmin), status),
    );
  }
  metrics.push(passportMetric("metadata", "Catalog metadata", entryItem.metadata, status));

  return metrics;
}

function passportMetric(
  id: string,
  label: string,
  value: string,
  status: EvidenceClaimStatus,
): CelestialObjectPassportMetric {
  return { id, label, value, status };
}

function coordinateSummary(entryItem: CelestialCatalogEntry, coordinateFrame: string): string {
  const galactic =
    entryItem.galLonDeg != null && entryItem.galLatDeg != null
      ? ` Galactic l/b ${entryItem.galLonDeg.toFixed(2)} deg / ${entryItem.galLatDeg.toFixed(2)} deg.`
      : "";
  return `${coordinateFrame}; ${formatRaDec(entryItem)}.${galactic}`;
}

function formatRaDec(entryItem: CelestialCatalogEntry): string {
  if (entryItem.raHours == null || entryItem.decDeg == null) return "unavailable";
  return `${entryItem.raHours.toFixed(3)}h / ${entryItem.decDeg.toFixed(3)} deg`;
}

function kindLabel(kind: CelestialObjectKind): string {
  switch (kind) {
    case "nearby-star":
      return "Nearby star";
    case "bright-star":
      return "Bright star";
    case "nebula":
      return "Nebula";
    case "star-cluster":
      return "Star cluster";
    case "galaxy":
      return "Galaxy";
    case "pulsar":
      return "Pulsar";
    case "constellation":
      return "Constellation";
  }
}

function sourceLabel(source: CelestialCatalogSource): string {
  switch (source) {
    case "curated-local-v22":
      return "Curated Local v22";
    case "gaia-dr3":
      return "Gaia DR3";
    case "iau-constellation-lines":
      return "IAU constellation lines";
    case "messier-ngc-curated":
      return "Messier/NGC curated";
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function formatDistance(distancePc: number): string {
  if (distancePc >= 1_000_000) return `${(distancePc / 1_000_000).toFixed(2)} Mpc`;
  if (distancePc >= 1_000) return `${(distancePc / 1_000).toFixed(2)} kpc`;
  return `${distancePc.toFixed(distancePc < 10 ? 2 : 0)} pc`;
}

function formatMagnitude(magV: number): string {
  return magV.toFixed(magV < 0 ? 2 : 1);
}

function formatAngularSize(sizeArcmin: number): string {
  return `${sizeArcmin.toFixed(sizeArcmin < 10 ? 1 : 0)} arcmin`;
}
