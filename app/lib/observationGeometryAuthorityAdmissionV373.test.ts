import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  evaluateObservationGeometryAuthorityV373,
  type ObservationGeometryValidationArtifactV373,
} from "./observationGeometryAuthorityAdmissionV373";
import type {
  ObservationGeometryCandidateV372,
  ObservationGeometryCompiledArtifactV372,
} from "./observationGeometryValidationV372";
import { OBSERVATION_GEOMETRY_VALIDATION_GATES_V372 } from "./observationGeometryValidationV372";

const SHA = "a".repeat(64);
const FILES = {
  compilation: "b".repeat(64),
  candidate: "c".repeat(64),
  identity: "d".repeat(64),
  collectingArea: "e".repeat(64),
  plateScale: "f".repeat(64),
  provenance: "1".repeat(64),
} as const;
const compilation = {
  version: "v371-observation-geometry-measured-compiler-v1",
  status: "compiled-measured-geometry-candidate-awaiting-independent-validation",
  sourceKind: "measured-import",
  sourceFileSha256: {
    identity: FILES.identity,
    collectingArea: FILES.collectingArea,
    plateScale: FILES.plateScale,
  },
  geometryCandidateArtifactSha256: SHA,
  candidatePublishable: true,
  runtimeGeometryPublished: false,
  measuredAuthorityGranted: false,
  independentScientificValidation: "pending",
} as ObservationGeometryCompiledArtifactV372;
const candidate = {
  version: "v369-measured-observation-geometry-v1",
  sourceKind: "measured-instrument-geometry",
  instrumentSerialOrCampaignId: "campaign-001",
  collectingAreaM2: 0.8,
  pixelSolidAngleSr: 5.8e-12,
  provenance: {
    sourceUrl: "https://observatory.example/geometry",
    licenseOrTerms: "measured geometry terms",
    artifactSha256: SHA,
  },
} as ObservationGeometryCandidateV372;
const validation = {
  version: "v372-independent-observation-geometry-validation-v1",
  status: "measured-geometry-validation-qualified",
  sourceKind: "measured-import",
  passed: true,
  gates: OBSERVATION_GEOMETRY_VALIDATION_GATES_V372,
  metrics: {
    collectingAreaM2: 0.8,
    pixelScaleArcsecPerPixel: 0.5,
    pixelSolidAngleSr: 5.8e-12,
    collectingAreaRepeatCoefficientOfVariation: 1e-4,
    pixelScaleRepeatCoefficientOfVariation: 1e-4,
    maximumStandardizedResidual: 0.2,
    collectingAreaCandidateRelativeDifference: 0,
    pixelSolidAngleCandidateRelativeDifference: 0,
  },
  sourceFileShaMatches: true,
  candidateArtifactShaMatches: true,
  instrumentIdentityMatches: true,
  provenanceMatches: true,
  failures: [],
  measuredValidationQualified: true,
  measuredAuthorityGranted: false,
  runtimeGeometryPublished: false,
  independentFromCompilerDerivations: true,
  boundary:
    "independent-validation-does-not-publish-runtime-geometry-or-grant-authority",
  inputFileSha256: FILES,
  validationAttemptConsumed: true,
  networkAttempted: false,
  artifactSha256: "2".repeat(64),
} as ObservationGeometryValidationArtifactV373;

const evaluate = (
  overrides: Partial<Parameters<typeof evaluateObservationGeometryAuthorityV373>[0]> = {},
) =>
  evaluateObservationGeometryAuthorityV373({
    compilation,
    candidate,
    validation,
    identityInstrumentSerialOrCampaignId: "campaign-001",
    actualInputFileSha256: FILES,
    candidateCanonicalSha256: SHA,
    validationArtifactCanonicalSha256: validation.artifactSha256,
    validationArtifactFileSha256: "3".repeat(64),
    declaredTestFixture: false,
    ...overrides,
  });

describe("v373 observation geometry authority admission", () => {
  it("qualifies only an identity- and SHA-locked measured chain", () => {
    expect(evaluate()).toMatchObject({
      status: "qualified-measured-observation-geometry-authority-local-shadow-only",
      authorityGranted: true,
      reasons: [],
      runtimeGeometryPublicationAllowed: false,
      sciencePayloadMutationAllowed: false,
      cinematicMutationAllowed: false,
      productPromotionAllowed: false,
      formalProductPointer: "v263",
    });
  });

  it("rejects fixture provenance despite passing numerical fields", () => {
    expect(evaluate({ declaredTestFixture: true })).toMatchObject({
      status: "rejected-test-fixture-nonpublishable",
      authorityGranted: false,
      reasons: expect.arrayContaining(["test-fixture-nonpublishable"]),
    });
  });

  it("fails closed on validation, candidate and raw file identity drift", () => {
    expect(
      evaluate({
        validation: {
          ...validation,
          passed: false,
          measuredValidationQualified: false,
          status: "validation-failed",
        },
      }),
    ).toMatchObject({
      status: "blocked-validation-not-qualified",
      authorityGranted: false,
    });
    expect(evaluate({ candidateCanonicalSha256: "4".repeat(64) })).toMatchObject({
      status: "blocked-input-identity-mismatch",
      reasons: expect.arrayContaining(["candidate-canonical-sha-mismatch"]),
    });
    expect(
      evaluate({
        actualInputFileSha256: { ...FILES, plateScale: "5".repeat(64) },
      }),
    ).toMatchObject({
      status: "blocked-input-identity-mismatch",
      reasons: expect.arrayContaining(["validation-input-file-sha-mismatch"]),
    });
  });

  it("publishes only an authority pointer, never runtime geometry", () => {
    const source = readFileSync("scripts/admit-observation-geometry-v373.ts", "utf8");
    expect(source).toContain("if (decision.authorityGranted)");
    expect(source).toContain("orbit-atlas-observation-geometry-authority-v373.json");
    expect(source).toContain("runtimeGeometryPublicationAllowed: false");
    expect(source).not.toContain(
      "dist/staging/detector-calibration-v369/observation-geometry.json",
    );
    expect(source).not.toContain("fetch(");
  });
});
