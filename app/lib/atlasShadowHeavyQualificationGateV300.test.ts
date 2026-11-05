import { describe, expect, it } from "vitest";
import {
  ATLAS_SHADOW_HEAVY_GATE_MIN_DISK_BYTES_V300,
  ATLAS_SHADOW_HEAVY_GATE_MIN_MEMORY_BYTES_V300,
  ATLAS_SHADOW_HEAVY_GATE_SAMPLE_COUNT_V300,
  evaluateAtlasShadowHeavyQualificationGateV300,
  type AtlasShadowHeavyGateInputV300,
} from "./atlasShadowHeavyQualificationGateV300";

const passing: AtlasShadowHeavyGateInputV300 = {
  resource: {
    evidenceVersion: "v300-heavy-resource-stability-v1",
    status: "resource-preflight-passed-heavy-work-authorized",
    sampleCount: ATLAS_SHADOW_HEAVY_GATE_SAMPLE_COUNT_V300,
    minimumMemoryBytes: ATLAS_SHADOW_HEAVY_GATE_MIN_MEMORY_BYTES_V300,
    p10MemoryBytes: ATLAS_SHADOW_HEAVY_GATE_MIN_MEMORY_BYTES_V300,
    minimumDiskBytes: ATLAS_SHADOW_HEAVY_GATE_MIN_DISK_BYTES_V300,
    protectedTerminationCount: 0,
    residualProjectProcessCount: 0,
    requiredPortsClear: true,
    unknownTargetListenerObserved: false,
  },
  campaign: { status: "complete", completedShardCount: 49, plannedShardCount: 49, aggregateAvailable: true, denseAuthorityAccepted: true },
  authority: { cpuAuthority: "qualified-v296-v297-portable-envelope", formalProductPointer: "v263", defaultKernel: "legacy-eih-1pn" },
};

describe("v300 heavy qualification gate", () => {
  it("authorizes every heavy stage only after resources and 49/49 authority are true", () => {
    const result = evaluateAtlasShadowHeavyQualificationGateV300(passing);
    expect(result).toMatchObject({ status: "heavy-qualification-authorized", authorized: true, blockers: [] });
    expect(result.allowedStages).toEqual(["builds", "browser", "visual", "soak", "rtx-webgpu"]);
  });

  it("fails closed for the current shard-0/incomplete and low-memory state", () => {
    const result = evaluateAtlasShadowHeavyQualificationGateV300({
      ...passing,
      resource: { ...passing.resource, status: "blocked-resource-preflight", p10MemoryBytes: 6.9 * 1024 ** 3 },
      campaign: { ...passing.campaign, status: "incomplete-1-of-49", completedShardCount: 1, aggregateAvailable: false, denseAuthorityAccepted: false },
    });
    expect(result.status).toBe("blocked-heavy-qualification");
    expect(result.authorized).toBe(false);
    expect(result.allowedStages).toEqual([]);
    expect(result.blockers).toEqual(expect.arrayContaining(["resource-preflight-not-passed", "p10-memory-below-7-gib", "dense-campaign-not-49-of-49", "dense-aggregate-unavailable"]));
  });

  it("does not allow formal pointer or kernel drift to authorize local-shadow heavy work", () => {
    const result = evaluateAtlasShadowHeavyQualificationGateV300({
      ...passing,
      authority: { ...passing.authority, formalProductPointer: "v300", defaultKernel: "candidate-kernel" },
    });
    expect(result.authorized).toBe(false);
    expect(result.blockers).toEqual(expect.arrayContaining(["formal-pointer-moved", "default-kernel-moved"]));
  });

  it("does not authorize a historical v275 resource record even if its numbers look sufficient", () => {
    const result = evaluateAtlasShadowHeavyQualificationGateV300({
      ...passing,
      resource: { ...passing.resource, evidenceVersion: "v275r1-resource-stability-preflight-v1" },
    });
    expect(result.authorized).toBe(false);
    expect(result.blockers).toContain("resource-preflight-version-not-v300");
  });
});
