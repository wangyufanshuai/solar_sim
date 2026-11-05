import { sha256BytesHexV566 } from "../lib/sha256BrowserV566";
import type { KerrObservationFieldV587, KerrObservationVariantV587 } from "../lib/kerrObservationV587";

type Request = Readonly<{
  requestId: string;
  root: string;
  variant: KerrObservationVariantV587;
  fields: readonly KerrObservationFieldV587[];
  scientificPayloadSha256: string;
}>;

type Response = Readonly<{
  requestId: string;
  status: "ready" | "error";
  variant: KerrObservationVariantV587;
  width: number;
  height: number;
  scienceRgba?: ArrayBuffer;
  cinematicRgba?: ArrayBuffer;
  scientificPayloadSha256: string;
  verifiedFieldSha256: readonly string[];
  error?: string;
}>;

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function gaussian(value: number, center: number, width: number): number {
  const normalized = (value - center) / width;
  return Math.exp(-(normalized * normalized));
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const normalized = clamp01((value - edge0) / (edge1 - edge0));
  return normalized * normalized * (3 - 2 * normalized);
}

const PRESENTATION_SUPERSAMPLE = 4;
const GAUSSIAN_KERNEL = [1, 4, 6, 4, 1] as const;
const GAUSSIAN_WEIGHT = 16;

function blurPass(
  source: Float32Array,
  width: number,
  height: number,
  horizontal: boolean,
): Float32Array {
  const target = new Float32Array(source.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let value = 0;
      for (let kernelIndex = 0; kernelIndex < GAUSSIAN_KERNEL.length; kernelIndex += 1) {
        const offset = kernelIndex - 2;
        const sampleX = horizontal ? Math.max(0, Math.min(width - 1, x + offset)) : x;
        const sampleY = horizontal ? y : Math.max(0, Math.min(height - 1, y + offset));
        value += source[sampleY * width + sampleX]! * GAUSSIAN_KERNEL[kernelIndex]!;
      }
      target[y * width + x] = value / GAUSSIAN_WEIGHT;
    }
  }
  return target;
}

function smoothField(source: Float32Array, width: number, height: number): Float32Array {
  // Two deterministic separable passes remove quadtree stair-steps from the
  // presentation projection. Canonical sidecars are never modified.
  const first = blurPass(blurPass(source, width, height, true), width, height, false);
  return blurPass(blurPass(first, width, height, true), width, height, false);
}

function bilinear(source: Float32Array, width: number, height: number, x: number, y: number): number {
  const x0 = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const y0 = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = clamp01(x - x0);
  const ty = clamp01(y - y0);
  const top = source[y0 * width + x0]! * (1 - tx) + source[y0 * width + x1]! * tx;
  const bottom = source[y1 * width + x0]! * (1 - tx) + source[y1 * width + x1]! * tx;
  return top * (1 - ty) + bottom * ty;
}

function normalizedObservable(
  observable: Float32Array,
  mask: Float32Array,
  width: number,
  height: number,
): Float32Array {
  const numerator = new Float32Array(observable.length);
  for (let index = 0; index < observable.length; index += 1) {
    const value = observable[index]!;
    numerator[index] = Number.isFinite(value) ? value * mask[index]! : 0;
  }
  const smoothNumerator = smoothField(numerator, width, height);
  const smoothMask = smoothField(mask, width, height);
  for (let index = 0; index < smoothNumerator.length; index += 1) {
    const weight = smoothMask[index]!;
    smoothNumerator[index] = weight > 1e-5 ? smoothNumerator[index]! / weight : 0;
  }
  return smoothNumerator;
}

function field(entries: readonly KerrObservationFieldV587[], name: KerrObservationFieldV587["field"]): KerrObservationFieldV587 {
  const match = entries.find((entry) => entry.field === name);
  if (!match) throw new Error(`v587-worker-field-missing:${name}`);
  return match;
}

async function fetchVerified(root: string, entry: KerrObservationFieldV587): Promise<ArrayBuffer> {
  const response = await fetch(`${root}/${entry.path}?sha256=${entry.sha256}`, { cache: "force-cache" });
  if (!response.ok) throw new Error(`v587-worker-fetch:${entry.field}:${response.status}`);
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength !== entry.bytes) throw new Error(`v587-worker-bytes:${entry.field}`);
  if (sha256BytesHexV566(new Uint8Array(buffer)) !== entry.sha256) {
    throw new Error(`v587-worker-sha:${entry.field}`);
  }
  return buffer;
}

