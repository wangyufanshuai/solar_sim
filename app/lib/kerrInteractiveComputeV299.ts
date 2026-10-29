export const KERR_INTERACTIVE_COMPUTE_V299_VERSION = "v299-kerr-interactive-compute" as const;
export const KERR_SHORT_AUTHORITY_ENVELOPE_SHA256_V299 = "1e568f2250660079d3deb03edcf90ac794968269af36786264bf42d02eb10559" as const;

export type KerrGpuDifferentialSnapshotV299 = {
  readonly version: "v299-kerr-gpu-differential";
  readonly authoritySha256: string;
  readonly classificationAgreement: number;
  readonly criticalCurveErrorPx: number;
  readonly redshiftError: number;
  readonly sampleCount: number;
  readonly passed: boolean;
};

export type KerrInteractiveComputeRequestV299 = {
  readonly version: typeof KERR_INTERACTIVE_COMPUTE_V299_VERSION;
  readonly requestId: string;
  readonly intent: "research-kerr";
  readonly width: number;
  readonly height: number;
  readonly spinA: number;
  readonly seed: number;
  readonly allowWebGpu: boolean;
  readonly differential: KerrGpuDifferentialSnapshotV299 | null;
};

export type KerrInteractiveComputeResponseV299 = {
  readonly version: typeof KERR_INTERACTIVE_COMPUTE_V299_VERSION;
  readonly requestId: string;
  readonly backend: "webgpu-shadow" | "bounded-worker" | "precomputed-transfer-map";
  readonly authoritative: false;
  readonly width: number;
  readonly height: number;
  readonly rayCount: number;
  readonly values: Float32Array;
  readonly estimatedGpuBytes: number;
  readonly resources: { readonly buffers: number; readonly pipelines: number; readonly queries: number };
  readonly error: string | null;
};

const SHA256 = /^[a-f0-9]{64}$/;

export function validateKerrInteractiveComputeRequestV299(
  value: unknown,
): { passed: boolean; failures: string[] } {
  const request = value as Partial<KerrInteractiveComputeRequestV299> | null;
  const failures: string[] = [];
  if (!request || request.version !== KERR_INTERACTIVE_COMPUTE_V299_VERSION || request.intent !== "research-kerr") failures.push("identity");
  if (typeof request?.requestId !== "string" || request.requestId.length < 1 || request.requestId.length > 128) failures.push("request-id");
  if (!Number.isSafeInteger(request?.width) || !Number.isSafeInteger(request?.height)
    || Number(request?.width) < 1 || Number(request?.height) < 1
    || Number(request?.width) > 384 || Number(request?.height) > 384) failures.push("dimensions");
  if (typeof request?.spinA !== "number" || !Number.isFinite(request.spinA) || Math.abs(request.spinA) > 0.998) failures.push("spin");
  if (!Number.isSafeInteger(request?.seed) || Number(request?.seed) < 0 || Number(request?.seed) > 0xffff_ffff) failures.push("seed");
  if (typeof request?.allowWebGpu !== "boolean") failures.push("webgpu-policy");
  if (request?.differential !== null) {
    const differential = request?.differential as Partial<KerrGpuDifferentialSnapshotV299> | undefined;
    const validNumbers = typeof differential?.classificationAgreement === "number"
      && Number.isFinite(differential.classificationAgreement)
      && differential.classificationAgreement >= 0
      && differential.classificationAgreement <= 1
      && typeof differential.criticalCurveErrorPx === "number"
      && !Number.isNaN(differential.criticalCurveErrorPx)
      && differential.criticalCurveErrorPx >= 0
      && typeof differential.redshiftError === "number"
      && !Number.isNaN(differential.redshiftError)
      && differential.redshiftError >= 0;
    if (!differential
      || differential.version !== "v299-kerr-gpu-differential"
      || differential.authoritySha256 !== KERR_SHORT_AUTHORITY_ENVELOPE_SHA256_V299
      || !SHA256.test(differential.authoritySha256)
      || !validNumbers
      || !Number.isSafeInteger(differential.sampleCount)
      || Number(differential.sampleCount) < 0
      || Number(differential.sampleCount) > 16
      || typeof differential.passed !== "boolean") failures.push("differential-identity");
    if (differential?.passed === true && !kerrGpuDifferentialPassedV299(differential as KerrGpuDifferentialSnapshotV299)) failures.push("differential-gate");
  }
  return { passed: failures.length === 0, failures };
}

export function kerrGpuDifferentialPassedV299(snapshot: KerrGpuDifferentialSnapshotV299 | null): boolean {
  return snapshot != null
    && snapshot.version === "v299-kerr-gpu-differential"
    && SHA256.test(snapshot.authoritySha256)
    && snapshot.authoritySha256 === KERR_SHORT_AUTHORITY_ENVELOPE_SHA256_V299
    && snapshot.sampleCount === 16
    && snapshot.passed
    && snapshot.classificationAgreement >= 0.999
    && snapshot.criticalCurveErrorPx < 0.5
    && snapshot.redshiftError < 0.005;
}

