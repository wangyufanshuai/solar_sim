import { createKerrScienceRasterV307, type KerrScienceRasterV307 } from "./kerrScienceRasterV307";
import { validateKerrScienceTransferPayloadV299, type KerrScienceTransferPayloadV299 } from "./strongGravityRenderingV299";

export const KERR_SCIENCE_BUFFER_INTEGRITY_VERSION_V317 = "v317-kerr-science-buffer-integrity-v1" as const;
export const KERR_SCIENCE_TYPED_ARRAY_COUNT_V317 = 67 as const;

type ScientificArray = ArrayBufferView<ArrayBufferLike> & Readonly<{ length: number }>;

export type KerrScienceBufferSnapshotV317 = Readonly<{
  version: typeof KERR_SCIENCE_BUFFER_INTEGRITY_VERSION_V317;
  digestAlgorithm: "sha-256-field-framed-byte-exact";
  digestSha256: string;
  typedArrayCount: typeof KERR_SCIENCE_TYPED_ARRAY_COUNT_V317;
  uniqueBufferCount: typeof KERR_SCIENCE_TYPED_ARRAY_COUNT_V317;
  totalByteLength: number;
  internalBuffersDisjoint: true;
  denseBoundary: "sparse-authority-dense-incomplete" | "dense-authority-complete";
}>;

export type KerrScienceBufferIntegrityV317 = Readonly<{
  version: typeof KERR_SCIENCE_BUFFER_INTEGRITY_VERSION_V317;
  before: KerrScienceBufferSnapshotV317;
  after: KerrScienceBufferSnapshotV317;
  sourcePayloadUnchanged: true;
  rasterDigestSha256: string;
  rasterBufferDisjoint: true;
  denseBoundary: KerrScienceBufferSnapshotV317["denseBoundary"];
}>;

export type KerrScienceRasterWithIntegrityV317 = Readonly<{
  raster: KerrScienceRasterV307;
  integrity: KerrScienceBufferIntegrityV317;
}>;

const encoder = new TextEncoder();
let observedScienceBuffers = new WeakSet<object>();

function hex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function sha256(parts: readonly Uint8Array<ArrayBuffer>[]): Promise<string> {
  const byteLength = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const framed = new Uint8Array(new ArrayBuffer(byteLength));
  let offset = 0;
  for (const part of parts) {
    framed.set(part, offset);
    offset += part.byteLength;
  }
  return hex(await crypto.subtle.digest("SHA-256", framed));
}

function scientificArrays(payload: KerrScienceTransferPayloadV299): readonly Readonly<{
  name: string;
  value: ScientificArray;
}>[] {
  const entries: { name: string; value: ScientificArray }[] = [];
  for (const [name, value] of Object.entries(payload as unknown as Record<string, unknown>)) {
    if (ArrayBuffer.isView(value) && "length" in value && typeof value.length === "number") {
      entries.push({ name, value: value as ScientificArray });
    }
  }
  entries.sort((left, right) => left.name.localeCompare(right.name));
  if (entries.length !== KERR_SCIENCE_TYPED_ARRAY_COUNT_V317) {
    throw new Error(`v317-science-array-count:${entries.length}`);
  }
  if (entries.some(({ value }) => value.length !== payload.sampleCount)) {
    throw new Error("v317-science-array-length");
  }
  return Object.freeze(entries.map((entry) => Object.freeze(entry)));
}

function copiedBytes(value: ScientificArray): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength));
}

export async function createKerrScienceBufferSnapshotV317(
  payload: KerrScienceTransferPayloadV299,
): Promise<KerrScienceBufferSnapshotV317> {
  const validation = validateKerrScienceTransferPayloadV299(payload);
  if (!validation.passed) throw new Error(`v317-payload-invalid:${validation.failures.join(",")}`);
  const entries = scientificArrays(payload);
  const buffers = new Set(entries.map(({ value }) => value.buffer));
  if (buffers.size !== entries.length) throw new Error("v317-science-internal-buffer-alias");
  for (const buffer of buffers) observedScienceBuffers.add(buffer as object);
  const parts: Uint8Array<ArrayBuffer>[] = [encoder.encode(`${KERR_SCIENCE_BUFFER_INTEGRITY_VERSION_V317}\0`)];
  let totalByteLength = 0;
  for (const { name, value } of entries) {
    parts.push(encoder.encode(`${name}\0${value.constructor.name}\0${value.length}\0${value.byteLength}\0`));
    parts.push(copiedBytes(value));
    totalByteLength += value.byteLength;
  }
  const denseBoundary = payload.denseCampaignComplete
    ? "dense-authority-complete"
    : "sparse-authority-dense-incomplete";
  if (denseBoundary === "sparse-authority-dense-incomplete" && payload.denseAggregateSha256 !== null) {
    throw new Error("v317-partial-dense-aggregate-forbidden");
  }
  return Object.freeze({
    version: KERR_SCIENCE_BUFFER_INTEGRITY_VERSION_V317,
    digestAlgorithm: "sha-256-field-framed-byte-exact",
    digestSha256: await sha256(parts),
    typedArrayCount: KERR_SCIENCE_TYPED_ARRAY_COUNT_V317,
    uniqueBufferCount: KERR_SCIENCE_TYPED_ARRAY_COUNT_V317,
    totalByteLength,
    internalBuffersDisjoint: true,
    denseBoundary,
  });
}

export function kerrScienceBuffersDisjointFromV317(
  payload: KerrScienceTransferPayloadV299,
  candidates: readonly ArrayBufferView<ArrayBufferLike>[],
): boolean {
  const scientificBuffers = new Set(scientificArrays(payload).map(({ value }) => value.buffer));
  return candidates.every((candidate) => !scientificBuffers.has(candidate.buffer));
}

export function kerrInteractiveBufferDisjointFromObservedScienceV317(
  candidate: ArrayBufferView<ArrayBufferLike>,
): boolean {
  return !observedScienceBuffers.has(candidate.buffer as object);
}

export function resetKerrScienceBufferObservationsV317ForTests(): void {
  observedScienceBuffers = new WeakSet<object>();
}

export async function createKerrScienceRasterWithIntegrityV317(
  payload: KerrScienceTransferPayloadV299,
): Promise<KerrScienceRasterWithIntegrityV317> {
  const before = await createKerrScienceBufferSnapshotV317(payload);
  const raster = createKerrScienceRasterV307(payload);
  const after = await createKerrScienceBufferSnapshotV317(payload);
  if (before.digestSha256 !== after.digestSha256) throw new Error("v317-science-payload-mutated-by-raster");
  if (!kerrScienceBuffersDisjointFromV317(payload, [raster.rgba])) throw new Error("v317-science-raster-buffer-alias");
  const rasterDigestSha256 = await sha256([
    encoder.encode(`${raster.version}\0${raster.width}\0${raster.height}\0${raster.boundary}\0`),
    Uint8Array.from(raster.rgba),
  ]);
  return Object.freeze({
    raster,
    integrity: Object.freeze({
      version: KERR_SCIENCE_BUFFER_INTEGRITY_VERSION_V317,
      before,
      after,
      sourcePayloadUnchanged: true,
      rasterDigestSha256,
      rasterBufferDisjoint: true,
      denseBoundary: before.denseBoundary,
    }),
  });
}
