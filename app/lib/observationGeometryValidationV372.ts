import { createHash } from "node:crypto";
import {
  OBSERVATION_GEOMETRY_VALIDATION_GATES_V372,
  OBSERVATION_GEOMETRY_VALIDATION_VERSION_V372,
} from "./observationGeometryValidationConstantsV372";

export {
  OBSERVATION_GEOMETRY_VALIDATION_GATES_V372,
  OBSERVATION_GEOMETRY_VALIDATION_VERSION_V372,
} from "./observationGeometryValidationConstantsV372";

type SourceKindV372 = "test-fixture" | "measured-import";

export type ObservationGeometryCompiledArtifactV372 = Readonly<{
  version: "v371-observation-geometry-measured-compiler-v1";
  status:
    | "compiled-test-fixture-nonpublishable"
    | "compiled-measured-geometry-candidate-awaiting-independent-validation";
  sourceKind: SourceKindV372;
  sourceFileSha256: Readonly<{
    identity: string;
    collectingArea: string;
    plateScale: string;
  }>;
  geometryCandidateArtifactSha256: string;
  candidatePublishable: boolean;
  runtimeGeometryPublished: false;
  measuredAuthorityGranted: false;
  independentScientificValidation: "pending";
}>;

export type ObservationGeometryCandidateV372 = Readonly<{
  version: "v369-measured-observation-geometry-v1";
  sourceKind: "measured-instrument-geometry";
  instrumentSerialOrCampaignId: string;
  collectingAreaM2: number;
  pixelSolidAngleSr: number;
  provenance: Readonly<{
    sourceUrl: string;
    licenseOrTerms: string;
    artifactSha256: string;
  }>;
}>;

export type ObservationGeometryValidationResultV372 = Readonly<{
  version: typeof OBSERVATION_GEOMETRY_VALIDATION_VERSION_V372;
  status:
    | "qualified-test-fixture-only"
    | "measured-geometry-validation-qualified"
    | "validation-failed";
  sourceKind: SourceKindV372;
  passed: boolean;
  gates: typeof OBSERVATION_GEOMETRY_VALIDATION_GATES_V372;
  metrics: Readonly<{
    collectingAreaM2: number;
    pixelScaleArcsecPerPixel: number;
    pixelSolidAngleSr: number;
    collectingAreaRepeatCoefficientOfVariation: number;
    pixelScaleRepeatCoefficientOfVariation: number;
    maximumStandardizedResidual: number;
    collectingAreaCandidateRelativeDifference: number;
    pixelSolidAngleCandidateRelativeDifference: number;
  }>;
  sourceFileShaMatches: boolean;
  candidateArtifactShaMatches: boolean;
  instrumentIdentityMatches: boolean;
  provenanceMatches: boolean;
  failures: readonly string[];
  measuredValidationQualified: boolean;
  measuredAuthorityGranted: false;
  runtimeGeometryPublished: false;
  independentFromCompilerDerivations: true;
  boundary: "independent-validation-does-not-publish-runtime-geometry-or-grant-authority";
}>;

const SHA256 = /^[a-f0-9]{64}$/;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const mean = (values: readonly number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;
const coefficientOfVariation = (values: readonly number[]) => {
  const average = mean(values);
  return (
    Math.sqrt(mean(values.map((value) => (value - average) ** 2))) /
    Math.max(1e-300, Math.abs(average))
  );
};
const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) / Math.max(1e-300, Math.abs(left), Math.abs(right));

function canonicalizeCandidate(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeCandidate);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "artifactSha256")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalizeCandidate(entry)]),
  );
}

export function createObservationGeometryCandidateShaV372(value: unknown): string {
  return sha(JSON.stringify(canonicalizeCandidate(value)));
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`v372-object:${label}`);
  }
  return value as Record<string, unknown>;
}

function parseJson(source: string, label: string): Record<string, unknown> {
  if (Buffer.byteLength(source, "utf8") > 128 * 1024 || source.includes("\0")) {
    throw new Error(`v372-json-size:${label}`);
  }
  return object(JSON.parse(source), label);
}

