import type { DetectorCalibrationCompilationResultV365 } from "./detectorCalibrationCompilerV365";
import type { DetectorCalibrationValidationResultV366 } from "./detectorCalibrationValidationV366";

export const DETECTOR_CALIBRATION_AUTHORITY_VERSION_V367 = "v367-detector-calibration-authority-admission-v1" as const;
const SHA256 = /^[a-f0-9]{64}$/;

export type DetectorCalibrationConditioningInputV367 = Readonly<{
  version: "v367-measured-jacobian-covariance-v1";
  sourceKind: "measured";
  instrumentSerialOrCampaignId: string;
  manifestCanonicalSha256: string;
  jacobian: readonly (readonly number[])[];
  observationVariance: readonly number[];
  provenance: Readonly<{
    sourceUrl: string;
    licenseOrTerms: string;
    artifactSha256: string;
  }>;
}>;

export type DetectorCalibrationAuthorityDecisionV367 = Readonly<{
  version: typeof DETECTOR_CALIBRATION_AUTHORITY_VERSION_V367;
  status:
    | "qualified-measured-authority-local-shadow-only"
    | "rejected-test-fixture-nonpublishable"
    | "blocked-validation-not-qualified"
    | "blocked-input-identity-mismatch";
  authorityGranted: boolean;
  reasons: readonly string[];
  compilerStatus: DetectorCalibrationCompilationResultV365["status"];
  validationStatus: DetectorCalibrationValidationResultV366["status"];
  identities: Readonly<{
    compilerManifestCanonicalSha256: string;
    validationManifestCanonicalSha256: string;
    conditioningManifestCanonicalSha256: string;
    compiledArtifactSha256: string;
    validationArtifactSha256: string;
    measuredManifestFileSha256: string;
    conditioningFileSha256: string;
  }>;
  authorityScope: "local-shadow-measured-detector-response-only";
  sciencePayloadMutationAllowed: false;
  cinematicMutationAllowed: false;
  productPromotionAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  boundary: "admission-decision-never-mutates-manifest-science-cinematic-or-product-state";
}>;

function isFiniteMatrix(matrix: readonly (readonly number[])[]): boolean {
  return matrix.length >= 7
    && matrix.every((row) => row.length === 7 && row.every(Number.isFinite));
}

export function parseDetectorCalibrationConditioningInputV367(value: unknown): DetectorCalibrationConditioningInputV367 {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? value as Partial<DetectorCalibrationConditioningInputV367>
    : null;
  const provenance = source?.provenance;
  if (!source
    || source.version !== "v367-measured-jacobian-covariance-v1"
    || source.sourceKind !== "measured"
    || typeof source.instrumentSerialOrCampaignId !== "string"
    || source.instrumentSerialOrCampaignId.trim().length < 3
    || !SHA256.test(source.manifestCanonicalSha256 ?? "")
    || !Array.isArray(source.jacobian)
    || !isFiniteMatrix(source.jacobian)
    || !Array.isArray(source.observationVariance)
    || source.observationVariance.length !== source.jacobian.length
    || !source.observationVariance.every((entry) => Number.isFinite(entry) && entry > 0)
    || !provenance
    || !/^https:\/\//.test(provenance.sourceUrl ?? "")
    || typeof provenance.licenseOrTerms !== "string"
    || provenance.licenseOrTerms.trim().length < 3
    || !SHA256.test(provenance.artifactSha256 ?? "")) {
    throw new Error("v367-conditioning-input-identity");
  }
  return value as DetectorCalibrationConditioningInputV367;
}

export function evaluateDetectorCalibrationAuthorityV367(args: Readonly<{
  compilation: DetectorCalibrationCompilationResultV365;
  validation: DetectorCalibrationValidationResultV366;
  validationManifestCanonicalSha256: string;
  conditioning: DetectorCalibrationConditioningInputV367;
  compiledArtifactSha256: string;
  validationArtifactSha256: string;
  measuredManifestFileSha256: string;
  conditioningFileSha256: string;
  declaredTestFixture: boolean;
}>): DetectorCalibrationAuthorityDecisionV367 {
  const identities = Object.freeze({
    compilerManifestCanonicalSha256: args.compilation.manifestCanonicalSha256,
    validationManifestCanonicalSha256: args.validationManifestCanonicalSha256,
    conditioningManifestCanonicalSha256: args.conditioning.manifestCanonicalSha256,
    compiledArtifactSha256: args.compiledArtifactSha256,
    validationArtifactSha256: args.validationArtifactSha256,
    measuredManifestFileSha256: args.measuredManifestFileSha256,
    conditioningFileSha256: args.conditioningFileSha256,
  });
  if (!Object.values(identities).every((entry) => SHA256.test(entry))) throw new Error("v367-artifact-sha-format");

  const reasons: string[] = [];
  const fixture = args.declaredTestFixture
    || args.compilation.sourceKind === "test-fixture"
    || args.compilation.status === "compiled-test-fixture-nonpublishable"
    || args.validation.sourceKind === "test-fixture"
    || args.validation.status === "qualified-test-fixture-only";
  if (fixture) reasons.push("test-fixture-nonpublishable");

  if (args.compilation.status !== "compiled-measured-manifest-awaiting-independent-validation"
    || args.compilation.sourceKind !== "measured-import"
    || args.compilation.manifestPublishable !== true
    || args.compilation.measuredAuthorityGranted !== false
    || args.compilation.independentScientificValidation !== "pending") reasons.push("compiler-not-measured-pending-validation");

  if (args.validation.status !== "measured-validation-qualified"
    || args.validation.sourceKind !== "measured-import"
    || args.validation.passed !== true
    || args.validation.measuredValidationQualified !== true
    || args.validation.measuredAuthorityGranted !== false
    || args.validation.independentFromCompilerDerivations !== true) reasons.push("independent-validation-not-qualified");

  if (args.compilation.manifest.instrument.serialOrCampaignId !== args.conditioning.instrumentSerialOrCampaignId) reasons.push("instrument-identity-mismatch");
  if (new Set([
    args.compilation.manifestCanonicalSha256,
    args.validationManifestCanonicalSha256,
    args.conditioning.manifestCanonicalSha256,
  ]).size !== 1) reasons.push("manifest-canonical-sha-mismatch");

  const uniqueReasons = Object.freeze([...new Set(reasons)]);
  const status: DetectorCalibrationAuthorityDecisionV367["status"] = fixture
    ? "rejected-test-fixture-nonpublishable"
    : uniqueReasons.includes("independent-validation-not-qualified")
      ? "blocked-validation-not-qualified"
      : uniqueReasons.length > 0
        ? "blocked-input-identity-mismatch"
        : "qualified-measured-authority-local-shadow-only";
  return Object.freeze({
    version: DETECTOR_CALIBRATION_AUTHORITY_VERSION_V367,
    status,
    authorityGranted: status === "qualified-measured-authority-local-shadow-only",
    reasons: uniqueReasons,
    compilerStatus: args.compilation.status,
    validationStatus: args.validation.status,
    identities,
    authorityScope: "local-shadow-measured-detector-response-only",
    sciencePayloadMutationAllowed: false,
    cinematicMutationAllowed: false,
    productPromotionAllowed: false,
    formalProductPointer: "v263",
    denseCampaignStatus: "incomplete-0-of-49",
    boundary: "admission-decision-never-mutates-manifest-science-cinematic-or-product-state",
  });
}
