/**
 * v276 offline relativity reference contracts.
 *
 * This module is deliberately data-only.  It is not imported by the live
 * physics worker and cannot change the frozen `legacy-eih-1pn` runtime.  The
 * reference runner and validators use these contracts to keep target
 * identity, coordinate origin and force-model provenance explicit.
 */

export const RELATIVITY_REFERENCE_V276_VERSION =
  "v276-relativity-reference-kernel" as const;

export const RELATIVITY_REFERENCE_V276_BOUNDARY =
  "offline-shadow-reference-only-no-runtime-physics-promotion" as const;

export const RELATIVITY_REFERENCE_V276_CODE_SHA =
  "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8" as const;

export const RELATIVITY_REFERENCE_V276_SCREEN_SHA =
  "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037" as const;

export type RelativityReferenceKernelIdV276 =
  | "barycentric-nbody-eih-1pn-v276"
  | "barycentric-nbody-eih-1pn+solar-j2-v276"
  | "barycentric-nbody-eih-1pn+solar-monopole-2pn+solar-lt-v276";

export type RelativityReferenceTargetKindV276 =
  | "planetary-system-barycenter"
  | "body-center";

export type RelativityReferenceFrameV276 = "ICRF/J2000";
export type RelativityReferenceOriginV276 = "solar-system-barycenter" | "body-center";

export type RelativityReferenceBodyIdentityV276 = {
  id: string;
  label: string;
  naifTargetId: number;
  horizonsCommand: string;
  targetKind: RelativityReferenceTargetKindV276;
  frame: RelativityReferenceFrameV276;
  origin: RelativityReferenceOriginV276;
  tdbEpoch: string;
  units: {
    position: "m";
    velocity: "m/s";
    gravitationalParameter: "m^3/s^2";
  };
  gmSource: string;
  gmSI: number;
};

export type RelativityReferenceForceModelV276 = {
  kernelId: RelativityReferenceKernelIdV276;
  bodyCount: number;
  coordinateGauge: "harmonic-barycentric";
  primaryFrame: RelativityReferenceFrameV276;
  origin: "solar-system-barycenter";
  includesNewtonianNBody: true;
  includesEihOnePn: boolean;
  includesSolarJ2: boolean;
  includesSolarMonopole2Pn: boolean;
  includesSolarLenseThirring: boolean;
  claimsGrmhd: false;
};

export type RelativityUncertaintyBudgetV276 = {
  uDiscretization: number;
  uSolver: number;
  uReference: number;
  uInitialState: number;
  uFit: number;
  uConstants: number;
  uModel: number;
  unit: "m";
  aggregation: "linear-no-independence-proof";
  total: number;
};

export type RelativityMultiprecisionOracleV276 = {
  id: "mp-oracle-v276";
  backend: "python-decimal" | "mpmath";
  decimalDigits: 80;
  scope: readonly [
    "two-body"
    , "schwarzschild-analytic"
    , "kerr-critical-curve"
  ];
  status: "not-run" | "passed" | "failed";
  fixtureCount: number;
  outputSha256: string | null;
  lowMemoryMode: true;
  fullNBodyAuthority: false;
};

export type RelativityReferenceWindowV276 = {
  calibrationDays: readonly [0, 30];
  fitRuns: 3;
  blindHoldoutDays: readonly [365, 3652.5];
  checkpointSchema: "relativity-reference-checkpoint-v276";
};

export type RelativityReferenceArtifactV276 = {
  version: typeof RELATIVITY_REFERENCE_V276_VERSION;
  generatedAt: string;
  manifestSha256: string;
  manifest: RelativityReferenceKernelManifestV276;
  targets: readonly RelativityReferenceBodyIdentityV276[];
  forceModel: RelativityReferenceForceModelV276;
  window: RelativityReferenceWindowV276;
  uncertaintyBudget: RelativityUncertaintyBudgetV276;
  oracle: RelativityMultiprecisionOracleV276;
  provenance: {
    scienceCodeSha256: typeof RELATIVITY_REFERENCE_V276_CODE_SHA;
    screenSha256: typeof RELATIVITY_REFERENCE_V276_SCREEN_SHA;
    workerPhysicsMutation: "not-applied";
    eihOnePnMutation: "not-applied";
    kerrMutation: "not-applied";
  };
  boundary: typeof RELATIVITY_REFERENCE_V276_BOUNDARY;
};

