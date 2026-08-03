import { KERR_FULL_SHORT_AUTHORITY_SHA256_V314 } from "./kerrCampaignV314";
import type { KerrInteractiveComputeResponseV299 } from "./kerrInteractiveComputeV299";

export const KERR_INTERACTIVE_COMPUTE_VERSION_V317 = "v317-kerr-interactive-compute-shadow" as const;
export const KERR_INTERACTIVE_AUTHORITY_SHA256_V317 = KERR_FULL_SHORT_AUTHORITY_SHA256_V314;

export type KerrGpuDifferentialSnapshotV317 = Readonly<{
  version: "v317-kerr-gpu-differential";
  authoritySha256: typeof KERR_INTERACTIVE_AUTHORITY_SHA256_V317;
  classificationAgreement: number;
  criticalCurveErrorPx: number;
  redshiftError: number;
  sampleCount: number;
  passed: boolean;
}>;

export type KerrInteractiveComputeRequestV317 = Readonly<{
  version: typeof KERR_INTERACTIVE_COMPUTE_VERSION_V317;
  authoritySha256: typeof KERR_INTERACTIVE_AUTHORITY_SHA256_V317;
  requestId: string;
  intent: "research-kerr";
  width: number;
  height: number;
  spinA: number;
  seed: number;
  allowWebGpu: boolean;
  differential: KerrGpuDifferentialSnapshotV317 | null;
}>;

export type KerrInteractiveComputeResponseV317 = Readonly<
  Omit<KerrInteractiveComputeResponseV299, "version"> & {
    version: typeof KERR_INTERACTIVE_COMPUTE_VERSION_V317;
    authoritySha256: typeof KERR_INTERACTIVE_AUTHORITY_SHA256_V317;
  }
>;

function validDifferentialNumbers(value: Partial<KerrGpuDifferentialSnapshotV317>): boolean {
  return typeof value.classificationAgreement === "number" && Number.isFinite(value.classificationAgreement)
    && value.classificationAgreement >= 0 && value.classificationAgreement <= 1
    && typeof value.criticalCurveErrorPx === "number" && !Number.isNaN(value.criticalCurveErrorPx) && value.criticalCurveErrorPx >= 0
    && typeof value.redshiftError === "number" && !Number.isNaN(value.redshiftError) && value.redshiftError >= 0;
}

export function kerrGpuDifferentialPassedV317(value: KerrGpuDifferentialSnapshotV317 | null): boolean {
  return value !== null
    && value.version === "v317-kerr-gpu-differential"
    && value.authoritySha256 === KERR_INTERACTIVE_AUTHORITY_SHA256_V317
    && value.sampleCount === 16
    && value.passed
    && value.classificationAgreement >= 0.999
    && value.criticalCurveErrorPx < 0.5
    && value.redshiftError < 0.005;
}

export function createPendingKerrGpuDifferentialV317(): KerrGpuDifferentialSnapshotV317 {
  return Object.freeze({
    version: "v317-kerr-gpu-differential",
    authoritySha256: KERR_INTERACTIVE_AUTHORITY_SHA256_V317,
    classificationAgreement: 0,
    criticalCurveErrorPx: Number.POSITIVE_INFINITY,
    redshiftError: Number.POSITIVE_INFINITY,
    sampleCount: 0,
    passed: false,
  });
}

export function validateKerrInteractiveComputeRequestV317(value: unknown): { passed: boolean; failures: string[] } {
  const request = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrInteractiveComputeRequestV317>
    : null;
  const failures: string[] = [];
  if (!request || request.version !== KERR_INTERACTIVE_COMPUTE_VERSION_V317
    || request.authoritySha256 !== KERR_INTERACTIVE_AUTHORITY_SHA256_V317
    || request.intent !== "research-kerr") failures.push("identity");
  if (typeof request?.requestId !== "string" || request.requestId.length < 1 || request.requestId.length > 128) failures.push("request-id");
  if (!Number.isSafeInteger(request?.width) || !Number.isSafeInteger(request?.height)
    || Number(request?.width) < 1 || Number(request?.height) < 1
    || Number(request?.width) > 384 || Number(request?.height) > 384) failures.push("dimensions");
  if (typeof request?.spinA !== "number" || !Number.isFinite(request.spinA) || Math.abs(request.spinA) > 0.998) failures.push("spin");
  if (!Number.isSafeInteger(request?.seed) || Number(request?.seed) < 0 || Number(request?.seed) > 0xffff_ffff) failures.push("seed");
  if (typeof request?.allowWebGpu !== "boolean") failures.push("webgpu-policy");
  if (request?.differential !== null) {
    const differential = request?.differential as Partial<KerrGpuDifferentialSnapshotV317> | undefined;
    if (!differential || differential.version !== "v317-kerr-gpu-differential"
      || differential.authoritySha256 !== KERR_INTERACTIVE_AUTHORITY_SHA256_V317
      || !validDifferentialNumbers(differential)
      || !Number.isSafeInteger(differential.sampleCount) || Number(differential.sampleCount) < 0 || Number(differential.sampleCount) > 16
      || typeof differential.passed !== "boolean") failures.push("differential-identity");
    if (differential?.passed === true && !kerrGpuDifferentialPassedV317(differential as KerrGpuDifferentialSnapshotV317)) failures.push("differential-gate");
  }
  return { passed: failures.length === 0, failures: [...new Set(failures)] };
}

