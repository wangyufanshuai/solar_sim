import { describe, expect, it } from "vitest";
import {
  ATLAS_RESOURCE_PREFLIGHT_MIN_DISK_BYTES_V275R1,
  ATLAS_RESOURCE_PREFLIGHT_MIN_MEMORY_BYTES_V275R1,
  ATLAS_RESOURCE_PREFLIGHT_SAMPLE_COUNT_V275R1,
  atlasNearestRankPercentileV275R1,
  atlasProcessIdentityMatchesV275R1,
  classifyAtlasProjectProcessV275R1,
  evaluateAtlasResourcePreflightV275R1,
  orderAtlasProjectProcessesForTerminationV275R1,
  type AtlasProcessObservationV1,
  type AtlasProjectProcessCandidateV1,
  type AtlasResourceStabilitySampleV1,
} from "./atlasResourcePreflightV275R1";

const WORKSPACE = "E:\\86137\\myai\\solar_sim\\next-web";
const observation = (overrides: Partial<AtlasProcessObservationV1> = {}): AtlasProcessObservationV1 => ({
  pid: 100,
  parentPid: 1,
  name: "node.exe",
  commandLine: `node ${WORKSPACE}\\scripts\\start-atlas-standalone.mjs --port 3015`,
  creationDate: "20260720040000.000000+480",
  workingSetBytes: 128 * 1024 ** 2,
  ...overrides,
});
const classify = (value: AtlasProcessObservationV1, ancestors = new Set<number>()) => classifyAtlasProjectProcessV275R1(value, {
  workspaceRoot: WORKSPACE,
  currentPid: 999,
  ancestorPids: ancestors,
});
const samples = (memoryBytes = 8 * 1024 ** 3, diskBytes = 40 * 1024 ** 3): AtlasResourceStabilitySampleV1[] =>
  Array.from({ length: ATLAS_RESOURCE_PREFLIGHT_SAMPLE_COUNT_V275R1 }, (_, index) => ({
    index: index + 1,
    sampledAt: new Date(Date.UTC(2026, 6, 20, 4, 0, index * 10)).toISOString(),
    freePhysicalMemoryBytes: memoryBytes,
    eDriveFreeBytes: diskBytes,
    valid: true,
  }));

describe("v275.1 resource stability preflight", () => {
  it("classifies only explicit Orbit Atlas runtimes as project-owned", () => {
    expect(classify(observation())).toMatchObject({ classification: "project-owned", eligibleForTermination: true });
    expect(classify(observation({ commandLine: "node E:\\other\\server.mjs" }))).toMatchObject({ classification: "unknown", eligibleForTermination: false });
    expect(classify(observation({ commandLine: "node C:\\Users\\86137\\.codex\\plugins\\mcp-server.cjs" }))).toMatchObject({ classification: "protected", eligibleForTermination: false });
    expect(classify(observation({ commandLine: "node ./mcp/server.cjs --stdio" }))).toMatchObject({ classification: "protected", eligibleForTermination: false });
    expect(classify(observation({ name: "python.exe", commandLine: "python -m comsol_agent_mcp.server" }))).toMatchObject({ classification: "protected", eligibleForTermination: false });
    expect(classify(observation({ name: "powershell.exe" }))).toMatchObject({ classification: "ignored", eligibleForTermination: false });
  });

  it("protects the runner ancestry even when its command line contains the workspace", () => {
    expect(classify(observation({ pid: 77 }), new Set([77]))).toMatchObject({
      classification: "protected",
      eligibleForTermination: false,
      reason: "current-runner-or-ancestor",
    });
  });

  it("detects PID reuse and terminates children before parents", () => {
    const before = observation({ pid: 200, creationDate: "A" });
    expect(atlasProcessIdentityMatchesV275R1(before, { ...before })).toBe(true);
    expect(atlasProcessIdentityMatchesV275R1(before, { ...before, creationDate: "B" })).toBe(false);
    const parent = classify(observation({ pid: 200, parentPid: 1 })) as AtlasProjectProcessCandidateV1;
    const child = classify(observation({ pid: 201, parentPid: 200 })) as AtlasProjectProcessCandidateV1;
    expect(orderAtlasProjectProcessesForTerminationV275R1([parent, child]).map((entry) => entry.pid)).toEqual([201, 200]);
  });

  it("uses nearest-rank P10 and passes only a complete stable sample window", () => {
    expect(atlasNearestRankPercentileV275R1([10, 20, 30, 40, 50], 0.1)).toBe(10);
    const result = evaluateAtlasResourcePreflightV275R1({
      samples: samples(),
      finalPorts: [],
      unknownTargetListenerObserved: false,
      residualProjectProcessCount: 0,
      protectedTerminationCount: 0,
    });
    expect(result).toMatchObject({
      status: "resource-preflight-passed-heavy-work-authorized",
      heavyWorkAuthorized: true,
      validSampleCount: 18,
      blockers: [],
    });
  });

  it("fails closed for memory, disk, invalid samples, required ports and residuals", () => {
    const unstable = samples();
    unstable[0] = { ...unstable[0]!, freePhysicalMemoryBytes: ATLAS_RESOURCE_PREFLIGHT_MIN_MEMORY_BYTES_V275R1 - 1 };
    unstable[1] = { ...unstable[1]!, eDriveFreeBytes: ATLAS_RESOURCE_PREFLIGHT_MIN_DISK_BYTES_V275R1 - 1 };
    unstable[2] = { ...unstable[2]!, valid: false };
    const result = evaluateAtlasResourcePreflightV275R1({
      samples: unstable,
      finalPorts: [{ port: 3015, address: "127.0.0.1", pid: 500, ownerClassification: "unknown", ownerReason: "unknown" }],
      unknownTargetListenerObserved: true,
      residualProjectProcessCount: 1,
      protectedTerminationCount: 1,
    });
    expect(result.heavyWorkAuthorized).toBe(false);
    expect(result.blockers).toEqual(expect.arrayContaining([
      "invalid-or-missing-stability-samples",
      "minimum-memory-below-operational-threshold",
      "minimum-e-drive-space-below-operational-threshold",
      "required-port-listener-present",
      "unknown-target-port-listener-observed",
      "project-process-residual",
      "protected-process-termination-detected",
    ]));
  });

  it("supports an additive user-authorized threshold without changing the v275.1 default", () => {
    const memory = 6.25 * 1024 ** 3;
    expect(evaluateAtlasResourcePreflightV275R1({
      samples: samples(memory), finalPorts: [], unknownTargetListenerObserved: false,
      residualProjectProcessCount: 0, protectedTerminationCount: 0,
    }).heavyWorkAuthorized).toBe(false);
    expect(evaluateAtlasResourcePreflightV275R1({
      samples: samples(memory), finalPorts: [], unknownTargetListenerObserved: false,
      residualProjectProcessCount: 0, protectedTerminationCount: 0,
      minimumMemoryBytes: 6 * 1024 ** 3,
    }).heavyWorkAuthorized).toBe(true);
  });
});
