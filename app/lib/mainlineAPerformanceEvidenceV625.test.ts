import { describe, expect, it } from "vitest";
import {
  appendMainlineAPerformanceRunV625,
  createMainlineAResourceLifecycleEvidenceV625,
  createMainlineAPerformanceBuildIdentityV625,
  createMainlineAPerformanceRunV625,
  createMainlineAPerformanceViewportV625,
  createPendingMainlineAPerformanceReceiptV625,
  digestMainlineAPerformanceValueV625,
  readMainlineAPerformanceMemoryV625,
  summarizeMainlineAPerformanceFramesV625,
  verifyMainlineAPerformanceReceiptV625,
} from "./mainlineAPerformanceEvidenceV625";

const snapshot = (digest: string, total = 0) => ({
  total,
  workers: 0,
  gpuRenderTargets: 0,
  gpuBuffers: 0,
  gpuComputePipelines: 0,
  gpuQueries: 0,
  textures: 0,
  models: 0,
  subscriptions: 0,
  objectUrls: 0,
  typedArrayCaches: 0,
  cameraLocks: 0,
  estimatedBytes: 0,
  estimatedGpuBytes: 0,
  byOwner: {},
  byKind: {
    worker: { count: 0, estimatedBytes: 0 },
    "gpu-render-target": { count: 0, estimatedBytes: 0 },
    "gpu-buffer": { count: 0, estimatedBytes: 0 },
    "gpu-compute-pipeline": { count: 0, estimatedBytes: 0 },
    "gpu-query": { count: 0, estimatedBytes: 0 },
    texture: { count: 0, estimatedBytes: 0 },
    model: { count: 0, estimatedBytes: 0 },
    subscription: { count: 0, estimatedBytes: 0 },
    "object-url": { count: 0, estimatedBytes: 0 },
    "typed-array-cache": { count: 0, estimatedBytes: 0 },
    "camera-lock": { count: 0, estimatedBytes: 0 },
  },
  byIdentity: {},
  identityDigest: digest,
  revision: 0,
});

describe("Mainline A V625 performance evidence", () => {
  it("summarizes frame samples deterministically", () => {
    const summary = summarizeMainlineAPerformanceFramesV625([
      { atMs: 0, deltaMs: 16, longTaskMs: 0 },
      { atMs: 16, deltaMs: 20, longTaskMs: 55 },
      { atMs: 36, deltaMs: 10, longTaskMs: 0 },
    ], 36);
    expect(summary.sampleCount).toBe(3);
    expect(summary.p50Ms).toBe(16);
    expect(summary.p95Ms).toBeGreaterThan(16);
    expect(summary.longTaskMaxMs).toBe(55);
    expect(summary.medianFps).toBeCloseTo(62.5);
  });

  it("returns null for unavailable memory without inventing values", () => {
    const result = readMainlineAPerformanceMemoryV625({
      performance: {} as Performance,
      navigator: {} as Navigator,
    });
    expect(result.jsHeapUsedBytes).toBeNull();
    expect(result.deviceMemoryGb).toBeNull();
    expect(result.source).toBe("unavailable");
  });

  it("keeps a balanced resource pair at baseline", () => {
    const before = snapshot("deadbeef");
    const after = snapshot("deadbeef");
    const evidence = createMainlineAResourceLifecycleEvidenceV625({ before, after, releasedOwners: [] });
    expect(evidence.status).toBe("baseline");
    expect(evidence.diff.status).toBe("baseline");
  });

  it("flags resource drift as a blocking lifecycle observation", () => {
    const evidence = createMainlineAResourceLifecycleEvidenceV625({ before: snapshot("11111111"), after: snapshot("22222222", 1) });
    expect(evidence.status).toBe("drift");
    expect(evidence.diff.identityChanged).toBe(true);
  });

  it("preserves the candidate-only boundary while appending a run", () => {
    const build = createMainlineAPerformanceBuildIdentityV625({ branch: "test", head: "head" });
    const receipt = createPendingMainlineAPerformanceReceiptV625(build, new Date(0).toISOString());
    const run = createMainlineAPerformanceRunV625({
      runId: "r65-desktop-001",
      device: "desktop",
      scenario: "atlas",
      viewport: createMainlineAPerformanceViewportV625(1280, 720, 1, "desktop-browser"),
      build,
      visibility: { documentVisibility: "visible", rootVisible: true, canvasCount: 1, panelVisible: true },
      startedAt: new Date(0).toISOString(),
      endedAt: new Date(4000).toISOString(),
      frameSamples: [{ atMs: 0, deltaMs: 16, longTaskMs: 0 }],
      durationMs: 4000,
      memory: { jsHeapUsedBytes: null, jsHeapTotalBytes: null, jsHeapLimitBytes: null, deviceMemoryGb: null, source: "unavailable" },
      resources: createMainlineAResourceLifecycleEvidenceV625({ before: snapshot("deadbeef"), after: snapshot("deadbeef") }),
    });
    const next = appendMainlineAPerformanceRunV625(receipt, run);
    expect(next.boundary.scientificPayloadWriteback).toBe(false);
    expect(next.boundary.runtimePromotion).toBe("closed");
    expect(next.runs).toHaveLength(1);
    expect(verifyMainlineAPerformanceReceiptV625(next).ok).toBe(true);
  });

  it("rejects a forged digest after mutation", () => {
    const build = createMainlineAPerformanceBuildIdentityV625({ branch: "test" });
    const receipt = createPendingMainlineAPerformanceReceiptV625(build, new Date(0).toISOString());
    const mutated = { ...receipt, blockers: ["forged"] };
    const check = verifyMainlineAPerformanceReceiptV625(mutated);
    expect(check.ok).toBe(false);
    expect(check.failures).toContain("digest");
    expect(digestMainlineAPerformanceValueV625(receipt)).not.toBe(digestMainlineAPerformanceValueV625(mutated));
  });
});
