/// <reference lib="webworker" />

import {
  CONSTELLATION_PACKET_BYTES_V591,
  CONSTELLATION_PACKET_FILE_SHA256_V591,
  CONSTELLATION_PACKET_URL_V591,
  parseConstellationPacketV591,
} from "../lib/celestialConstellationsV591";
import {
  GAIA_LITE_SHA256_V590,
  GAIA_LITE_URL_V590,
  bpRpToLinearRgbV590,
  classifyStarPsfV590,
  raDecToCelestialPositionV590,
  starPixelSizeV590,
  visualMagnitudeFluxV590,
} from "../lib/celestialDeepSpaceV590";
import type { CelestialDeliveryTierV590, CelestialDeviceTierV590 } from "../lib/celestialRenderingV590";
import { CONSTELLATION_RENDER_RADIUS_V592 } from "../lib/livingConstellationsV592";
import {
  GAIA_STRATIFIED_SUPPLEMENT_BYTES_V592,
  GAIA_STRATIFIED_SUPPLEMENT_RECORDS_V592,
  GAIA_STRATIFIED_SUPPLEMENT_SHA256_V592,
  GAIA_STRATIFIED_SUPPLEMENT_URL_V592,
} from "../data/livingStarfieldV592.generated";

export type LivingStarfieldRequestV592 = Readonly<{
  type: "load";
  requestId: number;
  deliveryTier: CelestialDeliveryTierV590;
  deviceTier: CelestialDeviceTierV590;
}> | Readonly<{
  type: "release";
  requestId: number;
}>;

export type LivingConstellationRangeV592 = Readonly<{
  code: string;
  name: string;
  segmentOffset: number;
  segmentCount: number;
  center: readonly [number, number, number];
}>;

export type LivingStarfieldResponseV592 =
  | Readonly<{
    type: "snapshot";
    requestId: number;
    status: "loading" | "ready" | "blocked" | "released";
    catalogVersion: string;
    recordCount: number;
    layerCounts: Readonly<{ faint: number; catalog: number; brightPsf: number }>;
    anchorCount: number;
    constellationCount: number;
    waypointCount: number;
    transferredBytes: number;
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
    constellationSegments: Float32Array;
    constellationRanges: readonly LivingConstellationRangeV592[];
    catalogVersion: string;
    presentationOnly: true;
  }>;

type GaiaRecordV592 = Readonly<{
  sourceId: bigint;
  raDeg: number;
  decDeg: number;
  magG: number;
  colorBpRp: number | null;
}>;

const BASE_CATALOG_VERSION_V592 = "gaia-lite-46000-v589-readonly-direct-v592";
const FULL_CATALOG_VERSION_V592 = "gaia-lite-46000-plus-stratified-14000-direct-v592";
const RECORD_BYTES = 24;
const UINT32_SCALE = 0x1_0000_0000;
const UINT32_MAX = 0xffff_ffff;
const COLOR_MISSING = -0x8000;
const CATALOG_BYTES = 46_000 * RECORD_BYTES;
const SCIENCE_SPHERE_RADIUS = CONSTELLATION_RENDER_RADIUS_V592;

let activeRequestId = 0;
let activeAbort: AbortController | null = null;

