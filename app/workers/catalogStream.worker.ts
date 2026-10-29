/// <reference lib="webworker" />

import { atlasAssetCandidates } from "../lib/atlasAssetResolver";
import {
  parseAtlasRangeDeliveryHeaderV1,
  type CatalogRangeDeliveryObservationV1,
} from "../lib/atlasBufferedRangeDeliveryV1";
import {
  CATALOG_TILE_MANIFEST_URL_V8,
  CATALOG_TILE_MAX_CONCURRENT_RANGES_V8,
  CatalogTileLruCacheV8,
  createCatalogStreamPointArraysV8,
  decodeCatalogTileRecordsV8,
  mergeCatalogTileRangesV8,
  parseCatalogTileIndexV8,
  parseCatalogTileManifestV8,
  selectCatalogTilesForConeV8,
  type CatalogByteRangeV8,
} from "../lib/catalogTileV8";
import {
  CatalogPersistentTileCacheV2,
  IndexedDbCatalogPersistentBackendV2,
  createCatalogPersistentCacheKeyV1,
} from "../lib/catalogPersistentCacheV1";
import {
  CATALOG_TILE_MANIFEST_URL_V9,
  findCatalogSourceLocationV1,
  parseCatalogSourceDirectoryV1,
  parseCatalogTileIndexV9,
  parseCatalogTileManifestV9,
  selectCatalogSourcePageV1,
  verifyCatalogRangeV9,
  type CatalogSourceDirectoryEntryV1,
  type CatalogSourceLocationV1,
  type CatalogTileIndexEntryV9,
  type CatalogTileManifestV9,
} from "../lib/catalogTileV9";
import {
  CATALOG_TILE_MANIFEST_URL_V10,
  decodeCatalogSelectedRangesV10,
  mergeCatalogTileRangesWithinBudgetV10,
  parseCatalogTileIndexV10,
  parseCatalogTileManifestV10,
  type CatalogTileManifestV10,
} from "../lib/catalogTileV10";

export type CatalogStreamWorkerRequestV9 =
  | { type: "init"; manifestUrl?: string }
  | {
      type: "view";
      requestId: number;
      raDeg: number;
      decDeg: number;
      fovDeg: number;
      recordBudget: number;
      selectedSourceId?: string;
    }
  | { type: "resolve-source"; requestId: number; sourceId: string }
  | { type: "clear-memory-cache" }
  | { type: "clear-persistent-cache" }
  | { type: "clear-cache" };

export type CatalogStreamWorkerRequestV8 = CatalogStreamWorkerRequestV9;

export type CatalogStreamTimingV264R1 = {
  readyMs: number;
  persistentReadMs: number;
  networkWallMs: number;
  checksumMs: number;
  decodeTimeMs: number;
  persistentQueueDepth: number;
  persistentFlushMs: number;
};

export type CatalogStreamTimingV264R2 = CatalogStreamTimingV264R1 & {
  mergedRangeRequestCount: number;
  selectedRangeBytes: number;
  gapRangeBytes: number;
  coldBootstrapBytes: number;
};

export type CatalogStreamTransportTelemetryV264R3 = {
  rangeDelivery: CatalogRangeDeliveryObservationV1 | "mixed";
  bufferedRangeResponses: number;
  streamedRangeResponses: number;
  unknownRangeResponses: number;
};

