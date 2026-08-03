import { atlasPublicAssetUrl } from "./atlasDeliveryProfile";

export const GAIA_PRESENTATION_CATALOG_V9_VERSION =
  "v265-gaia-dr3-presentation-10000000-v9" as const;
export const GAIA_PRESENTATION_CATALOG_V9_ID =
  "gaia-dr3-presentation-10000000-v9" as const;
export const GAIA_PRESENTATION_ROWS_V9 = 10_000_000;
export const GAIA_PRESENTATION_RECORD_BYTES_V9 = 24;
export const GAIA_PRESENTATION_DIRECTORY_ENTRY_BYTES_V9 = 28;
export const GAIA_PRESENTATION_LEAF_ENTRY_BYTES_V9 = 16;
export const GAIA_PRESENTATION_SOURCE_ENTRY_BYTES_V9 = 16;
export const GAIA_PRESENTATION_SOURCE_DIRECTORY_ENTRY_BYTES_V9 = 24;
export const GAIA_PRESENTATION_MANIFEST_URL_V9 = atlasPublicAssetUrl(
  "data/gaia-dr3-presentation-10000000-v9/manifest.json",
);

export type GaiaPresentationTileManifestV9 = {
  version: typeof GAIA_PRESENTATION_CATALOG_V9_VERSION;
  id: typeof GAIA_PRESENTATION_CATALOG_V9_ID;
  scheme: "NESTED";
  orders: readonly [3, 6, 8];
  generatedAt: string;
  source: {
    archive: "Gaia DR3 gaiadr3.gaia_source";
    endpoint: "https://gea.esac.esa.int/tap-server/tap/sync";
    randomIndexStart: 0;
    randomIndexMaximumExclusive: 10_200_000;
    shardMaximumRows: 100_000;
    shardCount: number;
    provenanceSha256: string;
  };
  counts: {
    presentation: typeof GAIA_PRESENTATION_ROWS_V9;
    excludedBright: number;
    rejectedInvalid: number;
    duplicateSourceIds: 0;
  };
  archive: GaiaPresentationArtifactV9 & {
    url: string;
    recordBytes: typeof GAIA_PRESENTATION_RECORD_BYTES_V9;
    byteLength: 240_000_000;
    sort: "healpix-order8,g-quantized,source-id";
  };
  aggregateOrder3: GaiaPresentationArtifactV9 & {
    url: string;
    entryBytes: 24;
    cellCount: 768;
  };
  directoryOrder6: GaiaPresentationArtifactV9 & {
    url: string;
    entryBytes: typeof GAIA_PRESENTATION_DIRECTORY_ENTRY_BYTES_V9;
    cellCount: 49_152;
  };
  leafIndexOrder8: GaiaPresentationArtifactV9 & {
    url: string;
    entryBytes: typeof GAIA_PRESENTATION_LEAF_ENTRY_BYTES_V9;
    cellCount: 786_432;
    pageBytes: 256;
  };
  sourceIndex: {
    data: GaiaPresentationArtifactV9 & { url: string; entryBytes: 16; entryCount: 10_000_000 };
    directory: GaiaPresentationArtifactV9 & { url: string; entryBytes: 24; pageEntries: 4096 };
  };
  runtime: {
    standaloneIntentRequired: true;
    liteIncluded: false;
    maxConcurrentRanges: 4;
    fallback: readonly ["catalog-v10-1221242", "gaia-v255-46000", "gaia-legacy-5000"];
  };
  canonical: true;
  presentationOnly: true;
  surveyCompletenessClaim: "not-applied";
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
  manifestSha256: string;
};

export type GaiaPresentationArtifactV9 = {
  byteLength: number;
  sha256: string;
};

export type GaiaPresentationRecordV9 = {
  sourceId: string;
  raDeg: number;
  decDeg: number;
  magG: number;
  colorBpRp: number | null;
  parallaxMas: number | null;
};

export type GaiaPresentationDirectoryEntryV9 = {
  parentCell: number;
  leafPageOffset: number;
  leafPageByteLength: number;
  archiveOffset: number;
  archiveByteLength: number;
  centerRaDeg: number;
  centerDecDeg: number;
  nonEmptyChildMask: number;
};

