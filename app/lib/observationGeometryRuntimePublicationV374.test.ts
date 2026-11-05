import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { ObservationGeometryAuthorityDecisionV373 } from "./observationGeometryAuthorityAdmissionV373";
import type { ObservationGeometryValidationArtifactV373 } from "./observationGeometryAuthorityAdmissionV373";
import {
  evaluateObservationGeometryRuntimePublicationV374,
  type ObservationGeometryAdmissionArtifactV374,
  type ObservationGeometryAuthorityPointerV374,
} from "./observationGeometryRuntimePublicationV374";
import type {
  ObservationGeometryCandidateV372,
  ObservationGeometryCompiledArtifactV372,
} from "./observationGeometryValidationV372";

const CANDIDATE = "a".repeat(64);
const VALIDATION = "b".repeat(64);
const ADMISSION = "c".repeat(64);
const POINTER = "d".repeat(64);
const files = {
  authorityPointer: "1".repeat(64),
  admission: "2".repeat(64),
  validation: "3".repeat(64),
  compilation: "4".repeat(64),
  candidate: "5".repeat(64),
  identity: "6".repeat(64),
  collectingArea: "7".repeat(64),
  plateScale: "8".repeat(64),
  provenance: "9".repeat(64),
} as const;
const candidate = {
  version: "v369-measured-observation-geometry-v1",
  sourceKind: "measured-instrument-geometry",
  instrumentSerialOrCampaignId: "campaign-001",
  collectingAreaM2: 0.8,
  pixelSolidAngleSr: 5.8e-12,
  provenance: {
    sourceUrl: "https://observatory.example/geometry",
    licenseOrTerms: "measured terms",
    artifactSha256: CANDIDATE,
  },
} as ObservationGeometryCandidateV372;
const compilation = {
  version: "v371-observation-geometry-measured-compiler-v1",
  status: "compiled-measured-geometry-candidate-awaiting-independent-validation",
  sourceKind: "measured-import",
  sourceFileSha256: {
    identity: files.identity,
    collectingArea: files.collectingArea,
    plateScale: files.plateScale,
  },
  geometryCandidateArtifactSha256: CANDIDATE,
  candidatePublishable: true,
  runtimeGeometryPublished: false,
  measuredAuthorityGranted: false,
  independentScientificValidation: "pending",
} as ObservationGeometryCompiledArtifactV372;
const validation = {
  version: "v372-independent-observation-geometry-validation-v1",
  status: "measured-geometry-validation-qualified",
  sourceKind: "measured-import",
  passed: true,
  measuredValidationQualified: true,
  measuredAuthorityGranted: false,
  runtimeGeometryPublished: false,
  independentFromCompilerDerivations: true,
  sourceFileShaMatches: true,
  candidateArtifactShaMatches: true,
  instrumentIdentityMatches: true,
  provenanceMatches: true,
  inputFileSha256: {
    compilation: files.compilation,
    candidate: files.candidate,
    identity: files.identity,
    collectingArea: files.collectingArea,
    plateScale: files.plateScale,
    provenance: files.provenance,
  },
  validationAttemptConsumed: true,
  networkAttempted: false,
  artifactSha256: VALIDATION,
} as unknown as ObservationGeometryValidationArtifactV373;
const authorityDecision = {
  version: "v373-observation-geometry-authority-admission-v1",
  status: "qualified-measured-observation-geometry-authority-local-shadow-only",
  authorityGranted: true,
  reasons: [],
  compilerStatus: compilation.status,
  validationStatus: validation.status,
  identities: {
    compilerCandidateCanonicalSha256: CANDIDATE,
    candidateCanonicalSha256: CANDIDATE,
    validationArtifactCanonicalSha256: VALIDATION,
    validationArtifactFileSha256: files.validation,
    compilationFileSha256: files.compilation,
    candidateFileSha256: files.candidate,
    identityFileSha256: files.identity,
    collectingAreaFileSha256: files.collectingArea,
    plateScaleFileSha256: files.plateScale,
    provenanceFileSha256: files.provenance,
  },
  authorityScope: "local-shadow-measured-observation-geometry-only",
  runtimeGeometryPublicationAllowed: false,
  sciencePayloadMutationAllowed: false,
  cinematicMutationAllowed: false,
  productPromotionAllowed: false,
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
  boundary:
    "authority-admission-does-not-publish-runtime-geometry-or-mutate-science-cinematic-product-state",
} as ObservationGeometryAuthorityDecisionV373;
const admission = {
  version: "v373-observation-geometry-authority-envelope-v1",
  status: authorityDecision.status,
  decision: authorityDecision,
  candidateCanonicalSha256: CANDIDATE,
  validationArtifactCanonicalSha256: VALIDATION,
  attemptConsumed: true,
  networkAttempted: false,
  automaticPromotionApplied: false,
  runtimeGeometryPublished: false,
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
  browserQualification: "not-run",
  artifactSha256: ADMISSION,
} as ObservationGeometryAdmissionArtifactV374;
const authorityPointer = {
  version: "v373-observation-geometry-authority-pointer-v1",
  status: authorityDecision.status,
  authorityGranted: true,
  admissionArtifactSha256: ADMISSION,
  validationArtifactCanonicalSha256: VALIDATION,
  validationArtifactFileSha256: files.validation,
  candidateCanonicalSha256: CANDIDATE,
  candidateFileSha256: files.candidate,
  instrumentSerialOrCampaignId: "campaign-001",
  localShadowOnly: true,
  runtimeGeometryPublicationAllowed: false,
  productPromotionAllowed: false,
  formalProductPointer: "v263",
  denseCampaignStatus: "incomplete-0-of-49",
  pointerSha256: POINTER,
} as ObservationGeometryAuthorityPointerV374;

