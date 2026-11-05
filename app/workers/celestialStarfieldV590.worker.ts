/// <reference lib="webworker" />

import { atlasAssetCandidates } from "../lib/atlasAssetResolver";
import {
  type CatalogByteRangeV8,
  type CatalogTileIndexEntryV8,
} from "../lib/catalogTileV8";
import { crc32CatalogPayloadV9 } from "../lib/catalogTileV9";
import {
  GAIA_PRESENTATION_MANIFEST_URL_V9,
  decodeGaiaPresentationRecordsV9,
  parseGaiaPresentationDirectoryV9,
  parseGaiaPresentationLeafPageV9,
  type GaiaPresentationDirectoryEntryV9,
  type GaiaPresentationLeafEntryV9,
  type GaiaPresentationRecordV9,
} from "../lib/gaiaPresentationCatalogV9";
import {
  parseGaiaPresentationCatalogManifestV272,
  type GaiaPresentationCatalogManifestV272,
} from "../lib/gaiaPresentationCatalogV272";
import {
  CONSTELLATION_BINDING_URL_V590,
  GAIA_RANGE_CONCURRENCY_V590,
  CONSTELLATION_BINDING_FILE_SHA256_V590,
  GAIA_LITE_SHA256_V590,
  GAIA_LITE_URL_V590,
  mergeBoundedCatalogRangesV590,
  angularDistanceDegV590,
  bpRpToLinearRgbV590,
  classifyStarPsfV590,
  parseConstellationBindingReceiptV590,
  raDecToCelestialPositionV590,
  selectStratifiedCatalogLeavesV590,
  selectStratifiedCatalogParentsV590,
  starBudgetV590,
  starPixelSizeV590,
  stratifiedParentLimitV590,
  visualMagnitudeFluxV590,
  type CelestialStarfieldViewV590,
} from "../lib/celestialDeepSpaceV590";
import type { CelestialDeliveryTierV590, CelestialDeviceTierV590 } from "../lib/celestialRenderingV590";

type LoadRequestV590 = Readonly<{
  type: "load" | "view";
  requestId: number;
  deliveryTier: CelestialDeliveryTierV590;
  deviceTier: CelestialDeviceTierV590;
  view: CelestialStarfieldViewV590;
}>;

type ReleaseRequestV590 = Readonly<{ type: "release"; requestId: number }>;
export type CelestialStarfieldRequestV590 = LoadRequestV590 | ReleaseRequestV590;

export type CelestialStarfieldResponseV590 =
  | Readonly<{
    type: "snapshot";
    requestId: number;
    status: "loading" | "ready" | "blocked" | "released";
    catalogVersion: string;
    recordCount: number;
    layerCounts: Readonly<{ faint: number; catalog: number; brightPsf: number }>;
    anchorCount: number;
    rangeRequests: number;
    transferredBytes: number;
    view: CelestialStarfieldViewV590;
    reason: string;
  }>
  | Readonly<{
    type: "points";
    requestId: number;
    directions: Float32Array;
    linearRgb: Float32Array;
    apparentFlux: Float32Array;
    sizes: Float32Array;
    psfClass: Uint8Array;
    sourceIds: BigUint64Array;
    constellationAnchorIndex: Int32Array;
    catalogVersion: string;
    presentationOnly: true;
  }>;

type GaiaRecordV590 = Readonly<{
  sourceId: bigint;
  raDeg: number;
  decDeg: number;
  magG: number;
  colorBpRp: number | null;
}>;

type LiteBundleV590 = Readonly<{
  records: readonly GaiaRecordV590[];
  anchors: ReadonlyMap<bigint, number>;
}>;

const RECORD_BYTES = 24;
const UINT32_SCALE = 0x1_0000_0000;
const UINT32_MAX = 0xffff_ffff;
const COLOR_MISSING = -0x8000;
const DEFAULT_VIEW_V590: CelestialStarfieldViewV590 = Object.freeze({ raDeg: 270, decDeg: -28, fovDeg: 82 });
const FULL_CATALOG_VERSION_V590 = "gaia-dr3-presentation-10000000-v9-range-plus-gaia-lite-46000-hybrid-v590";
const LITE_CATALOG_VERSION_V590 = "gaia-lite-46000-v589-readonly-v590";