export type CatalogStreamSnapshot = {
  status: "idle" | "initializing" | "ready" | "streaming" | "blocked";
  contract: "v8" | "v9" | "v10";
  requestId: number;
  activeTileCount: number;
  activeRecordCount: number;
  memoryCacheBytes: number;
  persistentCacheBytes: number;
  persistentCacheEntries: number;
  persistentCacheStatus: "idle" | "ready" | "blocked" | "unavailable";
  persistentFlushStatus: "idle" | "scheduled" | "flushing" | "blocked";
  cacheHitCount: number;
  cacheMissCount: number;
  rangeRequestCount: number;
  activeRangeRequests: number;
  queuedRangeRequests: number;
  cancelledRangeRequests: number;
  transferredBytes: number;
  readyMs: number;
  persistentReadMs: number;
  networkWallMs: number;
  checksumMs: number;
  decodeTimeMs: number;
  persistentQueueDepth: number;
  persistentFlushMs: number;
  mergedRangeRequestCount: number;
  selectedRangeBytes: number;
  gapRangeBytes: number;
  coldBootstrapBytes: number;
  rangeDelivery: CatalogStreamTransportTelemetryV264R3["rangeDelivery"];
  bufferedRangeResponses: number;
  streamedRangeResponses: number;
  unknownRangeResponses: number;
  selectedSourceRetention: "not-requested" | "retained" | "unavailable";
  fallback: "none" | "v9-1221242" | "v8-1221242" | "v255-46000" | "legacy-5000";
  error: string;
};

export type CatalogStreamWorkerResponseV9 =
  | { type: "snapshot"; snapshot: CatalogStreamSnapshot }
  | {
      type: "points";
      requestId: number;
      positions: Float32Array;
      colors: Float32Array;
      sizes: Float32Array;
      recordCount: number;
      cells: number[];
    }
  | { type: "source"; requestId: number; sourceId: string; location: CatalogSourceLocationV1 | null };

export type CatalogStreamWorkerResponseV8 = CatalogStreamWorkerResponseV9;

let manifest: CatalogTileManifestV9 | CatalogTileManifestV10 | null = null;
let manifestV8Archive: { url: string; sha256: string } | null = null;
let entries: CatalogTileIndexEntryV9[] = [];
let entriesByCell = new Map<number, CatalogTileIndexEntryV9>();
let sourceDirectory: CatalogSourceDirectoryEntryV1[] = [];
let initPromise: Promise<void> | null = null;
let activeRequestId = 0;
let activeAbortController: AbortController | null = null;
let activeContract: "v8" | "v9" | "v10" = "v10";
let activeFallback: CatalogStreamSnapshot["fallback"] = "none";
const cache = new CatalogTileLruCacheV8<ArrayBuffer>();
const persistentCache = new CatalogPersistentTileCacheV2(new IndexedDbCatalogPersistentBackendV2());
let cacheHitCount = 0;
let cacheMissCount = 0;
let rangeRequestCount = 0;
let activeRangeRequests = 0;
let queuedRangeRequests = 0;
let cancelledRangeRequests = 0;
let transferredBytes = 0;
let readyMs = 0;
let persistentReadMs = 0;
let networkWallMs = 0;
let checksumMs = 0;
let decodeTimeMs = 0;
let bootstrapBaseBytes = 0;
let mergedRangeRequestCount = 0;
let selectedRangeBytes = 0;
let gapRangeBytes = 0;
let bufferedRangeResponses = 0;
let streamedRangeResponses = 0;
let unknownRangeResponses = 0;
let selectedSourceRetention: CatalogStreamSnapshot["selectedSourceRetention"] = "not-requested";

async function fetchCatalogPrimaryAsset(
  assetPath: string,
  init?: RequestInit,
): Promise<Response> {
  const primary = atlasAssetCandidates(assetPath)[0];
  if (!primary) throw new Error(`Catalog primary asset is unavailable: ${assetPath}`);
  return fetch(primary, init);
}

function rangeDeliverySnapshot(): CatalogStreamTransportTelemetryV264R3["rangeDelivery"] {
  const activeKinds = [
    bufferedRangeResponses > 0,
    streamedRangeResponses > 0,
    unknownRangeResponses > 0,
  ].filter(Boolean).length;
  if (activeKinds > 1) return "mixed";
  if (bufferedRangeResponses > 0) return "buffered-v1";
  if (streamedRangeResponses > 0) return "streamed-v1";
  return "unknown";
}

