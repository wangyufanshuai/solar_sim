import type { GaiaScienceQualityTierV8 } from "./gaiaScienceV8";

export const GAIA_RESEARCH_WORKBENCH_VERSION = "v267-gaia-research-workbench-v1" as const;
export const GAIA_RESEARCH_RESPONSE_MAX_BYTES = 2 * 1024 * 1024;
export const GAIA_RESEARCH_G_EDGES = [-5, 6, 9, 12, 15, 17, 19, 22] as const;
export const GAIA_RESEARCH_COLOR_EDGES = [-2, 0, 0.8, 1.5, 2.5, 6] as const;
export const GAIA_RESEARCH_RUWE_LIMITS = [1.2, 1.4, 2] as const;
export const GAIA_RESEARCH_QUALITY_TIERS = ["gold", "silver", "limited"] as const;

export type GaiaResearchFiltersV267 = {
  qualityTiers: readonly GaiaScienceQualityTierV8[];
  gMin: number;
  gMax: number;
  bpRpMin: number;
  bpRpMax: number;
  ruweMax: 1.2 | 1.4 | 2 | null;
};

export type GaiaResearchQueryV267 =
  | { kind: "overview"; filters?: Partial<GaiaResearchFiltersV267> }
  | { kind: "healpix-density"; order: 3 | 5; filters?: Partial<GaiaResearchFiltersV267> }
  | { kind: "hr-density"; bins: 64 | 128; filters?: Partial<GaiaResearchFiltersV267> }
  | { kind: "selection"; order: 3 | 5; filters?: Partial<GaiaResearchFiltersV267> };

export type GaiaResearchOverviewV267 = {
  kind: "overview";
  frozenRows: number;
  matchedRows: number;
  qualityCounts: Readonly<Record<GaiaScienceQualityTierV8, number>>;
  hrEligibleRows: number;
  motherEligibleRows: number;
  gaiaSurveyCompleteness: "unavailable";
};

export type GaiaResearchDensityCellV267 = { cell: number; count: number };
export type GaiaResearchHrBinV267 = { x: number; y: number; count: number };
export type GaiaResearchSelectionCellV267 = {
  cell: number;
  selected: number;
  mother: number;
  inclusionFraction: number | null;
};

export type GaiaResearchPayloadV267 =
  | GaiaResearchOverviewV267
  | { kind: "healpix-density"; order: 3 | 5; cells: readonly GaiaResearchDensityCellV267[] }
  | { kind: "hr-density"; bins: 64 | 128; cells: readonly GaiaResearchHrBinV267[]; xDomain: readonly [-2, 6]; yDomain: readonly [-10, 20] }
  | { kind: "selection"; order: 3 | 5; cells: readonly GaiaResearchSelectionCellV267[]; selected: number; mother: number; inclusionFraction: number | null };

export type GaiaResearchResponseV267 = {
  version: typeof GAIA_RESEARCH_WORKBENCH_VERSION;
  canonical: true;
  source: "frozen-gaia-science-v8-derived-v267";
  query: GaiaResearchQueryV267 & { filters: GaiaResearchFiltersV267 };
  payload: GaiaResearchPayloadV267;
  provenance: {
    aggregateSha256: string;
    scienceSourceSha256: string;
    motherCatalogSha256: string;
    generatedAt: string;
  };
  boundary: "frozen-subset-analysis-not-gaia-survey-completeness-or-physics";
};

export type GaiaResearchWorkbenchStateV267 = {
  status: "idle" | "loading" | "ready" | "blocked";
  activeView: GaiaResearchQueryV267["kind"] | "single-star";
  filters: GaiaResearchFiltersV267;
  response: GaiaResearchResponseV267 | null;
  error: string;
};

const DEFAULT_FILTERS: GaiaResearchFiltersV267 = {
  qualityTiers: GAIA_RESEARCH_QUALITY_TIERS,
  gMin: GAIA_RESEARCH_G_EDGES[0],
  gMax: GAIA_RESEARCH_G_EDGES.at(-1)!,
  bpRpMin: GAIA_RESEARCH_COLOR_EDGES[0],
  bpRpMax: GAIA_RESEARCH_COLOR_EDGES.at(-1)!,
  ruweMax: null,
};

