import { describe, expect, it } from "vitest";
import {
  KERR_INTERACTIVE_COMPUTE_V299_VERSION,
  KERR_SHORT_AUTHORITY_ENVELOPE_SHA256_V299,
  kerrGpuDifferentialPassedV299,
  resolveKerrInteractiveDimensionsV299,
  validateKerrInteractiveComputeRequestV299,
  validateKerrInteractiveComputeResponseV299,
  type KerrGpuDifferentialSnapshotV299,
} from "./kerrInteractiveComputeV299";

const AUTHORITY_SHA = KERR_SHORT_AUTHORITY_ENVELOPE_SHA256_V299;

describe("v299 bounded interactive Kerr compute", () => {
  const request = {
    version: KERR_INTERACTIVE_COMPUTE_V299_VERSION,
    requestId: "v6-fixture",
    intent: "research-kerr" as const,
    width: 64,
    height: 64,
    spinA: 0.9,
    seed: 300,
    allowWebGpu: true,
    differential: null,
  };

  it("caps desktop and mobile buffers", () => {
    expect(resolveKerrInteractiveDimensionsV299({ mobile: false, width: 2560, height: 1440 })).toEqual({ width: 384, height: 216 });
    expect(resolveKerrInteractiveDimensionsV299({ mobile: true, width: 1170, height: 2532 })).toEqual({ width: 88, height: 192 });
  });

  it("requires every CPU differential threshold before WebGPU", () => {
    const passed: KerrGpuDifferentialSnapshotV299 = { version: "v299-kerr-gpu-differential", authoritySha256: AUTHORITY_SHA, classificationAgreement: 1, criticalCurveErrorPx: 0.1, redshiftError: 0.001, sampleCount: 16, passed: true };
    expect(kerrGpuDifferentialPassedV299(passed)).toBe(true);
    expect(kerrGpuDifferentialPassedV299({ ...passed, criticalCurveErrorPx: 0.5 })).toBe(false);
    expect(kerrGpuDifferentialPassedV299({ ...passed, sampleCount: 15 })).toBe(false);
    expect(kerrGpuDifferentialPassedV299({ ...passed, authoritySha256: "a".repeat(64) })).toBe(false);
  });

  it("requires exact WebGPU resource telemetry", () => {
    const values = new Float32Array(64 * 64 * 4);
    for (let index = 0; index < values.length; index += 4) values[index] = 2;
    const estimatedGpuBytes = values.byteLength * 2 + 16;
    const response = {
      version: KERR_INTERACTIVE_COMPUTE_V299_VERSION,
      requestId: "gpu-fixture",
      backend: "webgpu-shadow" as const,
      authoritative: false as const,
      width: 64,
      height: 64,
      rayCount: 4096,
      values,
      estimatedGpuBytes,
      resources: { buffers: 3, pipelines: 1, queries: 0 },
      error: null,
    };
    expect(validateKerrInteractiveComputeResponseV299(response)).toEqual({ passed: true, failures: [] });
    expect(validateKerrInteractiveComputeResponseV299({ ...response, estimatedGpuBytes: estimatedGpuBytes + 16 }).failures).toContain("resource-telemetry");
    expect(validateKerrInteractiveComputeResponseV299(response, request).failures).toContain("request-mismatch");
    expect(validateKerrInteractiveComputeResponseV299({ ...response, requestId: request.requestId }, request).failures).toContain("gpu-differential");
  });

  it("validates a bounded non-authoritative result", () => {
    const values = new Float32Array(64 * 64 * 4);
    for (let index = 0; index < values.length; index += 4) values[index] = 2;
    expect(validateKerrInteractiveComputeResponseV299({
      version: KERR_INTERACTIVE_COMPUTE_V299_VERSION,
      requestId: "fixture",
      backend: "bounded-worker",
      authoritative: false,
      width: 64,
      height: 64,
      rayCount: 4096,
      values,
      estimatedGpuBytes: 0,
      resources: { buffers: 0, pipelines: 0, queries: 0 },
      error: null,
    })).toEqual({ passed: true, failures: [] });
  });

  it("rejects malformed requests before CPU or WebGPU execution", () => {
    expect(validateKerrInteractiveComputeRequestV299(request)).toEqual({ passed: true, failures: [] });
    expect(validateKerrInteractiveComputeRequestV299({ ...request, spinA: Number.NaN }).failures).toContain("spin");
    expect(validateKerrInteractiveComputeRequestV299({ ...request, seed: -1 }).failures).toContain("seed");
    expect(validateKerrInteractiveComputeRequestV299({ ...request, width: 385 }).failures).toContain("dimensions");
    expect(validateKerrInteractiveComputeRequestV299({ ...request, differential: createDifferential({ authoritySha256: "a".repeat(64) }) }).failures).toContain("differential-identity");
    expect(validateKerrInteractiveComputeRequestV299({ ...request, differential: createDifferential({ passed: true, classificationAgreement: 0.9 }) }).failures).toContain("differential-gate");
  });

  it("rejects malformed, stale and scientifically inapplicable responses without throwing", () => {
    expect(validateKerrInteractiveComputeResponseV299(null).passed).toBe(false);
    expect(validateKerrInteractiveComputeResponseV299({ version: KERR_INTERACTIVE_COMPUTE_V299_VERSION }).failures).toEqual(expect.arrayContaining(["identity", "request-id", "backend", "dimensions", "buffer-length"]));
    const values = new Float32Array(64 * 64 * 4);
    for (let index = 0; index < values.length; index += 4) values[index] = 2;
    values[1] = 1;
    const response = {
      version: KERR_INTERACTIVE_COMPUTE_V299_VERSION,
      requestId: request.requestId,
      backend: "bounded-worker" as const,
      authoritative: false as const,
      width: 64,
      height: 64,
      rayCount: 4096,
      values,
      estimatedGpuBytes: 0,
      resources: { buffers: 0, pipelines: 0, queries: 0 },
      error: null,
    };
    expect(validateKerrInteractiveComputeResponseV299(response, request).failures).toContain("observable-applicability");
    expect(validateKerrInteractiveComputeResponseV299({ ...response, requestId: "stale" }, request).failures).toContain("request-mismatch");
  });
});

function createDifferential(overrides: Partial<KerrGpuDifferentialSnapshotV299> = {}): KerrGpuDifferentialSnapshotV299 {
  return {
    version: "v299-kerr-gpu-differential",
    authoritySha256: AUTHORITY_SHA,
    classificationAgreement: 1,
    criticalCurveErrorPx: 0.1,
    redshiftError: 0.001,
    sampleCount: 16,
    passed: false,
    ...overrides,
  };
}
