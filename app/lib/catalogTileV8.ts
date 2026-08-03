import { atlasPublicAssetUrl } from "./atlasDeliveryProfile";
import { gaiaColorToRgb } from "../data/gaiaStarCatalog";

export const CATALOG_TILE_MANIFEST_V8_VERSION =
  "v257-healpix-stream-catalog-v8" as const;
export const CATALOG_TILE_SCHEME_V8 = "NESTED" as const;
export const CATALOG_TILE_ORDERS_V8 = [3, 5, 6] as const;
export const CATALOG_TILE_RECORD_BYTES_V8 = 32;
export const CATALOG_TILE_INDEX_ENTRY_BYTES_V8 = 28;
export const CATALOG_TILE_MEMORY_CACHE_BYTES_V8 = 64 * 1024 * 1024;
export const CATALOG_TILE_PERSISTENT_CACHE_BYTES_V8 = 128 * 1024 * 1024;
export const CATALOG_TILE_MAX_CONCURRENT_RANGES_V8 = 4;
export const CATALOG_TILE_MANIFEST_URL_V8 = atlasPublicAssetUrl(
  "data/catalog-healpix-v8/manifest.json",
);

export const CATALOG_STREAM_BUDGET_V8 = {
  mobile: { faint: 8_000, bright: 750 },
  balanced: { faint: 32_000, bright: 2_000 },
  dense: { faint: 96_000, bright: 4_000 },
  closeup: { faint: 450, bright: 750 },
} as const;

export type CatalogTileManifestV8 = {
  version: typeof CATALOG_TILE_MANIFEST_V8_VERSION;
  scheme: typeof CATALOG_TILE_SCHEME_V8;
  orders: readonly [3, 5, 6];
  generatedAt: string;
  source: {
    path: string;
    sha256: string;
    rowCount: 1_224_219;
  };
  counts: {
    searchable: 1_224_219;
    renderable: 1_221_242;
    spatial3d: 758_955;
  };
  archive: {
    url: string;
    sha256: string;
    byteLength: number;
    headerBytes: number;
    recordBytes: typeof CATALOG_TILE_RECORD_BYTES_V8;
    recordsOffset: number;
  };
  index: {
    url: string;
    sha256: string;
    byteLength: number;
    entryBytes: typeof CATALOG_TILE_INDEX_ENTRY_BYTES_V8;
    cellCount: 49_152;
  };
  cache: {
    memoryBytes: typeof CATALOG_TILE_MEMORY_CACHE_BYTES_V8;
    persistentBytes: typeof CATALOG_TILE_PERSISTENT_CACHE_BYTES_V8;
    maxConcurrentRanges: typeof CATALOG_TILE_MAX_CONCURRENT_RANGES_V8;
  };
  fallbacks: readonly [
    "data/gaia-dr3-nearby-46000-v255.json",
    "data/gaia-dr3-bright-5000.json",
  ];
  canonical: true;
  livePhysicsMutation: "not-applied";
  workerPhysicsMutation: "not-applied";
};

export type CatalogTileIndexEntryV8 = {
  cell: number;
  archiveOffset: number;
  byteLength: number;
  rowCount: number;
  parentOrder5Cell: number;
  centerRaDeg: number;
  centerDecDeg: number;
};

export type CatalogStreamRecordV8 = {
  rowId: number;
  sourceId: string;
  raDeg: number;
  decDeg: number;
  magG: number;
  colorBpRp: number | null;
  parallaxMas: number | null;
  flags: number;
};

export type CatalogStreamPointArraysV8 = {
  positions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
};

export type CatalogByteRangeV8 = {
  start: number;
  end: number;
  cells: readonly number[];
};

const UINT32_SCALE = 0x1_0000_0000;
const UINT32_MAX = 0xffff_ffff;
const COLOR_MISSING = -0x8000;

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function objectValue(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Catalog v8 manifest must be an object");
  }
  return value as Record<string, unknown>;
}

