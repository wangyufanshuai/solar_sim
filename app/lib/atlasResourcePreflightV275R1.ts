export const ATLAS_RESOURCE_PREFLIGHT_VERSION_V275R1 = "v275r1-resource-stability-preflight-v1" as const;
export const ATLAS_RESOURCE_PREFLIGHT_SAMPLE_COUNT_V275R1 = 18;
export const ATLAS_RESOURCE_PREFLIGHT_SAMPLE_INTERVAL_MS_V275R1 = 10_000;
export const ATLAS_RESOURCE_PREFLIGHT_MIN_MEMORY_BYTES_V275R1 = 7 * 1024 ** 3;
export const ATLAS_RESOURCE_PREFLIGHT_MIN_DISK_BYTES_V275R1 = 30 * 1024 ** 3;
export const ATLAS_RESOURCE_PREFLIGHT_AUDIT_PORTS_V275R1 = Object.freeze(
  Array.from({ length: 21 }, (_, index) => 3000 + index),
);
export const ATLAS_RESOURCE_PREFLIGHT_REQUIRED_FREE_PORTS_V275R1 = Object.freeze([3015, 3017] as const);

export type AtlasProcessClassificationV1 = "project-owned" | "protected" | "unknown" | "ignored";

export type AtlasProcessObservationV1 = {
  pid: number;
  parentPid: number;
  name: string;
  commandLine: string;
  creationDate: string;
  workingSetBytes: number;
};

export type AtlasProjectProcessCandidateV1 = AtlasProcessObservationV1 & {
  classification: AtlasProcessClassificationV1;
  eligibleForTermination: boolean;
  reason: string;
};

export type AtlasPortObservationV1 = {
  port: number;
  address: string;
  pid: number;
  ownerClassification: AtlasProcessClassificationV1;
  ownerReason: string;
};

export type AtlasResourceStabilitySampleV1 = {
  index: number;
  sampledAt: string;
  freePhysicalMemoryBytes: number;
  eDriveFreeBytes: number;
  valid: boolean;
};

export type AtlasResourcePreflightEvaluationV275R1 = {
  status: "resource-preflight-passed-heavy-work-authorized" | "blocked-resource-preflight";
  heavyWorkAuthorized: boolean;
  validSampleCount: number;
  minimumMemoryBytes: number;
  p10MemoryBytes: number;
  minimumDiskBytes: number;
  requiredPortsClear: boolean;
  unknownTargetListenerObserved: boolean;
  residualProjectProcessCount: number;
  protectedTerminationCount: number;
  blockers: readonly string[];
};

export type AtlasResourcePreflightEvidenceV275R1 = {
  version: typeof ATLAS_RESOURCE_PREFLIGHT_VERSION_V275R1;
  attempt: 1;
  startedAt: string;
  endedAt: string;
  status: AtlasResourcePreflightEvaluationV275R1["status"];
  heavyWorkAuthorized: boolean;
  thresholds: {
    sampleCount: typeof ATLAS_RESOURCE_PREFLIGHT_SAMPLE_COUNT_V275R1;
    sampleIntervalMs: typeof ATLAS_RESOURCE_PREFLIGHT_SAMPLE_INTERVAL_MS_V275R1;
    minimumMemoryBytes: typeof ATLAS_RESOURCE_PREFLIGHT_MIN_MEMORY_BYTES_V275R1;
    minimumDiskBytes: typeof ATLAS_RESOURCE_PREFLIGHT_MIN_DISK_BYTES_V275R1;
    requiredFreePorts: typeof ATLAS_RESOURCE_PREFLIGHT_REQUIRED_FREE_PORTS_V275R1;
  };
  samples: readonly AtlasResourceStabilitySampleV1[];
  evaluation: AtlasResourcePreflightEvaluationV275R1;
  evidenceSha256: string;
};

export type AtlasResourcePreflightEvidenceV275R2 = Omit<
  AtlasResourcePreflightEvidenceV275R1,
  "version" | "attempt" | "status"
> & {
  version: "v275r2-resource-stability-preflight-user-override-v1";
  attempt: 2;
  status: "resource-preflight-passed-heavy-work-authorized-v271-only" | "blocked-resource-preflight";
  userAuthorizedThresholdOverride: {
    requestedExecutionMemoryGiB: 6.48;
    appliedMinimumMemoryBytes: number;
    historicalV275R1EvidenceChanged: false;
  };
};

