import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createKerrCanonicalRayViewV315,
  createKerrScienceGeometrySourceViewV315,
  createKerrSciencePolarizationSourceViewV315,
  createSparseKerrSciencePayloadV315,
} from "./kerrSciencePayloadV315";
import {
  createKerrGpuDifferentialReferenceV318,
  createKerrGpuDifferentialSnapshotV318,
  evaluateKerrGpuDifferentialV318,
  type KerrGpuDifferentialProbeResultV318,
  type KerrGpuDifferentialReferenceV318,
} from "./kerrGpuDifferentialV318";
import { kerrGpuDifferentialPassedV317 } from "./kerrInteractiveAuthorityV317";

const geometry = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json"), "utf8"));
const polarization = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-reference-v313/polarization-short-gate.json"), "utf8"));
const plan = JSON.parse(readFileSync(resolve(process.cwd(), "dist/science/kerr-campaign-v314/ray-plan.json"), "utf8"));

function reference(): KerrGpuDifferentialReferenceV318 {
  const geometryView = createKerrScienceGeometrySourceViewV315(geometry);
  const polarizationView = createKerrSciencePolarizationSourceViewV315(polarization);
  const rayView = createKerrCanonicalRayViewV315(plan);
  const payload = createSparseKerrSciencePayloadV315(geometryView, polarizationView, rayView);
  return createKerrGpuDifferentialReferenceV318(payload, rayView, geometry);
}

function perfectResult(source: KerrGpuDifferentialReferenceV318): KerrGpuDifferentialProbeResultV318 {
  return {
    version: "v318-kerr-gpu-probe-result-v1",
    authoritySha256: source.authoritySha256,
    backend: "webgpu-shadow",
    samples: source.samples.map((sample) => ({
      sampleIndex: sample.sampleIndex,
      rayId: sample.rayId,
      classification: sample.classification,
      redshiftFactor: sample.redshiftFactor,
    })),
    criticalBrackets: source.criticalBrackets.map((bracket) => ({
      bracketIndex: bracket.bracketIndex,
      leftClass: bracket.leftClass,
      rightClass: bracket.rightClass,
      estimatedImpactM: (bracket.leftImpactM + bracket.rightImpactM) / 2,
    })),
    invalidCount: 0,
    gpuValidationErrorCount: 0,
  };
}

describe("v318 canonical CPU/GPU differential", () => {
  it("builds a bounded current-authority packet with 16 rays and 40 signed-spin brackets", () => {
    const packet = reference();
    expect(packet).toMatchObject({
      authoritySha256: "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6",
      geometryAuthoritySha256: "dec9aa5644e602dd41c82d3a21faf9edf9865d4c2a430010ecae890388e5290e",
      sampleCount: 16,
      criticalBracketCount: 40,
      pixelsPerImpactM: 10,
      boundary: "cpu-authority-reference-only-no-gpu-qualification-without-hardware-result",
    });
    expect(packet.samples.filter((sample) => sample.classification === "capture")).toHaveLength(6);
    expect(packet.samples.filter((sample) => sample.classification === "escape")).toHaveLength(6);
    expect(packet.samples.filter((sample) => sample.classification === "disk-hit")).toHaveLength(4);
    expect(packet.samples.filter((sample) => sample.redshiftApplicable)).toHaveLength(4);
    expect(packet.criticalBrackets[0].spinA).toBeLessThan(0);
    expect(packet.criticalBrackets.at(-1)!.spinA).toBeGreaterThan(0);
    expect(packet.criticalBrackets.every((bracket) => bracket.leftClass !== bracket.rightClass && bracket.authorityWidthPx > 0 && bracket.authorityWidthPx < 0.5)).toBe(true);
  });

  it("converts only a complete passing hardware result into an eligible v317 snapshot", () => {
    const packet = reference();
    const evaluation = evaluateKerrGpuDifferentialV318(packet, perfectResult(packet));
    expect(evaluation).toMatchObject({
      sampleClassificationAgreement: 1,
      criticalEndpointAgreement: 1,
      criticalCurveErrorPx: 0,
      redshiftError: 0,
      invalidCount: 0,
      gpuValidationErrorCount: 0,
      passed: true,
      activation: "webgpu-shadow-eligible",
      boundary: "cpu-authority-remains-scientific-authority",
    });
    expect(kerrGpuDifferentialPassedV317(createKerrGpuDifferentialSnapshotV318(evaluation))).toBe(true);
  });

  it("fails closed on classification, critical endpoint, redshift, validation and identity errors", () => {
    const packet = reference();
    const perfect = perfectResult(packet);
    const diskIndex = perfect.samples.findIndex((sample) => sample.redshiftFactor !== null);
    const result: KerrGpuDifferentialProbeResultV318 = {
      ...perfect,
      samples: perfect.samples.map((sample, index) => index === 0
        ? { ...sample, classification: "escape" }
        : index === diskIndex ? { ...sample, redshiftFactor: Number(sample.redshiftFactor) + 0.01 } : sample),
      criticalBrackets: perfect.criticalBrackets.map((bracket, index) => index === 0
        ? { ...bracket, leftClass: bracket.rightClass }
        : index === 1 ? { ...bracket, estimatedImpactM: bracket.estimatedImpactM + 0.1 } : bracket),
      invalidCount: 1,
      gpuValidationErrorCount: 1,
    };
    const evaluation = evaluateKerrGpuDifferentialV318(packet, result);
    expect(evaluation.passed).toBe(false);
    expect(evaluation.activation).toBe("webgpu-shadow-disabled");
    expect(evaluation.failures).toEqual(expect.arrayContaining([
      "classification-agreement",
      "critical-endpoint-agreement",
      "critical-curve-error",
      "redshift-error",
      "invalid-result",
      "gpu-validation-error",
    ]));
    expect(kerrGpuDifferentialPassedV317(createKerrGpuDifferentialSnapshotV318(evaluation))).toBe(false);
  });

  it("does not use dense shards, cinematic buffers or historical v298r1 authority", () => {
    const source = readFileSync(resolve(process.cwd(), "app/lib/kerrGpuDifferentialV318.ts"), "utf8");
    const worker = readFileSync(resolve(process.cwd(), "app/workers/kerrGpuDifferentialProbeV318.worker.ts"), "utf8");
    expect(source).toContain("KERR_FULL_SHORT_AUTHORITY_SHA256_V314");
    expect(source).toContain("cpu-authority-remains-scientific-authority");
    expect(source).not.toContain("kerrCampaignV298R1");
    expect(source).not.toContain("createKerrCinematicRgbaV305");
    expect(worker).toContain("request.reference.sampleCount + request.reference.criticalBracketCount * 2");
    expect(worker).toContain('device.pushErrorScope("validation")');
    expect(worker).toContain("await device.popErrorScope()");
    expect(worker).toContain("device.destroy()");
    expect(worker).not.toContain("cpuFallback");
  });
});
