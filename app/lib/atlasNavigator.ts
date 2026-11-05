import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import {
  CELESTIAL_CATALOG_ENTRIES,
  celestialDisplayNameZh,
  celestialKindLabelZh,
  celestialSearchTextZh,
} from "./celestialCatalog";
import {
  searchGaiaStarIndex,
  type GaiaIndexedStar,
} from "./gaiaCatalogIndex";
import {
  stellarDocumentCatalogId,
  type StellarSearchResult,
} from "./stellarSearchCatalog";
import { RELATIVITY_OBSERVABLE_ATLAS_VERSION } from "./atlasRuntimeEvidenceCompatibilityManifestV198";
import type {
  AtlasNavigatorItem,
  AtlasNavigatorPanelId,
  AtlasNavigatorSummary,
  AtlasNavigatorVersion,
  CelestialCatalogEntry,
  EvidenceClaim,
  EvidenceLedgerSummary,
} from "./simulationDiagnosticsTypes";

export const ATLAS_NAVIGATOR_VERSION: AtlasNavigatorVersion =
  "v24-unified-atlas-navigator";

export type CreateAtlasNavigatorSummaryArgs = {
  query?: string | null;
  evidenceLedgerSummary?: EvidenceLedgerSummary | null;
  orbitAnalysisAvailable?: boolean;
  maxResults?: number;
  gaiaIndex?: readonly GaiaIndexedStar[];
  stellarSearchResults?: readonly StellarSearchResult[];
};

const DEFAULT_MAX_RESULTS = 18;

const KIND_RANK: Record<AtlasNavigatorItem["kind"], number> = {
  "panel-action": 0,
  "evidence-claim": 1,
  "solar-body": 2,
  "celestial-object": 3,
  "gaia-star": 4,
};

const SOLAR_BODY_TITLES: Record<string, string> = {
  sun: "太阳",
  mercury: "水星",
  venus: "金星",
  earth: "地球",
  moon: "月球",
  mars: "火星",
  jupiter: "木星",
  saturn: "土星",
  uranus: "天王星",
  neptune: "海王星",
  pluto: "冥王星",
  ceres: "谷神星",
  io: "木卫一",
  europa: "木卫二",
  ganymede: "木卫三",
  callisto: "木卫四",
  titan: "土卫六",
  enceladus: "土卫二",
  triton: "海卫一",
  halley: "哈雷彗星",
  voyager1: "Voyager 1",
  voyager2: "Voyager 2",
  newhorizons: "New Horizons",
  parker: "Parker Solar Probe",
};

const FEATURED_CATALOG_PRIORITY = new Map<string, number>([
  ["nearby-star:sirius", 92],
  ["nebula:m42", 91],
  ["star-cluster:m45", 90],
  ["galaxy:m31", 89],
  ["constellation:UMa", 82],
  ["constellation:Ori", 81],
  ["bright-star:vega", 78],
  ["bright-star:betelgeuse", 76],
]);

const SOLAR_BODY_TITLES_ZH: Readonly<Record<string, string>> = {
  sun: "太阳", mercury: "水星", venus: "金星", earth: "地球", moon: "月球", mars: "火星",
  jupiter: "木星", saturn: "土星", uranus: "天王星", neptune: "海王星", pluto: "冥王星",
  ceres: "谷神星", io: "木卫一", europa: "木卫二", ganymede: "木卫三", callisto: "木卫四",
  titan: "土卫六", enceladus: "土卫二", triton: "海卫一", halley: "哈雷彗星",
  voyager1: "Voyager 1", voyager2: "Voyager 2", newhorizons: "New Horizons", parker: "Parker Solar Probe",
};

