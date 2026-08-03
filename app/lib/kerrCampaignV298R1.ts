export const KERR_DENSE_CAMPAIGN_V298R1_VERSION = "v298r1-kerr-dense-campaign-state-v1" as const;
export const KERR_DENSE_RAY_PLAN_SHA256_V298R1 = "832f9086f8a4d5a4546879034481096510685efbcf51c6abfe5d83ddbcb3c850" as const;
export const KERR_DENSE_RAY_PLAN_FILE_SHA256_V298R1 = "9f1cd9b0d9e739d7e79952e9b3fd5228e29571d7acdb53f4ea235269fb66bdee" as const;

export type KerrDenseRayStratumV298R1 = "canonical" | "critical-band" | "disk-band" | "uniform-field";

export type KerrDenseRayPlanEntryV298R1 = {
  readonly rayIndex: number;
  readonly rayId: string;
  readonly stratum: KerrDenseRayStratumV298R1;
  readonly alphaM: number;
  readonly betaM: number;
  readonly spinA: number;
  readonly expectedFamily: string;
};

export type KerrDenseRayPlanV298R1 = {
  readonly version: "v298r1-kerr-dense-ray-plan-v1";
  readonly rayCount: 3097;
  readonly shardCount: 49;
  readonly executionsPerRay: 8;
  readonly strata: {
    readonly canonical: 16;
    readonly criticalBand: 560;
    readonly diskBand: 840;
    readonly uniformField: 1681;
  };
  readonly rays: readonly KerrDenseRayPlanEntryV298R1[];
  readonly planSha256: string;
};

export type KerrDenseShardCheckpointV298R1 = {
  readonly version: "v298r1-kerr-dense-shard-checkpoint-v1";
  readonly shardIndex: number;
  readonly completedRayCount: number;
  readonly nextRayIndex: number | null;
  readonly partBytes: number;
  readonly partSha256: string;
  readonly rayPlanSha256: string;
  readonly automaticRetryApplied: false;
  readonly checkpointSha256: string;
};

export type KerrDenseCampaignStatusV298R1 =
  | `incomplete-${number}-of-49`
  | `running-shard-${number}`
  | "failed-no-automatic-retry"
  | "aggregate-failed-no-automatic-retry"
  | "complete-awaiting-aggregate"
  | "complete";

export type KerrDenseCampaignStateV298R1 = {
  readonly version: typeof KERR_DENSE_CAMPAIGN_V298R1_VERSION;
  readonly status: KerrDenseCampaignStatusV298R1;
  readonly plannedRayCount: 3097;
  readonly plannedShardCount: 49;
  readonly executionsPerRay: 8;
  readonly completedShardIndices: readonly number[];
  readonly completedShardCount: number;
  readonly nextShardIndex: number | null;
  readonly failedShardIndex: number | null;
  readonly failure: string | null;
  readonly attemptConsumed: boolean;
  readonly partialAggregate: false;
  readonly runNextAvailable: boolean;
  readonly aggregateAvailable: boolean;
  readonly peakRssBytes?: number;
  readonly rssTelemetry?: {
    readonly status: "measured" | "measurement-failed";
    readonly probe: "process-peak-working-set-v298r1-r2";
    readonly peakRssBytes: number;
    readonly lastShardPeakRssBytes?: number;
    readonly limitBytes: number;
    readonly gatePassed: boolean;
    readonly failure?: string | null;
  };
  readonly rayPlanSha256: string;
  readonly stateSha256: string;
};

export type KerrDenseAggregateV298R1 = {
  readonly version: "v298r1-kerr-dense-aggregate-v1";
  readonly status: "complete";
  readonly rayCount: 3097;
  readonly executionCount: 24776;
  readonly shardCount: 49;
  readonly classCounts: Readonly<Record<"capture" | "escape" | "disk-hit", number>>;
  readonly applicablePolarizationExecutionCount: number;
  readonly unavailablePolarizationExecutionCount: 0;
  readonly qualification: {
    readonly qualified: true;
    readonly classificationAgreement: number;
    readonly redshiftComparisonCount: number;
    readonly maxRedshiftFormulaDifference: number;
    readonly maxReleaseEvpaDifferenceDeg: number;
    readonly maxInternalEvpaDifferenceDeg: number;
    readonly gates: Readonly<Record<string, true>>;
  };
  readonly partialAggregate: false;
  readonly formalProductPointer: "v263";
  readonly aggregateSha256: string;
};