function parseCsv(source: string, header: readonly string[], label: string): string[][] {
  if (Buffer.byteLength(source, "utf8") > 2 * 1024 * 1024 || source.includes("\0")) {
    throw new Error(`v372-csv-size:${label}`);
  }
  const lines = source.replaceAll("\r\n", "\n").trimEnd().split("\n");
  if (lines[0]?.split(",").join("|") !== header.join("|")) {
    throw new Error(`v372-csv-header:${label}`);
  }
  return lines.slice(1).filter((line) => line.trim()).map((line) => {
    const fields = line.split(",");
    if (fields.length !== header.length) throw new Error(`v372-csv-columns:${label}`);
    return fields;
  });
}

function number(value: string, label: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`v372-number:${label}`);
  return parsed;
}

function validateCompilationBoundary(
  compilation: ObservationGeometryCompiledArtifactV372,
  sourceKind: SourceKindV372,
) {
  const expectedStatus =
    sourceKind === "measured-import"
      ? "compiled-measured-geometry-candidate-awaiting-independent-validation"
      : "compiled-test-fixture-nonpublishable";
  if (
    compilation.version !== "v371-observation-geometry-measured-compiler-v1" ||
    compilation.status !== expectedStatus ||
    compilation.sourceKind !== sourceKind ||
    compilation.candidatePublishable !== (sourceKind === "measured-import") ||
    compilation.runtimeGeometryPublished !== false ||
    compilation.measuredAuthorityGranted !== false ||
    compilation.independentScientificValidation !== "pending" ||
    !SHA256.test(compilation.geometryCandidateArtifactSha256) ||
    !Object.values(compilation.sourceFileSha256).every((entry) => SHA256.test(entry))
  ) {
    throw new Error("v372-compiler-boundary");
  }
}

