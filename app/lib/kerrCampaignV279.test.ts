import { describe, expect, it } from "vitest";
import {
  chooseKerrGpuExecutionModeV279,
  createPendingKerrDenseCampaignStateV279,
  validateKerrDenseCampaignStateV279,
  validateKerrGpuComputeSnapshotV279,
} from "./kerrCampaignV279";

describe("v279 Kerr campaign and GPU boundaries", () => {
  it("creates a serial 49-shard 3097-ray plan without partial aggregation", () => {
    const state = createPendingKerrDenseCampaignStateV279();
    expect(state.plannedRayCount).toBe(3097);
    expect(state.plannedShardCount).toBe(49);
    expect(state.executionsPerRay).toBe(8);
    expect(validateKerrDenseCampaignStateV279(state)).toBe(true);
  });

  it("fails closed for duplicate or partial campaign state", () => {
    const state = createPendingKerrDenseCampaignStateV279();
    expect(validateKerrDenseCampaignStateV279({ ...state, completedShardIndices: [0, 0] })).toBe(false);
    expect(validateKerrDenseCampaignStateV279({ ...state, status: "failed", failedShardIndex: 1, failure: "watchdog-timeout" })).toBe(true);
  });

  it("selects WebGPU only as optional acceleration", () => {
    expect(chooseKerrGpuExecutionModeV279({ webgpuAvailable: true })).toBe("webgpu");
    expect(chooseKerrGpuExecutionModeV279({ webgpuAvailable: false, transferMapAvailable: true })).toBe("precomputed-transfer-map");
    expect(chooseKerrGpuExecutionModeV279({ webgpuAvailable: false })).toBe("worker");
    expect(validateKerrGpuComputeSnapshotV279({
      mode: "webgpu", webgpuAvailable: true, classificationAgreement: 0.9995,
      criticalCurveErrorPx: 0.2, redshiftP95RelativeError: 0.001, nanCount: 0,
      gpuBytes: 64 * 1024 * 1024, disabledReason: null,
    })).toBe(true);
  });
});
