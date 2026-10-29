/// <reference lib="webworker" />

import { atlasAssetCandidates } from "../lib/atlasAssetResolver";
import {
  mergeCatalogTileRangesV8,
  selectCatalogTilesForConeV8,
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
  CELESTIAL_ART_CONSTELLATION_BINDING_SHA256_V589,
  CELESTIAL_ART_CONSTELLATION_BINDING_URL_V589,
  CELESTIAL_ART_GAIA_LITE_SHA256_V589,
  CELESTIAL_ART_GAIA_LITE_URL_V589,
  bpRpToLinearRgbV589,
  classifyStarPsfV589,
  starSizeV589,
  type CelestialDeliveryTierV589,
  type CelestialDeviceTierV589,
} from "../lib/celestialArtV589";

type StarfieldViewV589 = Readonly<{
  raDeg: number;
  decDeg: number;
  fovDeg: number;
}>;

type LoadRequestV589 = Readonly<{
  type: "load" | "view";
  requestId: number;
  deliveryTier: CelestialDeliveryTierV589;
  deviceTier: CelestialDeviceTierV589;
  view: StarfieldViewV589;
}>;

type ReleaseRequestV589 = Readonly<{ type: "release"; requestId: number }>;
export type CelestialStarfieldRequestV589 = LoadRequestV589 | ReleaseRequestV589;

export type CelestialStarfieldResponseV589 =
  | Readonly<{
    type: "snapshot";
    requestId: number;
    status: "loading" | "ready" | "blocked" | "released";
    catalogVersion: string;
    recordCount: number;
    layerCounts: Readonly<{ faint: number; catalog: number; brightPsf: number }>;
    rangeRequests: number;
    transferredBytes: number;
    view: StarfieldViewV589;
    reason: string;
  }>
  | Readonly<{
    type: "points";
    requestId: number;
    positions: Float32Array;
    colors: Float32Array;
    sizes: Float32Array;
    psfClass: Uint8Array;
    sourceIds: BigUint64Array;
    catalogVersion: string;
    presentationOnly: true;
  }>;

type GaiaRecordV589 = Readonly<{
  sourceId: bigint;
  raDeg: number;
  decDeg: number;
  magG: number;
  colorBpRp: number | null;
}>;

type LiteBundleV589 = Readonly<{
  records: readonly GaiaRecordV589[];
  anchors: ReadonlySet<bigint>;
}>;

const RECORD_BYTES = 24;
const UINT32_SCALE = 0x1_0000_0000;
const UINT32_MAX = 0xffff_ffff;
const COLOR_MISSING = -0x8000;
const DEFAULT_VIEW_V589: StarfieldViewV589 = Object.freeze({ raDeg: 270, decDeg: -28, fovDeg: 82 });
const FULL_CATALOG_VERSION_V589 = "gaia-dr3-presentation-10000000-v9-range-worker";
const LITE_CATALOG_VERSION_V589 = "gaia-lite-46000-v589";

let activeRequestId = 0;
let activeAbort: AbortController | null = null;
let fullManifest: GaiaPresentationCatalogManifestV272 | null = null;
let fullDirectory: GaiaPresentationDirectoryEntryV9[] = [];
let fullInitializePromise: Promise<void> | null = null;
let liteBundlePromise: Promise<LiteBundleV589> | null = null;
let rangeRequests = 0;
let transferredBytes = 0;

function validView(value: StarfieldViewV589 | undefined): StarfieldViewV589 {
  if (!value) return DEFAULT_VIEW_V589;
  const raDeg = Number(value.raDeg);
  const decDeg = Number(value.decDeg);
  const fovDeg = Number(value.fovDeg);
  if (![raDeg, decDeg, fovDeg].every(Number.isFinite) || decDeg < -90 || decDeg > 90 || fovDeg < 8 || fovDeg > 170) {
    throw new Error("v589-gaia-view-invalid");
  }
  return { raDeg: ((raDeg % 360) + 360) % 360, decDeg, fovDeg };
}

function postSnapshot(
  requestId: number,
  status: Extract<CelestialStarfieldResponseV589, { type: "snapshot" }>[
    "status"
  ],
  partial: Partial<Extract<CelestialStarfieldResponseV589, { type: "snapshot" }>> = {},
): void {
  self.postMessage({
    type: "snapshot",
    requestId,
    status,
    catalogVersion: LITE_CATALOG_VERSION_V589,
    recordCount: 0,
    layerCounts: { faint: 0, catalog: 0, brightPsf: 0 },
    rangeRequests,
    transferredBytes,
    view: DEFAULT_VIEW_V589,
    reason: "none",
    ...partial,
  } satisfies CelestialStarfieldResponseV589);
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  return hex(new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)));
}