function normalizeVisibleNavigatorCopy(item: AtlasNavigatorItem): AtlasNavigatorItem {
  if (item.action === "focus-body" && item.bodyId) {
    return { ...item, title: SOLAR_BODY_TITLES_ZH[item.bodyId] ?? item.title, subtitle: item.bodyId === "sun" ? "太阳系主星" : "太阳系天体", actionLabel: "聚焦天体" };
  }
  if (item.action === "focus-gaia-star") {
    return {
      ...item,
      subtitle: item.source.includes("stellar") ? "恒星目录 V6 / 离线目录搜索" : "Gaia DR3 / 本地亮星目录",
      actionLabel: "聚焦并打开档案",
    };
  }
  if (item.action === "open-exoplanet-system") {
    return { ...item, subtitle: "系外行星系统 / NASA Exoplanet Archive", actionLabel: "打开行星系统" };
  }
  if (item.action === "focus-catalog-object" || item.action === "open-object-passport") {
    return { ...item, actionLabel: "聚焦并打开档案" };
  }
  return item;
}

export function createAtlasNavigatorSummary({
  query,
  evidenceLedgerSummary,
  orbitAnalysisAvailable = false,
  maxResults = DEFAULT_MAX_RESULTS,
  gaiaIndex = [],
  stellarSearchResults = [],
}: CreateAtlasNavigatorSummaryArgs = {}): AtlasNavigatorSummary {
  const trimmedQuery = (query ?? "").trim();
  const items = [
    ...createPanelActionItems(orbitAnalysisAvailable),
    ...createEvidenceClaimItems(evidenceLedgerSummary),
    ...createSolarBodyItems(),
    ...createCelestialObjectItems(),
    ...createGaiaStarItems(gaiaIndex, trimmedQuery),
    ...createStellarSearchItems(stellarSearchResults),
    ...createExoplanetSystemItems(),
  ];
  const normalizedItems = items.map(normalizeVisibleNavigatorCopy);
  const results = rankItems(normalizedItems, trimmedQuery).slice(0, Math.max(1, maxResults));

  return {
    version: ATLAS_NAVIGATOR_VERSION,
    query: trimmedQuery,
    itemCount: normalizedItems.length,
    resultCount: results.length,
    selectedDefaultId: results[0]?.id ?? "",
    items: normalizedItems,
    results,
  };
}

function createExoplanetSystemItems(): AtlasNavigatorItem[] {
  return [
    ["trappist-1","TRAPPIST-1","7 confirmed planets"],
    ["kepler-90","Kepler-90","8 confirmed planets"],
    ["51-peg","51 Pegasi","Confirmed planetary system"],
    ["hd-209458","HD 209458","Transit system / HD 209458 b"],
  ].map(([id,title,metric])=>({id:`exoplanet-system:${id}`,kind:"gaia-star" as const,action:"open-exoplanet-system" as const,title,subtitle:"系外行星系统 / NASA Exoplanet Archive",source:"offline NASA pscomppars",primaryMetric:metric,actionLabel:"打开行星系统",keywords:[title,id,"exoplanet","系外行星","行星系统"],priority:91,exoplanetSystemId:id}));
}

function createStellarSearchItems(
  results: readonly StellarSearchResult[],
): AtlasNavigatorItem[] {
  return results.map(({ document, matchKind, score }) => {
    const distancePc = document.parallaxMas && document.parallaxMas > 0
      ? 1000 / document.parallaxMas
      : null;
    return {
      id: `stellar-search:${document.sourceId}`,
      kind: "gaia-star",
      action: document.exoplanetSystemId ? "open-exoplanet-system" : "focus-gaia-star",
      title: document.displayName,
      subtitle: `恒星目录 V3 / ${stellarMatchKindLabel(matchKind)} / G ${document.magG.toFixed(2)}`,
      source: "offline-stellar-catalog-v3-219626",
      primaryMetric: `${distancePc ? `${distancePc.toFixed(2)} pc; ` : ""}BP-RP ${document.bpRp?.toFixed(2) ?? "--"}`,
      actionLabel: "聚焦 + 护照",
      keywords: [document.designation, document.sourceId, ...document.aliases],
      priority: Math.round(70 + Math.min(25, score / 80)),
      gaiaSourceId: document.sourceId,
      catalogObjectId: stellarDocumentCatalogId(document),
      exoplanetSystemId: document.exoplanetSystemId,
    };
  });
}

