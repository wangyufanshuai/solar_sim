import type {
  ObservationGeometryCandidateV372,
  ObservationGeometryCompiledArtifactV372,
  ObservationGeometryValidationResultV372,
} from "./observationGeometryValidationV372";

export const OBSERVATION_GEOMETRY_AUTHORITY_VERSION_V373 =
  "v373-observation-geometry-authority-admission-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const INPUT_KEYS = [
  "compilation",
  "candidate",
  "identity",
  "collectingArea",
  "plateScale",
  "provenance",
] as const;

export type ObservationGeometryValidationArtifactV373 =
  ObservationGeometryValidationResultV372 &
    Readonly<{
      inputFileSha256: Readonly<Record<(typeof INPUT_KEYS)[number], string>>;
      validationAttemptConsumed: true;
      networkAttempted: false;
      artifactSha256: string;
    }>;

export type ObservationGeometryAuthorityDecisionV373 = Readonly<{
  version: typeof OBSERVATION_GEOMETRY_AUTHORITY_VERSION_V373;
  status:
    | "qualified-measured-observation-geometry-authority-local-shadow-only"
    | "rejected-test-fixture-nonpublishable"
    | "blocked-validation-not-qualified"
    | "blocked-input-identity-mismatch";
  authorityGranted: boolean;
  reasons: readonly string[];
  compilerStatus: ObservationGeometryCompiledArtifactV372["status"];
  validationStatus: ObservationGeometryValidationResultV372["status"];
  identities: Readonly<{
    compilerCandidateCanonicalSha256: string;
    candidateCanonicalSha256: string;
    validationArtifactCanonicalSha256: string;
    validationArtifactFileSha256: string;
    compilationFileSha256: string;
    candidateFileSha256: string;
    identityFileSha256: string;
    collectingAreaFileSha256: string;
    plateScaleFileSha256: string;
    provenanceFileSha256: string;
  }>;
  authorityScope: "local-shadow-measured-observation-geometry-only";
  runtimeGeometryPublicationAllowed: false;
  sciencePayloadMutationAllowed: false;
  cinematicMutationAllowed: false;
  productPromotionAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  boundary: "authority-admission-does-not-publish-runtime-geometry-or-mutate-science-cinematic-product-state";
}>;

export function evaluateObservationGeometryAuthorityV373(args: Readonly<{
  compilation: ObservationGeometryCompiledArtifactV372;
  candidate: ObservationGeometryCandidateV372;
  validation: ObservationGeometryValidationArtifactV373;
  identityInstrumentSerialOrCampaignId: string;
  actualInputFileSha256: Readonly<Record<(typeof INPUT_KEYS)[number], string>>;
  candidateCanonicalSha256: string;
  validationArtifactCanonicalSha256: string;
  validationArtifactFileSha256: string;
  declaredTestFixture: boolean;
}>): ObservationGeometryAuthorityDecisionV373 {
  const identities = Object.freeze({
    compilerCandidateCanonicalSha256:
      args.compilation.geometryCandidateArtifactSha256,
    candidateCanonicalSha256: args.candidateCanonicalSha256,
    validationArtifactCanonicalSha256: args.validationArtifactCanonicalSha256,
    validationArtifactFileSha256: args.validationArtifactFileSha256,
    compilationFileSha256: args.actualInputFileSha256.compilation,
    candidateFileSha256: args.actualInputFileSha256.candidate,
    identityFileSha256: args.actualInputFileSha256.identity,
    collectingAreaFileSha256: args.actualInputFileSha256.collectingArea,
    plateScaleFileSha256: args.actualInputFileSha256.plateScale,
    provenanceFileSha256: args.actualInputFileSha256.provenance,
  });
  if (!Object.values(identities).every((entry) => SHA256.test(entry))) {
    throw new Error("v373-artifact-sha-format");
  }

  const reasons: string[] = [];
  const fixture =
    args.declaredTestFixture ||
    args.compilation.sourceKind === "test-fixture" ||
    args.compilation.status === "compiled-test-fixture-nonpublishable" ||
    args.validation.sourceKind === "test-fixture" ||
    args.validation.status === "qualified-test-fixture-only";
  if (fixture) reasons.push("test-fixture-nonpublishable");

  if (
    args.compilation.status !==
      "compiled-measured-geometry-candidate-awaiting-independent-validation" ||
    args.compilation.sourceKind !== "measured-import" ||
    args.compilation.candidatePublishable !== true ||
    args.compilation.runtimeGeometryPublished !== false ||
    args.compilation.measuredAuthorityGranted !== false ||
    args.compilation.independentScientificValidation !== "pending"
  ) {
    reasons.push("compiler-not-measured-pending-validation");
  }

  if (
    args.validation.status !== "measured-geometry-validation-qualified" ||
    args.validation.sourceKind !== "measured-import" ||
    args.validation.passed !== true ||
    args.validation.measuredValidationQualified !== true ||
    args.validation.measuredAuthorityGranted !== false ||
    args.validation.runtimeGeometryPublished !== false ||
    args.validation.independentFromCompilerDerivations !== true ||
    args.validation.sourceFileShaMatches !== true ||
    args.validation.candidateArtifactShaMatches !== true ||
    args.validation.instrumentIdentityMatches !== true ||
    args.validation.provenanceMatches !== true ||
    args.validation.validationAttemptConsumed !== true ||
    args.validation.networkAttempted !== false
  ) {
    reasons.push("independent-validation-not-qualified");
  }

  if (
    args.candidate.instrumentSerialOrCampaignId !==
      args.identityInstrumentSerialOrCampaignId
  ) {
    reasons.push("instrument-identity-mismatch");
  }
  if (
    args.candidateCanonicalSha256 !== args.candidate.provenance.artifactSha256 ||
    args.candidateCanonicalSha256 !==
      args.compilation.geometryCandidateArtifactSha256
  ) {
    reasons.push("candidate-canonical-sha-mismatch");
  }
  if (
    args.validationArtifactCanonicalSha256 !== args.validation.artifactSha256
  ) {
    reasons.push("validation-artifact-canonical-sha-mismatch");
  }
  if (
    INPUT_KEYS.some(
      (key) =>
        args.validation.inputFileSha256[key] !== args.actualInputFileSha256[key],
    )
  ) {
    reasons.push("validation-input-file-sha-mismatch");
  }

  const uniqueReasons = Object.freeze([...new Set(reasons)]);
  const status: ObservationGeometryAuthorityDecisionV373["status"] = fixture
    ? "rejected-test-fixture-nonpublishable"
    : uniqueReasons.includes("independent-validation-not-qualified")
      ? "blocked-validation-not-qualified"
      : uniqueReasons.length > 0
        ? "blocked-input-identity-mismatch"
        : "qualified-measured-observation-geometry-authority-local-shadow-only";
  return Object.freeze({
    version: OBSERVATION_GEOMETRY_AUTHORITY_VERSION_V373,
    status,
    authorityGranted:
      status ===
      "qualified-measured-observation-geometry-authority-local-shadow-only",
    reasons: uniqueReasons,
    compilerStatus: args.compilation.status,
    validationStatus: args.validation.status,
    identities,
    authorityScope: "local-shadow-measured-observation-geometry-only",
    runtimeGeometryPublicationAllowed: false,
    sciencePayloadMutationAllowed: false,
    cinematicMutationAllowed: false,
    productPromotionAllowed: false,
    formalProductPointer: "v263",
    denseCampaignStatus: "incomplete-0-of-49",
    boundary:
      "authority-admission-does-not-publish-runtime-geometry-or-mutate-science-cinematic-product-state",
  });
}