export function validateKerrInteractiveComputeResponseV317(
  value: unknown,
  expectedRequest?: KerrInteractiveComputeRequestV317,
): { passed: boolean; failures: string[] } {
  const response = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrInteractiveComputeResponseV317>
    : null;
  const failures: string[] = [];
  const width = response?.width;
  const height = response?.height;
  const values = response?.values instanceof Float32Array ? response.values : null;
  const resources = response?.resources && typeof response.resources === "object" ? response.resources : null;
  const backend = response?.backend;
  if (!response || response.version !== KERR_INTERACTIVE_COMPUTE_VERSION_V317
    || response.authoritySha256 !== KERR_INTERACTIVE_AUTHORITY_SHA256_V317
    || response.authoritative !== false) failures.push("identity");
  if (typeof response?.requestId !== "string" || response.requestId.length < 1 || response.requestId.length > 128) failures.push("request-id");
  if (backend !== "webgpu-shadow" && backend !== "bounded-worker" && backend !== "precomputed-transfer-map") failures.push("backend");
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height)
    || Number(width) < 1 || Number(height) < 1 || Number(width) > 384 || Number(height) > 384) failures.push("dimensions");
  if (!values || !Number.isSafeInteger(response?.rayCount)
    || response?.rayCount !== Number(width) * Number(height)
    || values.length !== Number(response?.rayCount) * 4) failures.push("buffer-length");
  if (!Number.isSafeInteger(response?.estimatedGpuBytes) || Number(response?.estimatedGpuBytes) < 0
    || Number(response?.estimatedGpuBytes) > 96 * 2 ** 20) failures.push("gpu-budget");
  const resourceCounts = resources ? [resources.buffers, resources.pipelines, resources.queries] : [];
  if (!resources || !resourceCounts.every((count) => Number.isSafeInteger(count) && count >= 0)) failures.push("resource-telemetry");
  const webGpuResources = resources?.buffers === 3 && resources.pipelines === 1 && resources.queries === 0;
  const cpuResources = resources?.buffers === 0 && resources.pipelines === 0 && resources.queries === 0;
  const expectedWebGpuBytes = values ? values.byteLength * 2 + 16 : -1;
  if (backend === "webgpu-shadow"
    ? !webGpuResources || response?.estimatedGpuBytes !== expectedWebGpuBytes
    : !cpuResources || response?.estimatedGpuBytes !== 0) failures.push("resource-telemetry");
  if (response?.error !== null && (typeof response?.error !== "string" || response.error.length > 512)) failures.push("error-boundary");
  if (expectedRequest) {
    if (response?.requestId !== expectedRequest.requestId || width !== expectedRequest.width || height !== expectedRequest.height
      || response?.authoritySha256 !== expectedRequest.authoritySha256) failures.push("request-mismatch");
    if (backend === "webgpu-shadow" && (!expectedRequest.allowWebGpu || !kerrGpuDifferentialPassedV317(expectedRequest.differential))) failures.push("gpu-differential");
  }
  for (let index = 0; values && index < values.length; index += 4) {
    const classification = values[index];
    const redshift = values[index + 1];
    const diskRadius = values[index + 2];
    const intensity = values[index + 3];
    if (![classification, redshift, diskRadius, intensity].every(Number.isFinite)) { failures.push("non-finite"); break; }
    if (classification !== 1 && classification !== 2 && classification !== 3) { failures.push("classification"); break; }
    const diskHit = classification === 3;
    if (redshift < 0 || diskRadius < 0 || intensity < 0
      || (diskHit ? redshift <= 0 || diskRadius <= 0 : redshift !== 0 || diskRadius !== 0 || intensity !== 0)) {
      failures.push("observable-applicability");
      break;
    }
  }
  return { passed: failures.length === 0, failures: [...new Set(failures)] };
}
