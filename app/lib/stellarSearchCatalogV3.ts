import type { StellarSearchDocument, StellarSearchResult } from "./stellarSearchCatalog";

export const STELLAR_CATALOG_V3_VERSION = "v121-named-stellar-catalog-v3" as const;
export const STELLAR_CATALOG_V3_MANIFEST_URL = "/data/stellar-search-v3/manifest.json";

export type StellarSearchDocumentV3 = StellarSearchDocument & {
  catalogKey: string;
  gaiaSourceId: string | null;
  spectralType: string | null;
  properMotionRaMasYr: number | null;
  properMotionDecMasYr: number | null;
  radialVelocityKmS: number | null;
  provenance: readonly ("hyg-v4.1" | "gaia-dr3" | "curated-alias")[];
};

export type StellarAliasPosting = { alias: string; documentKey: string };
export type StellarCatalogV3PrefixShard = { prefix: string; documentPath: string; postingPath: string; rowCount: number; aliasCount: number; sha256: string };
export type StellarCatalogV3Manifest = {
  version: typeof STELLAR_CATALOG_V3_VERSION;
  rowCount: number;
  namedCatalogCount: number;
  runtimePolicy: "offline-prefix-and-source-range-shards";
  generatedAt: string;
  provenance: readonly { source: string; url: string; license: string; sha256: string }[];
  prefixShards: readonly StellarCatalogV3PrefixShard[];
  gaiaManifestPath: string;
};

export type StellarSearchWorkerRequestV3 =
  | { type: "init-manifest" }
  | { type: "load-prefix"; prefix: string }
  | { type: "load-source-range"; sourceId: string }
  | { type: "get-by-id"; requestId: number; id: string }
  | { type: "query"; requestId: number; query: string; maxResults: number };

export type StellarSearchWorkerResponseV3 =
  | { type: "query-result"; requestId: number; query: string; results: StellarSearchResult[] }
  | { type: "query-error"; requestId: number; query: string; message: string };

export function stellarPrefix(query: string): string {
  const normalized = query.trim().toLocaleLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\u4e00-\u9fff]+/g, "");
  if (!normalized) return "_";
  const first = normalized[0]!;
  return /[a-z0-9]/.test(first) ? first : "unicode";
}