let activeRequestId = 0;
let activeAbort: AbortController | null = null;
let fullManifest: GaiaPresentationCatalogManifestV272 | null = null;
let fullDirectory: GaiaPresentationDirectoryEntryV9[] = [];
let fullInitializePromise: Promise<void> | null = null;
let fullInitializeAbort: AbortController | null = null;
let liteBundlePromise: Promise<LiteBundleV590> | null = null;
let liteBundleAbort: AbortController | null = null;
let rangeRequests = 0;
let transferredBytes = 0;
let lastCompleted: Readonly<{
  viewKey: string;
  catalogVersion: string;
  recordCount: number;
  layerCounts: Readonly<{ faint: number; catalog: number; brightPsf: number }>;
  anchorCount: number;
  view: CelestialStarfieldViewV590;
}> | null = null;

function viewKeyV590(view: CelestialStarfieldViewV590): string {
  return [view.raDeg, view.decDeg, view.fovDeg].map((value) => value.toFixed(6)).join(":");
}

function validView(value: CelestialStarfieldViewV590 | undefined): CelestialStarfieldViewV590 {
  if (!value) return DEFAULT_VIEW_V590;
  const raDeg = Number(value.raDeg);
  const decDeg = Number(value.decDeg);
  const fovDeg = Number(value.fovDeg);
  if (![raDeg, decDeg, fovDeg].every(Number.isFinite) || decDeg < -90 || decDeg > 90 || fovDeg < 8 || fovDeg > 170) {
    throw new Error("v590-gaia-view-invalid");
  }
  return { raDeg: ((raDeg % 360) + 360) % 360, decDeg, fovDeg };
}

function postSnapshot(
  requestId: number,
  status: Extract<CelestialStarfieldResponseV590, { type: "snapshot" }>["status"],
  partial: Partial<Extract<CelestialStarfieldResponseV590, { type: "snapshot" }>> = {},
): void {
  self.postMessage({
    type: "snapshot",
    requestId,
    status,
    catalogVersion: LITE_CATALOG_VERSION_V590,
    recordCount: 0,
    layerCounts: { faint: 0, catalog: 0, brightPsf: 0 },
    anchorCount: 0,
    rangeRequests,
    transferredBytes,
    view: DEFAULT_VIEW_V590,
    reason: "none",
    ...partial,
  } satisfies CelestialStarfieldResponseV590);
}

function bytesHex(bytes: Uint8Array): string {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  return bytesHex(new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)));
}

function decodeLite(buffer: ArrayBuffer): GaiaRecordV590[] {
  if (buffer.byteLength !== 46_000 * RECORD_BYTES) throw new Error(`v590-gaia-bytes:${buffer.byteLength}`);
  const view = new DataView(buffer);
  const records: GaiaRecordV590[] = [];
  for (let offset = 0; offset < buffer.byteLength; offset += RECORD_BYTES) {
    const color = view.getInt16(offset + 18, true);
    records.push({
      sourceId: view.getBigUint64(offset, true),
      raDeg: view.getUint32(offset + 8, true) / UINT32_SCALE * 360,
      decDeg: view.getUint32(offset + 12, true) / UINT32_MAX * 180 - 90,
      magG: view.getUint16(offset + 16, true) / 1000 - 5,
      colorBpRp: color === COLOR_MISSING ? null : color / 1000,
    });
  }
  return records;
}

async function fetchPrimary(path: string, init?: RequestInit): Promise<Response> {
  const primary = atlasAssetCandidates(path)[0] ?? path;
  return fetch(primary, init);
}