function postSnapshot(partial: Partial<CatalogStreamSnapshot> = {}): void {
  const persistent = persistentCache.snapshot;
  const snapshot: CatalogStreamSnapshot = {
    status: manifest || manifestV8Archive ? "ready" : "idle",
    contract: activeContract,
    requestId: activeRequestId,
    activeTileCount: 0,
    activeRecordCount: 0,
    memoryCacheBytes: cache.bytes,
    persistentCacheBytes: persistent.bytes,
    persistentCacheEntries: persistent.entries,
    persistentCacheStatus: persistent.status,
    persistentFlushStatus: persistent.flushStatus,
    cacheHitCount,
    cacheMissCount,
    rangeRequestCount,
    activeRangeRequests,
    queuedRangeRequests,
    cancelledRangeRequests,
    transferredBytes,
    readyMs,
    persistentReadMs,
    networkWallMs,
    checksumMs,
    decodeTimeMs,
    persistentQueueDepth: persistent.queueDepth,
    persistentFlushMs: persistent.flushMs,
    mergedRangeRequestCount,
    selectedRangeBytes,
    gapRangeBytes,
    coldBootstrapBytes: bootstrapBaseBytes + transferredBytes,
    rangeDelivery: rangeDeliverySnapshot(),
    bufferedRangeResponses,
    streamedRangeResponses,
    unknownRangeResponses,
    selectedSourceRetention,
    fallback: activeFallback,
    error: persistent.status === "blocked" ? persistent.error : "",
    ...partial,
  };
  self.postMessage({ type: "snapshot", snapshot } satisfies CatalogStreamWorkerResponseV9);
}

async function loadV10(manifestUrl: string): Promise<void> {
  const manifestResponse = await fetchCatalogPrimaryAsset(manifestUrl, { cache: "force-cache" });
  if (!manifestResponse.ok) throw new Error(`Catalog v10 manifest failed: ${manifestResponse.status}`);
  const manifestText = await manifestResponse.text();
  const parsed = parseCatalogTileManifestV10(JSON.parse(manifestText));
  const [indexResponse, directoryResponse] = await Promise.all([
    fetchCatalogPrimaryAsset(parsed.index.url, { cache: "force-cache" }),
    fetchCatalogPrimaryAsset(parsed.sourceIndex.directory.url, { cache: "force-cache" }),
  ]);
  if (!indexResponse.ok) throw new Error(`Catalog v10 index failed: ${indexResponse.status}`);
  if (!directoryResponse.ok) throw new Error(`Catalog v10 source directory failed: ${directoryResponse.status}`);
  const [indexBuffer, directoryBuffer] = await Promise.all([indexResponse.arrayBuffer(), directoryResponse.arrayBuffer()]);
  if (indexBuffer.byteLength !== parsed.index.byteLength) throw new Error("Catalog v10 index byte length mismatch");
  if (directoryBuffer.byteLength !== parsed.sourceIndex.directory.byteLength) throw new Error("Catalog v10 source directory byte length mismatch");
  const parsedEntries = parseCatalogTileIndexV10(indexBuffer);
  if (parsedEntries.length !== parsed.index.cellCount) throw new Error("Catalog v10 index cell count mismatch");
  const parsedEntriesByCell = new Map(parsedEntries.map((entry) => [entry.cell, entry]));
  const parsedSourceDirectory = parseCatalogSourceDirectoryV1(directoryBuffer);
  await persistentCache.initialize(parsed.manifestSha256);
  manifest = parsed;
  manifestV8Archive = null;
  entries = parsedEntries;
  entriesByCell = parsedEntriesByCell;
  sourceDirectory = parsedSourceDirectory;
  activeContract = "v10";
  activeFallback = "none";
  bootstrapBaseBytes = new TextEncoder().encode(manifestText).byteLength + indexBuffer.byteLength + directoryBuffer.byteLength;
}

