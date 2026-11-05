import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { KERR_FULL_SHORT_AUTHORITY_SHA256_V314 } from "./kerrCampaignV314";
import { KERR_SHORT_AUTHORITY_ENVELOPE_SHA256_V299 } from "./kerrInteractiveComputeV299";
import {
  KERR_INTERACTIVE_AUTHORITY_SHA256_V317,
  KERR_INTERACTIVE_COMPUTE_VERSION_V317,
  createPendingKerrGpuDifferentialV317,
  kerrGpuDifferentialPassedV317,
  validateKerrInteractiveComputeRequestV317,
  validateKerrInteractiveComputeResponseV317,
  type KerrGpuDifferentialSnapshotV317,
  type KerrInteractiveComputeRequestV317,
  type KerrInteractiveComputeResponseV317,
} from "./kerrInteractiveAuthorityV317";

const request = (differential: KerrGpuDifferentialSnapshotV317 | null = createPendingKerrGpuDifferentialV317()): KerrInteractiveComputeRequestV317 => ({
  version: KERR_INTERACTIVE_COMPUTE_VERSION_V317,
  authoritySha256: KERR_INTERACTIVE_AUTHORITY_SHA256_V317,
  requestId: "v317-fixture",
  intent: "research-kerr",
  width: 2,
  height: 2,
  spinA: 0.5,
  seed: 317,
  allowWebGpu: true,
  differential,
});

const values = () => new Float32Array([
  1, 0, 0, 0,
  2, 0, 0, 0,
  3, 0.9, 8, 0.01,
  2, 0, 0, 0,
]);

function response(input: KerrInteractiveComputeRequestV317): KerrInteractiveComputeResponseV317 {
  return {
    version: KERR_INTERACTIVE_COMPUTE_VERSION_V317,
    authoritySha256: KERR_INTERACTIVE_AUTHORITY_SHA256_V317,
    requestId: input.requestId,
    backend: "bounded-worker",
    authoritative: false,
    width: input.width,
    height: input.height,
    rayCount: 4,
    values: values(),
    estimatedGpuBytes: 0,
    resources: { buffers: 0, pipelines: 0, queries: 0 },
    error: null,
  };
}

describe("v317 current interactive authority protocol", () => {
  it("binds current requests to v312/v313 full-short authority without rewriting v299", () => {
    expect(KERR_INTERACTIVE_AUTHORITY_SHA256_V317).toBe(KERR_FULL_SHORT_AUTHORITY_SHA256_V314);
    expect(KERR_INTERACTIVE_AUTHORITY_SHA256_V317).toBe("99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6");
    expect(KERR_SHORT_AUTHORITY_ENVELOPE_SHA256_V299).toBe("1e568f2250660079d3deb03edcf90ac794968269af36786264bf42d02eb10559");
    expect(validateKerrInteractiveComputeRequestV317(request())).toEqual({ passed: true, failures: [] });
    expect(kerrGpuDifferentialPassedV317(createPendingKerrGpuDifferentialV317())).toBe(false);
  });

  it("fails closed on stale authority and validates bounded non-authoritative responses", () => {
    expect(validateKerrInteractiveComputeRequestV317({ ...request(), authoritySha256: KERR_SHORT_AUTHORITY_ENVELOPE_SHA256_V299 }).failures).toContain("identity");
    const input = request();
    expect(validateKerrInteractiveComputeResponseV317(response(input), input)).toEqual({ passed: true, failures: [] });
    const shared = response(input);
    shared.values[0] = 9;
    expect(validateKerrInteractiveComputeResponseV317(shared, input).failures).toContain("classification");
  });

  it("requires the frozen differential thresholds before WebGPU can activate", () => {
    const passed = {
      version: "v317-kerr-gpu-differential",
      authoritySha256: KERR_INTERACTIVE_AUTHORITY_SHA256_V317,
      classificationAgreement: 1,
      criticalCurveErrorPx: 0.1,
      redshiftError: 0.001,
      sampleCount: 16,
      passed: true,
    } as const;
    expect(kerrGpuDifferentialPassedV317(passed)).toBe(true);
    const gpuResponse = { ...response(request(passed)), backend: "webgpu-shadow", estimatedGpuBytes: values().byteLength * 2 + 16, resources: { buffers: 3, pipelines: 1, queries: 0 } };
    expect(validateKerrInteractiveComputeResponseV317(gpuResponse, request(passed)).passed).toBe(true);
  });

  it("keeps a dual-protocol Worker boundary while the renderer uses only v317", () => {
    const worker = readFileSync(resolve(process.cwd(), "app/workers/kerrInteractiveCompute.worker.ts"), "utf8");
    const renderer = readFileSync(resolve(process.cwd(), "app/components/KerrStrongGravityRendererV299.tsx"), "utf8");
    expect(worker).toContain("validateKerrInteractiveComputeRequestV299");
    expect(worker).toContain("validateKerrInteractiveComputeRequestV317");
    expect(renderer).toContain("KERR_INTERACTIVE_AUTHORITY_SHA256_V317");
    expect(renderer).not.toContain("KERR_SHORT_AUTHORITY_ENVELOPE_SHA256_V299");
  });
});