export function createDefaultGaiaResearchFiltersV267(): GaiaResearchFiltersV267 {
  return { ...DEFAULT_FILTERS, qualityTiers: [...DEFAULT_FILTERS.qualityTiers] };
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Gaia research query must be an object");
  return value as Record<string, unknown>;
}

function allowedEdge(value: unknown, edges: readonly number[], fallback: number): number {
  if (value === undefined) return fallback;
  if (typeof value !== "number" || !edges.includes(value)) throw new Error("Gaia research filter must use a canonical bin edge");
  return value;
}

export function parseGaiaResearchQueryV267(value: unknown): GaiaResearchQueryV267 & { filters: GaiaResearchFiltersV267 } {
  const root = object(value);
  const allowedRoot = new Set(["kind", "order", "bins", "filters"]);
  if (Object.keys(root).some((key) => !allowedRoot.has(key))) throw new Error("Gaia research query contains an unsupported field");
  const kind = root.kind;
  if (kind !== "overview" && kind !== "healpix-density" && kind !== "hr-density" && kind !== "selection") {
    throw new Error("Gaia research query kind is unsupported");
  }
  const filterInput = root.filters === undefined ? {} : object(root.filters);
  const allowedFilters = new Set(["qualityTiers", "gMin", "gMax", "bpRpMin", "bpRpMax", "ruweMax"]);
  if (Object.keys(filterInput).some((key) => !allowedFilters.has(key))) throw new Error("Gaia research filters contain an unsupported field");
  const qualityTiers = filterInput.qualityTiers === undefined
    ? [...DEFAULT_FILTERS.qualityTiers]
    : Array.isArray(filterInput.qualityTiers)
      ? Array.from(new Set(filterInput.qualityTiers))
      : [];
  if (!qualityTiers.length || qualityTiers.some((tier) => !GAIA_RESEARCH_QUALITY_TIERS.includes(tier as GaiaScienceQualityTierV8))) {
    throw new Error("Gaia research quality tiers are invalid");
  }
  const gMin = allowedEdge(filterInput.gMin, GAIA_RESEARCH_G_EDGES, DEFAULT_FILTERS.gMin);
  const gMax = allowedEdge(filterInput.gMax, GAIA_RESEARCH_G_EDGES, DEFAULT_FILTERS.gMax);
  const bpRpMin = allowedEdge(filterInput.bpRpMin, GAIA_RESEARCH_COLOR_EDGES, DEFAULT_FILTERS.bpRpMin);
  const bpRpMax = allowedEdge(filterInput.bpRpMax, GAIA_RESEARCH_COLOR_EDGES, DEFAULT_FILTERS.bpRpMax);
  if (gMin >= gMax || bpRpMin >= bpRpMax) throw new Error("Gaia research filter ranges are empty");
  const ruweMax = filterInput.ruweMax === undefined || filterInput.ruweMax === null
    ? null
    : GAIA_RESEARCH_RUWE_LIMITS.includes(filterInput.ruweMax as 1.2 | 1.4 | 2)
      ? filterInput.ruweMax as 1.2 | 1.4 | 2
      : undefined;
  if (ruweMax === undefined) throw new Error("Gaia research RUWE limit is invalid");
  const filters = { qualityTiers: qualityTiers as GaiaScienceQualityTierV8[], gMin, gMax, bpRpMin, bpRpMax, ruweMax };
  if (kind === "overview") return { kind, filters };
  if (kind === "hr-density") {
    if (root.bins !== 64 && root.bins !== 128) throw new Error("Gaia HR density bins must be 64 or 128");
    return { kind, bins: root.bins, filters };
  }
  if (root.order !== 3 && root.order !== 5) throw new Error("Gaia HEALPix order must be 3 or 5");
  return { kind, order: root.order, filters };
}

export function gaiaResearchBinRangeV267(valueMin: number, valueMax: number, edges: readonly number[]): readonly [number, number] {
  const first = edges.indexOf(valueMin);
  const last = edges.indexOf(valueMax);
  if (first < 0 || last <= first) throw new Error("Gaia research range is not aligned to canonical edges");
  return [first, last - 1];
}

export function atlasSubsetInclusionV267(selected: number, mother: number): number | null {
  return mother > 0 ? selected / mother : null;
}
