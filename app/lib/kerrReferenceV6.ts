/** Fail-closed v228 contract for dense, resumable dual-reference Kerr runs. */

export const KERR_REFERENCE_V6_VERSION =
  "v228-kerr-dense-sharded-cross-validation-v6" as const;

export type KerrRayClassV6 = "canonical" | "low-discrepancy" | "critical-bracket";
export type KerrReferenceSolverV6 = "carter-mino-dop853" | "kerr-schild-hamiltonian-dop853";
export type KerrToleranceTierV6 = "fine" | "finer";
export type KerrDeterministicRunV6 = "A" | "B";

export type KerrRayExecutionV6 = {
  solver: KerrReferenceSolverV6;
  tolerance: KerrToleranceTierV6;
  run: KerrDeterministicRunV6;
  status: "captured" | "escaped" | "disk-intersection" | "max-steps" | "invalid" | "watchdog-timeout";
  outputSha256: string;
  maxNullConstraint: number | null;
};

export type KerrRayShardManifestV6 = {
  version: typeof KERR_REFERENCE_V6_VERSION;
  shardId: string;
  shardIndex: number;
  shardSizeLimit: 64;
  rayCount: number;
  rayClassCounts: Readonly<Record<KerrRayClassV6, number>>;
  frozenScreenManifestSha256: string;
  codeSha256: string;
  environmentSha256: string;
  inputSha256: string;
  outputSha256: string;
  complete: boolean;
  watchdogSeconds: number;
  executionsPerRay: 8;
  rays: ReadonlyArray<{
    id: string;
    rayClass: KerrRayClassV6;
    executions: readonly KerrRayExecutionV6[];
  }>;
};

export type KerrDenseCrossValidationReportV6 = {
  version: typeof KERR_REFERENCE_V6_VERSION;
  frozenScreenManifestSha256: string;
  expected: {
    canonical: 25;
    lowDiscrepancy: 2048;
    criticalBracket: 1024;
  };
  executed: {
    canonical: number;
    lowDiscrepancy: number;
    criticalBracket: number;
  };
  shardCount: number;
  completeShardCount: number;
  partialResultsAggregated: false;
  deterministicRerunPassed: boolean;
  classificationAgreement: number | null;
  criticalCurveMaxErrorPx: number | null;
  maxNullConstraint: number | null;
  redshiftMaxRelativeError: number | null;
  evpaMaxErrorDeg: number | null;
  classificationGatePassed: boolean;
  criticalCurveGatePassed: boolean;
  nullConstraintGatePassed: boolean;
  redshiftGatePassed: boolean;
  evpaGatePassed: boolean;
  promotionDecision: "shadow-retained";
  boundary: "offline-dense-kerr-reference-not-grmhd-no-runtime-promotion";
};

const SHA256 = /^[a-f0-9]{64}$/;

export function validateKerrRayShardManifestV6(shard: KerrRayShardManifestV6) {
  const hashesValid = [
    shard.frozenScreenManifestSha256,
    shard.codeSha256,
    shard.environmentSha256,
    shard.inputSha256,
    shard.outputSha256,
  ].every((value) => SHA256.test(value));
  const executionsComplete = shard.rays.length === shard.rayCount && shard.rays.every((ray) => {
    const keys = new Set(ray.executions.map((execution) =>
      `${execution.solver}:${execution.tolerance}:${execution.run}`));
    return ray.executions.length === shard.executionsPerRay && keys.size === shard.executionsPerRay &&
      ray.executions.every((execution) => SHA256.test(execution.outputSha256) &&
        execution.status !== "invalid" && execution.status !== "watchdog-timeout");
  });
  const classCount = shard.rays.reduce<Record<KerrRayClassV6, number>>(
    (counts, ray) => ({ ...counts, [ray.rayClass]: counts[ray.rayClass] + 1 }),
    { canonical: 0, "low-discrepancy": 0, "critical-bracket": 0 },
  );
  const classCountsValid = Object.entries(classCount).every(
    ([key, value]) => shard.rayClassCounts[key as KerrRayClassV6] === value,
  );
  const sizeValid = shard.rayCount > 0 && shard.rayCount <= shard.shardSizeLimit;
  return {
    hashesValid,
    executionsComplete,
    classCountsValid,
    sizeValid,
    passed: shard.complete && hashesValid && executionsComplete && classCountsValid && sizeValid,
  };
}

export function validateKerrDenseCrossValidationReportV6(
  report: KerrDenseCrossValidationReportV6,
  shards: readonly KerrRayShardManifestV6[],
) {
  const shardValidationPassed = shards.length === report.shardCount &&
    shards.every((shard) => validateKerrRayShardManifestV6(shard).passed) &&
    new Set(shards.map((shard) => shard.shardId)).size === shards.length &&
    shards.every((shard) => shard.frozenScreenManifestSha256 === report.frozenScreenManifestSha256);
  const coverageComplete = report.executed.canonical === report.expected.canonical &&
    report.executed.lowDiscrepancy === report.expected.lowDiscrepancy &&
    report.executed.criticalBracket === report.expected.criticalBracket &&
    report.completeShardCount === report.shardCount &&
    report.partialResultsAggregated === false;
  const gatesRecomputed = coverageComplete && report.deterministicRerunPassed &&
    report.classificationAgreement !== null && report.classificationAgreement >= 0.999 &&
    report.criticalCurveMaxErrorPx !== null && report.criticalCurveMaxErrorPx < 0.5 &&
    report.maxNullConstraint !== null && report.maxNullConstraint < 1e-10 &&
    report.redshiftMaxRelativeError !== null && report.redshiftMaxRelativeError < 0.005 &&
    report.evpaMaxErrorDeg !== null && report.evpaMaxErrorDeg < 0.5;
  const declaredGatesMatch = report.classificationGatePassed === (
    coverageComplete && report.classificationAgreement !== null && report.classificationAgreement >= 0.999
  ) && report.criticalCurveGatePassed === (
    coverageComplete && report.criticalCurveMaxErrorPx !== null && report.criticalCurveMaxErrorPx < 0.5
  ) && report.nullConstraintGatePassed === (
    coverageComplete && report.maxNullConstraint !== null && report.maxNullConstraint < 1e-10
  ) && report.redshiftGatePassed === (
    coverageComplete && report.redshiftMaxRelativeError !== null && report.redshiftMaxRelativeError < 0.005
  ) && report.evpaGatePassed === (
    coverageComplete && report.evpaMaxErrorDeg !== null && report.evpaMaxErrorDeg < 0.5
  );
  return {
    shardValidationPassed,
    coverageComplete,
    declaredGatesMatch,
    passed: shardValidationPassed && declaredGatesMatch && gatesRecomputed,
  };
}