const evaluate = (
  overrides: Partial<
    Parameters<typeof evaluateObservationGeometryRuntimePublicationV374>[0]
  > = {},
) =>
  evaluateObservationGeometryRuntimePublicationV374({
    authorityPointer,
    admission,
    validation,
    compilation,
    candidate,
    identityInstrumentSerialOrCampaignId: "campaign-001",
    actualFileSha256: files,
    authorityPointerCanonicalSha256: POINTER,
    admissionCanonicalSha256: ADMISSION,
    validationCanonicalSha256: VALIDATION,
    candidateCanonicalSha256: CANDIDATE,
    ...overrides,
  });

describe("v374 observation geometry runtime publication", () => {
  it("allows only a fully revalidated authority chain", () => {
    expect(evaluate()).toMatchObject({
      status: "qualified-local-shadow-runtime-geometry-publication",
      publicationAllowed: true,
      reasons: [],
      geometry: candidate,
      authorityPointerQualified: true,
      inputShaLocked: true,
      localShadowOnly: true,
      sciencePayloadMutationAllowed: false,
      cinematicMutationAllowed: false,
      productPromotionAllowed: false,
      formalProductPointer: "v263",
    });
  });

  it("fails closed on pointer or artifact identity drift", () => {
    expect(
      evaluate({
        authorityPointer: { ...authorityPointer, authorityGranted: false },
      }),
    ).toMatchObject({
      status: "blocked-authority-chain-not-qualified",
      publicationAllowed: false,
      geometry: null,
    });
    expect(evaluate({ candidateCanonicalSha256: "e".repeat(64) })).toMatchObject({
      status: "blocked-publication-identity-mismatch",
      publicationAllowed: false,
      reasons: expect.arrayContaining(["candidate-canonical-sha-mismatch"]),
    });
    expect(
      evaluate({
        actualFileSha256: { ...files, collectingArea: "f".repeat(64) },
      }),
    ).toMatchObject({
      status: "blocked-publication-identity-mismatch",
      publicationAllowed: false,
      reasons: expect.arrayContaining(["publication-input-file-sha-mismatch"]),
    });
  });

  it("uses the v369 path only from the explicit v374 publisher", () => {
    const source = readFileSync("scripts/publish-observation-geometry-v374.ts", "utf8");
    expect(source).toContain("if (!decision.publicationAllowed || !decision.geometry)");
    expect(source).toContain(
      "dist/staging/detector-calibration-v369/observation-geometry.json",
    );
    expect(source).toContain("v374-refuse-overwrite-existing-runtime-geometry");
    expect(source).not.toContain("fetch(");
  });
});