function stellarMatchKindLabel(kind: StellarSearchResult["matchKind"]): string {
  switch (kind) {
    case "exact-id":
      return "精确编号";
    case "alias":
      return "名称别名";
    case "curated-local":
      return "本地精选";
    default:
      return "Gaia 数据";
  }
}

function createGaiaStarItems(
  index: readonly GaiaIndexedStar[],
  query: string,
): AtlasNavigatorItem[] {
  return searchGaiaStarIndex(index, query, 12).map((entry) => {
    const distancePc = 1000 / Math.max(entry.star.parallaxMas, 0.001);
    return {
      id: `gaia-star:${entry.sourceId}`,
      kind: "gaia-star",
      action: "focus-gaia-star",
      title: entry.displayName,
      subtitle: `Gaia DR3 / G ${entry.star.magG.toFixed(2)}`,
      source: "packaged-gaia-dr3-bright-5000",
      primaryMetric: `${distancePc.toFixed(2)} pc; BP-RP ${entry.star.colorBpRp.toFixed(2)}`,
      actionLabel: "聚焦 + 护照",
      keywords: entry.aliases,
      priority: entry.namedCatalogId ? 88 : 54,
      gaiaSourceId: entry.sourceId,
      catalogObjectId: entry.id,
    };
  });
}

function createSolarBodyItems(): AtlasNavigatorItem[] {
  return SOLAR_SYSTEM_BODIES.map((body, bodyIndex) => {
    const title = SOLAR_BODY_TITLES[body.id] ?? toTitleCase(body.id);
    return {
      id: `solar-body:${body.id}`,
      kind: "solar-body",
      action: "focus-body",
      title,
      subtitle: body.variant === "sun" ? "太阳系主星" : "太阳系天体",
      source: "J2000 local ephemeris / live solar-system state",
      primaryMetric: `${body.id}; visual radius ${formatNumber(body.radiusScene)}`,
      actionLabel: "聚焦天体",
      keywords: [body.id, body.name, SOLAR_BODY_TITLES[body.id] ?? "", body.variant, toTitleCase(body.id)],
      priority: body.variant === "sun" ? 86 : solarBodyPriority(body.id),
      bodyId: body.id,
      bodyIndex,
    };
  });
}

function createCelestialObjectItems(): AtlasNavigatorItem[] {
  return CELESTIAL_CATALOG_ENTRIES.map((entry) => ({
    id: `celestial-object:${entry.id}`,
    kind: "celestial-object",
    action: "focus-catalog-object",
    title: celestialDisplayNameZh(entry),
    subtitle: `${celestialKindLabelZh(entry.kind)} / ${entry.catalogName}`,
    source: entry.source,
    primaryMetric: entry.metadata,
    actionLabel: "聚焦 + 护照",
    keywords: [
      entry.id,
      entry.sourceId,
      entry.primaryName,
      entry.catalogName,
      entry.subtitle,
      entry.searchText,
      celestialSearchTextZh(entry),
      kindLabel(entry.kind),
      distanceKeyword(entry),
    ],
    priority: catalogPriority(entry),
    catalogObjectId: entry.id,
  }));
}

function createEvidenceClaimItems(
  evidenceLedgerSummary: EvidenceLedgerSummary | null | undefined,
): AtlasNavigatorItem[] {
  return (evidenceLedgerSummary?.claims ?? []).map((claim) => ({
    id: `evidence-claim:${claim.id}`,
    kind: "evidence-claim",
    action: "open-evidence-claim",
    title: claim.title,
    subtitle: `${claim.group}; ${claim.confidence}`,
    source: claim.source,
    primaryMetric: claim.metric,
    actionLabel: "Open evidence",
    keywords: [
      claim.id,
      claim.group,
      claim.model,
      claim.error,
      claim.boundary,
      ...claim.passport.sourceChain,
      ...claim.passport.formulas.map((formula) => formula.label),
    ],
    priority: evidencePriority(claim),
    evidenceClaimId: claim.id,
  }));
}