export function parseCatalogTileManifestV8(value: unknown): CatalogTileManifestV8 {
  const root = objectValue(value);
  const source = objectValue(root.source);
  const counts = objectValue(root.counts);
  const archive = objectValue(root.archive);
  const index = objectValue(root.index);
  const cache = objectValue(root.cache);
  if (
    root.version !== CATALOG_TILE_MANIFEST_V8_VERSION ||
    root.scheme !== CATALOG_TILE_SCHEME_V8 ||
    JSON.stringify(root.orders) !== JSON.stringify(CATALOG_TILE_ORDERS_V8) ||
    source.rowCount !== 1_224_219 ||
    counts.searchable !== 1_224_219 ||
    counts.renderable !== 1_221_242 ||
    counts.spatial3d !== 758_955 ||
    archive.recordBytes !== CATALOG_TILE_RECORD_BYTES_V8 ||
    index.entryBytes !== CATALOG_TILE_INDEX_ENTRY_BYTES_V8 ||
    index.cellCount !== 49_152 ||
    cache.memoryBytes !== CATALOG_TILE_MEMORY_CACHE_BYTES_V8 ||
    cache.persistentBytes !== CATALOG_TILE_PERSISTENT_CACHE_BYTES_V8 ||
    cache.maxConcurrentRanges !== CATALOG_TILE_MAX_CONCURRENT_RANGES_V8 ||
    root.canonical !== true ||
    root.livePhysicsMutation !== "not-applied" ||
    root.workerPhysicsMutation !== "not-applied"
  ) {
    throw new Error("Catalog v8 manifest violates the frozen streaming contract");
  }
  if (
    typeof source.path !== "string" ||
    !/^[a-f0-9]{64}$/.test(String(source.sha256)) ||
    typeof root.generatedAt !== "string" ||
    typeof archive.url !== "string" ||
    !/^[a-f0-9]{64}$/.test(String(archive.sha256)) ||
    !finiteNumber(archive.byteLength) ||
    !finiteNumber(archive.headerBytes) ||
    !finiteNumber(archive.recordsOffset) ||
    typeof index.url !== "string" ||
    !/^[a-f0-9]{64}$/.test(String(index.sha256)) ||
    !finiteNumber(index.byteLength)
  ) {
    throw new Error("Catalog v8 manifest provenance is incomplete");
  }
  return value as CatalogTileManifestV8;
}

function spreadNestedBits(value: number): number {
  let result = 0;
  let source = value >>> 0;
  let targetBit = 0;
  while (source > 0) {
    result |= (source & 1) << targetBit;
    source >>>= 1;
    targetBit += 2;
  }
  return result >>> 0;
}

/** HEALPix reference ang2pix for NESTED ordering, limited to safe JS orders. */
export function healpixNestedCellFromRaDec(
  order: number,
  raDeg: number,
  decDeg: number,
): number {
  if (!Number.isInteger(order) || order < 0 || order > 13) {
    throw new RangeError("HEALPix order must be an integer in [0, 13]");
  }
  if (!finiteNumber(raDeg) || !finiteNumber(decDeg) || decDeg < -90 || decDeg > 90) {
    throw new RangeError("HEALPix coordinates must be finite and declination must be in [-90, 90]");
  }
  const nside = 1 << order;
  const mask = nside - 1;
  const phi = ((((raDeg % 360) + 360) % 360) * Math.PI) / 180;
  const z = Math.sin((decDeg * Math.PI) / 180);
  const za = Math.abs(z);
  const tt = phi / (0.5 * Math.PI);
  let face: number;
  let ix: number;
  let iy: number;
  if (za <= 2 / 3) {
    const temp1 = nside * (0.5 + tt);
    const temp2 = nside * z * 0.75;
    const jp = Math.floor(temp1 - temp2);
    const jm = Math.floor(temp1 + temp2);
    const ifp = jp >> order;
    const ifm = jm >> order;
    face = ifp === ifm ? (ifp | 4) : ifp < ifm ? ifp : ifm + 8;
    ix = jm & mask;
    iy = nside - (jp & mask) - 1;
  } else {
    const ntt = Math.min(3, Math.floor(tt));
    const tp = tt - ntt;
    const tmp = nside * Math.sqrt(3 * (1 - za));
    const jp = Math.min(nside - 1, Math.floor(tp * tmp));
    const jm = Math.min(nside - 1, Math.floor((1 - tp) * tmp));
    if (z >= 0) {
      face = ntt;
      ix = nside - jm - 1;
      iy = nside - jp - 1;
    } else {
      face = ntt + 8;
      ix = jp;
      iy = jm;
    }
  }
  return face * nside * nside + spreadNestedBits(ix) + 2 * spreadNestedBits(iy);
}

