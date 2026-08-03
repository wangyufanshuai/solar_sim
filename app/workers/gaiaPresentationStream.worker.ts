/// <reference lib="webworker" />

import { atlasAssetCandidates } from "../lib/atlasAssetResolver";
import {
  createCatalogStreamPointArraysV8,
  mergeCatalogTileRangesV8,
  selectCatalogTilesForConeV8,
  type CatalogByteRangeV8,
  type CatalogStreamRecordV8,
  type CatalogTileIndexEntryV8,
} from "../lib/catalogTileV8";
import {
  crc32CatalogPayloadV9,
  findCatalogSourceLocationV1,
  parseCatalogSourceDirectoryV1,
  selectCatalogSourcePageV1,
  type CatalogSourceDirectoryEntryV1,
  type CatalogSourceLocationV1,
} from "../lib/catalogTileV9";
import {
  GAIA_PRESENTATION_MANIFEST_URL_V9,
  decodeGaiaPresentationRecordsV9,
  parseGaiaPresentationDirectoryV9,
  parseGaiaPresentationLeafPageV9,
  type GaiaPresentationDirectoryEntryV9,
  type GaiaPresentationLeafEntryV9,
  type GaiaPresentationRecordV9,
} from "../lib/gaiaPresentationCatalogV9";
import { parseGaiaPresentationCatalogManifestV272, type GaiaPresentationCatalogManifestV272 } from "../lib/gaiaPresentationCatalogV272";

export type GaiaPresentationStreamRequestV272 =
  | { type: "init" }
  | { type: "view"; requestId: number; raDeg: number; decDeg: number; fovDeg: number; recordBudget: number; selectedSourceId?: string };

export type GaiaPresentationStreamSnapshotV272 = {
  status: "idle" | "initializing" | "ready" | "streaming" | "blocked";
  requestId: number;
  activeParentCells: number;
  activeLeafCells: number;
  activeRecords: number;
  rangeRequests: number;
  transferredBytes: number;
  selectedSourceRetention: "not-requested" | "retained" | "unavailable";
  fallback: "none" | "catalog-v10-1221242";
  error: string;
};

export type GaiaPresentationStreamResponseV272 =
  | { type: "snapshot"; snapshot: GaiaPresentationStreamSnapshotV272 }
  | { type: "points"; requestId: number; positions: Float32Array; colors: Float32Array; sizes: Float32Array; recordCount: number };

let manifest: GaiaPresentationCatalogManifestV272 | null = null;
let directory: GaiaPresentationDirectoryEntryV9[] = [];
let sourceDirectory: CatalogSourceDirectoryEntryV1[] = [];
let initializePromise: Promise<void> | null = null;
let activeRequestId = 0;
let activeAbort: AbortController | null = null;
let rangeRequests = 0;
let transferredBytes = 0;

function snapshot(partial: Partial<GaiaPresentationStreamSnapshotV272> = {}): void {
  const value: GaiaPresentationStreamSnapshotV272 = {
    status: manifest ? "ready" : "idle",
    requestId: activeRequestId,
    activeParentCells: 0,
    activeLeafCells: 0,
    activeRecords: 0,
    rangeRequests,
    transferredBytes,
    selectedSourceRetention: "not-requested",
    fallback: "none",
    error: "",
    ...partial,
  };
  self.postMessage({ type: "snapshot", snapshot: value } satisfies GaiaPresentationStreamResponseV272);
}

async function fetchAsset(path: string, init?: RequestInit): Promise<Response> {
  const primary = atlasAssetCandidates(path)[0];
  if (!primary) throw new Error("Gaia 10m asset path is unavailable");
  return fetch(primary, init);
}

