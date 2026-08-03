import { KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312, parseKerrCorrectedAuthorityV312 } from "./kerrAuthorityV312";
import { KERR_FULL_SHORT_AUTHORITY_SHA256_V314 } from "./kerrCampaignV314";
import { KERR_INTERACTIVE_AUTHORITY_SHA256_V317, type KerrGpuDifferentialSnapshotV317 } from "./kerrInteractiveAuthorityV317";
import type { KerrCanonicalRayViewV315 } from "./kerrSciencePayloadV315";
import { KERR_CLASSIFICATION_V299, validateKerrScienceTransferPayloadV299, type KerrScienceTransferPayloadV299 } from "./strongGravityRenderingV299";

export const KERR_GPU_DIFFERENTIAL_VERSION_V318 = "v318-kerr-gpu-canonical-differential-v1" as const;
export const KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318 = 16 as const;
export const KERR_GPU_DIFFERENTIAL_BRACKET_COUNT_V318 = 40 as const;
export const KERR_GPU_DIFFERENTIAL_PIXELS_PER_IMPACT_M_V318 = 10 as const;

export type KerrGpuReferenceClassV318 = "capture" | "escape" | "disk-hit";
export type KerrGpuCriticalClassV318 = "capture" | "escape";

export type KerrGpuDifferentialReferenceV318 = Readonly<{
  version: typeof KERR_GPU_DIFFERENTIAL_VERSION_V318;
  authoritySha256: typeof KERR_FULL_SHORT_AUTHORITY_SHA256_V314;
  geometryAuthoritySha256: typeof KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312;
  sampleCount: typeof KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318;
  criticalBracketCount: typeof KERR_GPU_DIFFERENTIAL_BRACKET_COUNT_V318;
  pixelsPerImpactM: typeof KERR_GPU_DIFFERENTIAL_PIXELS_PER_IMPACT_M_V318;
  samples: readonly Readonly<{
    sampleIndex: number;
    rayId: string;
    alphaM: number;
    betaM: number;
    spinA: number;
    classification: KerrGpuReferenceClassV318;
    redshiftFactor: number | null;
    redshiftApplicable: boolean;
  }>[];
  criticalBrackets: readonly Readonly<{
    bracketIndex: number;
    spinA: number;
    leftImpactM: number;
    rightImpactM: number;
    leftClass: KerrGpuCriticalClassV318;
    rightClass: KerrGpuCriticalClassV318;
    authorityWidthPx: number;
  }>[];
  boundary: "cpu-authority-reference-only-no-gpu-qualification-without-hardware-result";
}>;

export type KerrGpuDifferentialProbeResultV318 = Readonly<{
  version: "v318-kerr-gpu-probe-result-v1";
  authoritySha256: typeof KERR_FULL_SHORT_AUTHORITY_SHA256_V314;
  backend: "webgpu-shadow";
  samples: readonly Readonly<{
    sampleIndex: number;
    rayId: string;
    classification: KerrGpuReferenceClassV318;
    redshiftFactor: number | null;
  }>[];
  criticalBrackets: readonly Readonly<{
    bracketIndex: number;
    leftClass: KerrGpuReferenceClassV318;
    rightClass: KerrGpuReferenceClassV318;
    estimatedImpactM: number;
  }>[];
  invalidCount: number;
  gpuValidationErrorCount: number;
}>;

export type KerrGpuDifferentialProbeRequestV318 = Readonly<{
  version: "v318-kerr-gpu-probe-request-v1";
  requestId: string;
  reference: KerrGpuDifferentialReferenceV318;
}>;

export type KerrGpuDifferentialProbeWorkerResponseV318 = Readonly<{
  version: "v318-kerr-gpu-probe-worker-response-v1";
  requestId: string;
  status: "completed" | "unavailable";
  result: KerrGpuDifferentialProbeResultV318 | null;
  error: string | null;
}>;