export function parseCatalogTileIndexV8(buffer: ArrayBuffer): CatalogTileIndexEntryV8[] {
  if (buffer.byteLength % CATALOG_TILE_INDEX_ENTRY_BYTES_V8 !== 0) {
    throw new Error("Catalog v8 tile index has a truncated entry");
  }
  const view = new DataView(buffer);
  const entries: CatalogTileIndexEntryV8[] = [];
  for (let offset = 0; offset < buffer.byteLength; offset += CATALOG_TILE_INDEX_ENTRY_BYTES_V8) {
    entries.push({
      cell: view.getUint32(offset, true),
      archiveOffset: view.getUint32(offset + 4, true),
      byteLength: view.getUint32(offset + 8, true),
      rowCount: view.getUint32(offset + 12, true),
      parentOrder5Cell: view.getUint32(offset + 16, true),
      centerRaDeg: view.getFloat32(offset + 20, true),
      centerDecDeg: view.getFloat32(offset + 24, true),
    });
  }
  return entries;
}

export function decodeCatalogTileRecordsV8(buffer: ArrayBuffer): CatalogStreamRecordV8[] {
  if (buffer.byteLength % CATALOG_TILE_RECORD_BYTES_V8 !== 0) {
    throw new Error("Catalog v8 tile payload has a truncated record");
  }
  const view = new DataView(buffer);
  const records: CatalogStreamRecordV8[] = [];
  for (let offset = 0; offset < buffer.byteLength; offset += CATALOG_TILE_RECORD_BYTES_V8) {
    const colorQuant = view.getInt16(offset + 22, true);
    const parallax = view.getFloat32(offset + 24, true);
    records.push({
      rowId: view.getUint32(offset, true),
      sourceId: view.getBigUint64(offset + 4, true).toString(),
      raDeg: (view.getUint32(offset + 12, true) / UINT32_SCALE) * 360,
      decDeg: (view.getUint32(offset + 16, true) / UINT32_MAX) * 180 - 90,
      magG: view.getUint16(offset + 20, true) / 1_000 - 5,
      colorBpRp: colorQuant === COLOR_MISSING ? null : colorQuant / 1_000,
      parallaxMas: Number.isFinite(parallax) ? parallax : null,
      flags: view.getUint16(offset + 28, true),
    });
  }
  return records;
}

export function createCatalogStreamPointArraysV8(
  records: readonly CatalogStreamRecordV8[],
): CatalogStreamPointArraysV8 {
  const positions = new Float32Array(records.length * 3);
  const colors = new Float32Array(records.length * 3);
  const sizes = new Float32Array(records.length);
  records.forEach((record, index) => {
    const ra = (record.raDeg * Math.PI) / 180;
    const dec = (record.decDeg * Math.PI) / 180;
    const x = Math.cos(dec) * Math.cos(ra);
    const y = Math.cos(dec) * Math.sin(ra);
    const z = Math.sin(dec);
    positions[index * 3] = -0.0548755604 * x - 0.8734370902 * y - 0.4838350155 * z;
    positions[index * 3 + 1] = 0.4941094279 * x - 0.44482963 * y + 0.7469822445 * z;
    positions[index * 3 + 2] = -0.867666149 * x - 0.1980763734 * y + 0.4559837762 * z;
    const [r, g, b] = gaiaColorToRgb(record.colorBpRp ?? 0.82);
    const intensity = Math.max(0.16, Math.min(0.72, 0.64 - (record.magG - 6) * 0.025));
    colors[index * 3] = r * intensity;
    colors[index * 3 + 1] = g * intensity;
    colors[index * 3 + 2] = b * intensity;
    sizes[index] = Math.max(0.55, Math.min(1.8, 1.45 - (record.magG - 6) * 0.075));
  });
  return { positions, colors, sizes };
}