export type GaiaPresentationLeafEntryV9 = {
  cell: number;
  archiveOffset: number;
  byteLength: number;
  crc32: number;
  rowCount: number;
};

const UINT32_SCALE = 0x1_0000_0000;
const UINT32_MAX = 0xffff_ffff;
const COLOR_MISSING = -0x8000;
const SHA256 = /^[a-f0-9]{64}$/;

function objectValue(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function artifactValue(value: unknown, label: string): Record<string, unknown> {
  const artifact = objectValue(value, label);
  if (!Number.isSafeInteger(artifact.byteLength) || Number(artifact.byteLength) < 0 || !SHA256.test(String(artifact.sha256))) {
    throw new Error(`${label} provenance is invalid`);
  }
  return artifact;
}

export function parseGaiaPresentationTileManifestV9(
  value: unknown,
): GaiaPresentationTileManifestV9 {
  const root = objectValue(value, "Gaia presentation manifest");
  const source = objectValue(root.source, "Gaia presentation source");
  const counts = objectValue(root.counts, "Gaia presentation counts");
  const archive = artifactValue(root.archive, "Gaia presentation archive");
  const aggregate = artifactValue(root.aggregateOrder3, "Gaia presentation order-3 aggregate");
  const directory = artifactValue(root.directoryOrder6, "Gaia presentation order-6 directory");
  const leaf = artifactValue(root.leafIndexOrder8, "Gaia presentation order-8 index");
  const sourceIndex = objectValue(root.sourceIndex, "Gaia presentation source index");
  const sourceData = artifactValue(sourceIndex.data, "Gaia presentation source-index data");
  const sourceDirectory = artifactValue(sourceIndex.directory, "Gaia presentation source-index directory");
  const runtime = objectValue(root.runtime, "Gaia presentation runtime");
  if (
    root.version !== GAIA_PRESENTATION_CATALOG_V9_VERSION ||
    root.id !== GAIA_PRESENTATION_CATALOG_V9_ID ||
    root.scheme !== "NESTED" ||
    JSON.stringify(root.orders) !== JSON.stringify([3, 6, 8]) ||
    source.archive !== "Gaia DR3 gaiadr3.gaia_source" ||
    source.endpoint !== "https://gea.esac.esa.int/tap-server/tap/sync" ||
    source.randomIndexStart !== 0 ||
    source.randomIndexMaximumExclusive !== 10_200_000 ||
    source.shardMaximumRows !== 100_000 ||
    !Number.isInteger(source.shardCount) || Number(source.shardCount) < 100 || Number(source.shardCount) > 102 ||
    !SHA256.test(String(source.provenanceSha256)) ||
    counts.presentation !== GAIA_PRESENTATION_ROWS_V9 ||
    counts.duplicateSourceIds !== 0 ||
    archive.recordBytes !== GAIA_PRESENTATION_RECORD_BYTES_V9 ||
    archive.byteLength !== GAIA_PRESENTATION_ROWS_V9 * GAIA_PRESENTATION_RECORD_BYTES_V9 ||
    archive.sort !== "healpix-order8,g-quantized,source-id" ||
    aggregate.entryBytes !== 24 || aggregate.cellCount !== 768 ||
    directory.entryBytes !== GAIA_PRESENTATION_DIRECTORY_ENTRY_BYTES_V9 || directory.cellCount !== 49_152 ||
    leaf.entryBytes !== GAIA_PRESENTATION_LEAF_ENTRY_BYTES_V9 || leaf.cellCount !== 786_432 || leaf.pageBytes !== 256 ||
    sourceData.entryBytes !== GAIA_PRESENTATION_SOURCE_ENTRY_BYTES_V9 || sourceData.entryCount !== GAIA_PRESENTATION_ROWS_V9 ||
    sourceDirectory.entryBytes !== GAIA_PRESENTATION_SOURCE_DIRECTORY_ENTRY_BYTES_V9 || sourceDirectory.pageEntries !== 4096 ||
    runtime.standaloneIntentRequired !== true || runtime.liteIncluded !== false || runtime.maxConcurrentRanges !== 4 ||
    root.canonical !== true || root.presentationOnly !== true || root.surveyCompletenessClaim !== "not-applied" ||
    root.livePhysicsMutation !== "not-applied" || root.workerPhysicsMutation !== "not-applied" ||
    !SHA256.test(String(root.manifestSha256))
  ) {
    throw new Error("Gaia presentation manifest violates the v265 frozen contract");
  }
  for (const artifact of [archive, aggregate, directory, leaf, sourceData, sourceDirectory]) {
    if (typeof artifact.url !== "string" || !artifact.url) throw new Error("Gaia presentation artifact URL is missing");
  }
  return value as GaiaPresentationTileManifestV9;
}

export function decodeGaiaPresentationRecordsV9(buffer: ArrayBuffer): GaiaPresentationRecordV9[] {
  if (buffer.byteLength % GAIA_PRESENTATION_RECORD_BYTES_V9 !== 0) {
    throw new Error("Gaia presentation record payload is truncated");
  }
  const view = new DataView(buffer);
  const rows: GaiaPresentationRecordV9[] = [];
  for (let offset = 0; offset < buffer.byteLength; offset += GAIA_PRESENTATION_RECORD_BYTES_V9) {
    const color = view.getInt16(offset + 18, true);
    const parallax = view.getFloat32(offset + 20, true);
    rows.push({
      sourceId: view.getBigUint64(offset, true).toString(),
      raDeg: (view.getUint32(offset + 8, true) / UINT32_SCALE) * 360,
      decDeg: (view.getUint32(offset + 12, true) / UINT32_MAX) * 180 - 90,
      magG: view.getUint16(offset + 16, true) / 1_000 - 5,
      colorBpRp: color === COLOR_MISSING ? null : color / 1_000,
      parallaxMas: Number.isFinite(parallax) ? parallax : null,
    });
  }
  return rows;
}

export function parseGaiaPresentationDirectoryV9(buffer: ArrayBuffer): GaiaPresentationDirectoryEntryV9[] {
  if (buffer.byteLength !== 49_152 * GAIA_PRESENTATION_DIRECTORY_ENTRY_BYTES_V9) {
    throw new Error("Gaia presentation order-6 directory length is invalid");
  }
  const view = new DataView(buffer);
  const rows: GaiaPresentationDirectoryEntryV9[] = [];
  for (let parentCell = 0, offset = 0; offset < buffer.byteLength; parentCell += 1, offset += 28) {
    rows.push({
      parentCell,
      leafPageOffset: view.getUint32(offset, true),
      leafPageByteLength: view.getUint32(offset + 4, true),
      archiveOffset: view.getUint32(offset + 8, true),
      archiveByteLength: view.getUint32(offset + 12, true),
      centerRaDeg: view.getFloat32(offset + 16, true),
      centerDecDeg: view.getFloat32(offset + 20, true),
      nonEmptyChildMask: view.getUint16(offset + 24, true),
    });
  }
  return rows;
}

export function parseGaiaPresentationLeafPageV9(
  parentCell: number,
  buffer: ArrayBuffer,
): GaiaPresentationLeafEntryV9[] {
  if (!Number.isInteger(parentCell) || parentCell < 0 || parentCell >= 49_152 || buffer.byteLength !== 256) {
    throw new Error("Gaia presentation order-8 leaf page is invalid");
  }
  const view = new DataView(buffer);
  const rows: GaiaPresentationLeafEntryV9[] = [];
  for (let child = 0, offset = 0; child < 16; child += 1, offset += 16) {
    const byteLength = view.getUint32(offset + 4, true);
    if (byteLength % GAIA_PRESENTATION_RECORD_BYTES_V9 !== 0) {
      throw new Error("Gaia presentation leaf byte length is not record aligned");
    }
    rows.push({
      cell: parentCell * 16 + child,
      archiveOffset: view.getUint32(offset, true),
      byteLength,
      crc32: view.getUint32(offset + 8, true),
      rowCount: view.getUint32(offset + 12, true),
    });
  }
  return rows;
}