async function initialize(): Promise<void> {
  if (manifest) return;
  if (initializePromise) return initializePromise;
  snapshot({ status: "initializing" });
  initializePromise = (async () => {
    const response = await fetchAsset(GAIA_PRESENTATION_MANIFEST_URL_V9, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Gaia 10m manifest unavailable: ${response.status}`);
    const text = await response.text();
    const parsed = parseGaiaPresentationCatalogManifestV272(JSON.parse(text));
    const [directoryResponse, sourceResponse] = await Promise.all([
      fetchAsset(parsed.directoryOrder6.url, { cache: "force-cache" }),
      fetchAsset(parsed.sourceIndex.directory.url, { cache: "force-cache" }),
    ]);
    if (!directoryResponse.ok || !sourceResponse.ok) throw new Error("Gaia 10m bootstrap indexes are unavailable");
    const [directoryBuffer, sourceBuffer] = await Promise.all([directoryResponse.arrayBuffer(), sourceResponse.arrayBuffer()]);
    if (directoryBuffer.byteLength !== parsed.directoryOrder6.byteLength || sourceBuffer.byteLength !== parsed.sourceIndex.directory.byteLength) {
      throw new Error("Gaia 10m bootstrap index length mismatch");
    }
    manifest = parsed;
    directory = parseGaiaPresentationDirectoryV9(directoryBuffer);
    sourceDirectory = parseCatalogSourceDirectoryV1(sourceBuffer);
    transferredBytes += new TextEncoder().encode(text).byteLength + directoryBuffer.byteLength + sourceBuffer.byteLength;
    snapshot({ status: "ready" });
  })().catch((error: unknown) => {
    manifest = null;
    directory = [];
    sourceDirectory = [];
    snapshot({ status: "blocked", fallback: "catalog-v10-1221242", error: error instanceof Error ? error.message : String(error) });
    throw error;
  }).finally(() => { initializePromise = null; });
  return initializePromise;
}

function parentEntries(): CatalogTileIndexEntryV8[] {
  return directory.map((entry) => ({
    cell: entry.parentCell,
    archiveOffset: entry.archiveOffset,
    byteLength: entry.archiveByteLength,
    rowCount: entry.archiveByteLength / 24,
    parentOrder5Cell: entry.parentCell >> 2,
    centerRaDeg: entry.centerRaDeg,
    centerDecDeg: entry.centerDecDeg,
  }));
}

async function fetchRanges(url: string, ranges: readonly CatalogByteRangeV8[], signal: AbortSignal): Promise<ArrayBuffer[]> {
  const result = new Array<ArrayBuffer>(ranges.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(4, ranges.length) }, async () => {
    while (cursor < ranges.length) {
      const index = cursor++;
      const range = ranges[index]!;
      rangeRequests += 1;
      const response = await fetchAsset(url, { headers: { Range: `bytes=${range.start}-${range.end}` }, cache: "force-cache", signal });
      if (response.status !== 206 && response.status !== 200) throw new Error(`Gaia 10m Range failed: ${response.status}`);
      const full = await response.arrayBuffer();
      const expected = range.end - range.start + 1;
      const payload = response.status === 200 ? full.slice(range.start, range.end + 1) : full;
      if (payload.byteLength !== expected) throw new Error("Gaia 10m Range length mismatch");
      transferredBytes += payload.byteLength;
      result[index] = payload;
    }
  }));
  return result;
}

function sliceEntry(range: CatalogByteRangeV8, payload: ArrayBuffer, offset: number, byteLength: number): ArrayBuffer {
  const relative = offset - range.start;
  if (relative < 0 || relative + byteLength > payload.byteLength) throw new Error("Gaia 10m entry lies outside fetched Range");
  return payload.slice(relative, relative + byteLength);
}

async function loadLeafEntries(parents: readonly CatalogTileIndexEntryV8[], signal: AbortSignal): Promise<GaiaPresentationLeafEntryV9[]> {
  if (!manifest) throw new Error("Gaia 10m manifest is unavailable");
  const byParent = new Map(directory.map((entry) => [entry.parentCell, entry]));
  const leafRanges = mergeCatalogTileRangesV8(parents.map((parent) => {
    const entry = byParent.get(parent.cell)!;
    return { ...parent, archiveOffset: entry.leafPageOffset, byteLength: entry.leafPageByteLength, rowCount: 16 };
  }), 64 * 1024);
  const buffers = await fetchRanges(manifest.leafIndexOrder8.url, leafRanges, signal);
  const leaves: GaiaPresentationLeafEntryV9[] = [];
  for (let rangeIndex = 0; rangeIndex < leafRanges.length; rangeIndex += 1) {
    const range = leafRanges[rangeIndex]!;
    const payload = buffers[rangeIndex]!;
    for (const parentCell of range.cells) {
      const parent = byParent.get(parentCell);
      if (!parent) throw new Error("Gaia 10m leaf parent is unavailable");
      leaves.push(...parseGaiaPresentationLeafPageV9(parentCell, sliceEntry(range, payload, parent.leafPageOffset, parent.leafPageByteLength)).filter((entry) => entry.rowCount > 0));
    }
  }
  return leaves;
}

function leafAsTile(entry: GaiaPresentationLeafEntryV9): CatalogTileIndexEntryV8 {
  return {
    cell: entry.cell,
    archiveOffset: entry.archiveOffset,
    byteLength: entry.byteLength,
    rowCount: entry.rowCount,
    parentOrder5Cell: entry.cell >> 6,
    centerRaDeg: 0,
    centerDecDeg: 0,
  };
}

function verifyAndDecode(ranges: readonly CatalogByteRangeV8[], buffers: readonly ArrayBuffer[], leaves: readonly GaiaPresentationLeafEntryV9[]): GaiaPresentationRecordV9[] {
  const byCell = new Map(leaves.map((entry) => [entry.cell, entry]));
  const records: GaiaPresentationRecordV9[] = [];
  ranges.forEach((range, rangeIndex) => {
    const payload = buffers[rangeIndex]!;
    for (const cell of range.cells) {
      const leaf = byCell.get(cell);
      if (!leaf) throw new Error("Gaia 10m archive Range references an unknown leaf");
      const segment = sliceEntry(range, payload, leaf.archiveOffset, leaf.byteLength);
      if (crc32CatalogPayloadV9(segment) !== leaf.crc32) throw new Error(`Gaia 10m CRC mismatch for cell ${cell}`);
      records.push(...decodeGaiaPresentationRecordsV9(segment));
    }
  });
  return records;
}

async function resolveSource(sourceId: string, signal: AbortSignal): Promise<CatalogSourceLocationV1 | null> {
  if (!manifest) return null;
  const page = selectCatalogSourcePageV1(sourceDirectory, sourceId);
  if (!page) return null;
  const start = page.byteOffset;
  const end = start + page.entryCount * 16 - 1;
  const [payload] = await fetchRanges(manifest.sourceIndex.data.url, [{ start, end, cells: [] }], signal);
  return findCatalogSourceLocationV1(payload, sourceId);
}

async function streamView(request: Extract<GaiaPresentationStreamRequestV272, { type: "view" }>): Promise<void> {
  await initialize();
  if (!manifest) throw new Error("Gaia 10m manifest is unavailable");
  activeRequestId = request.requestId;
  activeAbort?.abort();
  const controller = new AbortController();
  activeAbort = controller;
  rangeRequests = 0;
  transferredBytes = 0;
  const parents = selectCatalogTilesForConeV8(parentEntries(), request.raDeg, request.decDeg, request.fovDeg, request.recordBudget);
  snapshot({ status: "streaming", requestId: request.requestId, activeParentCells: parents.length, selectedSourceRetention: request.selectedSourceId ? "unavailable" : "not-requested" });
  let leaves = await loadLeafEntries(parents, controller.signal);
  let selectedLocation: CatalogSourceLocationV1 | null = null;
  if (request.selectedSourceId) {
    selectedLocation = await resolveSource(request.selectedSourceId, controller.signal);
    if (selectedLocation && !leaves.some((entry) => entry.cell === selectedLocation!.cell)) {
      const parentCell = selectedLocation.cell >> 4;
      const parent = parentEntries().find((entry) => entry.cell === parentCell);
      if (parent) leaves = [...leaves, ...await loadLeafEntries([parent], controller.signal)];
    }
  }
  const archiveRanges = mergeCatalogTileRangesV8(leaves.map(leafAsTile), 64 * 1024);
  const archiveBuffers = await fetchRanges(manifest.archive.url, archiveRanges, controller.signal);
  if (controller.signal.aborted || activeRequestId !== request.requestId) return;
  let records = verifyAndDecode(archiveRanges, archiveBuffers, leaves);
  let retention: GaiaPresentationStreamSnapshotV272["selectedSourceRetention"] = request.selectedSourceId ? "unavailable" : "not-requested";
  if (request.selectedSourceId) {
    const selected = records.find((record) => record.sourceId === request.selectedSourceId);
    if (selected) {
      retention = "retained";
      records = [selected, ...records.filter((record) => record.sourceId !== request.selectedSourceId)];
    }
  }
  records = records.slice(0, request.recordBudget);
  const compatible: CatalogStreamRecordV8[] = records.map((record, rowId) => ({ ...record, rowId, flags: 0 }));
  const points = createCatalogStreamPointArraysV8(compatible);
  self.postMessage({ type: "points", requestId: request.requestId, positions: points.positions, colors: points.colors, sizes: points.sizes, recordCount: records.length } satisfies GaiaPresentationStreamResponseV272, [points.positions.buffer, points.colors.buffer, points.sizes.buffer]);
  snapshot({ status: "ready", requestId: request.requestId, activeParentCells: parents.length, activeLeafCells: leaves.length, activeRecords: records.length, selectedSourceRetention: retention });
}

self.addEventListener("message", (event: MessageEvent<GaiaPresentationStreamRequestV272>) => {
  const request = event.data;
  const operation = request.type === "init" ? initialize() : streamView(request);
  void operation.catch((error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") return;
    snapshot({ status: "blocked", requestId: "requestId" in request ? request.requestId : activeRequestId, fallback: "catalog-v10-1221242", error: error instanceof Error ? error.message : String(error) });
  });
});

export {};