export type RelativityReferenceKernelManifestV276 = {
  version: typeof RELATIVITY_REFERENCE_V276_VERSION;
  authority: "offline-cpu-reference";
  primarySolver: "scipy-dop853";
  independentSolver: "rebound-ias15";
  precision: "float64";
  stateDimension: 72;
  variationalParameterDimension: 66;
  integratedStateAndPhiDimension: 4824;
  targetIdentityRule: "target-kind-and-origin-must-match-before-comparison";
  models: readonly RelativityReferenceKernelIdV276[];
  canonicalShaExcludes: readonly ["generatedAt", "host", "pid", "absolutePath"];
};

export type RelativityReferenceValidationV276 = {
  version: typeof RELATIVITY_REFERENCE_V276_VERSION;
  identityValid: boolean;
  frameAndUnitsValid: boolean;
  forceModelValid: boolean;
  dimensionsValid: boolean;
  uncertaintyValid: boolean;
  oracleContractValid: boolean;
  provenanceFrozen: boolean;
  manifestShaValid: boolean;
  passed: boolean;
  failures: readonly string[];
};

const SHA256 = /^[a-f0-9]{64}$/;
const TDB_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

/** Stable JSON-compatible key ordering used by the v276 artifact builders. */
export function canonicalizeRelativityReferenceV276(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeRelativityReferenceV276);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalizeRelativityReferenceV276(entry)]),
    );
  }
  return value;
}

export function canonicalRelativityReferenceJsonV276(value: unknown): string {
  return JSON.stringify(canonicalizeRelativityReferenceV276(value));
}

/**
 * Removes host/transient fields before hashing an artifact.  `generatedAt`
 * is retained in the human-readable document but is intentionally absent
 * from canonical identity, so two deterministic reruns can be compared.
 */
export function canonicalRelativityReferenceShaPayloadV276(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalRelativityReferenceShaPayloadV276);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !["generatedAt", "host", "pid", "absolutePath"].includes(key))
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalRelativityReferenceShaPayloadV276(entry)]),
    );
  }
  return value;
}

export function canonicalRelativityReferenceShaJsonV276(value: unknown): string {
  return JSON.stringify(canonicalRelativityReferenceShaPayloadV276(value));
}