function createPanelActionItems(orbitAnalysisAvailable: boolean): AtlasNavigatorItem[] {
  return [
    panelAction({
      id: "panel:observational-astrophysics",
      panelId: "observational-astrophysics",
      title: "观测天体物理实验室",
      subtitle: "HR 图、系外行星凌日与径向速度对照",
      source: "Gaia DR3 / NASA Exoplanet Archive / v144 worker models",
      primaryMetric: "Measured / derived / display-assumption provenance",
      actionLabel: "打开观测实验室",
      keywords: ["观测", "天体物理", "HR", "Hertzsprung Russell", "凌日", "transit", "径向速度", "radial velocity", "系外行星"],
      priority: 97.5,
    }),
    panelAction({
      id: "panel:mission-hub",
      panelId: "mission-hub",
      title: "Mission Hub",
      subtitle: "Scientific session memory",
      source: "Atlas Mission Hub v26",
      primaryMetric: "Current context / recents / pinned targets",
      actionLabel: "Open hub",
      keywords: [
        "mission",
        "mission hub",
        "recent",
        "recents",
        "pinned",
        "pin",
        "session",
        "continue",
        "scientific session",
      ],
      priority: 100,
    }),
    panelAction({
      id: "panel:observatory-deck",
      panelId: "observatory-deck",
      title: "Observatory Deck",
      subtitle: "Four-zone scientific control workbench",
      source: "Atlas Observatory Deck v31",
      primaryMetric: "Current target / trust matrix / mission path / report export",
      actionLabel: "Open deck",
      keywords: [
        "observatory",
        "observatory deck",
        "deck",
        "workbench",
        "control room",
        "dashboard",
        "science dashboard",
        "scientific control",
        "control workbench",
      ],
      priority: 99.5,
    }),
    panelAction({
      id: "panel:scientific-report",
      panelId: "scientific-report",
      title: "Report Studio",
      subtitle: "Printable evidence dossier export",
      source: "Report Studio v29 / Scientific Report v28",
      primaryMetric: "Markdown / JSON / printable HTML over Mission Capsule and Evidence Ledger",
      actionLabel: "Open studio",
      keywords: [
        "report",
        "report studio",
        "scientific report",
        "evidence report",
        "dossier",
        "printable dossier",
        "printable html",
        "html report",
        "export report",
        "markdown",
        "json",
        "html",
        "provenance report",
      ],
      priority: 99,
    }),
    panelAction({
      id: "panel:validation-console",
      panelId: "validation-console",
      title: "Validation Console",
      subtitle: "Trust matrix and readiness issues",
      source: "Validation Console v30",
      primaryMetric: "Ready / pending / failed domains; blockers / warnings / info",
      actionLabel: "Open console",
      keywords: [
        "validation",
        "validation console",
        "中文界面",
        "中文 ui",
        "星空背景",
        "银河背景",
        "星云",
        "星座",
        "深空美术",
        "deep space fidelity",
        "trust matrix",
        "quality console",
        "readiness",
        "status matrix",
        "blocker",
        "warning",
        "scientific readiness",
        "release candidate",
        "release gate",
        "rc gate",
        "hardening",
        "browser acceptance",
        "playwright smoke",
        "desktop mobile",
        "regression gate",
        "accessibility",
        "keyboard navigation",
        "reduced motion",
        "wcag",
        "aa audit",
        "visual polish",
        "cinematic ui",
        "art direction",
        "universe sandbox",
        "aaa visual",
        "planet closeup",
        "planet realism",
        "earth detail",
        "sun surface",
        "deep space backdrop",
        "sky fidelity",
        "universe background",
        "cinematic lighting",
        "filmic exposure",
        "post fx",
        "color grading",
        "closeup composition",
        "planet lighting",
        "3a画质",
        "3a 画质",
        "电影级构图",
        "深空镜头",
        "宇宙沙盒质感",
        "背景降噪",
        "目标分离",
        "cinematic camera",
        "deep space camera",
        "宇宙沙盒背景",
        "背景对比",
        "3a背景",
        "星空标杆",
        "银河质感",
        "深空层次",
        "reference backdrop",
        "sandbox reference",
        "sky benchmark",
        "3A美术",
        "科研模拟画质",
        "背景合成",
        "银河暗带",
        "星噪控制",
        "主体负空间",
        "reference grade",
        "space art direction",
        "cinematic composite",
        "星体材质",
        "行星近景",
        "土星环",
        "木星条带",
        "地球云层",
        "太阳颗粒",
        "planet material",
        "body closeup",
        "ring fidelity",
        "近景导演",
        "星体构图",
        "土星环构图",
        "巨行星近景",
        "3A近景",
        "镜头避让",
        "主体构图",
        "closeup director",
        "planet composition",
        "saturn showcase",
        "gas giant portrait",
        "subject composition",
        "key light",
        "phase director",
        "planet phase",
        "gas giant lighting",
        "saturn lighting",
        "ring exposure",
        "body key light",
        "readable phase",
        "planet depth lighting",
        "depth lighting",
        "terminator depth",
        "atmosphere rim",
        "ring shadow",
        "saturn ring shadow",
        "gas band depth",
        "planetary depth",
        "planet color grade",
        "color grading planet",
        "gas layer color",
        "saturn occlusion tone",
        "earth color depth",
        "jupiter color depth",
        "numerical integrity",
        "physics benchmark",
        "time reversal",
        "timestep sensitivity",
        "energy drift",
        "angular momentum drift",
        "3A星体",
        "3A背景",
        "宇宙沙盒对比",
        "气态巨行星",
        "土星环质感",
        "地球夜面",
        "太阳表面",
        "整体调色",
        "planetary art direction",
        "cinematic planet grade",
        "universe sandbox look",
        "宇宙背景",
        "3A宇宙背景",
        "深空背景",
        "银河暗带",
        "背景星噪",
        "NASA星图",
        "星云背景",
        "电影级背景",
        "universe sandbox backdrop",
        "deep-space backdrop",
        "NASA star map",
        "3A深空",
        "稀疏星空",
        "宇宙沙盒背景升级",
        "NASA 16K星图",
        "银河暗带增强",
        "主体负空间",
        "sparse deep space",
        "16k star map",
        "starfield director",
        "近景一致性",
        "右侧预览",
        "太阳背景修复",
        "行星可读性",
        "closeup preview",
        "solar backdrop fix",
        "planet readability",
        "数值审计",
        "时间步敏感性",
        "时间反演",
        "守恒漂移",
        "行星调色",
        "气态层流",
        "土星遮挡色调",
        "木星色彩层次",
        "行星深度光照",
        "大气边缘",
        "终结线层次",
        "土星环影",
        "木星带状层次",
        "主光",
        "相位光",
        "行星补光",
        "巨行星补光",
        "土星环曝光",
      ],
      priority: 98.5,
    }),
    panelAction({
      id: "panel:atlas-workflows",
      panelId: "atlas-workflows",
      title: "Atlas Workflows",
      subtitle: "Guided scientific mission paths",
      source: "Atlas Workflows v25",
      primaryMetric: "Solar validation / Kerr workflow / Relativity tour / Deep sky / FRW / Gaia",
      actionLabel: "Open workflows",
      keywords: [
        "workflow",
        "workflows",
        "mission",
        "guided science",
        "relativity tour",
        "guided relativity",
        "science story",
        "observable walkthrough",
        "kerr workflow",
        "deep sky workflow",
        "frw workflow",
        "gaia workflow",
        "atlas workflows",
      ],
      priority: 98,
    }),
    panelAction({
      id: "panel:evidence-ledger",
      panelId: "evidence-ledger",
      title: "Evidence Ledger",
      subtitle: "Global scientific provenance",
      source: "Evidence Ledger v21",
      primaryMetric: "Claim passports: source / model / metric / boundary",
      actionLabel: "Open ledger",
      keywords: ["proof", "claims", "passport", "science provenance"],
      priority: 97,
    }),
    panelAction({
      id: "panel:kerr-relativity-lab",
      panelId: "kerr-lab",
      title: "Kerr 相对论工作室",
      subtitle: "基于 Kerr 测地线轨迹的强场实验面板",
      source: "Kerr geodesic kernel v17 / Relativity Studio v35",
      primaryMetric: "Null probe, ISCO split, 4M/b and Hamiltonian drift",
      actionLabel: "打开工作室",
      keywords: [
        "Kerr",
        "相对论",
        "黑洞",
        "强场",
        "测地线",
        "black hole",
        "spin",
        "impact parameter",
        "geodesic",
        "strong field",
        "kerr relativity studio",
        "relativity lab",
      ],
      priority: 96,
    }),
    panelAction({
      id: "panel:relativity-observables",
      panelId: "relativity-observables",
      title: "相对论核心 / Observable Atlas",
      subtitle: "集中查看 EIH 1PN、弱场检验、Kerr 和数值健康读数",
      source: `Relativity Observable Atlas ${RELATIVITY_OBSERVABLE_ATLAS_VERSION}`,
      primaryMetric: "Mercury / light deflection / Shapiro / clocks / Kerr 4M/b / ISCO / drift",
      actionLabel: "打开核心",
      keywords: [
        "相对论",
        "相对论核心",
        "广义相对论",
        "1PN",
        "EIH",
        "水星进动",
        "光偏折",
        "Shapiro",
        "Kerr",
        "黑洞",
        "relativity observables",
        "observable atlas",
        "science depth",
        "formula atlas",
        "relativity explainer",
        "formula steps",
        "derivation cards",
        "variable glossary",
        "mercury precession",
        "perihelion",
        "light deflection",
        "solar limb",
        "shapiro",
        "radar delay",
        "time dilation",
        "4m/b",
        "isco",
        "hamiltonian drift",
      ],
      priority: 96.5,
    }),
    panelAction({
      id: "panel:object-browser",
      panelId: "object-browser",
      title: "Object Browser",
      subtitle: "Categorized solar and celestial catalog browser",
      source: "Sandbox left panel",
      primaryMetric: "Solar / Nearby Stars / Constellations / Deep Sky",
      actionLabel: "Open browser",
      keywords: ["catalog", "left panel", "nearby stars", "deep sky"],
      priority: 94,
    }),
    panelAction({
      id: "panel:orbit-analysis",
      panelId: "orbit-analysis",
      title: "Orbit Analysis",
      subtitle: orbitAnalysisAvailable
        ? "Selected-body osculating diagnostics"
        : "Select a solar body in Orbit Atlas first",
      source: "Orbit Analysis sheet",
      primaryMetric: orbitAnalysisAvailable
        ? "Osculating diagnostics available for current body"
        : "Unavailable without a selected Orbit Atlas body",
      actionLabel: "Open analysis",
      keywords: ["osculating", "telemetry", "selected body", "orbit diagnostics"],
      priority: orbitAnalysisAvailable ? 88 : 46,
      disabled: !orbitAnalysisAvailable,
      disabledReason: "Select a solar body in Orbit Atlas before opening Orbit Analysis.",
    }),
    panelAction({
      id: "panel:view",
      panelId: "view-panel",
      title: "View Panel",
      subtitle: "Layer and display controls",
      source: "Sandbox view controls",
      primaryMetric: "Constellations / deep sky / labels / relativistic optics",
      actionLabel: "Open view",
      keywords: ["layers", "constellations", "catalog labels", "view settings"],
      priority: 84,
    }),
    panelAction({
      id: "panel:tools",
      panelId: "tools-panel",
      title: "Tools Panel",
      subtitle: "Simulation tools and provenance entrypoints",
      source: "Sandbox tools controls",
      primaryMetric: "Evidence ledger / export / import",
      actionLabel: "Open tools",
      keywords: ["tools", "export", "import", "settings"],
      priority: 83,
    }),
  ];
}