async function loadLiteBundle(): Promise<LiteBundleV590> {
  if (!liteBundlePromise) {
    const controller = new AbortController();
    liteBundleAbort = controller;
    liteBundlePromise = (async () => {
      const [catalogResponse, bindingResponse] = await Promise.all([
        fetch(`${GAIA_LITE_URL_V590}?sha256=${GAIA_LITE_SHA256_V590}`, { cache: "force-cache", signal: controller.signal }),
        fetch(`${CONSTELLATION_BINDING_URL_V590}?identity=v590-readonly`, { cache: "force-cache", signal: controller.signal }),
      ]);
      if (!catalogResponse.ok) throw new Error(`v590-gaia-fetch:${catalogResponse.status}`);
      if (!bindingResponse.ok) throw new Error(`v590-constellation-fetch:${bindingResponse.status}`);
      const [buffer, bindingBuffer] = await Promise.all([catalogResponse.arrayBuffer(), bindingResponse.arrayBuffer()]);
      if (await sha256(buffer) !== GAIA_LITE_SHA256_V590) throw new Error("v590-gaia-sha");
      if (await sha256(bindingBuffer) !== CONSTELLATION_BINDING_FILE_SHA256_V590) throw new Error("v590-constellation-file-sha");
      const bindingValue = JSON.parse(new TextDecoder().decode(bindingBuffer)) as unknown;
      const receipt = parseConstellationBindingReceiptV590(bindingValue);
      const anchors = new Map<bigint, number>();
      receipt.bindings.flatMap((entry) => entry.waypoints).forEach((entry, index) => {
        const sourceId = BigInt(entry.sourceId);
        if (!anchors.has(sourceId)) anchors.set(sourceId, index);
      });
      return { records: decodeLite(buffer), anchors };
    })().catch((error: unknown) => {
      liteBundlePromise = null;
      throw error;
    }).finally(() => {
      if (liteBundleAbort === controller) liteBundleAbort = null;
    });
  }
  return liteBundlePromise;
}

function parentEntries(): CatalogTileIndexEntryV8[] {
  return fullDirectory.map((entry) => ({
    cell: entry.parentCell,
    archiveOffset: entry.archiveOffset,
    byteLength: entry.archiveByteLength,
    rowCount: entry.archiveByteLength / RECORD_BYTES,
    parentOrder5Cell: entry.parentCell >> 2,
    centerRaDeg: entry.centerRaDeg,
    centerDecDeg: entry.centerDecDeg,
  }));
}

async function initializeFull(): Promise<void> {
  if (fullManifest) return;
  if (fullInitializePromise) return fullInitializePromise;
  const controller = new AbortController();
  fullInitializeAbort = controller;
  fullInitializePromise = (async () => {
    const manifestResponse = await fetchPrimary(GAIA_PRESENTATION_MANIFEST_URL_V9, { cache: "force-cache", signal: controller.signal });
    if (!manifestResponse.ok) throw new Error(`v590-gaia-10m-manifest:${manifestResponse.status}`);
    const manifestText = await manifestResponse.text();
    const parsed = parseGaiaPresentationCatalogManifestV272(JSON.parse(manifestText));
    const directoryResponse = await fetchPrimary(parsed.directoryOrder6.url, { cache: "force-cache", signal: controller.signal });
    if (!directoryResponse.ok) throw new Error(`v590-gaia-10m-directory:${directoryResponse.status}`);
    const directoryBuffer = await directoryResponse.arrayBuffer();
    if (directoryBuffer.byteLength !== parsed.directoryOrder6.byteLength) throw new Error("v590-gaia-10m-directory-bytes");
    if (await sha256(directoryBuffer) !== parsed.directoryOrder6.sha256) throw new Error("v590-gaia-10m-directory-sha");
    fullManifest = parsed;
    fullDirectory = parseGaiaPresentationDirectoryV9(directoryBuffer);
    transferredBytes += new TextEncoder().encode(manifestText).byteLength + directoryBuffer.byteLength;
  })().catch((error: unknown) => {
    fullManifest = null;
    fullDirectory = [];
    throw error;
  }).finally(() => {
    fullInitializePromise = null;
    if (fullInitializeAbort === controller) fullInitializeAbort = null;
  });
  return fullInitializePromise;
}

