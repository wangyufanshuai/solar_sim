export const ATLAS_SHADOW_HEAVY_GATE_VERSION_V300 = "v300-shadow-heavy-qualification-gate-v1" as const;
export const ATLAS_SHADOW_HEAVY_GATE_SAMPLE_COUNT_V300 = 18 as const;
export const ATLAS_SHADOW_HEAVY_GATE_MIN_MEMORY_BYTES_V300 = 7 * 1024 ** 3;
export const ATLAS_SHADOW_HEAVY_GATE_MIN_DISK_BYTES_V300 = 30 * 1024 ** 3;

export type AtlasShadowHeavyGateStageV300 = "builds" | "browser" | "visual" | "soak" | "rtx-webgpu";

export type AtlasShadowHeavyGateInputV300 = Readonly<{
  resource: Readonly<{
    evidenceVersion: "v300-heavy-resource-stability-v1" | string;
    status: "resource-preflight-passed-heavy-work-authorized" | "blocked-resource-preflight" | "unavailable";
    sampleCount: number;
    minimumMemoryBytes: number;
    p10MemoryBytes: number;
    minimumDiskBytes: number;
    protectedTerminationCount: number;
    residualProjectProcessCount: number;
    requiredPortsClear: boolean;
    unknownTargetListenerObserved: boolean;
  }>;
  campaign: Readonly<{
    status: string;
    completedShardCount: number;
    plannedShardCount: number;
    aggregateAvailable: boolean;
    denseAuthorityAccepted: boolean;
  }>;
  authority: Readonly<{
    cpuAuthority: "qualified-v296-v297-portable-envelope" | "unavailable";
    formalProductPointer: "v263" | string;
    defaultKernel: "legacy-eih-1pn" | string;
  }>;
}>;

export type AtlasShadowHeavyGateResultV300 = Readonly<{
  version: typeof ATLAS_SHADOW_HEAVY_GATE_VERSION_V300;
  status: "heavy-qualification-authorized" | "blocked-heavy-qualification";
  authorized: boolean;
  blockers: readonly string[];
  allowedStages: readonly AtlasShadowHeavyGateStageV300[];
  thresholds: Readonly<{
    sampleCount: typeof ATLAS_SHADOW_HEAVY_GATE_SAMPLE_COUNT_V300;
    minimumMemoryBytes: typeof ATLAS_SHADOW_HEAVY_GATE_MIN_MEMORY_BYTES_V300;
    minimumDiskBytes: typeof ATLAS_SHADOW_HEAVY_GATE_MIN_DISK_BYTES_V300;
  }>;
  boundary: "local-shadow-only-formal-v263-retained-no-automatic-promotion";
}>;

const STAGES: readonly AtlasShadowHeavyGateStageV300[] = ["builds", "browser", "visual", "soak", "rtx-webgpu"];

export function evaluateAtlasShadowHeavyQualificationGateV300(
  input: AtlasShadowHeavyGateInputV300,
): AtlasShadowHeavyGateResultV300 {
  const blockers: string[] = [];
  const resource = input.resource;
  const campaign = input.campaign;
  const authority = input.authority;
  if (resource.evidenceVersion !== "v300-heavy-resource-stability-v1") blockers.push("resource-preflight-version-not-v300");
  if (resource.status !== "resource-preflight-passed-heavy-work-authorized") blockers.push("resource-preflight-not-passed");
  if (resource.sampleCount !== ATLAS_SHADOW_HEAVY_GATE_SAMPLE_COUNT_V300) blockers.push("resource-stability-sample-count");
  if (!Number.isFinite(resource.minimumMemoryBytes) || resource.minimumMemoryBytes < ATLAS_SHADOW_HEAVY_GATE_MIN_MEMORY_BYTES_V300) blockers.push("minimum-memory-below-7-gib");
  if (!Number.isFinite(resource.p10MemoryBytes) || resource.p10MemoryBytes < ATLAS_SHADOW_HEAVY_GATE_MIN_MEMORY_BYTES_V300) blockers.push("p10-memory-below-7-gib");
  if (!Number.isFinite(resource.minimumDiskBytes) || resource.minimumDiskBytes < ATLAS_SHADOW_HEAVY_GATE_MIN_DISK_BYTES_V300) blockers.push("disk-below-30-gib");
  if (resource.protectedTerminationCount !== 0) blockers.push("protected-process-termination");
  if (resource.residualProjectProcessCount !== 0) blockers.push("residual-project-process");
  if (!resource.requiredPortsClear) blockers.push("required-port-listener");
  if (resource.unknownTargetListenerObserved) blockers.push("unknown-target-listener");
  if (campaign.status !== "complete" || campaign.completedShardCount !== 49 || campaign.plannedShardCount !== 49) blockers.push("dense-campaign-not-49-of-49");
  if (!campaign.aggregateAvailable) blockers.push("dense-aggregate-unavailable");
  if (!campaign.denseAuthorityAccepted) blockers.push("dense-authority-not-accepted");
  if (authority.cpuAuthority !== "qualified-v296-v297-portable-envelope") blockers.push("cpu-authority-lock-missing");
  if (authority.formalProductPointer !== "v263") blockers.push("formal-pointer-moved");
  if (authority.defaultKernel !== "legacy-eih-1pn") blockers.push("default-kernel-moved");
  const authorized = blockers.length === 0;
  return {
    version: ATLAS_SHADOW_HEAVY_GATE_VERSION_V300,
    status: authorized ? "heavy-qualification-authorized" : "blocked-heavy-qualification",
    authorized,
    blockers,
    allowedStages: authorized ? STAGES : [],
    thresholds: {
      sampleCount: ATLAS_SHADOW_HEAVY_GATE_SAMPLE_COUNT_V300,
      minimumMemoryBytes: ATLAS_SHADOW_HEAVY_GATE_MIN_MEMORY_BYTES_V300,
      minimumDiskBytes: ATLAS_SHADOW_HEAVY_GATE_MIN_DISK_BYTES_V300,
    },
    boundary: "local-shadow-only-formal-v263-retained-no-automatic-promotion",
  };
}