export function validateRelativityReferenceV276(
  artifact: RelativityReferenceArtifactV276,
  expectedManifestSha256?: string,
): RelativityReferenceValidationV276 {
  const failures: string[] = [];
  const manifest = artifact.manifest;
  const targetIdsUnique = new Set(artifact.targets.map((target) => target.id)).size === artifact.targets.length;
  const identityValid = targetIdsUnique && artifact.targets.length > 0 && artifact.targets.every((target) =>
    target.id.length > 0 && Number.isInteger(target.naifTargetId) && target.horizonsCommand.length > 0 &&
    TDB_ISO.test(target.tdbEpoch) && target.frame === "ICRF/J2000" &&
    target.units.position === "m" && target.units.velocity === "m/s" &&
    target.units.gravitationalParameter === "m^3/s^2" &&
    Number.isFinite(target.gmSI) && target.gmSI > 0 &&
    ((target.targetKind === "planetary-system-barycenter" && target.origin === "solar-system-barycenter") ||
      (target.targetKind === "body-center" && target.origin === "body-center")),
  );
  if (!identityValid) failures.push(targetIdsUnique ? "target-identity-or-units-invalid" : "target-identity-duplicate-id");

  const frameAndUnitsValid = manifest.primarySolver === "scipy-dop853" &&
    manifest.independentSolver === "rebound-ias15" && manifest.precision === "float64" &&
    manifest.targetIdentityRule === "target-kind-and-origin-must-match-before-comparison";
  if (!frameAndUnitsValid) failures.push("frame-origin-or-solver-contract-invalid");

  const forceModelValid = artifact.forceModel.bodyCount === 12 &&
    artifact.forceModel.coordinateGauge === "harmonic-barycentric" &&
    artifact.forceModel.primaryFrame === "ICRF/J2000" &&
    artifact.forceModel.origin === "solar-system-barycenter" &&
    artifact.forceModel.includesNewtonianNBody && artifact.forceModel.claimsGrmhd === false &&
    artifact.forceModel.kernelId === manifest.models[0] &&
    artifact.forceModel.includesEihOnePn === true &&
    ((artifact.forceModel.kernelId === "barycentric-nbody-eih-1pn-v276" &&
      !artifact.forceModel.includesSolarJ2 && !artifact.forceModel.includesSolarMonopole2Pn &&
      !artifact.forceModel.includesSolarLenseThirring) ||
      (artifact.forceModel.kernelId === "barycentric-nbody-eih-1pn+solar-j2-v276" &&
        artifact.forceModel.includesSolarJ2 && !artifact.forceModel.includesSolarMonopole2Pn &&
        !artifact.forceModel.includesSolarLenseThirring) ||
      (artifact.forceModel.kernelId === "barycentric-nbody-eih-1pn+solar-monopole-2pn+solar-lt-v276" &&
        !artifact.forceModel.includesSolarJ2 && artifact.forceModel.includesSolarMonopole2Pn &&
        artifact.forceModel.includesSolarLenseThirring));
  if (!forceModelValid) failures.push("force-model-contract-invalid");

  const dimensionsValid = manifest.stateDimension === 72 &&
    manifest.variationalParameterDimension === 66 && manifest.integratedStateAndPhiDimension === 4824;
  if (!dimensionsValid) failures.push("variational-dimensions-invalid");

  const budget = artifact.uncertaintyBudget;
  const uncertaintyValid = budget.aggregation === "linear-no-independence-proof" &&
    budget.unit === "m" && [budget.uDiscretization, budget.uSolver, budget.uReference,
      budget.uInitialState, budget.uFit, budget.uConstants, budget.uModel, budget.total]
      .every((value) => Number.isFinite(value) && value >= 0) &&
    Math.abs(budget.total - (
      budget.uDiscretization + budget.uSolver + budget.uReference + budget.uInitialState +
      budget.uFit + budget.uConstants + budget.uModel
    )) <= Math.max(1e-12, budget.total * 1e-12);
  if (!uncertaintyValid) failures.push("uncertainty-budget-invalid");

  const oracle = artifact.oracle;
  const oracleContractValid = oracle.id === "mp-oracle-v276" && oracle.decimalDigits === 80 &&
    oracle.lowMemoryMode === true && oracle.fullNBodyAuthority === false && oracle.fixtureCount >= 0 &&
    oracle.scope.length === 3 && (oracle.outputSha256 === null || SHA256.test(oracle.outputSha256));
  if (!oracleContractValid) failures.push("multiprecision-oracle-contract-invalid");

  const provenanceFrozen = artifact.provenance.scienceCodeSha256 === RELATIVITY_REFERENCE_V276_CODE_SHA &&
    artifact.provenance.screenSha256 === RELATIVITY_REFERENCE_V276_SCREEN_SHA &&
    artifact.provenance.workerPhysicsMutation === "not-applied" &&
    artifact.provenance.eihOnePnMutation === "not-applied" && artifact.provenance.kerrMutation === "not-applied" &&
    artifact.boundary === RELATIVITY_REFERENCE_V276_BOUNDARY;
  if (!provenanceFrozen) failures.push("protected-science-provenance-changed");

  const manifestShaValid = SHA256.test(artifact.manifestSha256) &&
    (!expectedManifestSha256 || artifact.manifestSha256 === expectedManifestSha256);
  if (!manifestShaValid) failures.push("manifest-sha-format-invalid");

  return {
    version: RELATIVITY_REFERENCE_V276_VERSION,
    identityValid,
    frameAndUnitsValid,
    forceModelValid,
    dimensionsValid,
    uncertaintyValid,
    oracleContractValid,
    provenanceFrozen,
    manifestShaValid,
    passed: failures.length === 0,
    failures,
  };
}

export function compareReferenceTargetIdentityV276(
  left: RelativityReferenceBodyIdentityV276,
  right: RelativityReferenceBodyIdentityV276,
): { comparable: boolean; reasons: readonly string[] } {
  const reasons: string[] = [];
  if (left.naifTargetId !== right.naifTargetId) reasons.push("naif-target-id-mismatch");
  if (left.targetKind !== right.targetKind) reasons.push("target-kind-mismatch");
  if (left.origin !== right.origin) reasons.push("origin-mismatch");
  if (left.frame !== right.frame) reasons.push("frame-mismatch");
  if (left.horizonsCommand !== right.horizonsCommand) reasons.push("horizons-command-mismatch");
  if (left.units.position !== right.units.position || left.units.velocity !== right.units.velocity) reasons.push("unit-mismatch");
  return { comparable: reasons.length === 0, reasons };
}
