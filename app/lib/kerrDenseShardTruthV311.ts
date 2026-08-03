export const KERR_DENSE_SHARD_TRUTH_VERSION_V311 = "v311-kerr-dense-shard-truth-audit-v1" as const;
export const KERR_DENSE_SHARD_TRUTH_AUDIT_SHA256_V311 = "b6a2e8b91b62e4b73a2e7f713c294388767b72763cda02358514958a66edd31a" as const;
export const KERR_DENSE_SHARD_TRUTH_FILE_SHA256_V311 = "ff10ab7cd521f4135e680db933e164ef9a6d6497928fa6fc547fc2ec56843fb7" as const;
export const KERR_DENSE_SHARD_STATE_SHA256_V311 = "2bb8fbd88f66c2064fb93152f13d73f879174ad53f2c409050f9876a49597fe2" as const;

export type KerrDenseShardTruthAuditV311 = Readonly<{
  version: typeof KERR_DENSE_SHARD_TRUTH_VERSION_V311;
  status: "failed-tolerance-ladder-degenerate";
  scope: "published-shard-0-read-only-audit-no-campaign-state-mutation";
  shard: Readonly<{
    index: 0;
    rayCount: 64;
    executionCount: 512;
    rayClassCounts: Readonly<{ capture: 26; escape: 34; "disk-hit": 4 }>;
  }>;
  campaign: Readonly<{
    stateSha256: typeof KERR_DENSE_SHARD_STATE_SHA256_V311;
    status: "incomplete-1-of-49";
    completedShardCount: 1;
    nextShardIndex: 1;
    campaignStateMutationApplied: false;
    nextShardAttempted: false;
    automaticRetryApplied: false;
  }>;
  structuralGates: Readonly<Record<string, true>>;
  crossRayNonDegeneracy: Readonly<{
    uniqueSpinCount: number;
    uniqueSelectedEventParameterCount: number;
    uniqueRedshiftCount: number;
    uniqueWalkerPenroseEvpaCount: number;
    uniqueGeometryFingerprintCount: number;
    passed: true;
  }>;
  toleranceLadder: Readonly<{
    expectedPairCount: 256;
    declaredToleranceByClass: Readonly<{ release: readonly [1e-10]; internal: readonly [1e-12] }>;
    solverToleranceByFormulaAndClass: Readonly<Record<string, Readonly<{ release: readonly [2.3e-14]; internal: readonly [2.3e-14] }>>>;
    strictSolverLadderPairCount: 0;
    geometryDistinctPairCount: 0;
    stepCountDistinctPairCount: 0;
    residualDistinctPairCount: 0;
    allPairsUseSameSolverTolerance: true;
    allGeometryPayloadsDuplicateAcrossTolerance: true;
    passed: false;
  }>;
  qualification: Readonly<{
    structuralShardStatus: "qualified";
    denseToleranceConvergenceStatus: "withdrawn";
    denseCampaignContinuation: "requires-corrected-authority-and-new-campaign-namespace";
    aggregateEligible: false;
    partialAggregateAccepted: false;
  }>;
  boundary: "negative-truth-evidence-preserves-v296-v297-and-v298r1-artifacts-no-retroactive-mutation";
  truthAuditSha256: typeof KERR_DENSE_SHARD_TRUTH_AUDIT_SHA256_V311;
}>;

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v311-${label}-invalid`);
  return value as UnknownRecord;
}

function exactSingleNumber(value: unknown, expected: number): boolean {
  return Array.isArray(value) && value.length === 1 && value[0] === expected;
}

export function parseKerrDenseShardTruthAuditV311(value: unknown): KerrDenseShardTruthAuditV311 {
  const source = record(value, "audit");
  const shard = record(source.shard, "shard");
  const rayClassCounts = record(shard.rayClassCounts, "class-counts");
  const campaign = record(source.campaign, "campaign");
  const structural = record(source.structuralGates, "structural-gates");
  const crossRay = record(source.crossRayNonDegeneracy, "cross-ray");
  const ladder = record(source.toleranceLadder, "tolerance-ladder");
  const declared = record(ladder.declaredToleranceByClass, "declared-tolerance");
  const solver = record(ladder.solverToleranceByFormulaAndClass, "solver-tolerance");
  const qualification = record(source.qualification, "qualification");
  if (source.version !== KERR_DENSE_SHARD_TRUTH_VERSION_V311
    || source.status !== "failed-tolerance-ladder-degenerate"
    || source.scope !== "published-shard-0-read-only-audit-no-campaign-state-mutation"
    || source.truthAuditSha256 !== KERR_DENSE_SHARD_TRUTH_AUDIT_SHA256_V311
    || source.boundary !== "negative-truth-evidence-preserves-v296-v297-and-v298r1-artifacts-no-retroactive-mutation") {
    throw new Error("v311-audit-identity-invalid");
  }
  if (shard.index !== 0 || shard.rayCount !== 64 || shard.executionCount !== 512
    || rayClassCounts.capture !== 26 || rayClassCounts.escape !== 34 || rayClassCounts["disk-hit"] !== 4) {
    throw new Error("v311-shard-conservation-invalid");
  }
  if (campaign.stateSha256 !== KERR_DENSE_SHARD_STATE_SHA256_V311
    || campaign.status !== "incomplete-1-of-49" || campaign.completedShardCount !== 1 || campaign.nextShardIndex !== 1
    || campaign.campaignStateMutationApplied !== false || campaign.nextShardAttempted !== false || campaign.automaticRetryApplied !== false) {
    throw new Error("v311-campaign-boundary-invalid");
  }
  if (Object.keys(structural).length < 7 || Object.values(structural).some((entry) => entry !== true)
    || crossRay.passed !== true
    || ![crossRay.uniqueSpinCount, crossRay.uniqueSelectedEventParameterCount, crossRay.uniqueRedshiftCount, crossRay.uniqueWalkerPenroseEvpaCount, crossRay.uniqueGeometryFingerprintCount]
      .every((entry) => Number.isSafeInteger(entry) && Number(entry) > 0)) {
    throw new Error("v311-structural-nondegeneracy-invalid");
  }
  if (ladder.expectedPairCount !== 256 || ladder.strictSolverLadderPairCount !== 0
    || ladder.geometryDistinctPairCount !== 0 || ladder.stepCountDistinctPairCount !== 0 || ladder.residualDistinctPairCount !== 0
    || ladder.allPairsUseSameSolverTolerance !== true || ladder.allGeometryPayloadsDuplicateAcrossTolerance !== true || ladder.passed !== false
    || !exactSingleNumber(declared.release, 1e-10) || !exactSingleNumber(declared.internal, 1e-12)) {
    throw new Error("v311-tolerance-ladder-result-invalid");
  }
  const expectedFormulas = [
    "carter-mino-dop853-constraint-stabilized-v296",
    "cartesian-kerr-schild-hamiltonian-dop853-v292",
  ];
  if (Object.keys(solver).sort().join("|") !== expectedFormulas.sort().join("|")
    || expectedFormulas.some((formula) => {
      const classes = record(solver[formula], `solver-${formula}`);
      return !exactSingleNumber(classes.release, 2.3e-14) || !exactSingleNumber(classes.internal, 2.3e-14);
    })) throw new Error("v311-effective-solver-tolerance-invalid");
  if (qualification.structuralShardStatus !== "qualified"
    || qualification.denseToleranceConvergenceStatus !== "withdrawn"
    || qualification.denseCampaignContinuation !== "requires-corrected-authority-and-new-campaign-namespace"
    || qualification.aggregateEligible !== false || qualification.partialAggregateAccepted !== false) {
    throw new Error("v311-qualification-boundary-invalid");
  }
  return source as unknown as KerrDenseShardTruthAuditV311;
}
