export const KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314 = "89ce45769978650c177acb83a0c37ceb1c0a1a6f6db34655448f5c6fcb896c04" as const;
export const KERR_CORRECTED_DENSE_RAY_PLAN_FILE_SHA256_V314 = "a19598c89d98172850fb6faf0b5b00fbe3e369bda409abea7d7b76b431b0906c" as const;
export const KERR_FULL_SHORT_AUTHORITY_SHA256_V314 = "99e591c0a8fd1f342ef622239301d04cf9f5cd33cbe1c45f1159e0804f2e81a6" as const;

export type KerrCorrectedDenseRayPlanEntryV314 = Readonly<{
  rayIndex: number;
  rayId: string;
  stratum: "canonical" | "critical-band" | "disk-band" | "uniform-field";
  alphaM: number;
  betaM: number;
  spinA: number;
  expectedFamily: "capture" | "escape" | "disk-hit" | "unclassified";
}>;

export type KerrCorrectedDenseCampaignStateV314 = Readonly<{
  version: "v314-kerr-corrected-dense-campaign-state-v1";
  status: "incomplete-0-of-49";
  plannedRayCount: 3097;
  plannedShardCount: 49;
  executionsPerRay: 8;
  completedShardIndices: readonly [];
  completedShardCount: 0;
  nextShardIndex: 0;
  attemptConsumed: false;
  runNextAuthorized: false;
  runNextAvailable: false;
  controllerImplementation: "v312-v313-locked-streaming-ndjson-v1";
  partialAggregate: false;
  aggregateAvailable: false;
  formalProductPointer: "v263";
  defaultKernel: "legacy-eih-1pn";
  stateSha256: string;
}>;

export function isKerrCorrectedDenseCampaignStateV314(value: unknown): value is KerrCorrectedDenseCampaignStateV314 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as Partial<KerrCorrectedDenseCampaignStateV314>;
  return state.version === "v314-kerr-corrected-dense-campaign-state-v1" && state.status === "incomplete-0-of-49"
    && state.plannedRayCount === 3097 && state.plannedShardCount === 49 && state.executionsPerRay === 8
    && Array.isArray(state.completedShardIndices) && state.completedShardIndices.length === 0 && state.completedShardCount === 0 && state.nextShardIndex === 0
    && state.attemptConsumed === false && state.runNextAuthorized === false && state.runNextAvailable === false
    && state.controllerImplementation === "v312-v313-locked-streaming-ndjson-v1"
    && state.partialAggregate === false && state.aggregateAvailable === false
    && state.formalProductPointer === "v263" && state.defaultKernel === "legacy-eih-1pn"
    && typeof state.stateSha256 === "string" && /^[a-f0-9]{64}$/.test(state.stateSha256);
}
