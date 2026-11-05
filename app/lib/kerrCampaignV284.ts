export type KerrDenseShardCheckpointV284 = {
  version: "v284-corrected-kerr-dense-shard-v1";
  shardIndex: number;
  rayStart: number;
  rayStopExclusive: number;
  rayCount: number;
  executionCount: number;
  authoritySourceSha256: string;
  shortGateEvidenceSha256: string;
  complete: boolean;
  automaticRetryApplied: false;
};

export type KerrDenseAggregateV284 = {
  version: "v284-corrected-kerr-dense-aggregate-v1";
  status: "complete";
  rayCount: 3097;
  executionCount: 24776;
  shardCount: 49;
  partialAggregate: false;
  cpuAuthority: "v283-float64-dop853";
};

export function canAggregateKerrDenseCampaignV284(args: { completedShardCount: number; rayCount: number; executionCount: number }): boolean {
  return args.completedShardCount === 49 && args.rayCount === 3097 && args.executionCount === 24776;
}
