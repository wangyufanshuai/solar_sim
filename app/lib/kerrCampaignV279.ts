export const KERR_CAMPAIGN_V279_VERSION = "v279-kerr-dense-campaign" as const;

export type KerrGpuExecutionModeV279 = "webgpu" | "worker" | "precomputed-transfer-map";

export type KerrGpuComputeSnapshotV279 = {
  mode: KerrGpuExecutionModeV279;
  webgpuAvailable: boolean;
  classificationAgreement: number | null;
  criticalCurveErrorPx: number | null;
  redshiftP95RelativeError: number | null;
  nanCount: number;
  gpuBytes: number;
  disabledReason: string | null;
};

export type KerrDenseCampaignStateV279 = {
  version: typeof KERR_CAMPAIGN_V279_VERSION;
  plannedRayCount: 3097;
  plannedShardCount: 49;
  shardSizeLimit: 64;
  executionsPerRay: 8;
  completedShardIndices: readonly number[];
  nextShardIndex: number | null;
  status: "pending" | "running" | "failed" | "complete";
  failedShardIndex: number | null;
  failure: string | null;
  noAutomaticRetry: true;
  partialResultsAggregated: false;
  promotionDecision: "shadow-retained";
};

export function chooseKerrGpuExecutionModeV279(args: {
  webgpuAvailable: boolean;
  transferMapAvailable?: boolean;
}): KerrGpuExecutionModeV279 {
  if (args.webgpuAvailable) return "webgpu";
  if (args.transferMapAvailable) return "precomputed-transfer-map";
  return "worker";
}

export function validateKerrGpuComputeSnapshotV279(snapshot: KerrGpuComputeSnapshotV279): boolean {
  const finite = (value: number | null): value is number => value !== null && Number.isFinite(value);
  const passed = snapshot.nanCount === 0 && snapshot.gpuBytes >= 0 && snapshot.gpuBytes <= 96 * 1024 * 1024
    && finite(snapshot.classificationAgreement) && snapshot.classificationAgreement >= 0.999
    && finite(snapshot.criticalCurveErrorPx) && snapshot.criticalCurveErrorPx < 0.5
    && finite(snapshot.redshiftP95RelativeError) && snapshot.redshiftP95RelativeError < 0.005;
  return passed && snapshot.disabledReason === null;
}

export function createPendingKerrDenseCampaignStateV279(): KerrDenseCampaignStateV279 {
  return {
    version: KERR_CAMPAIGN_V279_VERSION,
    plannedRayCount: 3097,
    plannedShardCount: 49,
    shardSizeLimit: 64,
    executionsPerRay: 8,
    completedShardIndices: [],
    nextShardIndex: 0,
    status: "pending",
    failedShardIndex: null,
    failure: null,
    noAutomaticRetry: true,
    partialResultsAggregated: false,
    promotionDecision: "shadow-retained",
  };
}

export function validateKerrDenseCampaignStateV279(state: KerrDenseCampaignStateV279): boolean {
  const indices = [...state.completedShardIndices];
  const unique = new Set(indices);
  const indicesValid = indices.every((index) => Number.isInteger(index) && index >= 0 && index < 49);
  const nextValid = state.nextShardIndex === null || (Number.isInteger(state.nextShardIndex) && state.nextShardIndex >= 0 && state.nextShardIndex < 49);
  const completeValid = state.status !== "complete" || (indices.length === 49 && state.nextShardIndex === null);
  const failedValid = state.status !== "failed" || (state.failedShardIndex !== null && typeof state.failure === "string" && state.failure.length > 0);
  return state.version === KERR_CAMPAIGN_V279_VERSION && unique.size === indices.length && indicesValid && nextValid
    && completeValid && failedValid && state.noAutomaticRetry && state.partialResultsAggregated === false;
}