async function fetchRanges(
  stage: "leaf" | "archive",
  url: string,
  ranges: readonly CatalogByteRangeV8[],
  signal: AbortSignal,
): Promise<ArrayBuffer[]> {
  const result = new Array<ArrayBuffer>(ranges.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(GAIA_RANGE_CONCURRENCY_V590, ranges.length) }, async () => {
    while (cursor < ranges.length) {
      const index = cursor++;
      const range = ranges[index]!;
      const expected = range.end - range.start + 1;
      rangeRequests += 1;
      let response: Response;
      try {
        response = await fetchPrimary(url, {
          headers: { Range: `bytes=${range.start}-${range.end}` },
          cache: "force-cache",
          signal,
        });
      } catch (error) {
        if (signal.aborted) throw new DOMException("v590-gaia-range-aborted", "AbortError");
        throw new Error(`v590-gaia-${stage}-fetch:${index}:${range.start}-${range.end}:${error instanceof Error ? error.message : String(error)}`);
      }
      if (response.status !== 206 && response.status !== 200) throw new Error(`v590-gaia-10m-range:${response.status}`);
      const declaredLength = Number(response.headers.get("content-length"));
      if (response.status === 200 && Number.isFinite(declaredLength) && declaredLength > expected) {
        await response.body?.cancel();
        throw new Error("v590-gaia-10m-range-unsupported");
      }
      const full = await response.arrayBuffer();
      const payload = response.status === 200 && full.byteLength !== expected
        ? full.slice(range.start, range.end + 1)
        : full;
      if (payload.byteLength !== expected) throw new Error("v590-gaia-10m-range-length");
      transferredBytes += payload.byteLength;
      result[index] = payload;
    }
  }));
  return result;
}

function sliceEntry(range: CatalogByteRangeV8, payload: ArrayBuffer, offset: number, byteLength: number): ArrayBuffer {
  const relative = offset - range.start;
  if (relative < 0 || relative + byteLength > payload.byteLength) throw new Error("v590-gaia-10m-range-bounds");
  return payload.slice(relative, relative + byteLength);
}

