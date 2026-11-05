export type RelativityReferenceBodyIdentityV282 = {
  id: string;
  naifTargetId: number;
  horizonsCommand: string;
  targetKind: "planetary-system-barycenter" | "body-center";
  frame: "ICRF/J2000";
  origin: "solar-system-barycenter";
  timeScale: "TDB";
};

export type RelativityReferenceCampaignStateV282 = {
  version: "v282-relativity-reference-checkpoint-v1";
  stage: "prepared" | "campaign-complete" | "blocked-target-identity-mismatch" | "failed-child-command";
  bodyCount: 12;
  stateDimension: 72;
  parameterDimension: 66;
  jointDimension: 4824;
  fitIterations: 3;
  calibrationDays: 30;
  holdoutDays: readonly [365, 3652.5];
  targetIdentityMatrix: readonly RelativityReferenceBodyIdentityV282[];
  automaticRetryApplied: false;
};

export type RelativityReferenceValidationResultV282 = {
  status: "passed" | "blocked-target-identity-mismatch" | "blocked-missing-provenance-ready-bundle";
  mismatches: readonly { id: string; expected?: string; actual?: string; reason: string }[];
};

export function validateRelativityReferenceIdentityV282(args: {
  expected: readonly RelativityReferenceBodyIdentityV282[];
  sourceQueries: Readonly<Record<string, string>>;
}): RelativityReferenceValidationResultV282 {
  const mismatches = args.expected.flatMap((row) => {
    const actual = args.sourceQueries[row.id];
    if (!actual) return [{ id: row.id, reason: "missing-source-query" }];
    if (actual !== row.horizonsCommand && actual !== row.horizonsCommand.replace(/^@/, "")) return [{ id: row.id, expected: row.horizonsCommand, actual, reason: "target-kind-or-command-mismatch" }];
    return [];
  });
  return { status: mismatches.length === 0 ? "passed" : "blocked-target-identity-mismatch", mismatches };
}
