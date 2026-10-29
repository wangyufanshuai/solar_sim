import type { ObservationGeometryAuthorityDecisionV373 } from "./observationGeometryAuthorityAdmissionV373";
import type { ObservationGeometryValidationArtifactV373 } from "./observationGeometryAuthorityAdmissionV373";
import type {
  ObservationGeometryCandidateV372,
  ObservationGeometryCompiledArtifactV372,
} from "./observationGeometryValidationV372";

export const OBSERVATION_GEOMETRY_RUNTIME_PUBLICATION_VERSION_V374 =
  "v374-observation-geometry-runtime-publication-gate-v1" as const;

const SHA256 = /^[a-f0-9]{64}$/;
const RAW_KEYS = ["identity", "collectingArea", "plateScale", "provenance"] as const;

export type ObservationGeometryAdmissionArtifactV374 = Readonly<{
  version: "v373-observation-geometry-authority-envelope-v1";
  status: string;
  decision: ObservationGeometryAuthorityDecisionV373;
  candidateCanonicalSha256: string;
  validationArtifactCanonicalSha256: string;
  attemptConsumed: true;
  networkAttempted: false;
  automaticPromotionApplied: false;
  runtimeGeometryPublished: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  browserQualification: "not-run";
  artifactSha256: string;
}>;

export type ObservationGeometryAuthorityPointerV374 = Readonly<{
  version: "v373-observation-geometry-authority-pointer-v1";
  status: string;
  authorityGranted: boolean;
  admissionArtifactSha256: string;
  validationArtifactCanonicalSha256: string;
  validationArtifactFileSha256: string;
  candidateCanonicalSha256: string;
  candidateFileSha256: string;
  instrumentSerialOrCampaignId: string;
  localShadowOnly: true;
  runtimeGeometryPublicationAllowed: false;
  productPromotionAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  pointerSha256: string;
}>;

export type ObservationGeometryRuntimePublicationDecisionV374 = Readonly<{
  version: typeof OBSERVATION_GEOMETRY_RUNTIME_PUBLICATION_VERSION_V374;
  status:
    | "qualified-local-shadow-runtime-geometry-publication"
    | "blocked-authority-chain-not-qualified"
    | "blocked-publication-identity-mismatch";
  publicationAllowed: boolean;
  reasons: readonly string[];
  geometry: ObservationGeometryCandidateV372 | null;
  authorityPointerRequired: true;
  authorityPointerQualified: boolean;
  inputShaLocked: boolean;
  runtimePath: "dist/staging/detector-calibration-v369/observation-geometry.json";
  localShadowOnly: true;
  sciencePayloadMutationAllowed: false;
  cinematicMutationAllowed: false;
  productPromotionAllowed: false;
  formalProductPointer: "v263";
  denseCampaignStatus: "incomplete-0-of-49";
  boundary: "runtime-publication-revalidates-authority-admission-validation-candidate-compiler-and-raw-files";
}>;