async function loadV9(manifestUrl: string, fallback: CatalogStreamSnapshot["fallback"] = "none"): Promise<void> {
  const manifestResponse = await fetchCatalogPrimaryAsset(manifestUrl, { cache: "force-cache" });
  if (!manifestResponse.ok) throw new Error(`Catalog v9 manifest failed: ${manifestResponse.status}`);
  const manifestText = await manifestResponse.text();
  const parsed = parseCatalogTileManifestV9(JSON.parse(manifestText));
  const [indexResponse, directoryResponse] = await Promise.all([
    fetchCatalogPrimaryAsset(parsed.index.url, { cache: "force-cache" }),
    fetchCatalogPrimaryAsset(parsed.sourceIndex.directory.url, { cache: "force-cache" }),
  ]);
  if (!indexResponse.ok) throw new Error(`Catalog v9 index failed: ${indexResponse.status}`);
  if (!directoryResponse.ok) throw new Error(`Catalog v9 source directory failed: ${directoryResponse.status}`);
  const [indexBuffer, directoryBuffer] = await Promise.all([indexResponse.arrayBuffer(), directoryResponse.arrayBuffer()]);
  if (indexBuffer.byteLength !== parsed.index.byteLength) throw new Error("Catalog v9 index byte length mismatch");
  if (directoryBuffer.byteLength !== parsed.sourceIndex.directory.byteLength) throw new Error("Catalog v9 source directory byte length mismatch");
  const parsedEntries = parseCatalogTileIndexV9(indexBuffer);
  if (parsedEntries.length !== parsed.index.cellCount) throw new Error("Catalog v9 index cell count mismatch");
  const parsedEntriesByCell = new Map(parsedEntries.map((entry) => [entry.cell, entry]));
  const parsedSourceDirectory = parseCatalogSourceDirectoryV1(directoryBuffer);
  await persistentCache.initialize(parsed.manifestSha256);
  manifest = parsed;
  manifestV8Archive = null;
  entries = parsedEntries;
  entriesByCell = parsedEntriesByCell;
  sourceDirectory = parsedSourceDirectory;
  activeContract = "v9";
  activeFallback = fallback;
  bootstrapBaseBytes = new TextEncoder().encode(manifestText).byteLength + indexBuffer.byteLength + directoryBuffer.byteLength;
}

async function loadV8Fallback(): Promise<void> {
  const manifestResponse = await fetchCatalogPrimaryAsset(CATALOG_TILE_MANIFEST_URL_V8, { cache: "force-cache" });
  if (!manifestResponse.ok) throw new Error(`Catalog v8 fallback manifest failed: ${manifestResponse.status}`);
  const manifestText = await manifestResponse.text();
  const parsed = parseCatalogTileManifestV8(JSON.parse(manifestText));
  const indexResponse = await fetchCatalogPrimaryAsset(parsed.index.url, { cache: "force-cache" });
  if (!indexResponse.ok) throw new Error(`Catalog v8 fallback index failed: ${indexResponse.status}`);
  const indexBuffer = await indexResponse.arrayBuffer();
  if (indexBuffer.byteLength !== parsed.index.byteLength) throw new Error("Catalog v8 fallback index byte length mismatch");
  const parsedEntries = parseCatalogTileIndexV8(indexBuffer).map((entry) => ({ ...entry, crc32: 0 }));
  const parsedEntriesByCell = new Map(parsedEntries.map((entry) => [entry.cell, entry]));
  await persistentCache.initialize(parsed.archive.sha256);
  manifest = null;
  manifestV8Archive = { url: parsed.archive.url, sha256: parsed.archive.sha256 };
  entries = parsedEntries;
  entriesByCell = parsedEntriesByCell;
  sourceDirectory = [];
  activeContract = "v8";
  activeFallback = "v8-1221242";
  bootstrapBaseBytes = new TextEncoder().encode(manifestText).byteLength + indexBuffer.byteLength;
}

async function initialize(manifestUrl = CATALOG_TILE_MANIFEST_URL_V10): Promise<void> {
  if (manifest || manifestV8Archive) return;
  if (initPromise) return initPromise;
  postSnapshot({ status: "initializing" });
  initPromise = (async () => {
    try {
      await loadV10(manifestUrl);
    } catch (v10Error) {
      if (manifestUrl !== CATALOG_TILE_MANIFEST_URL_V10) throw v10Error;
      try {
        await loadV9(CATALOG_TILE_MANIFEST_URL_V9, "v9-1221242");
      } catch {
        await loadV8Fallback();
      }
    }
    postSnapshot({ status: "ready" });
  })().catch((error: unknown) => {
    manifest = null;
    manifestV8Archive = null;
    entries = [];
    entriesByCell.clear();
    sourceDirectory = [];
    activeFallback = "v255-46000";
    postSnapshot({ status: "blocked", error: error instanceof Error ? error.message : String(error) });
    throw error;
  }).finally(() => { initPromise = null; });
  return initPromise;
}

