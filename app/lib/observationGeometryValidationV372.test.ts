import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  compileObservationGeometryV371,
  parseObservationGeometryCollectingAreaCsvV371,
  parseObservationGeometryIdentityV371,
  parseObservationGeometryPlateScaleCsvV371,
  parseObservationGeometryProvenanceV371,
} from "./observationGeometryCompilerV371";
import {
  createObservationGeometryCandidateShaV372,
  validateObservationGeometryIndependentlyV372,
  type ObservationGeometryCandidateV372,
  type ObservationGeometryCompiledArtifactV372,
} from "./observationGeometryValidationV372";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");

function fixture(sourceKind: "test-fixture" | "measured-import") {
  const identityDocument = {
    version: "v371-observation-geometry-identity-v1",
    measuredAcquisition: true,
    instrumentSerialOrCampaignId: "geometry-campaign-001",
    observatoryOrLaboratory: "Traceable Observatory",
    measuredAtUtc: "2026-07-29T00:00:00Z",
    attestation: {
      statement: "real-measured-observation-geometry-not-synthetic-or-example",
      operatorOrArchive: "fixture-operator",
      signedAtUtc: "2026-07-29T00:00:01Z",
    },
  } as const;
  const identitySource = JSON.stringify(identityDocument);
  const collectingAreaSource = `measurementId,repeatIndex,illuminatedAreaM2,obscuredAreaM2,effectiveAreaUncertaintyM2,rawArtifactSha256\n${[
    0,
    1,
    -1,
  ]
    .map(
      (offset, index) =>
        `area-${index + 1},${index + 1},${1 + offset * 1e-4},0.2,0.0005,${sha(`area-${index}`)}`,
    )
    .join("\n")}\n`;
  const plateScaleSource = `measurementId,repeatIndex,referenceAngleArcsec,measuredPixelSeparation,pixelSeparationUncertainty,rawArtifactSha256\n${[
    0,
    1,
    -1,
  ]
    .map(
      (offset, index) =>
        `scale-${index + 1},${index + 1},10,${20 + offset * 1e-3},0.01,${sha(`scale-${index}`)}`,
    )
    .join("\n")}\n`;
  const provenanceDocument = {
    version: "v371-observation-geometry-provenance-v1",
    sourceUrl: "https://observatory.example/geometry",
    licenseOrTerms: "fixture terms",
    identityFileSha256: sha(identitySource),
    collectingAreaFileSha256: sha(collectingAreaSource),
    plateScaleFileSha256: sha(plateScaleSource),
    processingParametersSha256: "a".repeat(64),
  } as const;
  const provenanceSource = JSON.stringify(provenanceDocument);
  const compilation = compileObservationGeometryV371({
    identity: parseObservationGeometryIdentityV371(identityDocument),
    provenance: parseObservationGeometryProvenanceV371(provenanceDocument),
    collectingAreaRows: parseObservationGeometryCollectingAreaCsvV371(collectingAreaSource),
    plateScaleRows: parseObservationGeometryPlateScaleCsvV371(plateScaleSource),
    sourceKind,
    sourceFileSha256: {
      identity: sha(identitySource),
      collectingArea: sha(collectingAreaSource),
      plateScale: sha(plateScaleSource),
    },
  });
  const candidateWithoutSha = {
    ...compilation.geometryDraft,
    provenance: { ...compilation.geometryDraft.provenance },
  };
  const artifactSha256 = createObservationGeometryCandidateShaV372(candidateWithoutSha);
  const candidate = {
    ...candidateWithoutSha,
    provenance: { ...candidateWithoutSha.provenance, artifactSha256 },
  } as ObservationGeometryCandidateV372;
  const compiled = {
    ...compilation,
    geometryCandidateArtifactSha256: artifactSha256,
  } as ObservationGeometryCompiledArtifactV372;
  return {
    compilation: compiled,
    candidate,
    identitySource,
    collectingAreaSource,
    plateScaleSource,
    provenanceSource,
    sourceKind,
  } as const;
}

describe("v372 independent observation geometry validation", () => {
  it("recomputes a fixture without granting measured authority", () => {
    const result = validateObservationGeometryIndependentlyV372(fixture("test-fixture"));
    expect(result).toMatchObject({
      status: "qualified-test-fixture-only",
      passed: true,
      sourceFileShaMatches: true,
      candidateArtifactShaMatches: true,
      instrumentIdentityMatches: true,
      provenanceMatches: true,
      measuredValidationQualified: false,
      measuredAuthorityGranted: false,
      runtimeGeometryPublished: false,
      independentFromCompilerDerivations: true,
      failures: [],
    });
    expect(result.metrics.collectingAreaCandidateRelativeDifference).toBeLessThan(1e-12);
    expect(result.metrics.pixelSolidAngleCandidateRelativeDifference).toBeLessThan(1e-12);
  });

  it("can qualify measured validation while still refusing authority", () => {
    const result = validateObservationGeometryIndependentlyV372(fixture("measured-import"));
    expect(result).toMatchObject({
      status: "measured-geometry-validation-qualified",
      passed: true,
      measuredValidationQualified: true,
      measuredAuthorityGranted: false,
      runtimeGeometryPublished: false,
    });
  });

  it("detects a self-consistently re-signed but scientifically drifted candidate", () => {
    const input = fixture("test-fixture");
    const driftedWithoutSha = {
      ...input.candidate,
      collectingAreaM2: input.candidate.collectingAreaM2 * 1.01,
      provenance: {
        sourceUrl: input.candidate.provenance.sourceUrl,
        licenseOrTerms: input.candidate.provenance.licenseOrTerms,
      },
    };
    const artifactSha256 = createObservationGeometryCandidateShaV372(driftedWithoutSha);
    const candidate = {
      ...driftedWithoutSha,
      provenance: { ...driftedWithoutSha.provenance, artifactSha256 },
    } as ObservationGeometryCandidateV372;
    const result = validateObservationGeometryIndependentlyV372({
      ...input,
      candidate,
      compilation: {
        ...input.compilation,
        geometryCandidateArtifactSha256: artifactSha256,
      },
    });
    expect(result).toMatchObject({
      status: "validation-failed",
      passed: false,
      candidateArtifactShaMatches: true,
      failures: expect.arrayContaining(["candidate-reconstruction"]),
      measuredAuthorityGranted: false,
    });
  });

  it("rejects compiler/source-kind mismatch before scientific validation", () => {
    const input = fixture("test-fixture");
    expect(() =>
      validateObservationGeometryIndependentlyV372({
        ...input,
        sourceKind: "measured-import",
      }),
    ).toThrow("v372-compiler-boundary");
  });
});