function panelAction(args: {
  id: string;
  panelId: AtlasNavigatorPanelId;
  title: string;
  subtitle: string;
  source: string;
  primaryMetric: string;
  actionLabel: string;
  keywords: readonly string[];
  priority: number;
  disabled?: boolean;
  disabledReason?: string;
}): AtlasNavigatorItem {
  return {
    ...args,
    kind: "panel-action",
    action: "open-panel",
  };
}

function rankItems(items: readonly AtlasNavigatorItem[], query: string): AtlasNavigatorItem[] {
  const terms = normalize(query).split(" ").filter(Boolean);
  const scored = items.flatMap((item) => {
    const score = scoreItem(item, query, terms);
    return score == null ? [] : [{ item, score }];
  });

  return scored
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.item.priority !== a.item.priority) return b.item.priority - a.item.priority;
      if (KIND_RANK[a.item.kind] !== KIND_RANK[b.item.kind]) {
        return KIND_RANK[a.item.kind] - KIND_RANK[b.item.kind];
      }
      return a.item.title.localeCompare(b.item.title);
    })
    .map((scoredItem) => scoredItem.item);
}

function scoreItem(
  item: AtlasNavigatorItem,
  query: string,
  terms: readonly string[],
): number | null {
  if (terms.length === 0) return item.priority;

  const normalizedTitle = normalize(item.title);
  const normalizedId = normalize(item.id);
  const normalizedText = normalize(
    [
      item.id,
      item.kind,
      item.action,
      item.title,
      item.subtitle,
      item.source,
      item.primaryMetric,
      item.actionLabel,
      item.keywords.join(" "),
    ].join(" "),
  );

  if (!terms.every((term) => normalizedText.includes(term))) return null;

  const normalizedQuery = normalize(query);
  let score = item.priority;
  if (normalizedTitle === normalizedQuery) score += 420;
  else if (normalizedTitle.startsWith(normalizedQuery)) score += 240;
  else if (normalizedTitle.includes(normalizedQuery)) score += 150;
  if (normalizedId.includes(normalizedQuery)) score += 90;
  if (item.keywords.some((keyword) => normalize(keyword) === normalizedQuery)) score += 260;
  score += terms.length * 18;
  return score;
}

