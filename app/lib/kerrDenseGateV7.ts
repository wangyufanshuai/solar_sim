export const KERR_DENSE_GATE_V7_VERSION =
  "v242-kerr-dense-short-gate-v7" as const;

export type KerrDenseGateExecutionV7 = {
  solver: "carter-mino-dop853" | "kerr-schild-hamiltonian-dop853";
  tolerance: "fine" | "finer";
  run: "A" | "B";
  status: "captured" | "escaped" | "invalid" | "watchdog-timeout";
  maxNullConstraint: number | null;
  outputSha256: string;
};

export type KerrDenseGateManifestV7 = {
  version: typeof KERR_DENSE_GATE_V7_VERSION;
  profile: "gate-isolated-from-release-shards";
  gateInputSha256: string;
  selectedRayCount: 16;
  selectedRayIds: readonly string[];
  evaluation: {
    executionCount: 128;
    invalidCount: number;
    nonPhysicalCount: number;
    deterministicFailureCount: number;
    criticalTransitionCount: number;
    criticalTransitionExpected: 40;
    maxNullConstraint: number | null;
    radiativeEvidencePassed: boolean;
    gatePassed: boolean;
  };
  releaseShardCoverageContribution: 0;
  promotionDecision: "shadow-retained";
  canonicalEvidenceSha256: string;
};