export type AtlasResourcePreflightEvidenceV300 = Omit<
  AtlasResourcePreflightEvidenceV275R1,
  "version" | "attempt"
> & {
  version: "v300-heavy-resource-stability-v1";
  attempt: 1;
  v300CampaignReadiness: {
    ready: true;
    attemptConsumed: false;
    blockers: readonly [];
    statePath: "dist/science/kerr-campaign-v298r1/campaign-state.json";
    stateStatus: "complete";
    completedShardCount: 49;
    plannedShardCount: 49;
    stateSha256: string;
    aggregatePath: "dist/science/kerr-campaign-v298r1/dense-aggregate.json";
    aggregateAvailable: true;
    aggregateIdentityMatches: true;
  };
  nextAuthorizedStage: "local-shadow-heavy-qualification-suite" | "none";
};

const PROCESS_NAMES = new Set(["node", "node.exe", "python", "python.exe", "pythonw", "pythonw.exe", "playwright", "playwright.exe"]);
const PROTECTED_MARKERS = [
  "/.codex/plugins/",
  "/.codex/skills/",
  "mcp-server",
  "/mcp/server.cjs",
  "comsol_agent_mcp",
  "comsol-multiphysics-mcp",
  "chatgpt",
  "msedgewebview",
] as const;
const PROJECT_MARKERS = [
  "/.next-atlas-",
  "start-atlas-standalone.mjs",
  "playwright.atlas",
  "/tests/atlas-browser/",
] as const;

function normalize(value: string): string {
  return value.trim().replaceAll("\\", "/").toLowerCase();
}

