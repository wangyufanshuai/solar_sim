import { describe, expect, it } from "vitest";
import { resolveKerrGpuBackendV283 } from "./kerrGpuComputeV283";

describe("v283 optional Kerr GPU shadow", () => {
  it("never loads on solar or Lite and keeps CPU authority", () => {
    expect(resolveKerrGpuBackendV283({ intent: "solar", lite: false, webGpuAvailable: true }).chunkLoaded).toBe(false);
    expect(resolveKerrGpuBackendV283({ intent: "research-kerr", lite: true, webGpuAvailable: true }).backend).toBe("none");
  });

  it("uses WebGPU only after the differential gate", () => {
    const active = resolveKerrGpuBackendV283({ intent: "research-kerr", lite: false, webGpuAvailable: true, differential: { classificationAgreement: 1, criticalCurveErrorPx: 0.1, redshiftError: 0.001, passed: true } });
    expect(active.backend).toBe("webgpu-shadow");
    expect(active.cpuAuthority).toBe("v283-float64-dop853");
    expect(active.estimatedBytes).toBeLessThanOrEqual(64 * 2 ** 20);
  });
});