function evidencePriority(claim: EvidenceClaim): number {
  if (claim.id === "kerr-geodesic-lab") return 93;
  if (claim.id === "frw-planck2018-lcdm") return 92;
  if (claim.id === "celestial-catalog-atlas") return 91;
  if (claim.id === "solar-eih-1pn-horizons") return 90;
  if (claim.status === "failed") return 74;
  if (claim.status === "ready") return 86;
  return 72;
}

function solarBodyPriority(bodyId: string): number {
  if (bodyId === "earth") return 85;
  if (bodyId === "mars") return 84;
  if (bodyId === "jupiter") return 82;
  if (bodyId === "saturn") return 81;
  if (bodyId === "moon") return 80;
  return 58;
}

function catalogPriority(entry: CelestialCatalogEntry): number {
  return (
    FEATURED_CATALOG_PRIORITY.get(entry.id) ??
    Math.max(35, Math.min(72, (entry.labelPriority ?? 0) + 50))
  );
}

function distanceKeyword(entry: CelestialCatalogEntry): string {
  if (entry.distancePc == null) return "";
  if (entry.distancePc >= 1_000_000) return `${(entry.distancePc / 1_000_000).toFixed(1)} mpc`;
  if (entry.distancePc >= 1_000) return `${(entry.distancePc / 1_000).toFixed(1)} kpc`;
  return `${entry.distancePc.toFixed(1)} pc`;
}

function kindLabel(kind: CelestialCatalogEntry["kind"]): string {
  return kind
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function toTitleCase(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "n/a";
  if (Math.abs(value) >= 10) return value.toFixed(1);
  return value.toFixed(3);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u3400-\u9fff+./:-]+/g, " ")
    .trim();
}