function validPid(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

export function classifyAtlasProjectProcessV275R1(
  observation: AtlasProcessObservationV1,
  options: { workspaceRoot: string; currentPid: number; ancestorPids: ReadonlySet<number> },
): AtlasProjectProcessCandidateV1 {
  const name = normalize(observation.name);
  const commandLine = normalize(observation.commandLine);
  const workspace = normalize(options.workspaceRoot).replace(/\/$/, "");
  const base = { ...observation };
  if (!validPid(observation.pid) || !PROCESS_NAMES.has(name)) {
    return { ...base, classification: "ignored", eligibleForTermination: false, reason: "not-a-target-runtime-process" };
  }
  if (observation.pid === options.currentPid || options.ancestorPids.has(observation.pid)) {
    return { ...base, classification: "protected", eligibleForTermination: false, reason: "current-runner-or-ancestor" };
  }
  const protectedMarker = PROTECTED_MARKERS.find((marker) => commandLine.includes(marker));
  if (protectedMarker) {
    return { ...base, classification: "protected", eligibleForTermination: false, reason: `protected-marker:${protectedMarker}` };
  }
  const projectMarker = PROJECT_MARKERS.find((marker) => commandLine.includes(marker));
  const workspaceMatch = workspace.length > 0 && commandLine.includes(`${workspace}/`);
  if (workspaceMatch || projectMarker) {
    return {
      ...base,
      classification: "project-owned",
      eligibleForTermination: true,
      reason: workspaceMatch ? "workspace-command-line-match" : `project-marker:${projectMarker}`,
    };
  }
  return { ...base, classification: "unknown", eligibleForTermination: false, reason: "target-runtime-without-project-ownership" };
}

export function atlasProcessIdentityMatchesV275R1(
  before: AtlasProcessObservationV1,
  current: AtlasProcessObservationV1,
): boolean {
  return before.pid === current.pid
    && normalize(before.name) === normalize(current.name)
    && before.creationDate === current.creationDate
    && normalize(before.commandLine) === normalize(current.commandLine);
}

export function orderAtlasProjectProcessesForTerminationV275R1(
  candidates: readonly AtlasProjectProcessCandidateV1[],
): readonly AtlasProjectProcessCandidateV1[] {
  const eligible = candidates.filter((candidate) => candidate.eligibleForTermination);
  const byPid = new Map(eligible.map((candidate) => [candidate.pid, candidate]));
  const depth = (candidate: AtlasProjectProcessCandidateV1) => {
    let value = 0;
    let parent = byPid.get(candidate.parentPid);
    const seen = new Set<number>([candidate.pid]);
    while (parent && !seen.has(parent.pid)) {
      seen.add(parent.pid);
      value += 1;
      parent = byPid.get(parent.parentPid);
    }
    return value;
  };
  return [...eligible].sort((left, right) => depth(right) - depth(left) || right.pid - left.pid);
}

export function atlasNearestRankPercentileV275R1(values: readonly number[], percentile: number): number {
  const finite = values.filter((value) => Number.isFinite(value)).toSorted((left, right) => left - right);
  if (!finite.length || !Number.isFinite(percentile) || percentile < 0 || percentile > 1) return 0;
  const rank = Math.max(1, Math.ceil(percentile * finite.length));
  return finite[Math.min(finite.length - 1, rank - 1)]!;
}

export function evaluateAtlasResourcePreflightV275R1(args: {
  samples: readonly AtlasResourceStabilitySampleV1[];
  finalPorts: readonly AtlasPortObservationV1[];
  unknownTargetListenerObserved: boolean;
  residualProjectProcessCount: number;
  protectedTerminationCount: number;
  minimumMemoryBytes?: number;
  minimumDiskBytes?: number;
}): AtlasResourcePreflightEvaluationV275R1 {
  const minimumMemoryThreshold = args.minimumMemoryBytes ?? ATLAS_RESOURCE_PREFLIGHT_MIN_MEMORY_BYTES_V275R1;
  const minimumDiskThreshold = args.minimumDiskBytes ?? ATLAS_RESOURCE_PREFLIGHT_MIN_DISK_BYTES_V275R1;
  const validSamples = args.samples.filter((sample) => sample.valid
    && Number.isFinite(sample.freePhysicalMemoryBytes)
    && sample.freePhysicalMemoryBytes >= 0
    && Number.isFinite(sample.eDriveFreeBytes)
    && sample.eDriveFreeBytes >= 0);
  const memory = validSamples.map((sample) => sample.freePhysicalMemoryBytes);
  const disk = validSamples.map((sample) => sample.eDriveFreeBytes);
  const minimumMemoryBytes = memory.length ? Math.min(...memory) : 0;
  const p10MemoryBytes = atlasNearestRankPercentileV275R1(memory, 0.1);
  const minimumDiskBytes = disk.length ? Math.min(...disk) : 0;
  const requiredPortsClear = ATLAS_RESOURCE_PREFLIGHT_REQUIRED_FREE_PORTS_V275R1.every(
    (port) => !args.finalPorts.some((listener) => listener.port === port),
  );
  const blockers: string[] = [];
  if (validSamples.length !== ATLAS_RESOURCE_PREFLIGHT_SAMPLE_COUNT_V275R1) blockers.push("invalid-or-missing-stability-samples");
  if (minimumMemoryBytes < minimumMemoryThreshold) blockers.push("minimum-memory-below-operational-threshold");
  if (p10MemoryBytes < minimumMemoryThreshold) blockers.push("p10-memory-below-operational-threshold");
  if (minimumDiskBytes < minimumDiskThreshold) blockers.push("minimum-e-drive-space-below-operational-threshold");
  if (!requiredPortsClear) blockers.push("required-port-listener-present");
  if (args.unknownTargetListenerObserved) blockers.push("unknown-target-port-listener-observed");
  if (args.residualProjectProcessCount !== 0) blockers.push("project-process-residual");
  if (args.protectedTerminationCount !== 0) blockers.push("protected-process-termination-detected");
  const heavyWorkAuthorized = blockers.length === 0;
  return {
    status: heavyWorkAuthorized ? "resource-preflight-passed-heavy-work-authorized" : "blocked-resource-preflight",
    heavyWorkAuthorized,
    validSampleCount: validSamples.length,
    minimumMemoryBytes,
    p10MemoryBytes,
    minimumDiskBytes,
    requiredPortsClear,
    unknownTargetListenerObserved: args.unknownTargetListenerObserved,
    residualProjectProcessCount: args.residualProjectProcessCount,
    protectedTerminationCount: args.protectedTerminationCount,
    blockers,
  };
}
