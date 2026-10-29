import type { StellarDataTier } from "./atlasReleaseProgram";

export const CATALOG_V7_VERSION = "v148-gaia-astrophysical-catalog-v7" as const;
export const CATALOG_V7_MINIMUM_ROWS = 1_224_219;
export const CATALOG_V7_MINIMUM_PARAMETER_RICH = 180_000;
export const CATALOG_V7_MINIMUM_PRIORITY_RICH = 15_000;
export const CATALOG_MILLION_V7_OPFS_FILENAME = "catalog-million-v7.sqlite";
export const CATALOG_MILLION_V7_MANIFEST_VERSION = "v148-catalog-million-v7" as const;

export type StellarParameterInterval = {
  value: number | null;
  lower: number | null;
  upper: number | null;
  unit: string;
};

export type StellarAstrophysicalParametersV2 = {
  sourceId: string;
  teffK: StellarParameterInterval;
  loggDex: StellarParameterInterval;
  metallicityDex: StellarParameterInterval;
  distancePc: StellarParameterInterval;
  extinctionMag: StellarParameterInterval;
  radiusSolar: StellarParameterInterval;
  luminositySolar: StellarParameterInterval;
  massSolar: StellarParameterInterval;
  ageGyr: StellarParameterInterval;
  flagsFlame: string | null;
  snapshotId: string;
  provenance: "Gaia DR3 astrophysical_parameters";
};

export type CatalogObjectV7 = {
  id: string;
  displayName: string;
  designation: string;
  gaiaSourceId: string | null;
  dataTier: StellarDataTier;
  astrophysicalParameters: StellarAstrophysicalParametersV2 | null;
};

export type CatalogV7BuildReport = {
  version: typeof CATALOG_V7_VERSION;
  rowCount: number;
  parameterRichCount: number;
  priorityParameterRichCount: number;
  invalidIntervalCount: number;
  duplicateSourceIdCount: number;
  sourceSha256: string;
  outputSha256: string;
  snapshotId: string;
  passed: boolean;
};

export type WebCatalogPackManifestV3 = {
  schemaVersion: 3;
  version: "v148-catalog-million-v7";
  sqliteSchemaVersion: 2;
  rowCount: number;
  parameterRichCount: number;
  priorityParameterRichCount: number;
  installedBytes: number;
  sha256: string;
  chunkBytes: number;
  chunks: readonly { index: number; path: string; offset: number; bytes: number; sha256: string }[];
  baseUrl: string;
  runtimePolicy: "opfs-sqlite-wasm-dedicated-worker-direct-oo1-runtime-offline";
  sourceManifest: string;
  provenance: readonly string[];
  snapshotId: string;
};

export type CatalogPackInstallStateV7 = {
  version: typeof CATALOG_MILLION_V7_MANIFEST_VERSION;
  status: "not-installed" | "checking-space" | "downloading" | "paused" | "verifying" | "installed" | "corrupt" | "insufficient-space";
  completedChunks: number;
  totalChunks: number;
  downloadedBytes: number;
  installedBytes: number;
  activeFilename: string | null;
  error: string | null;
};

export type CatalogPackAvailability =
  | "checking"
  | "local"
  | "remote"
  | "unavailable"
  | "installed";

export function validateWebCatalogPackManifestV3(manifest: WebCatalogPackManifestV3): readonly string[] {
  const errors: string[] = [];
  if (manifest.schemaVersion !== 3) errors.push("unsupported-manifest-schema");
  if (manifest.version !== CATALOG_MILLION_V7_MANIFEST_VERSION) errors.push("unexpected-pack-version");
  if (manifest.sqliteSchemaVersion !== 2) errors.push("unsupported-sqlite-schema");
  if (manifest.rowCount < CATALOG_V7_MINIMUM_ROWS) errors.push("catalog-below-v7-row-gate");
  if (manifest.parameterRichCount < CATALOG_V7_MINIMUM_PARAMETER_RICH) errors.push("catalog-below-rich-gate");
  if (manifest.priorityParameterRichCount < CATALOG_V7_MINIMUM_PRIORITY_RICH) errors.push("catalog-below-priority-rich-gate");
  if (manifest.installedBytes > 360 * 1024 * 1024) errors.push("catalog-over-360-mib");
  if (manifest.chunkBytes > 16 * 1024 * 1024) errors.push("chunk-over-16-mib");
  if (!/^[a-f0-9]{64}$/.test(manifest.sha256)) errors.push("invalid-full-checksum");
  let offset = 0;
  for (let index = 0; index < manifest.chunks.length; index += 1) {
    const chunk = manifest.chunks[index];
    if (chunk.index !== index || chunk.offset !== offset || chunk.bytes > manifest.chunkBytes || !/^[a-f0-9]{64}$/.test(chunk.sha256)) errors.push("invalid-chunk-table");
    offset += chunk.bytes;
  }
  if (offset !== manifest.installedBytes) errors.push("non-contiguous-pack");
  return Array.from(new Set(errors));
}

export function inferCatalogV7Tier(parameters: StellarAstrophysicalParametersV2 | null): StellarDataTier {
  if (parameters?.teffK.value != null && parameters.loggDex.value != null && parameters.radiusSolar.value != null) return "parameter-rich";
  if (parameters?.teffK.value != null) return "photometric-derived";
  return "catalog-basic";
}

export function validateStellarParameterInterval(interval: StellarParameterInterval): boolean {
  const numbers = [interval.value, interval.lower, interval.upper].filter((value): value is number => value != null);
  if (numbers.some((value) => !Number.isFinite(value))) return false;
  if (interval.lower != null && interval.upper != null && interval.lower > interval.upper) return false;
  if (interval.value != null && interval.lower != null && interval.value < interval.lower) return false;
  if (interval.value != null && interval.upper != null && interval.value > interval.upper) return false;
  return true;
}