function activeArchiveUrl(): string {
  const url = manifest?.archive.url ?? manifestV8Archive?.url;
  if (!url) throw new Error("Catalog archive is unavailable");
  return url;
}

function memoryKey(resourceUrl: string, start: number, end: number): string {
  return `${resourceUrl}:${start}-${end}`;
}

function activeManifestSha256(): string {
  const sha256 = manifest?.manifestSha256 ?? manifestV8Archive?.sha256;
  if (!sha256) throw new Error("Catalog manifest SHA is unavailable");
  return sha256;
}

async function fetchNetworkRange(resourceUrl: string, start: number, end: number, signal: AbortSignal): Promise<ArrayBuffer> {
  rangeRequestCount += 1;
  activeRangeRequests += 1;
  try {
    const response = await fetchCatalogPrimaryAsset(resourceUrl, {
      headers: { Range: `bytes=${start}-${end}` },
      cache: "force-cache",
      signal,
    });
    if (!(response.status === 206 || response.status === 200)) throw new Error(`Catalog range failed: ${response.status}`);
    const delivery = parseAtlasRangeDeliveryHeaderV1(
      response.headers.get("x-atlas-range-delivery"),
    );
    if (delivery === "buffered-v1") bufferedRangeResponses += 1;
    else if (delivery === "streamed-v1") streamedRangeResponses += 1;
    else unknownRangeResponses += 1;
    const full = await response.arrayBuffer();
    const expected = end - start + 1;
    const payload = response.status === 200 ? full.slice(start, end + 1) : full;
    if (payload.byteLength !== expected) throw new Error("Catalog range byte length mismatch");
    transferredBytes += payload.byteLength;
    return payload;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") cancelledRangeRequests += 1;
    throw error;
  } finally {
    activeRangeRequests -= 1;
  }
}

async function mapConcurrent<T, R>(values: readonly T[], limit: number, work: (value: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  queuedRangeRequests = values.length;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      queuedRangeRequests -= 1;
      results[index] = await work(values[index]!);
    }
  }));
  return results;
}

function verifyRange(range: CatalogByteRangeV8, payload: ArrayBuffer): void {
  if (activeContract === "v8") return;
  const started = performance.now();
  try {
    verifyCatalogRangeV9(range, payload, entriesByCell);
  } finally {
    checksumMs += performance.now() - started;
  }
}

async function invalidateCorruptRange(resourceUrl: string, range: CatalogByteRangeV8): Promise<void> {
  cache.delete(memoryKey(resourceUrl, range.start, range.end));
  await persistentCache.delete(resourceUrl, range.start, range.end);
  activeFallback = "v255-46000";
}