function buildProjection(
  classification: Uint8Array,
  validity: Uint8Array,
  redshift: Float32Array,
  delay: Float32Array,
  evpa: Float32Array,
  width: number,
  height: number,
): { science: Uint8Array; cinematic: Uint8Array } {
  const sourceLength = width * height;
  const diskMask = new Float32Array(sourceLength);
  const captureMask = new Float32Array(sourceLength);
  for (let index = 0; index < sourceLength; index += 1) {
    const valid = validity[index] === 1;
    diskMask[index] = valid && classification[index] === 3 ? 1 : 0;
    captureMask[index] = valid && classification[index] === 1 ? 1 : 0;
  }
  const smoothDiskMask = smoothField(diskMask, width, height);
  const smoothCaptureMask = smoothField(captureMask, width, height);
  const smoothRedshift = normalizedObservable(redshift, diskMask, width, height);
  const smoothDelay = normalizedObservable(delay, diskMask, width, height);
  const evpaCos = new Float32Array(sourceLength);
  const evpaSin = new Float32Array(sourceLength);
  for (let index = 0; index < sourceLength; index += 1) {
    const angle = evpa[index]!;
    if (diskMask[index] === 1 && Number.isFinite(angle)) {
      evpaCos[index] = Math.cos(2 * angle);
      evpaSin[index] = Math.sin(2 * angle);
    }
  }
  const smoothEvpaCos = normalizedObservable(evpaCos, diskMask, width, height);
  const smoothEvpaSin = normalizedObservable(evpaSin, diskMask, width, height);

  const outputWidth = width * PRESENTATION_SUPERSAMPLE;
  const outputHeight = height * PRESENTATION_SUPERSAMPLE;
  const science = new Uint8Array(outputWidth * outputHeight * 4);
  const cinematic = new Uint8Array(outputWidth * outputHeight * 4);
  for (let index = 0; index < outputWidth * outputHeight; index += 1) {
    const output = index * 4;
    const x = index % outputWidth;
    const y = Math.floor(index / outputWidth);
    const sourceX = (x + 0.5) / PRESENTATION_SUPERSAMPLE - 0.5;
    const sourceY = (y + 0.5) / PRESENTATION_SUPERSAMPLE - 0.5;
    const diskCoverage = clamp01(bilinear(smoothDiskMask, width, height, sourceX, sourceY));
    const captureCoverage = clamp01(bilinear(smoothCaptureMask, width, height, sourceX, sourceY));
    const g = bilinear(smoothRedshift, width, height, sourceX, sourceY);
    const dt = bilinear(smoothDelay, width, height, sourceX, sourceY);
    const angle = 0.5 * Math.atan2(
      bilinear(smoothEvpaSin, width, height, sourceX, sourceY),
      bilinear(smoothEvpaCos, width, height, sourceX, sourceY),
    );
    const screenX = outputWidth > 1 ? x / (outputWidth - 1) * 2 - 1 : 0;
    const screenY = outputHeight > 1 ? y / (outputHeight - 1) * 2 - 1 : 0;
    const lensRadius = Math.hypot(screenX * 0.8, screenY * 1.32);
    const warpedPlane = screenY + screenX * 0.12 + 0.055 * Math.sin(screenX * Math.PI * 1.4);
    const diskPlane = gaussian(Math.abs(warpedPlane), 0.05, 0.19);
    const photonRing = gaussian(lensRadius, 0.43, 0.065);
    const outerLensing = gaussian(lensRadius, 0.62, 0.095);
    const captureCore = smoothstep(0.42, 0.62, captureCoverage);
    const captureEdge = Math.pow(clamp01(4 * captureCoverage * (1 - captureCoverage)), 2.4);
    const deterministicDetail = 0.88 + 0.12 * (
      Math.sin((x * 12.9898 + y * 78.233 + 587) * 0.017453292519943295) * 0.5 + 0.5
    );

    if (diskCoverage > 1e-4 || captureCoverage > 1e-4) {
      const shifted = clamp01((g - 0.25) / 1.1);
      const timeNormalized = clamp01(dt / 45);
      const orientationModulation = 0.94 + 0.06 * Math.cos(2 * angle);
      const scientificSignal = clamp01(
        0.05
        + diskPlane * (0.43 + 0.16 * (1 - timeNormalized))
        + photonRing * 0.86
        + outerLensing * 0.24,
      );
      const centralOcclusion = 1 - gaussian(lensRadius, 0, 0.31);
      const visibleSignal = clamp01(scientificSignal * centralOcclusion * diskCoverage);
      const redWing = clamp01(shifted * 1.18);
      const blueWing = clamp01((1 - shifted) * 1.22);
      const neutralPeak = 1 - Math.abs(shifted * 2 - 1);
      const edgeLuma = captureEdge * (0.055 + photonRing * 0.06);
      science[output] = clampByte(
        (34 + redWing * 174 + photonRing * 42) * visibleSignal
        + edgeLuma * 116,
      );
      science[output + 1] = clampByte(
        (58 + neutralPeak * 128 + photonRing * 54) * visibleSignal
        + edgeLuma * 194,
      );
      science[output + 2] = clampByte(
        (46 + blueWing * 184 + photonRing * 40) * visibleSignal
        + edgeLuma * 198,
      );
      science[output + 3] = clampByte(
        Math.max(visibleSignal * 240, captureCore * 244, captureEdge * 46),
      );

      const cinematicSignal = clamp01(
        diskPlane * 0.68
        + photonRing * 1.08
        + outerLensing * 0.31,
      ) * centralOcclusion * (0.58 + diskCoverage * 0.42) * (1 - captureCore);
      const cinematicLuma = cinematicSignal * deterministicDetail * orientationModulation;
      cinematic[output] = clampByte(255 * cinematicLuma);
      cinematic[output + 1] = clampByte((116 + 82 * shifted + photonRing * 42) * cinematicLuma);
      cinematic[output + 2] = clampByte((32 + 46 * blueWing) * cinematicLuma);
      cinematic[output + 3] = clampByte(cinematicSignal * 150);
      continue;
    }
    science.set([0, 0, 0, 0], output);
    cinematic.set([0, 0, 0, 0], output);
  }
  return { science, cinematic };
}

