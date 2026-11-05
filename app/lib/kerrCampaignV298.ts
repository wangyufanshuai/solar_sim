export type KerrDenseCampaignStatusV298 = "incomplete-0-of-49" | "blocked-by-v297" | "not-initialized";

export interface KerrDenseCampaignPlanV298 {
  readonly plannedRayCount: 3097;
  readonly plannedShardCount: 49;
  readonly maxRaysPerShard: 64;
  readonly executionsPerRay: 8;
}

export interface KerrDenseCampaignStateV298 extends KerrDenseCampaignPlanV298 {
  readonly version: "v298-kerr-dense-campaign-state-v1";
  readonly status: KerrDenseCampaignStatusV298;
  readonly completedShardCount: number;
  readonly nextShardIndex: number | null;
  readonly partialAggregate: false;
  readonly runNextAvailable: false;
  readonly aggregateAvailable: false;
  readonly stateSha256?: string;
}

export function isKerrDenseCampaignStateV298(value: unknown): value is KerrDenseCampaignStateV298 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<KerrDenseCampaignStateV298>;
  return candidate.version === "v298-kerr-dense-campaign-state-v1"
    && (candidate.status === "incomplete-0-of-49" || candidate.status === "blocked-by-v297" || candidate.status === "not-initialized")
    && candidate.plannedRayCount === 3097
    && candidate.plannedShardCount === 49
    && candidate.maxRaysPerShard === 64
    && candidate.executionsPerRay === 8
    && candidate.partialAggregate === false
    && candidate.runNextAvailable === false
    && candidate.aggregateAvailable === false;
}