export function selectCatalogTilesForConeV8(
  entries: readonly CatalogTileIndexEntryV8[],
  raDeg: number,
  decDeg: number,
  fovDeg: number,
  recordBudget: number,
): CatalogTileIndexEntryV8[] {
  if (!(finiteNumber(fovDeg) && fovDeg > 0 && fovDeg <= 180)) {
    throw new RangeError("Catalog field of view must be in (0, 180]");
  }
  if (!(Number.isInteger(recordBudget) && recordBudget > 0)) {
    throw new RangeError("Catalog record budget must be a positive integer");
  }
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  const target = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)] as const;
  const cellMarginDeg = 1.2;
  const minDot = Math.cos(((Math.min(180, fovDeg * 0.5 + cellMarginDeg)) * Math.PI) / 180);
  const candidates = entries
    .filter((entry) => entry.rowCount > 0)
    .map((entry) => {
      const entryRa = (entry.centerRaDeg * Math.PI) / 180;
      const entryDec = (entry.centerDecDeg * Math.PI) / 180;
      const dot =
        target[0] * Math.cos(entryDec) * Math.cos(entryRa) +
        target[1] * Math.cos(entryDec) * Math.sin(entryRa) +
        target[2] * Math.sin(entryDec);
      return { entry, dot };
    })
    .filter(({ dot }) => dot >= minDot)
    .sort((left, right) => right.dot - left.dot || left.entry.cell - right.entry.cell);
  const selected: CatalogTileIndexEntryV8[] = [];
  let records = 0;
  for (const { entry } of candidates) {
    selected.push(entry);
    records += entry.rowCount;
    if (records >= recordBudget) break;
  }
  return selected;
}

export function mergeCatalogTileRangesV8(
  entries: readonly CatalogTileIndexEntryV8[],
  maxGapBytes = CATALOG_TILE_RECORD_BYTES_V8,
): CatalogByteRangeV8[] {
  const sorted = [...entries]
    .filter((entry) => entry.byteLength > 0)
    .sort((left, right) => left.archiveOffset - right.archiveOffset || left.cell - right.cell);
  const ranges: CatalogByteRangeV8[] = [];
  for (const entry of sorted) {
    const start = entry.archiveOffset;
    const end = start + entry.byteLength - 1;
    const previous = ranges.at(-1);
    if (previous && start <= previous.end + 1 + maxGapBytes) {
      ranges[ranges.length - 1] = {
        start: previous.start,
        end: Math.max(previous.end, end),
        cells: [...previous.cells, entry.cell],
      };
    } else {
      ranges.push({ start, end, cells: [entry.cell] });
    }
  }
  return ranges;
}

export class CatalogTileLruCacheV8<T extends { byteLength: number }> {
  readonly maxBytes: number;
  #entries = new Map<string, T>();
  #bytes = 0;

  constructor(maxBytes = CATALOG_TILE_MEMORY_CACHE_BYTES_V8) {
    if (!(Number.isInteger(maxBytes) && maxBytes > 0)) throw new RangeError("LRU byte limit must be positive");
    this.maxBytes = maxBytes;
  }

  get bytes(): number {
    return this.#bytes;
  }

  get size(): number {
    return this.#entries.size;
  }

  get(key: string): T | undefined {
    const value = this.#entries.get(key);
    if (!value) return undefined;
    this.#entries.delete(key);
    this.#entries.set(key, value);
    return value;
  }

  set(key: string, value: T): void {
    const previous = this.#entries.get(key);
    if (previous) this.#bytes -= previous.byteLength;
    this.#entries.delete(key);
    if (value.byteLength > this.maxBytes) return;
    this.#entries.set(key, value);
    this.#bytes += value.byteLength;
    while (this.#bytes > this.maxBytes) {
      const oldest = this.#entries.entries().next().value as [string, T] | undefined;
      if (!oldest) break;
      this.#entries.delete(oldest[0]);
      this.#bytes -= oldest[1].byteLength;
    }
  }

  delete(key: string): void {
    const previous = this.#entries.get(key);
    if (!previous) return;
    this.#entries.delete(key);
    this.#bytes -= previous.byteLength;
  }

  clear(): void {
    this.#entries.clear();
    this.#bytes = 0;
  }
}