async function loadRanges(
  resourceUrl: string,
  ranges: readonly CatalogByteRangeV8[],
  signal: AbortSignal,
  checksummed: boolean,
): Promise<ArrayBuffer[]> {
  const results: Array<ArrayBuffer | null> = Array.from({ length: ranges.length }, () => null);
  const unresolved: Array<{ index: number; range: CatalogByteRangeV8; key: string; persistentKey: string }> = [];
  const manifestSha256 = activeManifestSha256();

  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index]!;
    const key = memoryKey(resourceUrl, range.start, range.end);
    const cached = cache.get(key);
    if (!cached) {
      unresolved.push({
        index,
        range,
        key,
        persistentKey: createCatalogPersistentCacheKeyV1(manifestSha256, resourceUrl, range.start, range.end),
      });
      continue;
    }
    try {
      if (checksummed) verifyRange(range, cached);
    } catch (error) {
      await invalidateCorruptRange(resourceUrl, range);
      throw error;
    }
    cacheHitCount += 1;
    results[index] = cached;
  }

  const persistentStarted = performance.now();
  const persistentRows = await persistentCache.getMany(unresolved.map(({ range }) => ({
    resourceUrl,
    start: range.start,
    end: range.end,
  })));
  persistentReadMs += performance.now() - persistentStarted;
  const networkMisses: typeof unresolved = [];
  for (const item of unresolved) {
    const payload = persistentRows.get(item.persistentKey);
    if (!payload) {
      networkMisses.push(item);
      continue;
    }
    try {
      if (checksummed) verifyRange(item.range, payload);
    } catch (error) {
      await invalidateCorruptRange(resourceUrl, item.range);
      throw error;
    }
    cacheHitCount += 1;
    cache.set(item.key, payload);
    results[item.index] = payload;
  }

  if (networkMisses.length > 0) {
    cacheMissCount += networkMisses.length;
    const networkStarted = performance.now();
    try {
      const payloads = await mapConcurrent(
        networkMisses,
        CATALOG_TILE_MAX_CONCURRENT_RANGES_V8,
        ({ range }) => fetchNetworkRange(resourceUrl, range.start, range.end, signal),
      );
      for (let index = 0; index < networkMisses.length; index += 1) {
        const item = networkMisses[index]!;
        const payload = payloads[index]!;
        try {
          if (checksummed) verifyRange(item.range, payload);
        } catch (error) {
          await invalidateCorruptRange(resourceUrl, item.range);
          throw error;
        }
        cache.set(item.key, payload);
        persistentCache.enqueueSet(resourceUrl, item.range.start, item.range.end, payload);
        results[item.index] = payload;
      }
    } finally {
      networkWallMs += performance.now() - networkStarted;
      queuedRangeRequests = 0;
    }
  }

  if (results.some((payload) => payload === null)) throw new Error("Catalog range batch is incomplete");
  return results as ArrayBuffer[];
}

async function resolveSourceLocation(sourceId: string, signal: AbortSignal): Promise<CatalogSourceLocationV1 | null> {
  if (!manifest || sourceDirectory.length === 0) return null;
  const page = selectCatalogSourcePageV1(sourceDirectory, sourceId);
  if (!page) return null;
  const start = page.byteOffset;
  const end = start + page.entryCount * manifest.sourceIndex.entryBytes - 1;
  const [buffer] = await loadRanges(
    manifest.sourceIndex.data.url,
    [{ start, end, cells: [] }],
    signal,
    false,
  );
  return findCatalogSourceLocationV1(buffer, sourceId);
}