export type KerrGpuDifferentialEvaluationV318 = Readonly<{
  version: typeof KERR_GPU_DIFFERENTIAL_VERSION_V318;
  authoritySha256: typeof KERR_FULL_SHORT_AUTHORITY_SHA256_V314;
  sampleClassificationAgreement: number;
  criticalEndpointAgreement: number;
  criticalCurveErrorPx: number;
  redshiftError: number;
  sampleCount: typeof KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318;
  criticalBracketCount: typeof KERR_GPU_DIFFERENTIAL_BRACKET_COUNT_V318;
  invalidCount: number;
  gpuValidationErrorCount: number;
  passed: boolean;
  failures: readonly string[];
  activation: "webgpu-shadow-eligible" | "webgpu-shadow-disabled";
  boundary: "cpu-authority-remains-scientific-authority";
}>;

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v318-${label}-invalid`);
  return value as Record<string, unknown>;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`v318-${label}-non-finite`);
  return value;
}

function referenceClass(value: number): KerrGpuReferenceClassV318 {
  if (value === KERR_CLASSIFICATION_V299.capture) return "capture";
  if (value === KERR_CLASSIFICATION_V299.escape) return "escape";
  if (value === KERR_CLASSIFICATION_V299["disk-hit"]) return "disk-hit";
  throw new Error("v318-reference-class-invalid");
}

function criticalClass(value: unknown, label: string): KerrGpuCriticalClassV318 {
  if (value !== "capture" && value !== "escape") throw new Error(`v318-${label}-invalid`);
  return value;
}

export function validateKerrGpuDifferentialReferenceV318(value: unknown): { passed: boolean; failures: string[] } {
  const reference = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<KerrGpuDifferentialReferenceV318>
    : null;
  const failures: string[] = [];
  if (!reference || reference.version !== KERR_GPU_DIFFERENTIAL_VERSION_V318
    || reference.authoritySha256 !== KERR_FULL_SHORT_AUTHORITY_SHA256_V314
    || reference.geometryAuthoritySha256 !== KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312
    || reference.sampleCount !== 16 || reference.criticalBracketCount !== 40
    || reference.pixelsPerImpactM !== 10
    || reference.boundary !== "cpu-authority-reference-only-no-gpu-qualification-without-hardware-result") failures.push("identity");
  if (!Array.isArray(reference?.samples) || reference.samples.length !== 16) failures.push("sample-count");
  else {
    const rayIds = new Set<string>();
    reference.samples.forEach((sample, index) => {
      if (sample.sampleIndex !== index || typeof sample.rayId !== "string" || !sample.rayId
        || ![sample.alphaM, sample.betaM, sample.spinA].every(Number.isFinite)
        || !["capture", "escape", "disk-hit"].includes(sample.classification)
        || (sample.classification === "disk-hit"
          ? sample.redshiftApplicable !== true || typeof sample.redshiftFactor !== "number" || !Number.isFinite(sample.redshiftFactor) || sample.redshiftFactor <= 0
          : sample.redshiftApplicable !== false || sample.redshiftFactor !== null)) failures.push("sample");
      rayIds.add(sample.rayId);
    });
    if (rayIds.size !== 16) failures.push("sample-identity");
  }
  if (!Array.isArray(reference?.criticalBrackets) || reference.criticalBrackets.length !== 40) failures.push("critical-count");
  else {
    let previousSpin = Number.NEGATIVE_INFINITY;
    reference.criticalBrackets.forEach((bracket, index) => {
      const expectedWidth = Math.abs(bracket.rightImpactM - bracket.leftImpactM) * 10;
      if (bracket.bracketIndex !== index || ![bracket.spinA, bracket.leftImpactM, bracket.rightImpactM, bracket.authorityWidthPx].every(Number.isFinite)
        || bracket.spinA <= previousSpin || bracket.leftImpactM === bracket.rightImpactM
        || (bracket.leftClass !== "capture" && bracket.leftClass !== "escape")
        || (bracket.rightClass !== "capture" && bracket.rightClass !== "escape")
        || bracket.leftClass === bracket.rightClass || bracket.authorityWidthPx <= 0 || bracket.authorityWidthPx >= 0.5
        || Math.abs(bracket.authorityWidthPx - expectedWidth) > Math.max(1e-15, expectedWidth * 1e-12)) failures.push("critical");
      previousSpin = bracket.spinA;
    });
  }
  return { passed: failures.length === 0, failures: [...new Set(failures)] };
}

export function createKerrGpuDifferentialReferenceV318(
  payload: KerrScienceTransferPayloadV299,
  canonicalRayView: KerrCanonicalRayViewV315,
  correctedGeometryAuthority: unknown,
): KerrGpuDifferentialReferenceV318 {
  const payloadValidation = validateKerrScienceTransferPayloadV299(payload);
  if (!payloadValidation.passed) throw new Error(`v318-payload-invalid:${payloadValidation.failures.join(",")}`);
  parseKerrCorrectedAuthorityV312(correctedGeometryAuthority);
  if (payload.authorityKind !== "v312-v313-short-gate-sparse" || payload.denseCampaignComplete
    || payload.denseAggregateSha256 !== null || payload.sampleCount !== KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318
    || canonicalRayView.fullShortAuthoritySha256 !== KERR_FULL_SHORT_AUTHORITY_SHA256_V314
    || KERR_INTERACTIVE_AUTHORITY_SHA256_V317 !== KERR_FULL_SHORT_AUTHORITY_SHA256_V314) {
    throw new Error("v318-current-authority-boundary");
  }
  const samples = canonicalRayView.canonicalRays.map((ray, sampleIndex) => {
    if (ray.rayIndex !== sampleIndex || payload.spinA[sampleIndex] !== ray.spinA
      || payload.alphaM[sampleIndex] !== ray.alphaM || payload.betaM[sampleIndex] !== ray.betaM) {
      throw new Error("v318-ray-plan-payload-order-mismatch");
    }
    const classification = referenceClass(payload.classification[sampleIndex]);
    const redshiftApplicable = payload.redshiftApplicable[sampleIndex] === 1;
    const redshiftFactor = redshiftApplicable ? payload.redshiftFactor[sampleIndex] : null;
    if (classification === "disk-hit" ? !redshiftApplicable || !Number.isFinite(redshiftFactor) : redshiftApplicable || redshiftFactor !== null) {
      throw new Error("v318-reference-redshift-applicability");
    }
    return Object.freeze({ sampleIndex, rayId: ray.rayId, alphaM: ray.alphaM, betaM: ray.betaM, spinA: ray.spinA, classification, redshiftFactor, redshiftApplicable });
  });
  if (samples.length !== KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318
    || new Set(samples.map((sample) => sample.rayId)).size !== KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318) {
    throw new Error("v318-reference-sample-conservation");
  }
  const geometry = record(correctedGeometryAuthority, "geometry-authority");
  if (!Array.isArray(geometry.criticalBrackets) || geometry.criticalBrackets.length !== KERR_GPU_DIFFERENTIAL_BRACKET_COUNT_V318) {
    throw new Error("v318-critical-bracket-count");
  }
  let previousSpin = Number.NEGATIVE_INFINITY;
  const criticalBrackets = geometry.criticalBrackets.map((value, bracketIndex) => {
    const bracket = record(value, `critical-bracket-${bracketIndex}`);
    const spinA = finite(bracket.spin, `critical-spin-${bracketIndex}`);
    const leftImpactM = finite(bracket.leftImpactM, `critical-left-${bracketIndex}`);
    const rightImpactM = finite(bracket.rightImpactM, `critical-right-${bracketIndex}`);
    const leftClass = criticalClass(bracket.leftClass, `critical-left-class-${bracketIndex}`);
    const rightClass = criticalClass(bracket.rightClass, `critical-right-class-${bracketIndex}`);
    const authorityWidthPx = finite(bracket.bracketWidthPx, `critical-width-${bracketIndex}`);
    const expectedWidth = Math.abs(rightImpactM - leftImpactM) * KERR_GPU_DIFFERENTIAL_PIXELS_PER_IMPACT_M_V318;
    if (bracket.index !== bracketIndex || bracket.valid !== true || spinA <= previousSpin || leftImpactM === rightImpactM
      || leftClass === rightClass || authorityWidthPx <= 0 || authorityWidthPx >= 0.5
      || Math.abs(authorityWidthPx - expectedWidth) > Math.max(1e-15, expectedWidth * 1e-12)) {
      throw new Error("v318-critical-bracket-conservation");
    }
    previousSpin = spinA;
    return Object.freeze({ bracketIndex, spinA, leftImpactM, rightImpactM, leftClass, rightClass, authorityWidthPx });
  });
  const reference: KerrGpuDifferentialReferenceV318 = Object.freeze({
    version: KERR_GPU_DIFFERENTIAL_VERSION_V318,
    authoritySha256: KERR_FULL_SHORT_AUTHORITY_SHA256_V314,
    geometryAuthoritySha256: KERR_CORRECTED_AUTHORITY_EVIDENCE_SHA256_V312,
    sampleCount: KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318,
    criticalBracketCount: KERR_GPU_DIFFERENTIAL_BRACKET_COUNT_V318,
    pixelsPerImpactM: KERR_GPU_DIFFERENTIAL_PIXELS_PER_IMPACT_M_V318,
    samples: Object.freeze(samples),
    criticalBrackets: Object.freeze(criticalBrackets),
    boundary: "cpu-authority-reference-only-no-gpu-qualification-without-hardware-result",
  });
  const validation = validateKerrGpuDifferentialReferenceV318(reference);
  if (!validation.passed) throw new Error(`v318-reference-invalid:${validation.failures.join(",")}`);
  return reference;
}

export function evaluateKerrGpuDifferentialV318(
  reference: KerrGpuDifferentialReferenceV318,
  result: KerrGpuDifferentialProbeResultV318,
): KerrGpuDifferentialEvaluationV318 {
  const failures: string[] = [];
  if (reference.version !== KERR_GPU_DIFFERENTIAL_VERSION_V318
    || reference.authoritySha256 !== KERR_FULL_SHORT_AUTHORITY_SHA256_V314
    || reference.sampleCount !== 16 || reference.criticalBracketCount !== 40
    || result.version !== "v318-kerr-gpu-probe-result-v1" || result.backend !== "webgpu-shadow"
    || result.authoritySha256 !== reference.authoritySha256) failures.push("identity");
  if (result.samples.length !== 16 || result.criticalBrackets.length !== 40) failures.push("count");
  let correctSamples = 0;
  let redshiftError = 0;
  for (let index = 0; index < reference.samples.length; index += 1) {
    const expected = reference.samples[index];
    const actual = result.samples[index];
    if (!actual || actual.sampleIndex !== index || actual.rayId !== expected.rayId) { failures.push("sample-order"); continue; }
    if (actual.classification === expected.classification) correctSamples += 1;
    if (expected.redshiftApplicable) {
      if (typeof actual.redshiftFactor !== "number" || !Number.isFinite(actual.redshiftFactor) || actual.redshiftFactor <= 0) failures.push("redshift-applicability");
      else redshiftError = Math.max(redshiftError, Math.abs(actual.redshiftFactor - Number(expected.redshiftFactor)));
    } else if (actual.redshiftFactor !== null) failures.push("redshift-applicability");
  }
  let correctCriticalEndpoints = 0;
  let criticalCurveErrorPx = 0;
  for (let index = 0; index < reference.criticalBrackets.length; index += 1) {
    const expected = reference.criticalBrackets[index];
    const actual = result.criticalBrackets[index];
    if (!actual || actual.bracketIndex !== index || !Number.isFinite(actual.estimatedImpactM)) { failures.push("critical-order"); continue; }
    if (actual.leftClass === expected.leftClass) correctCriticalEndpoints += 1;
    if (actual.rightClass === expected.rightClass) correctCriticalEndpoints += 1;
    const lower = Math.min(expected.leftImpactM, expected.rightImpactM);
    const upper = Math.max(expected.leftImpactM, expected.rightImpactM);
    const outsideDistanceM = actual.estimatedImpactM < lower ? lower - actual.estimatedImpactM
      : actual.estimatedImpactM > upper ? actual.estimatedImpactM - upper : 0;
    criticalCurveErrorPx = Math.max(criticalCurveErrorPx, outsideDistanceM * reference.pixelsPerImpactM);
  }
  const sampleClassificationAgreement = correctSamples / 16;
  const criticalEndpointAgreement = correctCriticalEndpoints / 80;
  const invalidCount = Number.isSafeInteger(result.invalidCount) && result.invalidCount >= 0 ? result.invalidCount : 1;
  const gpuValidationErrorCount = Number.isSafeInteger(result.gpuValidationErrorCount) && result.gpuValidationErrorCount >= 0 ? result.gpuValidationErrorCount : 1;
  if (sampleClassificationAgreement < 0.999) failures.push("classification-agreement");
  if (criticalEndpointAgreement !== 1) failures.push("critical-endpoint-agreement");
  if (!Number.isFinite(criticalCurveErrorPx) || criticalCurveErrorPx >= 0.5) failures.push("critical-curve-error");
  if (!Number.isFinite(redshiftError) || redshiftError >= 0.005) failures.push("redshift-error");
  if (invalidCount !== 0) failures.push("invalid-result");
  if (gpuValidationErrorCount !== 0) failures.push("gpu-validation-error");
  const uniqueFailures = Object.freeze([...new Set(failures)]);
  const passed = uniqueFailures.length === 0;
  return Object.freeze({
    version: KERR_GPU_DIFFERENTIAL_VERSION_V318,
    authoritySha256: KERR_FULL_SHORT_AUTHORITY_SHA256_V314,
    sampleClassificationAgreement,
    criticalEndpointAgreement,
    criticalCurveErrorPx,
    redshiftError,
    sampleCount: KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318,
    criticalBracketCount: KERR_GPU_DIFFERENTIAL_BRACKET_COUNT_V318,
    invalidCount,
    gpuValidationErrorCount,
    passed,
    failures: uniqueFailures,
    activation: passed ? "webgpu-shadow-eligible" : "webgpu-shadow-disabled",
    boundary: "cpu-authority-remains-scientific-authority",
  });
}

export function createKerrGpuDifferentialSnapshotV318(
  evaluation: KerrGpuDifferentialEvaluationV318,
): KerrGpuDifferentialSnapshotV317 {
  return Object.freeze({
    version: "v317-kerr-gpu-differential",
    authoritySha256: KERR_INTERACTIVE_AUTHORITY_SHA256_V317,
    classificationAgreement: evaluation.sampleClassificationAgreement,
    criticalCurveErrorPx: evaluation.criticalCurveErrorPx,
    redshiftError: evaluation.redshiftError,
    sampleCount: KERR_GPU_DIFFERENTIAL_SAMPLE_COUNT_V318,
    passed: evaluation.passed,
  });
}