export function validateObservationGeometryIndependentlyV372(args: Readonly<{
  compilation: ObservationGeometryCompiledArtifactV372;
  candidate: ObservationGeometryCandidateV372;
  identitySource: string;
  collectingAreaSource: string;
  plateScaleSource: string;
  provenanceSource: string;
  sourceKind: SourceKindV372;
}>): ObservationGeometryValidationResultV372 {
  validateCompilationBoundary(args.compilation, args.sourceKind);
  const identity = parseJson(args.identitySource, "identity");
  const attestation = object(identity.attestation, "attestation");
  const provenance = parseJson(args.provenanceSource, "provenance");
  if (
    identity.version !== "v371-observation-geometry-identity-v1" ||
    identity.measuredAcquisition !== true ||
    typeof identity.instrumentSerialOrCampaignId !== "string" ||
    identity.instrumentSerialOrCampaignId.trim().length < 3 ||
    !ISO_UTC.test(String(identity.measuredAtUtc ?? "")) ||
    attestation.statement !== "real-measured-observation-geometry-not-synthetic-or-example" ||
    !ISO_UTC.test(String(attestation.signedAtUtc ?? ""))
  ) {
    throw new Error("v372-identity");
  }
  if (
    provenance.version !== "v371-observation-geometry-provenance-v1" ||
    !/^https:\/\//.test(String(provenance.sourceUrl ?? "")) ||
    typeof provenance.licenseOrTerms !== "string" ||
    provenance.licenseOrTerms.trim().length < 3 ||
    ![
      provenance.identityFileSha256,
      provenance.collectingAreaFileSha256,
      provenance.plateScaleFileSha256,
      provenance.processingParametersSha256,
    ].every((entry) => typeof entry === "string" && SHA256.test(entry))
  ) {
    throw new Error("v372-provenance");
  }
  if (
    args.candidate.version !== "v369-measured-observation-geometry-v1" ||
    args.candidate.sourceKind !== "measured-instrument-geometry" ||
    !Number.isFinite(args.candidate.collectingAreaM2) ||
    !Number.isFinite(args.candidate.pixelSolidAngleSr) ||
    !SHA256.test(args.candidate.provenance.artifactSha256)
  ) {
    throw new Error("v372-candidate");
  }

  const areaRows = parseCsv(
    args.collectingAreaSource,
    [
      "measurementId",
      "repeatIndex",
      "illuminatedAreaM2",
      "obscuredAreaM2",
      "effectiveAreaUncertaintyM2",
      "rawArtifactSha256",
    ],
    "collecting-area",
  ).map((row) => ({
    measurementId: row[0],
    repeatIndex: number(row[1], "area-repeat"),
    illuminatedAreaM2: number(row[2], "illuminated-area"),
    obscuredAreaM2: number(row[3], "obscured-area"),
    uncertaintyM2: number(row[4], "area-uncertainty"),
    rawArtifactSha256: row[5],
  }));
  const scaleRows = parseCsv(
    args.plateScaleSource,
    [
      "measurementId",
      "repeatIndex",
      "referenceAngleArcsec",
      "measuredPixelSeparation",
      "pixelSeparationUncertainty",
      "rawArtifactSha256",
    ],
    "plate-scale",
  ).map((row) => ({
    measurementId: row[0],
    repeatIndex: number(row[1], "scale-repeat"),
    referenceAngleArcsec: number(row[2], "reference-angle"),
    measuredPixelSeparation: number(row[3], "pixel-separation"),
    pixelSeparationUncertainty: number(row[4], "pixel-uncertainty"),
    rawArtifactSha256: row[5],
  }));

  const validCommon = (rows: readonly Readonly<{
    measurementId: string;
    repeatIndex: number;
    rawArtifactSha256: string;
  }>[]) =>
    rows.length >= OBSERVATION_GEOMETRY_VALIDATION_GATES_V372.minimumRepeatCount &&
    new Set(rows.map((row) => row.measurementId)).size === rows.length &&
    new Set(rows.map((row) => row.repeatIndex)).size === rows.length &&
    rows.every(
      (row) =>
        row.measurementId.trim().length >= 3 &&
        Number.isInteger(row.repeatIndex) &&
        row.repeatIndex >= 1 &&
        SHA256.test(row.rawArtifactSha256),
    );
  if (!validCommon(areaRows) || !validCommon(scaleRows)) {
    throw new Error("v372-row-identity");
  }
  if (
    !areaRows.every(
      (row) =>
        row.illuminatedAreaM2 > row.obscuredAreaM2 &&
        row.obscuredAreaM2 >= 0 &&
        row.uncertaintyM2 > 0,
    ) ||
    !scaleRows.every(
      (row) =>
        row.referenceAngleArcsec > 0 &&
        row.measuredPixelSeparation > 0 &&
        row.pixelSeparationUncertainty > 0,
    )
  ) {
    throw new Error("v372-row-values");
  }

  const areas = areaRows.map((row) => row.illuminatedAreaM2 - row.obscuredAreaM2);
  const collectingAreaM2 = mean(areas);
  const scales = scaleRows.map(
    (row) => row.referenceAngleArcsec / row.measuredPixelSeparation,
  );
  const pixelScaleArcsecPerPixel = mean(scales);
  const pixelSolidAngleSr =
    (pixelScaleArcsecPerPixel * Math.PI / (180 * 3600)) ** 2;
  const collectingAreaCv = coefficientOfVariation(areas);
  const pixelScaleCv = coefficientOfVariation(scales);
  const areaResidual = Math.max(
    ...areaRows.map(
      (row, index) => Math.abs(areas[index] - collectingAreaM2) / row.uncertaintyM2,
    ),
  );
  const scaleResidual = Math.max(
    ...scaleRows.map(
      (row, index) =>
        Math.abs(scales[index] - pixelScaleArcsecPerPixel) /
        ((row.referenceAngleArcsec * row.pixelSeparationUncertainty) /
          row.measuredPixelSeparation ** 2),
    ),
  );
  const maximumStandardizedResidual = Math.max(areaResidual, scaleResidual);
  const collectingAreaDifference = relativeDifference(
    collectingAreaM2,
    args.candidate.collectingAreaM2,
  );
  const pixelSolidAngleDifference = relativeDifference(
    pixelSolidAngleSr,
    args.candidate.pixelSolidAngleSr,
  );

  const identitySha = sha(args.identitySource);
  const areaSha = sha(args.collectingAreaSource);
  const scaleSha = sha(args.plateScaleSource);
  const sourceFileShaMatches =
    args.compilation.sourceFileSha256.identity === identitySha &&
    args.compilation.sourceFileSha256.collectingArea === areaSha &&
    args.compilation.sourceFileSha256.plateScale === scaleSha &&
    provenance.identityFileSha256 === identitySha &&
    provenance.collectingAreaFileSha256 === areaSha &&
    provenance.plateScaleFileSha256 === scaleSha;
  const candidateArtifactSha = createObservationGeometryCandidateShaV372(args.candidate);
  const candidateArtifactShaMatches =
    candidateArtifactSha === args.candidate.provenance.artifactSha256 &&
    candidateArtifactSha === args.compilation.geometryCandidateArtifactSha256;
  const instrumentIdentityMatches =
    args.candidate.instrumentSerialOrCampaignId === identity.instrumentSerialOrCampaignId;
  const provenanceMatches =
    args.candidate.provenance.sourceUrl === provenance.sourceUrl &&
    args.candidate.provenance.licenseOrTerms === provenance.licenseOrTerms;

  const failures: string[] = [];
  if (!sourceFileShaMatches) failures.push("source-file-sha");
  if (!candidateArtifactShaMatches) failures.push("candidate-artifact-sha");
  if (!instrumentIdentityMatches) failures.push("instrument-identity");
  if (!provenanceMatches) failures.push("provenance");
  if (
    collectingAreaCv >
    OBSERVATION_GEOMETRY_VALIDATION_GATES_V372.maximumRepeatCoefficientOfVariation
  ) {
    failures.push("collecting-area-repeatability");
  }
  if (
    pixelScaleCv >
    OBSERVATION_GEOMETRY_VALIDATION_GATES_V372.maximumRepeatCoefficientOfVariation
  ) {
    failures.push("plate-scale-repeatability");
  }
  if (
    maximumStandardizedResidual >
    OBSERVATION_GEOMETRY_VALIDATION_GATES_V372.maximumStandardizedResidual
  ) {
    failures.push("standardized-residual");
  }
  if (
    Math.max(collectingAreaDifference, pixelSolidAngleDifference) >
    OBSERVATION_GEOMETRY_VALIDATION_GATES_V372
      .maximumCandidateReconstructionRelativeDifference
  ) {
    failures.push("candidate-reconstruction");
  }

  const passed = failures.length === 0;
  const measuredValidationQualified = passed && args.sourceKind === "measured-import";
  return Object.freeze({
    version: OBSERVATION_GEOMETRY_VALIDATION_VERSION_V372,
    status: passed
      ? measuredValidationQualified
        ? "measured-geometry-validation-qualified"
        : "qualified-test-fixture-only"
      : "validation-failed",
    sourceKind: args.sourceKind,
    passed,
    gates: OBSERVATION_GEOMETRY_VALIDATION_GATES_V372,
    metrics: Object.freeze({
      collectingAreaM2,
      pixelScaleArcsecPerPixel,
      pixelSolidAngleSr,
      collectingAreaRepeatCoefficientOfVariation: collectingAreaCv,
      pixelScaleRepeatCoefficientOfVariation: pixelScaleCv,
      maximumStandardizedResidual,
      collectingAreaCandidateRelativeDifference: collectingAreaDifference,
      pixelSolidAngleCandidateRelativeDifference: pixelSolidAngleDifference,
    }),
    sourceFileShaMatches,
    candidateArtifactShaMatches,
    instrumentIdentityMatches,
    provenanceMatches,
    failures: Object.freeze(failures),
    measuredValidationQualified,
    measuredAuthorityGranted: false,
    runtimeGeometryPublished: false,
    independentFromCompilerDerivations: true,
    boundary:
      "independent-validation-does-not-publish-runtime-geometry-or-grant-authority",
  });
}