self.onmessage = (event: MessageEvent<Request>) => {
  const request = event.data;
  void Promise.resolve().then(async () => {
    const selected = request.fields.filter((entry) => entry.variant === request.variant);
    if (selected.length !== 5) throw new Error("v587-worker-field-coverage");
    const classificationEntry = field(selected, "classification");
    const [height, width] = classificationEntry.shape;
    const buffers = await Promise.all(selected.map((entry) => fetchVerified(request.root, entry)));
    const byName = new Map(selected.map((entry, index) => [entry.field, buffers[index]!] as const));
    const classification = new Uint8Array(byName.get("classification")!);
    const validity = new Uint8Array(byName.get("validity")!);
    const redshift = new Float32Array(byName.get("redshift")!);
    const delay = new Float32Array(byName.get("delay")!);
    const evpa = new Float32Array(byName.get("evpa")!);
    const expected = width * height;
    if (
      classification.length !== expected
      || validity.length !== expected
      || redshift.length !== expected
      || delay.length !== expected
      || evpa.length !== expected
    ) throw new Error("v587-worker-field-shape");
    const projection = buildProjection(classification, validity, redshift, delay, evpa, width, height);
    // The projection arrays are freshly allocated by this worker. Normalize
    // their buffers to transferable ArrayBuffers even when lib.d.ts exposes
    // TypedArray.buffer as ArrayBufferLike.
    const scienceRgba = projection.science.buffer instanceof ArrayBuffer
      ? projection.science.buffer
      : new Uint8Array(projection.science).buffer;
    const cinematicRgba = projection.cinematic.buffer instanceof ArrayBuffer
      ? projection.cinematic.buffer
      : new Uint8Array(projection.cinematic).buffer;
    const response: Response = {
      requestId: request.requestId,
      status: "ready",
      variant: request.variant,
      width: width * PRESENTATION_SUPERSAMPLE,
      height: height * PRESENTATION_SUPERSAMPLE,
      scienceRgba,
      cinematicRgba,
      scientificPayloadSha256: request.scientificPayloadSha256,
      verifiedFieldSha256: selected.map((entry) => entry.sha256),
    };
    self.postMessage(response, { transfer: [scienceRgba, cinematicRgba] });
  }).catch((error: unknown) => {
    const response: Response = {
      requestId: request.requestId,
      status: "error",
      variant: request.variant,
      width: 0,
      height: 0,
      scientificPayloadSha256: request.scientificPayloadSha256,
      verifiedFieldSha256: [],
      error: error instanceof Error ? error.message : "v587-worker-unknown",
    };
    self.postMessage(response);
  });
};
