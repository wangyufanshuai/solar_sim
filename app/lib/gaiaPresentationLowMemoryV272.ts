export const GAIA_PRESENTATION_FETCH_DEFAULT_MEMORY_GIB_V272 = 6 as const;
export const GAIA_PRESENTATION_FETCH_LOW_MEMORY_FLOOR_GIB_V272 = 3 as const;
export const GAIA_PRESENTATION_FETCH_BATCH_ROWS_V272 = 5_000 as const;

export type GaiaPresentationLowMemoryPolicyV272 = {
  defaultMinimumFreeMemoryGiB: typeof GAIA_PRESENTATION_FETCH_DEFAULT_MEMORY_GIB_V272;
  requestedMinimumFreeMemoryGiB: number;
  minimumAllowedMemoryGiB: typeof GAIA_PRESENTATION_FETCH_LOW_MEMORY_FLOOR_GIB_V272;
  overrideApplied: boolean;
  authorization: "default-policy" | "user-authorized-3-gib-fetch-only";
  buildThresholdUnchangedGiB: 6;
};

export type GaiaPresentationShardAttemptV272 = {
  shard: number;
  startedAt: string;
  finishedAt: string | null;
  exitCode: number | null;
  outcome?: "checkpoint-verified" | "failed-no-retry" | "blocked-preflight-shard-not-attempted";
  shardAttempted?: boolean;
  validCandidateRowsAfter?: number;
  automaticRetryApplied: false;
};

export type GaiaPresentationShardSeriesStateV272 = {
  version: "v272-gaia-dr3-presentation-fetch-series-v1";
  status:
    | "running"
    | "ready-for-build"
    | "paused-maximum-new-shards"
    | "blocked-first-shard-failure"
    | "blocked-child-preflight"
    | "blocked-insufficient-candidates";
  startedAt: string;
  finishedAt: string | null;
  minimumFreeMemoryGiB: number;
  defaultMinimumFreeMemoryGiB: 6;
  lowMemoryOverrideApplied: boolean;
  authorization: GaiaPresentationLowMemoryPolicyV272["authorization"];
  initialCompletedShards: number;
  maximumNewShards: number;
  completedShards?: number;
  uniqueValidCandidateRows?: number;
  failedShard?: number;
  automaticRetryApplied: false;
  attempts: GaiaPresentationShardAttemptV272[];
};

export function createGaiaPresentationLowMemoryPolicyV272(
  requestedMinimumFreeMemoryGiB: number = GAIA_PRESENTATION_FETCH_DEFAULT_MEMORY_GIB_V272,
): GaiaPresentationLowMemoryPolicyV272 {
  if (!Number.isFinite(requestedMinimumFreeMemoryGiB) || requestedMinimumFreeMemoryGiB < GAIA_PRESENTATION_FETCH_LOW_MEMORY_FLOOR_GIB_V272) {
    throw new Error("Gaia v272 fetch memory threshold must be at least 3 GiB");
  }
  const overrideApplied = requestedMinimumFreeMemoryGiB < GAIA_PRESENTATION_FETCH_DEFAULT_MEMORY_GIB_V272;
  return {
    defaultMinimumFreeMemoryGiB: GAIA_PRESENTATION_FETCH_DEFAULT_MEMORY_GIB_V272,
    requestedMinimumFreeMemoryGiB,
    minimumAllowedMemoryGiB: GAIA_PRESENTATION_FETCH_LOW_MEMORY_FLOOR_GIB_V272,
    overrideApplied,
    authorization: overrideApplied ? "user-authorized-3-gib-fetch-only" : "default-policy",
    buildThresholdUnchangedGiB: 6,
  };
}