function bytesHex(bytes: Uint8Array): string {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function sha256(buffer: ArrayBuffer): Promise<string> {
  return bytesHex(new Uint8Array(await crypto.subtle.digest("SHA-256", buffer)));
}

function decodeCatalog(buffer: ArrayBuffer, expectedRecords: number): GaiaRecordV592[] {
  if (buffer.byteLength !== expectedRecords * RECORD_BYTES) throw new Error(`v592-gaia-catalog-bytes:${buffer.byteLength}`);
  const view = new DataView(buffer);
  const records: GaiaRecordV592[] = [];
  for (let offset = 0; offset < buffer.byteLength; offset += RECORD_BYTES) {
    const color = view.getInt16(offset + 18, true);
    records.push({
      sourceId: view.getBigUint64(offset, true),
      raDeg: view.getUint32(offset + 8, true) / UINT32_SCALE * 360,
      decDeg: view.getUint32(offset + 12, true) / UINT32_MAX * 180 - 90,
      magG: view.getUint16(offset + 16, true) / 1_000 - 5,
      colorBpRp: color === COLOR_MISSING ? null : color / 1_000,
    });
  }
  return records;
}

function budgetFor(request: Extract<LivingStarfieldRequestV592, { type: "load" }>): number {
  if (request.deviceTier === "mobile") return request.deliveryTier === "standalone-full" ? 18_000 : 10_000;
  return request.deliveryTier === "standalone-full" ? 60_000 : 30_000;
}

function sourceUnit(sourceId: bigint): number {
  let value = BigInt.asUintN(64, sourceId ^ (sourceId >> BigInt(31)) ^ BigInt("0x9e3779b97f4a7c15"));
  value = BigInt.asUintN(64, value * BigInt("0xbf58476d1ce4e5b9"));
  value ^= value >> BigInt(27);
  return Number(value & BigInt("0xffffffff")) / 0xffff_ffff;
}

function selectRecords(
  records: readonly GaiaRecordV592[],
  anchorIndex: ReadonlyMap<bigint, number>,
  budget: number,
): GaiaRecordV592[] {
  if (budget >= records.length) return [...records];
  const anchors = records.filter((record) => anchorIndex.has(record.sourceId));
  const remaining = records
    .filter((record) => !anchorIndex.has(record.sourceId))
    .sort((left, right) => (
      left.magG - right.magG
      || sourceUnit(left.sourceId) - sourceUnit(right.sourceId)
      || (left.sourceId < right.sourceId ? -1 : 1)
    ));
  return [...anchors, ...remaining.slice(0, Math.max(0, budget - anchors.length))]
    .sort((left, right) => left.sourceId < right.sourceId ? -1 : left.sourceId > right.sourceId ? 1 : 0);
}

function buildConstellations(packet: ReturnType<typeof parseConstellationPacketV591>) {
  const segments: number[] = [];
  const ranges: LivingConstellationRangeV592[] = [];
  for (const binding of packet.bindings) {
    const offset = segments.length / 6;
    const center = new Float64Array(3);
    for (const waypoint of binding.waypoints) {
      const direction = raDecToCelestialPositionV590(waypoint.anchorRaDeg, waypoint.anchorDecDeg, 1);
      center[0] += direction[0];
      center[1] += direction[1];
      center[2] += direction[2];
    }
    for (let index = 0; index + 1 < binding.waypoints.length; index += 1) {
      const first = binding.waypoints[index]!;
      const second = binding.waypoints[index + 1]!;
      segments.push(
        ...raDecToCelestialPositionV590(first.anchorRaDeg, first.anchorDecDeg, SCIENCE_SPHERE_RADIUS),
        ...raDecToCelestialPositionV590(second.anchorRaDeg, second.anchorDecDeg, SCIENCE_SPHERE_RADIUS),
      );
    }
    const length = Math.hypot(center[0], center[1], center[2]) || 1;
    ranges.push({
      code: binding.iauCode,
      name: binding.name,
      segmentOffset: offset,
      segmentCount: Math.max(0, binding.waypoints.length - 1),
      center: [
        center[0] / length * SCIENCE_SPHERE_RADIUS,
        center[1] / length * SCIENCE_SPHERE_RADIUS,
        center[2] / length * SCIENCE_SPHERE_RADIUS,
      ],
    });
  }
  return { segments: new Float32Array(segments), ranges };
}

function postSnapshot(
  requestId: number,
  status: Extract<LivingStarfieldResponseV592, { type: "snapshot" }>["status"],
  values: Partial<Omit<Extract<LivingStarfieldResponseV592, { type: "snapshot" }>, "type" | "requestId" | "status">> = {},
): void {
  self.postMessage({
    type: "snapshot",
    requestId,
    status,
    catalogVersion: BASE_CATALOG_VERSION_V592,
    recordCount: 0,
    layerCounts: { faint: 0, catalog: 0, brightPsf: 0 },
    anchorCount: 0,
    constellationCount: 0,
    waypointCount: 0,
    transferredBytes: 0,
    reason: status,
    ...values,
  } satisfies LivingStarfieldResponseV592);
}

async function load(request: Extract<LivingStarfieldRequestV592, { type: "load" }>): Promise<void> {
  activeAbort?.abort();
  const controller = new AbortController();
  activeAbort = controller;
  activeRequestId = request.requestId;
  postSnapshot(request.requestId, "loading", { reason: "sha-verifying-gaia-and-constellations" });
  const useSupplement = request.deliveryTier === "standalone-full" && request.deviceTier === "desktop";
  const [catalogResponse, packetResponse, supplementResponse] = await Promise.all([
    fetch(`${GAIA_LITE_URL_V590}?sha256=${GAIA_LITE_SHA256_V590}`, { cache: "force-cache", signal: controller.signal }),
    fetch(`${CONSTELLATION_PACKET_URL_V591}?sha256=${CONSTELLATION_PACKET_FILE_SHA256_V591}`, { cache: "force-cache", signal: controller.signal }),
    useSupplement
      ? fetch(`${GAIA_STRATIFIED_SUPPLEMENT_URL_V592}?sha256=${GAIA_STRATIFIED_SUPPLEMENT_SHA256_V592}`, { cache: "force-cache", signal: controller.signal })
      : Promise.resolve(null),
  ]);
  if (!catalogResponse.ok) throw new Error(`v592-gaia-lite-fetch:${catalogResponse.status}`);
  if (!packetResponse.ok) throw new Error(`v592-constellation-fetch:${packetResponse.status}`);
  if (supplementResponse && !supplementResponse.ok) throw new Error(`v592-gaia-supplement-fetch:${supplementResponse.status}`);
  const [catalogBuffer, packetBuffer, supplementBuffer] = await Promise.all([
    catalogResponse.arrayBuffer(),
    packetResponse.arrayBuffer(),
    supplementResponse ? supplementResponse.arrayBuffer() : Promise.resolve(null),
  ]);
  if (catalogBuffer.byteLength !== CATALOG_BYTES || await sha256(catalogBuffer) !== GAIA_LITE_SHA256_V590) {
    throw new Error("v592-gaia-lite-integrity");
  }
  if (packetBuffer.byteLength !== CONSTELLATION_PACKET_BYTES_V591 || await sha256(packetBuffer) !== CONSTELLATION_PACKET_FILE_SHA256_V591) {
    throw new Error("v592-constellation-integrity");
  }
  if (supplementBuffer && (
    supplementBuffer.byteLength !== GAIA_STRATIFIED_SUPPLEMENT_BYTES_V592
    || await sha256(supplementBuffer) !== GAIA_STRATIFIED_SUPPLEMENT_SHA256_V592
  )) throw new Error("v592-gaia-supplement-integrity");
  const packet = parseConstellationPacketV591(JSON.parse(new TextDecoder().decode(packetBuffer)) as unknown);
  const anchorIndex = new Map<bigint, number>();
  packet.bindings.flatMap((binding) => binding.waypoints).forEach((waypoint, index) => {
    const sourceId = BigInt(waypoint.sourceId);
    if (!anchorIndex.has(sourceId)) anchorIndex.set(sourceId, index);
  });
  const baseRecords = decodeCatalog(catalogBuffer, 46_000);
  const supplementRecords = supplementBuffer
    ? decodeCatalog(supplementBuffer, GAIA_STRATIFIED_SUPPLEMENT_RECORDS_V592)
    : [];
  const combinedRecords = [...baseRecords, ...supplementRecords];
  if (new Set(combinedRecords.map((record) => record.sourceId)).size !== combinedRecords.length) {
    throw new Error("v592-gaia-supplement-source-id-overlap");
  }
  const records = selectRecords(combinedRecords, anchorIndex, budgetFor(request));
  const catalogVersion = supplementBuffer ? FULL_CATALOG_VERSION_V592 : BASE_CATALOG_VERSION_V592;
  const directions = new Float32Array(records.length * 3);
  const linearRgb = new Float32Array(records.length * 3);
  const apparentFlux = new Float32Array(records.length);
  const sizes = new Float32Array(records.length);
  const psfClass = new Uint8Array(records.length);
  const sourceIds = new BigUint64Array(records.length);
  const constellationAnchorIndex = new Int32Array(records.length);
  constellationAnchorIndex.fill(-1);
  const layerCounts = { faint: 0, catalog: 0, brightPsf: 0 };
  let retainedAnchorCount = 0;
  records.forEach((record, index) => {
    directions.set(raDecToCelestialPositionV590(record.raDeg, record.decDeg, 1), index * 3);
    linearRgb.set(bpRpToLinearRgbV590(record.colorBpRp), index * 3);
    apparentFlux[index] = visualMagnitudeFluxV590(record.magG);
    const classification = classifyStarPsfV590(record.magG);
    psfClass[index] = classification;
    sizes[index] = starPixelSizeV590(record.magG, classification);
    sourceIds[index] = record.sourceId;
    const anchor = anchorIndex.get(record.sourceId);
    if (anchor !== undefined) {
      constellationAnchorIndex[index] = anchor;
      retainedAnchorCount += 1;
    }
    if (classification === 2) layerCounts.brightPsf += 1;
    else if (classification === 1) layerCounts.catalog += 1;
    else layerCounts.faint += 1;
  });
  const constellation = buildConstellations(packet);
  if (controller.signal.aborted || request.requestId !== activeRequestId) return;
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
    constellationSegments: constellation.segments,
    constellationRanges: constellation.ranges,
    catalogVersion,
    presentationOnly: true,
  } satisfies LivingStarfieldResponseV592, [
    directions.buffer,
    linearRgb.buffer,
    apparentFlux.buffer,
    sizes.buffer,
    psfClass.buffer,
    sourceIds.buffer,
    constellationAnchorIndex.buffer,
    constellation.segments.buffer,
  ]);
  postSnapshot(request.requestId, "ready", {
    recordCount: records.length,
    layerCounts,
    anchorCount: retainedAnchorCount,
    constellationCount: packet.bindings.length,
    waypointCount: packet.bindings.reduce((sum, binding) => sum + binding.waypoints.length, 0),
    transferredBytes: catalogBuffer.byteLength + packetBuffer.byteLength + (supplementBuffer?.byteLength ?? 0),
    catalogVersion,
    reason: supplementBuffer
      ? "direct-public-sha-verified-gaia-60000-readonly-v592"
      : "direct-public-sha-verified-gaia-tier-budget-readonly-v592",
  });
}

self.addEventListener("message", (event: MessageEvent<LivingStarfieldRequestV592>) => {
  const request = event.data;
  if (request.type === "release") {
    activeAbort?.abort();
    activeAbort = null;
    activeRequestId = request.requestId;
    postSnapshot(request.requestId, "released", { reason: "explicit-release" });
    return;
  }
  void load(request).catch((error: unknown) => {
    if (request.requestId !== activeRequestId || activeAbort?.signal.aborted) return;
    postSnapshot(request.requestId, "blocked", {
      reason: error instanceof Error ? error.message : "v592-living-starfield-unknown",
    });
  });
});

export {};
