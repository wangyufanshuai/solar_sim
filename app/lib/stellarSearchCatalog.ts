import type { GaiaStarRecord } from "../data/gaiaStarCatalog";
import type { GaiaIndexedStar } from "./gaiaCatalogIndex";

export const STELLAR_SEARCH_CATALOG_VERSION =
  "v116-offline-stellar-search-catalog-v2" as const;
export const STELLAR_SEARCH_CATALOG_MANIFEST_URL =
  "/data/stellar-search/manifest.json";

export type StellarSearchMatchKind =
  | "exact-id"
  | "alias"
  | "gaia-data"
  | "curated-local";

export type StellarSearchDocument = {
  sourceId: string;
  designation: string;
  displayName: string;
  aliases: readonly string[];
  raDeg: number;
  decDeg: number;
  parallaxMas: number | null;
  magG: number;
  bpRp: number | null;
  ruwe: number | null;
  teffK: number | null;
  teffLowerK?: number | null;
  teffUpperK?: number | null;
  logg: number | null;
  radiusSolar: number | null;
  metallicityDex?: number | null;
  luminositySolar?: number | null;
  astrophysicalFlags?: string | null;
  dataTier?: "parameter-rich" | "photometric-derived" | "catalog-basic";
  variable: boolean;
  source: "gaia-dr3" | "simbad-alias" | "curated-local" | "exoplanet-host";
  exoplanetSystemId?: string;
};

export type StellarSearchResult = {
  document: StellarSearchDocument;
  matchKind: StellarSearchMatchKind;
  score: number;
};

export type StellarSearchShardManifest = {
  id: string;
  path: string;
  rowCount: number;
  sourceIdMin: string;
  sourceIdMaxExclusive: string;
  sha256?: string;
};

export type StellarSearchManifest = {
  version: typeof STELLAR_SEARCH_CATALOG_VERSION;
  source: "ESA Gaia DR3 archive";
  sourceTable: "gaiadr3.gaia_source";
  generatedAt: string;
  rowCount: number;
  renderCatalogRowCount: 5000;
  runtimePolicy: "offline-sharded-no-runtime-network";
  aliasPath: string;
  shards: readonly StellarSearchShardManifest[];
};

export type StellarSearchWorkerRequest =
  | { type: "init-shard"; shardId: string }
  | { type: "query"; requestId: number; query: string; maxResults: number };

export type StellarSearchWorkerResponse =
  | { type: "query-result"; requestId: number; query: string; results: StellarSearchResult[] }
  | { type: "query-error"; requestId: number; query: string; message: string };

// Gaia source_id encodes a level-12 HEALPix index and occupies 3 * 2^61 IDs.
const SOURCE_ID_LIMIT = BigInt("6917529027641081856");

export function normalizeStellarSearchQuery(query: string): string {
  return query
    .trim()
    .toLocaleLowerCase()
    .replace(/^gaia\s+dr3\s+/i, "")
    .replace(/\s+/g, " ");
}

export function selectStellarSearchShard(
  manifest: StellarSearchManifest,
  sourceId: string,
): StellarSearchShardManifest | null {
  if (!/^\d{8,20}$/.test(sourceId)) return null;
  try {
    const value = BigInt(sourceId);
    if (value < BigInt(0) || value >= SOURCE_ID_LIMIT) return null;
    return (
      manifest.shards.find(
        (shard) =>
          value >= BigInt(shard.sourceIdMin) &&
          value < BigInt(shard.sourceIdMaxExclusive),
      ) ?? null
    );
  } catch {
    return null;
  }
}

export function searchStellarDocuments(
  documents: readonly StellarSearchDocument[],
  query: string,
  maxResults = 20,
): StellarSearchResult[] {
  const normalized = normalizeStellarSearchQuery(query);
  if (normalized.length < 2 || maxResults <= 0) return [];
  const numericQuery = /^\d{8,20}$/.test(normalized);
  const terms = normalized.split(" ").filter(Boolean);

  return documents
    .flatMap((document) => {
      const aliases = [
        document.sourceId,
        document.designation,
        document.displayName,
        ...document.aliases,
      ];
      const normalizedAliases = aliases.map((value) => value.toLocaleLowerCase());
      const haystack = normalizedAliases.join(" ");
      if (!terms.every((term) => haystack.includes(term))) return [];

      let matchKind: StellarSearchMatchKind = "gaia-data";
      let score = 100 - Math.min(60, document.magG * 3);
      if (document.sourceId === normalized) {
        matchKind = "exact-id";
        score += 1200;
      } else if (
        normalizedAliases.some((alias) => alias === normalized) ||
        document.displayName.toLocaleLowerCase() === normalized
      ) {
        matchKind = document.source === "curated-local" ? "curated-local" : "alias";
        score += 900;
      } else if (numericQuery && document.sourceId.includes(normalized)) {
        score += 500;
      } else if (haystack.startsWith(normalized)) {
        score += 260;
      }
      if (document.aliases.length > 0) score += 80;
      return [{ document, matchKind, score }];
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.document.magG - b.document.magG ||
        a.document.sourceId.localeCompare(b.document.sourceId),
    )
    .slice(0, maxResults);
}

export function stellarDocumentToGaiaIndex(
  document: StellarSearchDocument,
): GaiaIndexedStar {
  const star: GaiaStarRecord = {
    sourceId: document.sourceId,
    raDeg: document.raDeg,
    decDeg: document.decDeg,
    parallaxMas: document.parallaxMas ?? 0.001,
    magG: document.magG,
    colorBpRp: document.bpRp ?? 0.82,
  };
  const aliases = [
    document.sourceId,
    document.designation,
    document.displayName,
    ...document.aliases,
  ];
  return {
    id: stellarDocumentCatalogId(document),
    sourceId: document.sourceId,
    star,
    displayName: document.displayName || `Gaia ...${document.sourceId.slice(-8)}`,
    shortLabel: document.displayName || `Gaia ...${document.sourceId.slice(-8)}`,
    aliases,
    searchText: aliases.join(" ").toLocaleLowerCase(),
    namedCatalogId: null,
    stellarParameters: {
      teffK: document.teffK,
      teffLowerK: document.teffLowerK ?? null,
      teffUpperK: document.teffUpperK ?? null,
      logg: document.logg,
      radiusSolar: document.radiusSolar,
      metallicityDex: document.metallicityDex ?? null,
      luminositySolar: document.luminositySolar ?? null,
      dataTier: document.dataTier ?? null,
      variable: document.variable,
      spectralType: "spectralType" in document ? String(document.spectralType ?? "") || null : null,
    },
  };
}

export function stellarDocumentCatalogId(document: StellarSearchDocument): string {
  if (/^\d{10,22}$/.test(document.sourceId)) return `gaia-dr3:${document.sourceId}`;
  if (/^hyg:\d+$/i.test(document.sourceId)) return document.sourceId.toLocaleLowerCase();
  if (document.source === "exoplanet-host") return `exoplanet-host:${document.sourceId}`;
  if (document.source === "curated-local") return `curated-star:${document.sourceId}`;
  return `stellar-catalog:${document.sourceId}`;
}
