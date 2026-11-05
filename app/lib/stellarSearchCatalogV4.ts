import type { StellarSearchDocument } from "./stellarSearchCatalog";

export const STELLAR_CATALOG_V4_VERSION = "v125-catalog-architecture-universal-search" as const;
export const STELLAR_CATALOG_V4_MANIFEST_URL = "/data/stellar-search-v4/manifest.json";

export type StellarCrossmatchProvenance =
  | "explicit-hip-gaia-best-neighbour"
  | "native-gaia-source-id"
  | "not-crossmatched";
export type StellarParameterCompleteness = "full" | "photometric" | "catalog-basic";

export type StellarSearchDocumentV4 = StellarSearchDocument & {
  catalogKey: string;
  documentShardId: string;
  gaiaSourceId: string | null;
  hipId: string | null;
  hdId: string | null;
  hrId: string | null;
  gjId: string | null;
  spectralType: string | null;
  properMotionRaMasYr: number | null;
  properMotionDecMasYr: number | null;
  radialVelocityKmS: number | null;
  exoplanetSystemId?: string;
  crossmatchProvenance: StellarCrossmatchProvenance;
  parameterCompleteness: StellarParameterCompleteness;
  provenance: readonly string[];
};

export type StellarAliasPostingV4 = {
  alias: string;
  normalizedAlias: string;
  documentKey: string;
  documentShardId: string;
};
export type StellarDocumentShardV4 = { id: string; path: string; rowCount: number; sha256: string };
export type StellarPostingShardV4 = { prefix: string; path: string; rowCount: number; sha256: string };
export type StellarCatalogV4Manifest = {
  version: typeof STELLAR_CATALOG_V4_VERSION;
  rowCount: number;
  namedCatalogCount: number;
  exoplanetHostCount: number;
  crossmatchedGaiaCount: number;
  documentShardSize: number;
  runtimePolicy: "offline-alias-posting-document-range-shards";
  generatedAt: string;
  documents: readonly StellarDocumentShardV4[];
  postings: readonly StellarPostingShardV4[];
  provenance: readonly { source: string; url: string; sha256: string }[];
};

export function normalizeUniversalSearchAlias(value: string): string {
  return value.trim().toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u3400-\u9fff]+/g, " ").trim();
}
export function universalSearchPrefix(value: string): string {
  const compact = normalizeUniversalSearchAlias(value).replace(/\s+/g, "");
  if (!compact) return "__";
  if (!/^[a-z0-9]/.test(compact)) return "unicode";
  return compact.slice(0, 2).padEnd(2, "_");
}