function decodeLite(buffer: ArrayBuffer): GaiaRecordV589[] {
  if (buffer.byteLength !== 46_000 * RECORD_BYTES) throw new Error(`v589-gaia-bytes:${buffer.byteLength}`);
  const view = new DataView(buffer);
  const records: GaiaRecordV589[] = [];
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

function position(raDeg: number, decDeg: number, distance: number): readonly [number, number, number] {
  const ra = raDeg * Math.PI / 180;
  const dec = decDeg * Math.PI / 180;
  return [
    Math.cos(dec) * Math.cos(ra) * distance,
    Math.sin(dec) * distance,
    Math.cos(dec) * Math.sin(ra) * distance,
  ];
}

function angularDistanceDeg(leftRa: number, leftDec: number, rightRa: number, rightDec: number): number {
  const leftRaRad = leftRa * Math.PI / 180;
  const leftDecRad = leftDec * Math.PI / 180;
  const rightRaRad = rightRa * Math.PI / 180;
  const rightDecRad = rightDec * Math.PI / 180;
  const cosine = Math.sin(leftDecRad) * Math.sin(rightDecRad)
    + Math.cos(leftDecRad) * Math.cos(rightDecRad) * Math.cos(leftRaRad - rightRaRad);
  return Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
}

async function fetchPrimary(path: string, init?: RequestInit): Promise<Response> {
  const primary = atlasAssetCandidates(path)[0] ?? path;
  return fetch(primary, init);
}

async function loadLiteBundle(signal: AbortSignal): Promise<LiteBundleV589> {
  if (!liteBundlePromise) {
    liteBundlePromise = (async () => {
      const [catalogResponse, bindingResponse] = await Promise.all([
        fetch(`${CELESTIAL_ART_GAIA_LITE_URL_V589}?sha256=${CELESTIAL_ART_GAIA_LITE_SHA256_V589}`, {
          cache: "force-cache",
          signal,
        }),
        fetch(`${CELESTIAL_ART_CONSTELLATION_BINDING_URL_V589}?sha256=${CELESTIAL_ART_CONSTELLATION_BINDING_SHA256_V589}`, {
          cache: "force-cache",
          signal,
        }),
      ]);
      if (!catalogResponse.ok) throw new Error(`v589-gaia-fetch:${catalogResponse.status}`);
      if (!bindingResponse.ok) throw new Error(`v589-constellation-fetch:${bindingResponse.status}`);
      const [buffer, bindingValue] = await Promise.all([
        catalogResponse.arrayBuffer(),
        bindingResponse.json() as Promise<{
          bindingSha256?: string;
          waypointCount?: number;
          bindings?: Array<{ waypoints?: Array<{ sourceId?: string }> }>;
        }>,
      ]);
      if (await sha256(buffer) !== CELESTIAL_ART_GAIA_LITE_SHA256_V589) throw new Error("v589-gaia-sha");
      if (
        bindingValue.bindingSha256 !== CELESTIAL_ART_CONSTELLATION_BINDING_SHA256_V589
        || bindingValue.waypointCount !== 484
        || !Array.isArray(bindingValue.bindings)
      ) throw new Error("v589-constellation-binding-identity");
      const anchors = new Set(bindingValue.bindings
        .flatMap((entry) => entry.waypoints ?? [])
        .map((entry) => BigInt(entry.sourceId ?? "0")));
      return { records: decodeLite(buffer), anchors };
    })().catch((error: unknown) => {
      liteBundlePromise = null;
      throw error;
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

async function initializeFull(signal: AbortSignal): Promise<void> {
  if (fullManifest) return;
  if (fullInitializePromise) return fullInitializePromise;
  fullInitializePromise = (async () => {
    const manifestResponse = await fetchPrimary(GAIA_PRESENTATION_MANIFEST_URL_V9, { cache: "force-cache", signal });
    if (!manifestResponse.ok) throw new Error(`v589-gaia-10m-manifest:${manifestResponse.status}`);
    const manifestText = await manifestResponse.text();
    const parsed = parseGaiaPresentationCatalogManifestV272(JSON.parse(manifestText));
    const directoryResponse = await fetchPrimary(parsed.directoryOrder6.url, { cache: "force-cache", signal });
    if (!directoryResponse.ok) throw new Error(`v589-gaia-10m-directory:${directoryResponse.status}`);
    const directoryBuffer = await directoryResponse.arrayBuffer();
    if (directoryBuffer.byteLength !== parsed.directoryOrder6.byteLength) throw new Error("v589-gaia-10m-directory-bytes");
    if (await sha256(directoryBuffer) !== parsed.directoryOrder6.sha256) throw new Error("v589-gaia-10m-directory-sha");
    fullManifest = parsed;
    fullDirectory = parseGaiaPresentationDirectoryV9(directoryBuffer);
    transferredBytes += new TextEncoder().encode(manifestText).byteLength + directoryBuffer.byteLength;
  })().catch((error: unknown) => {
    fullManifest = null;
    fullDirectory = [];
    throw error;
  }).finally(() => { fullInitializePromise = null; });
  return fullInitializePromise;
}

async function fetchRanges(url: string, ranges: readonly CatalogByteRangeV8[], signal: AbortSignal): Promise<ArrayBuffer[]> {
  const result = new Array<ArrayBuffer>(ranges.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(4, ranges.length) }, async () => {
    while (cursor < ranges.length) {
      const index = cursor++;
      const range = ranges[index]!;
      const expected = range.end - range.start + 1;
      rangeRequests += 1;
      const response = await fetchPrimary(url, {
        headers: { Range: `bytes=${range.start}-${range.end}` },
        cache: "force-cache",
        signal,
      });
      if (response.status !== 206 && response.status !== 200) throw new Error(`v589-gaia-10m-range:${response.status}`);
      const declaredLength = Number(response.headers.get("content-length"));
      if (response.status === 200 && Number.isFinite(declaredLength) && declaredLength > expected) {
        await response.body?.cancel();
        throw new Error("v589-gaia-10m-range-unsupported");
      }
      const full = await response.arrayBuffer();
      const payload = response.status === 200 && full.byteLength !== expected
        ? full.slice(range.start, range.end + 1)
        : full;
      if (payload.byteLength !== expected) throw new Error("v589-gaia-10m-range-length");
      transferredBytes += payload.byteLength;
      result[index] = payload;
    }
  }));
  return result;
}

function sliceEntry(range: CatalogByteRangeV8, payload: ArrayBuffer, offset: number, byteLength: number): ArrayBuffer {
  const relative = offset - range.start;
  if (relative < 0 || relative + byteLength > payload.byteLength) throw new Error("v589-gaia-10m-range-bounds");
  return payload.slice(relative, relative + byteLength);
}

async function loadLeafEntries(parents: readonly CatalogTileIndexEntryV8[], signal: AbortSignal): Promise<GaiaPresentationLeafEntryV9[]> {
  if (!fullManifest) throw new Error("v589-gaia-10m-manifest-unavailable");
  const byParent = new Map(fullDirectory.map((entry) => [entry.parentCell, entry]));
  const leafRanges = mergeCatalogTileRangesV8(parents.map((parent) => {
    const entry = byParent.get(parent.cell);
    if (!entry) throw new Error("v589-gaia-10m-parent-unavailable");
    return { ...parent, archiveOffset: entry.leafPageOffset, byteLength: entry.leafPageByteLength, rowCount: 16 };
  }), 64 * 1024);
  const buffers = await fetchRanges(fullManifest.leafIndexOrder8.url, leafRanges, signal);
  const leaves: GaiaPresentationLeafEntryV9[] = [];
  for (let rangeIndex = 0; rangeIndex < leafRanges.length; rangeIndex += 1) {
    const range = leafRanges[rangeIndex]!;
    const payload = buffers[rangeIndex]!;
    for (const parentCell of range.cells) {
      const parent = byParent.get(parentCell);
      if (!parent) throw new Error("v589-gaia-10m-leaf-parent-unavailable");
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
      if (!leaf) throw new Error("v589-gaia-10m-leaf-unknown");
      const segment = sliceEntry(range, payload, leaf.archiveOffset, leaf.byteLength);
      if (crc32CatalogPayloadV9(segment) !== leaf.crc32) throw new Error(`v589-gaia-10m-crc:${cell}`);
      records.push(...decodeGaiaPresentationRecordsV9(segment));
    }
  });
  return records;
}

function compatibleFull(record: GaiaPresentationRecordV9): GaiaRecordV589 {
  return {
    sourceId: BigInt(record.sourceId),
    raDeg: record.raDeg,
    decDeg: record.decDeg,
    magG: record.magG,
    colorBpRp: record.colorBpRp,
  };
}

async function streamFull(view: StarfieldViewV589, budget: number, signal: AbortSignal): Promise<GaiaRecordV589[]> {
  await initializeFull(signal);
  if (!fullManifest) throw new Error("v589-gaia-10m-manifest-unavailable");
  const parents = selectCatalogTilesForConeV8(parentEntries(), view.raDeg, view.decDeg, view.fovDeg, budget);
  const leaves = await loadLeafEntries(parents, signal);
  const archiveRanges = mergeCatalogTileRangesV8(leaves.map(leafAsTile), 64 * 1024);
  const archiveBuffers = await fetchRanges(fullManifest.archive.url, archiveRanges, signal);
  return verifyAndDecode(archiveRanges, archiveBuffers, leaves)
    .map(compatibleFull)
    .filter((record) => angularDistanceDeg(record.raDeg, record.decDeg, view.raDeg, view.decDeg) <= view.fovDeg * 0.66 + 8)
    .sort((left, right) => left.magG - right.magG || (left.sourceId < right.sourceId ? -1 : 1))
    .slice(0, Math.max(0, budget - 484));
}

function selectLiteRecords(
  records: readonly GaiaRecordV589[],
  anchors: ReadonlySet<bigint>,
  budget: number,
  view: StarfieldViewV589,
): GaiaRecordV589[] {
  const cone = records
    .filter((record) => angularDistanceDeg(record.raDeg, record.decDeg, view.raDeg, view.decDeg) <= view.fovDeg * 0.66 + 12)
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

function appendAnchors(
  records: readonly GaiaRecordV589[],
  lite: LiteBundleV589,
): GaiaRecordV589[] {
  const result = [...records];
  const selectedIds = new Set(result.map((record) => record.sourceId));
  for (const record of lite.records) {
    if (!lite.anchors.has(record.sourceId) || selectedIds.has(record.sourceId)) continue;
    result.push(record);
    selectedIds.add(record.sourceId);
  }
  return result.sort((left, right) => left.sourceId < right.sourceId ? -1 : left.sourceId > right.sourceId ? 1 : 0);
}

function emitPoints(request: LoadRequestV589, records: readonly GaiaRecordV589[], catalogVersion: string, view: StarfieldViewV589): void {
  const positions = new Float32Array(records.length * 3);
  const colors = new Float32Array(records.length * 3);
  const sizes = new Float32Array(records.length);
  const psfClass = new Uint8Array(records.length);
  const sourceIds = new BigUint64Array(records.length);
  const layerCounts = { faint: 0, catalog: 0, brightPsf: 0 };
  records.forEach((record, index) => {
    const point = position(record.raDeg, record.decDeg, 84 + Number(record.sourceId % BigInt(997)) / 997 * 8);
    const color = bpRpToLinearRgbV589(record.colorBpRp);
    const psf = classifyStarPsfV589(record.magG, record.sourceId);
    positions.set(point, index * 3);
    colors.set(color, index * 3);
    sizes[index] = starSizeV589(record.magG, record.sourceId);
    psfClass[index] = psf;
    sourceIds[index] = record.sourceId;
    if (psf === 2) layerCounts.brightPsf += 1;
    else if (psf === 1) layerCounts.catalog += 1;
    else layerCounts.faint += 1;
  });
  self.postMessage({
    type: "points",
    requestId: request.requestId,
    positions,
    colors,
    sizes,
    psfClass,
    sourceIds,
    catalogVersion,
    presentationOnly: true,
  } satisfies CelestialStarfieldResponseV589, [positions.buffer, colors.buffer, sizes.buffer, psfClass.buffer, sourceIds.buffer]);
  postSnapshot(request.requestId, "ready", {
    catalogVersion,
    recordCount: records.length,
    layerCounts,
    view,
  });
}

async function load(request: LoadRequestV589): Promise<void> {
  activeRequestId = request.requestId;
  activeAbort?.abort();
  const controller = new AbortController();
  activeAbort = controller;
  rangeRequests = 0;
  transferredBytes = 0;
  const view = validView(request.view);
  const catalogVersion = request.deliveryTier === "standalone-full" ? FULL_CATALOG_VERSION_V589 : LITE_CATALOG_VERSION_V589;
  postSnapshot(request.requestId, "loading", { catalogVersion, view });
  const lite = await loadLiteBundle(controller.signal);
  const budget = request.deviceTier === "mobile"
    ? (request.deliveryTier === "standalone-full" ? 18_000 : 10_000)
    : (request.deliveryTier === "standalone-full" ? 60_000 : 30_000);
  const records = request.deliveryTier === "standalone-full"
    ? appendAnchors(await streamFull(view, budget, controller.signal), lite)
    : selectLiteRecords(lite.records, lite.anchors, budget, view);
  if (controller.signal.aborted || activeRequestId !== request.requestId) return;
  emitPoints(request, records, catalogVersion, view);
}

self.addEventListener("message", (event: MessageEvent<CelestialStarfieldRequestV589>) => {
  const request = event.data;
  if (request.type === "release") {
    activeAbort?.abort();
    activeAbort = null;
    activeRequestId = request.requestId;
    postSnapshot(request.requestId, "released", { reason: "explicit-release" });
    return;
  }
  void load(request).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === "AbortError") return;
    postSnapshot(request.requestId, "blocked", {
      catalogVersion: request.deliveryTier === "standalone-full" ? FULL_CATALOG_VERSION_V589 : LITE_CATALOG_VERSION_V589,
      view: validView(request.view),
      reason: error instanceof Error ? error.message : "v589-starfield-unknown",
    });
  });
});

export {};