export function evaluateObservationGeometryRuntimePublicationV374(args: Readonly<{
  authorityPointer: ObservationGeometryAuthorityPointerV374;
  admission: ObservationGeometryAdmissionArtifactV374;
  validation: ObservationGeometryValidationArtifactV373;
  compilation: ObservationGeometryCompiledArtifactV372;
  candidate: ObservationGeometryCandidateV372;
  identityInstrumentSerialOrCampaignId: string;
  actualFileSha256: Readonly<{
    authorityPointer: string;
    admission: string;
    validation: string;
    compilation: string;
    candidate: string;
    identity: string;
    collectingArea: string;
    plateScale: string;
    provenance: string;
  }>;
  authorityPointerCanonicalSha256: string;
  admissionCanonicalSha256: string;
  validationCanonicalSha256: string;
  candidateCanonicalSha256: string;
}>): ObservationGeometryRuntimePublicationDecisionV374 {
  if (
    ![
      ...Object.values(args.actualFileSha256),
      args.authorityPointerCanonicalSha256,
      args.admissionCanonicalSha256,
      args.validationCanonicalSha256,
      args.candidateCanonicalSha256,
    ].every((entry) => SHA256.test(entry))
  ) {
    throw new Error("v374-sha-format");
  }

  const reasons: string[] = [];
  const pointerQualified =
    args.authorityPointer.version ===
      "v373-observation-geometry-authority-pointer-v1" &&
    args.authorityPointer.status ===
      "qualified-measured-observation-geometry-authority-local-shadow-only" &&
    args.authorityPointer.authorityGranted === true &&
    args.authorityPointer.localShadowOnly === true &&
    args.authorityPointer.runtimeGeometryPublicationAllowed === false &&
    args.authorityPointer.productPromotionAllowed === false &&
    args.authorityPointer.formalProductPointer === "v263" &&
    args.authorityPointer.denseCampaignStatus === "incomplete-0-of-49" &&
    args.authorityPointerCanonicalSha256 === args.authorityPointer.pointerSha256;
  if (!pointerQualified) reasons.push("authority-pointer-not-qualified");

  if (
    args.admission.version !== "v373-observation-geometry-authority-envelope-v1" ||
    args.admission.status !==
      "qualified-measured-observation-geometry-authority-local-shadow-only" ||
    args.admission.decision.authorityGranted !== true ||
    args.admission.attemptConsumed !== true ||
    args.admission.networkAttempted !== false ||
    args.admission.automaticPromotionApplied !== false ||
    args.admission.runtimeGeometryPublished !== false ||
    args.admissionCanonicalSha256 !== args.admission.artifactSha256
  ) {
    reasons.push("admission-not-qualified");
  }
  if (
    args.validation.status !== "measured-geometry-validation-qualified" ||
    args.validation.passed !== true ||
    args.validation.measuredValidationQualified !== true ||
    args.validation.measuredAuthorityGranted !== false ||
    args.validation.runtimeGeometryPublished !== false ||
    args.validation.independentFromCompilerDerivations !== true ||
    args.validationCanonicalSha256 !== args.validation.artifactSha256
  ) {
    reasons.push("validation-not-qualified");
  }
  if (
    args.compilation.status !==
      "compiled-measured-geometry-candidate-awaiting-independent-validation" ||
    args.compilation.sourceKind !== "measured-import" ||
    args.compilation.candidatePublishable !== true ||
    args.compilation.runtimeGeometryPublished !== false ||
    args.compilation.measuredAuthorityGranted !== false
  ) {
    reasons.push("compiler-not-qualified");
  }

  if (
    args.candidateCanonicalSha256 !== args.candidate.provenance.artifactSha256 ||
    args.candidateCanonicalSha256 !==
      args.compilation.geometryCandidateArtifactSha256 ||
    args.candidateCanonicalSha256 !== args.admission.candidateCanonicalSha256 ||
    args.candidateCanonicalSha256 !==
      args.authorityPointer.candidateCanonicalSha256
  ) {
    reasons.push("candidate-canonical-sha-mismatch");
  }
  if (
    args.admissionCanonicalSha256 !==
      args.authorityPointer.admissionArtifactSha256 ||
    args.validationCanonicalSha256 !==
      args.admission.validationArtifactCanonicalSha256 ||
    args.validationCanonicalSha256 !==
      args.authorityPointer.validationArtifactCanonicalSha256 ||
    args.actualFileSha256.validation !==
      args.authorityPointer.validationArtifactFileSha256 ||
    args.actualFileSha256.candidate !== args.authorityPointer.candidateFileSha256
  ) {
    reasons.push("authority-artifact-sha-mismatch");
  }
  if (
    args.candidate.instrumentSerialOrCampaignId !==
      args.identityInstrumentSerialOrCampaignId ||
    args.candidate.instrumentSerialOrCampaignId !==
      args.authorityPointer.instrumentSerialOrCampaignId
  ) {
    reasons.push("instrument-identity-mismatch");
  }

  const rawShaLocked = RAW_KEYS.every(
    (key) =>
      args.validation.inputFileSha256[key] === args.actualFileSha256[key] &&
      args.admission.decision.identities[
        `${key}FileSha256` as keyof typeof args.admission.decision.identities
      ] === args.actualFileSha256[key],
  );
  const generatedShaLocked =
    args.validation.inputFileSha256.compilation ===
      args.actualFileSha256.compilation &&
    args.validation.inputFileSha256.candidate === args.actualFileSha256.candidate &&
    args.admission.decision.identities.compilationFileSha256 ===
      args.actualFileSha256.compilation &&
    args.admission.decision.identities.candidateFileSha256 ===
      args.actualFileSha256.candidate &&
    args.admission.decision.identities.validationArtifactFileSha256 ===
      args.actualFileSha256.validation;
  const inputShaLocked = rawShaLocked && generatedShaLocked;
  if (!inputShaLocked) reasons.push("publication-input-file-sha-mismatch");

  const uniqueReasons = Object.freeze([...new Set(reasons)]);
  const authorityFailure = uniqueReasons.some((reason) =>
    [
      "authority-pointer-not-qualified",
      "admission-not-qualified",
      "validation-not-qualified",
      "compiler-not-qualified",
    ].includes(reason),
  );
  const status: ObservationGeometryRuntimePublicationDecisionV374["status"] =
    uniqueReasons.length === 0
      ? "qualified-local-shadow-runtime-geometry-publication"
      : authorityFailure
        ? "blocked-authority-chain-not-qualified"
        : "blocked-publication-identity-mismatch";
  return Object.freeze({
    version: OBSERVATION_GEOMETRY_RUNTIME_PUBLICATION_VERSION_V374,
    status,
    publicationAllowed: status === "qualified-local-shadow-runtime-geometry-publication",
    reasons: uniqueReasons,
    geometry:
      status === "qualified-local-shadow-runtime-geometry-publication"
        ? args.candidate
        : null,
    authorityPointerRequired: true,
    authorityPointerQualified: pointerQualified,
    inputShaLocked,
    runtimePath:
      "dist/staging/detector-calibration-v369/observation-geometry.json",
    localShadowOnly: true,
    sciencePayloadMutationAllowed: false,
    cinematicMutationAllowed: false,
    productPromotionAllowed: false,
    formalProductPointer: "v263",
    denseCampaignStatus: "incomplete-0-of-49",
    boundary:
      "runtime-publication-revalidates-authority-admission-validation-candidate-compiler-and-raw-files",
  });
}