export type KerrDenseShardScienceAuditV298R1 = {
  readonly version: "v298r1-kerr-dense-shard-science-audit-v1";
  readonly status: "shard-structural-qualified";
  readonly shardIndex: number;
  readonly rayCount: number;
  readonly executionCount: number;
  readonly qualification: {
    readonly qualified: true;
    readonly scope: "shard";
    readonly statisticalGatesApplied: false;
    readonly gates: Readonly<Record<string, true>>;
  };
  readonly errorBudget: {
    readonly version: "v298r1-dense-kerr-error-budget-v1";
    readonly scope: "shard";
    readonly independenceAssumption: "not-established";
    readonly combinationPolicy: "componentwise-reporting-no-rss-no-cross-dimension-sum";
    readonly components: Readonly<Record<string, { readonly observed: number; readonly threshold: number; readonly unit: string; readonly source: string }>>;
  };
  readonly partialAggregate: true;
  readonly aggregateEligible: false;
  readonly formalProductPointer: "v263";
  readonly auditSha256: string;
};

const SHA256 = /^[a-f0-9]{64}$/;

export function isKerrDenseCampaignStateV298R1(value: unknown): value is KerrDenseCampaignStateV298R1 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<KerrDenseCampaignStateV298R1>;
  const completed = candidate.completedShardIndices;
  if (candidate.version !== KERR_DENSE_CAMPAIGN_V298R1_VERSION || typeof candidate.status !== "string") return false;
  const statusValid = (/^incomplete-\d+-of-49$/.test(candidate.status)
    || /^running-shard-\d+$/.test(candidate.status)
    || ["failed-no-automatic-retry", "aggregate-failed-no-automatic-retry", "complete-awaiting-aggregate", "complete"].includes(candidate.status));
  const completedValid = Array.isArray(completed)
    && completed.every((index) => Number.isSafeInteger(index) && index >= 0 && index < 49)
    && new Set(completed).size === completed.length
    && completed.length === candidate.completedShardCount;
  const nextValid = candidate.nextShardIndex === null
    || (Number.isSafeInteger(candidate.nextShardIndex) && candidate.nextShardIndex! >= 0 && candidate.nextShardIndex! < 49);
  const incompleteMatch = !candidate.status.startsWith("incomplete-")
    || candidate.status === `incomplete-${candidate.completedShardCount}-of-49`;
  const completionMatch = candidate.status !== "complete"
    || (candidate.completedShardCount === 49 && candidate.nextShardIndex === null && candidate.aggregateAvailable === true);
  return statusValid
    && candidate.plannedRayCount === 3097
    && candidate.plannedShardCount === 49
    && candidate.executionsPerRay === 8
    && completedValid
    && Number.isSafeInteger(candidate.completedShardCount)
    && candidate.completedShardCount! >= 0
    && candidate.completedShardCount! <= 49
    && nextValid
    && incompleteMatch
    && completionMatch
    && candidate.partialAggregate === false
    && typeof candidate.runNextAvailable === "boolean"
    && typeof candidate.aggregateAvailable === "boolean"
    && typeof candidate.rayPlanSha256 === "string"
    && SHA256.test(candidate.rayPlanSha256)
    && typeof candidate.stateSha256 === "string"
    && SHA256.test(candidate.stateSha256);
}

