import type { CatalogObjectV5 } from "./catalogV5";
import { atlasPublicAssetUrl } from "./atlasDeliveryProfile";
import type {
  StellarCatalogV4Manifest,
  StellarDocumentShardV4,
  StellarPostingShardV4,
} from "./stellarSearchCatalogV4";

export const CATALOG_LITE_V6_VERSION = "v142-catalog-lite-v6" as const;
export const CATALOG_MILLION_V6_VERSION = "v142-catalog-million-v6" as const;
export const CATALOG_LITE_V6_MANIFEST_URL = atlasPublicAssetUrl("data/catalog-lite-v6/manifest.json");
export const CATALOG_PACK_STATE_DB = "atlas-catalog-pack-v6";
export const CATALOG_PACK_ACTIVE_KEY = "active";
export const CATALOG_MILLION_OPFS_FILENAME = "catalog-million-v6.sqlite";

export type CatalogLiteManifestV6 = Omit<
  StellarCatalogV4Manifest,
  "version" | "runtimePolicy" | "documents" | "postings"
> & {
  version: typeof CATALOG_LITE_V6_VERSION;
  sourceVersion: StellarCatalogV4Manifest["version"];
  runtimePolicy: "gzip-json-alias-posting-document-shards";
  compression: "gzip-json";
  compressedBytes: number;
  documents: readonly (StellarDocumentShardV4 & { compressedBytes: number })[];
  postings: readonly (StellarPostingShardV4 & { compressedBytes: number })[];
};

export type WebCatalogPackChunk = {
  index: number;
  path: string;
  offset: number;
  bytes: number;
  sha256: string;
};

export type WebCatalogPackManifestV2 = {
  schemaVersion: 2;
  version: typeof CATALOG_MILLION_V6_VERSION;
  sqliteSchemaVersion: 1;
  rowCount: number;
  parameterRichCount: number;
  installedBytes: number;
  sha256: string;
  chunkBytes: number;
  chunks: readonly WebCatalogPackChunk[];
  baseUrl: string;
  runtimePolicy: "opfs-sqlite-wasm-dedicated-worker-direct-oo1";
  sourceManifest: string;
  provenance: readonly string[];
};

export type CatalogPackInstallState = {
  version: typeof CATALOG_MILLION_V6_VERSION;
  status: "not-installed" | "checking-space" | "downloading" | "verifying" | "installed" | "corrupt" | "insufficient-space";
  completedChunks: number;
  totalChunks: number;
  downloadedBytes: number;
  installedBytes: number;
  activeFilename: string | null;
  error: string | null;
};

export type CatalogSearchResultV6 = Pick<
  CatalogObjectV5,
  | "id"
  | "objectType"
  | "displayName"
  | "designation"
  | "raDeg"
  | "decDeg"
  | "gaiaSourceId"
  | "magG"
  | "bpRp"
  | "parallaxMas"
  | "teffK"
  | "logg"
  | "radiusSolar"
  | "spectralType"
  | "dataTier"
  | "exoplanetSystemId"
> & { matchKind: "exact-id" | "name" | "designation" | "cone" };

export type CatalogWorkerRequestV6 =
  | { type: "install-status"; requestId: number }
  | { type: "open-database"; requestId: number; filename?: string }
  | { type: "query"; requestId: number; query: string; maxResults: number }
  | { type: "get-by-id"; requestId: number; id: string }
  | { type: "cone-search"; requestId: number; raDeg: number; decDeg: number; radiusDeg: number; maxResults: number };

export type CatalogWorkerResponseV6 =
  | { type: "install-status"; requestId: number; state: CatalogPackInstallState | null }
  | { type: "database-opened"; requestId: number; filename: string; rowCount: number }
  | { type: "query-result"; requestId: number; query: string; results: readonly CatalogSearchResultV6[]; source: "catalog-million-v6" | "catalog-million-v7" | "catalog-lite-v6" }
  | { type: "query-error"; requestId: number; query: string; message: string };

export function validateWebCatalogPackManifest(
  manifest: WebCatalogPackManifestV2,
): readonly string[] {
  const errors: string[] = [];
  if (manifest.schemaVersion !== 2) errors.push("unsupported-schema");
  if (manifest.rowCount < 1_000_000) errors.push("catalog-below-one-million");
  if (manifest.installedBytes > 360 * 1024 * 1024) errors.push("catalog-over-360-mib");
  if (manifest.chunkBytes > 16 * 1024 * 1024) errors.push("chunk-over-16-mib");
  if (!/^[a-f0-9]{64}$/.test(manifest.sha256)) errors.push("invalid-full-checksum");
  if (manifest.chunks.some((chunk, index) => chunk.index !== index || chunk.bytes > manifest.chunkBytes || !/^[a-f0-9]{64}$/.test(chunk.sha256))) errors.push("invalid-chunk-table");
  const contiguous = manifest.chunks.every((chunk, index) => chunk.offset === manifest.chunks.slice(0, index).reduce((sum, entry) => sum + entry.bytes, 0));
  if (!contiguous || manifest.chunks.reduce((sum, chunk) => sum + chunk.bytes, 0) !== manifest.installedBytes) errors.push("non-contiguous-pack");
  return errors;
}