async function streamView(request: Extract<CatalogStreamWorkerRequestV9, { type: "view" }>): Promise<void> {
  await initialize();
  activeRequestId = request.requestId;
  activeAbortController?.abort();
  const abortController = new AbortController();
  activeAbortController = abortController;
  readyMs = 0;
  persistentReadMs = 0;
  networkWallMs = 0;
  checksumMs = 0;
  decodeTimeMs = 0;
  mergedRangeRequestCount = 0;
  selectedRangeBytes = 0;
  gapRangeBytes = 0;
  bufferedRangeResponses = 0;
  streamedRangeResponses = 0;
  unknownRangeResponses = 0;
  selectedSourceRetention = request.selectedSourceId ? "unavailable" : "not-requested";
  const selectedTiles = selectCatalogTilesForConeV8(entries, request.raDeg, request.decDeg, request.fovDeg, request.recordBudget);
  const streamStarted = performance.now();
  postSnapshot({ status: "streaming", activeTileCount: selectedTiles.length });
  if (request.selectedSourceId) {
    const location = await resolveSourceLocation(request.selectedSourceId, abortController.signal);
    const selectedTile = location ? entriesByCell.get(location.cell) : undefined;
    if (selectedTile && !selectedTiles.some((entry) => entry.cell === selectedTile.cell)) selectedTiles.push(selectedTile);
  }
  const rangePlan = activeContract === "v10"
    ? mergeCatalogTileRangesWithinBudgetV10(selectedTiles)
    : null;
  const ranges = rangePlan?.ranges ?? mergeCatalogTileRangesV8(selectedTiles, 0);
  mergedRangeRequestCount = ranges.length;
  selectedRangeBytes = rangePlan?.telemetry.selectedBytes ?? ranges.reduce((sum, range) => sum + range.end - range.start + 1, 0);
  gapRangeBytes = rangePlan?.telemetry.gapBytes ?? 0;
  const buffers = await loadRanges(
    activeArchiveUrl(),
    ranges,
    abortController.signal,
    activeContract !== "v8",
  );
  if (activeRequestId !== request.requestId || abortController.signal.aborted) return;
  const decodeStarted = performance.now();
  let records = activeContract === "v10"
    ? decodeCatalogSelectedRangesV10(ranges, buffers, entriesByCell)
    : buffers.flatMap((buffer) => decodeCatalogTileRecordsV8(buffer));
  decodeTimeMs = performance.now() - decodeStarted;
  if (request.selectedSourceId) {
    const selected = records.find((record) => record.sourceId === request.selectedSourceId);
    if (selected) {
      selectedSourceRetention = "retained";
      records = [selected, ...records.filter((record) => record.sourceId !== request.selectedSourceId)];
    }
  }
  records = records.slice(0, request.recordBudget);
  const points = createCatalogStreamPointArraysV8(records);
  const response = {
    type: "points",
    requestId: request.requestId,
    positions: points.positions,
    colors: points.colors,
    sizes: points.sizes,
    recordCount: records.length,
    cells: selectedTiles.map(({ cell }) => cell),
  } satisfies CatalogStreamWorkerResponseV9;
  self.postMessage(response, [points.positions.buffer, points.colors.buffer, points.sizes.buffer]);
  readyMs = performance.now() - streamStarted;
  postSnapshot({ status: "ready", requestId: request.requestId, activeTileCount: selectedTiles.length, activeRecordCount: records.length });
  setTimeout(() => {
    void persistentCache.flush().then(() => {
      if (activeRequestId !== request.requestId) return;
      postSnapshot({
        status: "ready",
        requestId: request.requestId,
        activeTileCount: selectedTiles.length,
        activeRecordCount: records.length,
      });
    });
  }, 0);
}

async function resolveSource(request: Extract<CatalogStreamWorkerRequestV9, { type: "resolve-source" }>): Promise<void> {
  await initialize();
  activeRequestId = request.requestId;
  activeAbortController?.abort();
  const abortController = new AbortController();
  activeAbortController = abortController;
  const location = await resolveSourceLocation(request.sourceId, abortController.signal);
  self.postMessage({ type: "source", requestId: request.requestId, sourceId: request.sourceId, location } satisfies CatalogStreamWorkerResponseV9);
}

self.addEventListener("message", (event: MessageEvent<CatalogStreamWorkerRequestV9>) => {
  const request = event.data;
  if (request.type === "clear-cache" || request.type === "clear-memory-cache") {
    activeAbortController?.abort();
    cache.clear();
    cacheHitCount = 0;
    cacheMissCount = 0;
    rangeRequestCount = 0;
    transferredBytes = 0;
    mergedRangeRequestCount = 0;
    selectedRangeBytes = 0;
    gapRangeBytes = 0;
    bufferedRangeResponses = 0;
    streamedRangeResponses = 0;
    unknownRangeResponses = 0;
    postSnapshot();
    return;
  }
  if (request.type === "clear-persistent-cache") {
    void persistentCache.clear().then(() => postSnapshot());
    return;
  }
  const operation = request.type === "init"
    ? initialize(request.manifestUrl)
    : request.type === "resolve-source"
      ? resolveSource(request)
      : streamView(request);
  void operation.catch((error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") return;
    if (activeFallback === "none" || activeFallback === "v9-1221242" || activeFallback === "v8-1221242") activeFallback = "v255-46000";
    postSnapshot({ status: "blocked", error: error instanceof Error ? error.message : String(error) });
  });
});

export {};