export function isKerrDenseAggregateV298R1(value: unknown): value is KerrDenseAggregateV298R1 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<KerrDenseAggregateV298R1>;
  const gates = candidate.qualification?.gates;
  return candidate.version === "v298r1-kerr-dense-aggregate-v1"
    && candidate.status === "complete"
    && candidate.rayCount === 3097
    && candidate.executionCount === 24776
    && candidate.shardCount === 49
    && candidate.partialAggregate === false
    && candidate.formalProductPointer === "v263"
    && candidate.unavailablePolarizationExecutionCount === 0
    && candidate.qualification?.qualified === true
    && typeof candidate.qualification.classificationAgreement === "number"
    && candidate.qualification.classificationAgreement >= 0.999
    && typeof candidate.qualification.maxRedshiftFormulaDifference === "number"
    && candidate.qualification.maxRedshiftFormulaDifference < 0.005
    && typeof candidate.qualification.maxReleaseEvpaDifferenceDeg === "number"
    && candidate.qualification.maxReleaseEvpaDifferenceDeg < 0.5
    && typeof candidate.qualification.maxInternalEvpaDifferenceDeg === "number"
    && candidate.qualification.maxInternalEvpaDifferenceDeg < 0.1
    && !!gates
    && Object.keys(gates).length > 0
    && Object.values(gates).every((passed) => passed === true)
    && typeof candidate.aggregateSha256 === "string"
    && SHA256.test(candidate.aggregateSha256);
}

export function isKerrDenseShardScienceAuditV298R1(value: unknown): value is KerrDenseShardScienceAuditV298R1 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<KerrDenseShardScienceAuditV298R1>;
  const gates = candidate.qualification?.gates;
  const components = candidate.errorBudget?.components;
  return candidate.version === "v298r1-kerr-dense-shard-science-audit-v1"
    && candidate.status === "shard-structural-qualified"
    && Number.isSafeInteger(candidate.shardIndex)
    && candidate.shardIndex! >= 0
    && candidate.shardIndex! < 49
    && Number.isSafeInteger(candidate.rayCount)
    && candidate.rayCount! > 0
    && candidate.rayCount! <= 64
    && candidate.executionCount === candidate.rayCount! * 8
    && candidate.qualification?.qualified === true
    && candidate.qualification.scope === "shard"
    && candidate.qualification.statisticalGatesApplied === false
    && !!gates
    && Object.keys(gates).length > 0
    && Object.values(gates).every((passed) => passed === true)
    && candidate.errorBudget?.version === "v298r1-dense-kerr-error-budget-v1"
    && candidate.errorBudget.scope === "shard"
    && candidate.errorBudget.independenceAssumption === "not-established"
    && candidate.errorBudget.combinationPolicy === "componentwise-reporting-no-rss-no-cross-dimension-sum"
    && !!components
    && Object.keys(components).length >= 10
    && Object.values(components).every((component) => Number.isFinite(component.observed)
      && Number.isFinite(component.threshold)
      && component.threshold > 0
      && typeof component.unit === "string"
      && typeof component.source === "string")
    && candidate.partialAggregate === true
    && candidate.aggregateEligible === false
    && candidate.formalProductPointer === "v263"
    && typeof candidate.auditSha256 === "string"
    && SHA256.test(candidate.auditSha256);
}

export function isKerrDenseRayPlanV298R1(value: unknown): value is KerrDenseRayPlanV298R1 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<KerrDenseRayPlanV298R1>;
  if (candidate.version !== "v298r1-kerr-dense-ray-plan-v1"
    || candidate.rayCount !== 3097
    || candidate.shardCount !== 49
    || candidate.executionsPerRay !== 8
    || !Array.isArray(candidate.rays)
    || candidate.rays.length !== 3097
    || !candidate.strata
    || candidate.strata.canonical !== 16
    || candidate.strata.criticalBand !== 560
    || candidate.strata.diskBand !== 840
    || candidate.strata.uniformField !== 1681
    || typeof candidate.planSha256 !== "string"
    || !SHA256.test(candidate.planSha256)) return false;
  return candidate.rays.every((ray, index) => ray.rayIndex === index
    && Number.isFinite(ray.alphaM)
    && Number.isFinite(ray.betaM)
    && Number.isFinite(ray.spinA));
}