export function resolveKerrInteractiveDimensionsV299(args: { mobile: boolean; width: number; height: number }): { width: number; height: number } {
  const limit = args.mobile ? 192 : 384;
  const scale = Math.min(1, limit / Math.max(1, args.width), limit / Math.max(1, args.height));
  return {
    width: Math.max(64, Math.min(limit, Math.floor(args.width * scale))),
    height: Math.max(64, Math.min(limit, Math.floor(args.height * scale))),
  };
}

export function validateKerrInteractiveComputeResponseV299(
  value: unknown,
  expectedRequest?: KerrInteractiveComputeRequestV299,
): { passed: boolean; failures: string[] } {
  const response = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrInteractiveComputeResponseV299>
    : null;
  const failures: string[] = [];
  const backend = response?.backend;
  const width = response?.width;
  const height = response?.height;
  const values = response?.values instanceof Float32Array ? response.values : null;
  const resources = response?.resources && typeof response.resources === "object" ? response.resources : null;
  if (!response || response.version !== KERR_INTERACTIVE_COMPUTE_V299_VERSION || response.authoritative !== false) failures.push("identity");
  if (typeof response?.requestId !== "string" || response.requestId.length < 1 || response.requestId.length > 128) failures.push("request-id");
  if (backend !== "webgpu-shadow" && backend !== "bounded-worker" && backend !== "precomputed-transfer-map") failures.push("backend");
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height)
    || Number(width) < 1 || Number(height) < 1 || Number(width) > 384 || Number(height) > 384) failures.push("dimensions");
  if (!values || !Number.isSafeInteger(response?.rayCount)
    || response?.rayCount !== Number(width) * Number(height)
    || values.length !== Number(response?.rayCount) * 4) failures.push("buffer-length");
  if (!Number.isSafeInteger(response?.estimatedGpuBytes) || Number(response?.estimatedGpuBytes) < 0 || Number(response?.estimatedGpuBytes) > 96 * 2 ** 20) failures.push("gpu-budget");
  if (!resources || ![resources.buffers, resources.pipelines, resources.queries].every((count) => Number.isSafeInteger(count) && count >= 0)) failures.push("resource-telemetry");
  const webGpuResources = resources?.buffers === 3 && resources.pipelines === 1 && resources.queries === 0;
  const cpuResources = resources?.buffers === 0 && resources.pipelines === 0 && resources.queries === 0;
  const expectedWebGpuBytes = values ? values.byteLength * 2 + 16 : -1;
  if (backend === "webgpu-shadow"
    ? !webGpuResources || response?.estimatedGpuBytes !== expectedWebGpuBytes
    : !cpuResources || response?.estimatedGpuBytes !== 0) failures.push("resource-telemetry");
  if (response?.error !== null && (typeof response?.error !== "string" || response.error.length > 512)) failures.push("error-boundary");
  if (expectedRequest) {
    if (response?.requestId !== expectedRequest.requestId || width !== expectedRequest.width || height !== expectedRequest.height) failures.push("request-mismatch");
    if (backend === "webgpu-shadow" && (!expectedRequest.allowWebGpu || !kerrGpuDifferentialPassedV299(expectedRequest.differential))) failures.push("gpu-differential");
  }
  for (let index = 0; values && index < values.length; index += 4) {
    const classification = values[index];
    const redshift = values[index + 1];
    const diskRadius = values[index + 2];
    const intensity = values[index + 3];
    if (![classification, redshift, diskRadius, intensity].every(Number.isFinite)) {
      failures.push("non-finite");
      break;
    }
    if (classification !== 1 && classification !== 2 && classification !== 3) {
      failures.push("classification");
      break;
    }
    if (redshift < 0 || diskRadius < 0 || intensity < 0) {
      failures.push("negative-observable");
      break;
    }
    const diskHit = classification === 3;
    if (diskHit ? redshift <= 0 || diskRadius <= 0 : redshift !== 0 || diskRadius !== 0 || intensity !== 0) {
      failures.push("observable-applicability");
      break;
    }
  }
  return { passed: failures.length === 0, failures };
}

export function createPendingKerrGpuDifferentialV299(authoritySha256: string): KerrGpuDifferentialSnapshotV299 {
  return {
    version: "v299-kerr-gpu-differential",
    authoritySha256,
    classificationAgreement: 0,
    criticalCurveErrorPx: Number.POSITIVE_INFINITY,
    redshiftError: Number.POSITIVE_INFINITY,
    sampleCount: 0,
    passed: false,
  };
}