async function loadLeafEntries(parents: readonly CatalogTileIndexEntryV8[], signal: AbortSignal): Promise<GaiaPresentationLeafEntryV9[]> {
  if (!fullManifest) throw new Error("v590-gaia-10m-manifest-unavailable");
  const byParent = new Map(fullDirectory.map((entry) => [entry.parentCell, entry]));
  const leafRanges = mergeBoundedCatalogRangesV590(parents.map((parent) => {
    const entry = byParent.get(parent.cell);
    if (!entry) throw new Error("v590-gaia-10m-parent-unavailable");
    return { ...parent, archiveOffset: entry.leafPageOffset, byteLength: entry.leafPageByteLength, rowCount: 16 };
  }));
  const buffers = await fetchRanges("leaf", fullManifest.leafIndexOrder8.url, leafRanges, signal);
  const leaves: GaiaPresentationLeafEntryV9[] = [];
  for (let rangeIndex = 0; rangeIndex < leafRanges.length; rangeIndex += 1) {
    const range = leafRanges[rangeIndex]!;
    const payload = buffers[rangeIndex]!;
    for (const parentCell of range.cells) {
      const parent = byParent.get(parentCell);
      if (!parent) throw new Error("v590-gaia-10m-leaf-parent-unavailable");
      const page = sliceEntry(range, payload, parent.leafPageOffset, parent.leafPageByteLength);
      leaves.push(...parseGaiaPresentationLeafPageV9(parentCell, page).filter((entry) => entry.rowCount > 0));
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

function verifyAndDecode(
  ranges: readonly CatalogByteRangeV8[],
  buffers: readonly ArrayBuffer[],
  leaves: readonly GaiaPresentationLeafEntryV9[],
): GaiaPresentationRecordV9[] {
  const byCell = new Map(leaves.map((entry) => [entry.cell, entry]));
  const records: GaiaPresentationRecordV9[] = [];
  ranges.forEach((range, rangeIndex) => {
    const payload = buffers[rangeIndex]!;
    for (const cell of range.cells) {
      const leaf = byCell.get(cell);
      if (!leaf) throw new Error("v590-gaia-10m-leaf-unknown");
      const segment = sliceEntry(range, payload, leaf.archiveOffset, leaf.byteLength);
      if (crc32CatalogPayloadV9(segment) !== leaf.crc32) throw new Error(`v590-gaia-10m-crc:${cell}`);
      records.push(...decodeGaiaPresentationRecordsV9(segment));
    }
  });
  return records;
}

function compatibleFull(record: GaiaPresentationRecordV9): GaiaRecordV590 {
  return {
    sourceId: BigInt(record.sourceId),
    raDeg: record.raDeg,
    decDeg: record.decDeg,
    magG: record.magG,
    colorBpRp: record.colorBpRp,
  };
}

async function streamFull(view: CelestialStarfieldViewV590, budget: number, signal: AbortSignal): Promise<GaiaRecordV590[]> {
  await initializeFull();
  if (!fullManifest) throw new Error("v590-gaia-10m-manifest-unavailable");
  const parents = selectStratifiedCatalogParentsV590(parentEntries(), view, stratifiedParentLimitV590(budget));
  const leaves = selectStratifiedCatalogLeavesV590(
    await loadLeafEntries(parents, signal),
    parents.map((entry) => entry.cell),
    Math.max(1, budget - 484),
  );
  const archiveRanges = mergeBoundedCatalogRangesV590(leaves.map(leafAsTile));
  const archiveBuffers = await fetchRanges("archive", fullManifest.archive.url, archiveRanges, signal);
  return verifyAndDecode(archiveRanges, archiveBuffers, leaves)
    .map(compatibleFull)
    .filter((record) => angularDistanceDegV590(record.raDeg, record.decDeg, view.raDeg, view.decDeg) <= view.fovDeg * 0.5 + 7)
    .sort((left, right) => left.sourceId < right.sourceId ? -1 : left.sourceId > right.sourceId ? 1 : 0)
    .slice(0, Math.max(0, budget));
}

function selectLiteRecords(
  records: readonly GaiaRecordV590[],
  anchors: ReadonlyMap<bigint, number>,
  budget: number,
  view: CelestialStarfieldViewV590,
): GaiaRecordV590[] {
  const cone = records
    .filter((record) => angularDistanceDegV590(record.raDeg, record.decDeg, view.raDeg, view.decDeg) <= view.fovDeg * 0.66 + 12)
    .sort((left, right) => left.magG - right.magG || (left.sourceId < right.sourceId ? -1 : 1));
  const selected = cone.slice(0, Math.max(0, budget - anchors.size));
  const selectedIds = new Set(selected.map((record) => record.sourceId));
  for (const record of records) {
    if (!anchors.has(record.sourceId) || selectedIds.has(record.sourceId)) continue;
    selected.push(record);
    selectedIds.add(record.sourceId);
  }
  return selected.sort((left, right) => left.sourceId < right.sourceId ? -1 : left.sourceId > right.sourceId ? 1 : 0);
}

function mergeFullWithLiteV590(
  fullRecords: readonly GaiaRecordV590[],
  liteRecords: readonly GaiaRecordV590[],
  budget: number,
): GaiaRecordV590[] {
  const result = [...liteRecords.slice(0, budget)];
  const selectedIds = new Set(result.map((record) => record.sourceId));
  for (const record of fullRecords) {
    if (result.length >= budget) break;
    if (selectedIds.has(record.sourceId)) continue;
    result.push(record);
    selectedIds.add(record.sourceId);
  }
  return result.sort((left, right) => left.sourceId < right.sourceId ? -1 : left.sourceId > right.sourceId ? 1 : 0);
}

function emitPoints(
  request: LoadRequestV590,
  records: readonly GaiaRecordV590[],
  anchors: ReadonlyMap<bigint, number>,
  catalogVersion: string,
  view: CelestialStarfieldViewV590,
): void {
  const directions = new Float32Array(records.length * 3);
  const linearRgb = new Float32Array(records.length * 3);
  const apparentFlux = new Float32Array(records.length);
  const sizes = new Float32Array(records.length);
  const psfClass = new Uint8Array(records.length);
  const sourceIds = new BigUint64Array(records.length);
  const constellationAnchorIndex = new Int32Array(records.length);
  constellationAnchorIndex.fill(-1);
  const layerCounts = { faint: 0, catalog: 0, brightPsf: 0 };
  let anchorCount = 0;
  records.forEach((record, index) => {
    const point = raDecToCelestialPositionV590(record.raDeg, record.decDeg, 1);
    const color = bpRpToLinearRgbV590(record.colorBpRp);
    const psf = classifyStarPsfV590(record.magG);
    directions.set(point, index * 3);
    linearRgb.set(color, index * 3);
    apparentFlux[index] = visualMagnitudeFluxV590(record.magG);
    sizes[index] = starPixelSizeV590(record.magG, psf);
    psfClass[index] = psf;
    sourceIds[index] = record.sourceId;
    const anchorIndex = anchors.get(record.sourceId);
    if (anchorIndex !== undefined) {
      constellationAnchorIndex[index] = anchorIndex;
      anchorCount += 1;
    }
    if (psf === 2) layerCounts.brightPsf += 1;
    else if (psf === 1) layerCounts.catalog += 1;
    else layerCounts.faint += 1;
  });
  self.postMessage({
    type: "points",
    requestId: request.requestId,
    directions,
    linearRgb,
    apparentFlux,
    sizes,
    psfClass,
    sourceIds,
    constellationAnchorIndex,
    catalogVersion,
    presentationOnly: true,
  } satisfies CelestialStarfieldResponseV590, [
    directions.buffer,
    linearRgb.buffer,
    apparentFlux.buffer,
    sizes.buffer,
    psfClass.buffer,
    sourceIds.buffer,
    constellationAnchorIndex.buffer,
  ]);
  lastCompleted = {
    viewKey: viewKeyV590(view),
    catalogVersion,
    recordCount: records.length,
    layerCounts,
    anchorCount,
    view,
  };
  postSnapshot(request.requestId, "ready", {
    catalogVersion,
    recordCount: records.length,
    layerCounts,
    anchorCount,
    view,
  });
}

async function load(request: LoadRequestV590): Promise<void> {
  const view = validView(request.view);
  const completed = lastCompleted;
  if (request.type === "view" && completed?.viewKey === viewKeyV590(view)) {
    activeRequestId = request.requestId;
    postSnapshot(request.requestId, "ready", {
      catalogVersion: completed.catalogVersion,
      recordCount: completed.recordCount,
      layerCounts: completed.layerCounts,
      anchorCount: completed.anchorCount,
      view: completed.view,
      reason: "unchanged-view-no-reload",
    });
    return;
  }
  activeRequestId = request.requestId;
  activeAbort?.abort();
  const controller = new AbortController();
  activeAbort = controller;
  rangeRequests = 0;
  transferredBytes = 0;
  const catalogVersion = request.deliveryTier === "standalone-full" ? FULL_CATALOG_VERSION_V590 : LITE_CATALOG_VERSION_V590;
  postSnapshot(request.requestId, "loading", { catalogVersion, view });
  const lite = await loadLiteBundle();
  const budget = starBudgetV590(request.deliveryTier, request.deviceTier);
  let records: GaiaRecordV590[];
  if (request.deliveryTier === "standalone-full") {
    const liteBudget = request.deviceTier === "desktop" ? Math.min(lite.records.length, budget) : Math.floor(budget * 0.8);
    const liteRecords = request.deviceTier === "desktop"
      ? [...lite.records]
      : selectLiteRecords(lite.records, lite.anchors, liteBudget, view);
    const fullBudget = Math.min(2_000, Math.max(0, budget - liteRecords.length));
    records = mergeFullWithLiteV590(
      fullBudget > 0 ? await streamFull(view, fullBudget, controller.signal) : [],
      liteRecords,
      budget,
    );
  } else {
    records = selectLiteRecords(lite.records, lite.anchors, budget, view);
  }
  if (controller.signal.aborted || activeRequestId !== request.requestId) return;
  emitPoints(request, records, lite.anchors, catalogVersion, view);
}

self.addEventListener("message", (event: MessageEvent<CelestialStarfieldRequestV590>) => {
  const request = event.data;
  if (request.type === "release") {
    activeAbort?.abort();
    activeAbort = null;
    fullInitializeAbort?.abort();
    fullInitializeAbort = null;
    liteBundleAbort?.abort();
    liteBundleAbort = null;
    lastCompleted = null;
    activeRequestId = request.requestId;
    postSnapshot(request.requestId, "released", { reason: "explicit-release" });
    return;
  }
  void load(request).catch((error: unknown) => {
    if (
      request.requestId !== activeRequestId
      || activeAbort?.signal.aborted
      || (error instanceof DOMException && error.name === "AbortError")
    ) return;
    postSnapshot(request.requestId, "blocked", {
      catalogVersion: request.deliveryTier === "standalone-full" ? FULL_CATALOG_VERSION_V590 : LITE_CATALOG_VERSION_V590,
      view: validView(request.view),
      reason: error instanceof Error ? error.message : "v590-starfield-unknown",
    });
  });
});

export {};
