import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrSpectralLandmarkTransportV481,
  parseKerrSpectralLandmarkArtifactV481,
} from "../app/lib/kerrSpectralLandmarkTransportV481";
import {
  canonicalKerrSpectralLandmarkCovarianceV482,
  parseKerrSpectralLandmarkCovarianceArtifactV482,
} from "../app/lib/kerrSpectralLandmarkCovarianceV482";
import {
  canonicalKerrSpectralSensitivityModesV483,
  parseKerrSpectralSensitivityArtifactV483,
} from "../app/lib/kerrSpectralSensitivityModesV483";
import {
  canonicalKerrSpectralIdentifiabilityV484,
  KERR_SPECTRAL_IDENTIFIABILITY_ARTIFACT_VERSION_V484,
  parseKerrSpectralIdentifiabilityArtifactV484,
  type KerrSpectralIdentifiabilityRowV484,
} from "../app/lib/kerrSpectralIdentifiabilityV484";

type Json = Record<string, unknown>;
type Matrix = readonly (readonly number[])[];
const root = process.cwd();
const paths = Object.freeze({
  v483: "dist/science/kerr-spectral-sensitivity-modes-v483/sensitivity-modes.json",
  v482: "dist/science/kerr-spectral-landmark-covariance-v482/covariance.json",
  v481: "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-spectral-identifiability-v484/identifiability.json",
});
const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const digest = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
const fileSha = (path: string) => digest(readFileSync(resolve(root, path)));
const canonicalSha = (value: unknown) => digest(canonicalKerrSpectralIdentifiabilityV484(value));
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;
const matrix = (factory: (row: number, column: number) => number) =>
  Array.from({ length: 5 }, (_, row) =>
    Object.freeze(Array.from({ length: 5 }, (_, column) => factory(row, column))),
  );
const identity = matrix((row, column) => (row === column ? 1 : 0));
const multiply = (left: Matrix, right: Matrix) =>
  matrix((row, column) =>
    left[row].reduce((sum, value, index) => sum + value * right[index][column], 0),
  );
const add = (left: Matrix, right: Matrix) =>
  matrix((row, column) => left[row][column] + right[row][column]);
const subtract = (left: Matrix, right: Matrix) =>
  matrix((row, column) => left[row][column] - right[row][column]);
const transpose = (value: Matrix) => matrix((row, column) => value[column][row]);
const frobenius = (value: Matrix) =>
  Math.sqrt(value.reduce((sum, row) => sum + row.reduce((inner, entry) => inner + entry ** 2, 0), 0));
const maxAbs = (value: Matrix) => Math.max(...value.flatMap((row) => row.map((entry) => Math.abs(entry))));
const relativeMatrixResidual = (actual: Matrix, expected: Matrix) =>
  frobenius(subtract(actual, expected)) / Math.max(frobenius(expected), Number.MIN_VALUE);
const trace = (value: Matrix) => value.reduce((sum, row, index) => sum + row[index], 0);
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const v483 = parseKerrSpectralSensitivityArtifactV483(read(paths.v483));
const v482 = parseKerrSpectralLandmarkCovarianceArtifactV482(read(paths.v482));
const v481 = parseKerrSpectralLandmarkArtifactV481(read(paths.v481));
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(String(formal.source));
const formalScience = nested(formalEvidence, "science");
const formalContracts = nested(formalEvidence, "contracts");

if (
  digest(canonicalKerrSpectralSensitivityModesV483(v483)) !== v483.artifactSha256 ||
  digest(canonicalKerrSpectralLandmarkCovarianceV482(v482)) !== v482.artifactSha256 ||
  digest(canonicalKerrSpectralLandmarkTransportV481(v481)) !== v481.artifactSha256 ||
  v483.rows.length !== 4 ||
  v483.basis.modes.length !== 5 ||
  v483.boundary.statisticalLikelihoodAuthorityGranted !== false ||
  v482.rows.length !== 4 ||
  v482.audit.rankOneMatrixCount !== 4 ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalScience.defaultKernel !== "legacy-eih-1pn" ||
  formalContracts.singleCanvas !== true ||
  formalContracts.legacyRootAttributes !== 603 ||
  formalContracts.evidenceLedgerClaims !== 84
) {
  throw new Error("v484-upstream-boundary");
}

const commonMode = v483.basis.modes[0].vector;
const identifiableProjector = matrix(
  (row, column) => commonMode[row] * commonMode[column],
);
const unidentifiableProjector = subtract(identity, identifiableProjector);

const rows = Object.freeze(
  v482.rows.map((covarianceRow): KerrSpectralIdentifiabilityRowV484 => {
    const sensitivityRow = v483.rows.find((row) => row.rayId === covarianceRow.rayId);
    if (!sensitivityRow || sensitivityRow.sourceCovarianceRowSha256 !== covarianceRow.rowSha256) {
      throw new Error(`v484-source-row:${covarianceRow.rayId}`);
    }
    const covariance = covarianceRow.covarianceUpperBound;
    const eigenvalue = covarianceRow.audit.principalEigenvalueUpperBound;
    if (!(eigenvalue > 0)) throw new Error(`v484-zero-eigenvalue:${covarianceRow.rayId}`);
    const pseudoInverse = matrix(
      (row, column) => (commonMode[row] * commonMode[column]) / eigenvalue,
    );
    const covarianceTimesPseudo = multiply(covariance, pseudoInverse);
    const pseudoTimesCovariance = multiply(pseudoInverse, covariance);
    const rowUnsigned = {
      rayId: covarianceRow.rayId,
      sourceCovarianceRowSha256: covarianceRow.rowSha256,
      sourceSensitivityRowSha256: sensitivityRow.rowSha256,
      principalEigenvalueUpperBound: eigenvalue,
      pseudoDeterminantUpperBound: eigenvalue,
      determinant: 0 as const,
      fullConditionNumber: "infinite-singular" as const,
      nonzeroSpectrumConditionNumber: 1 as const,
      identifiableDimension: 1 as const,
      unidentifiableDimension: 4 as const,
      moorePenrosePseudoInverse: pseudoInverse,
      identifiableProjector,
      unidentifiableProjector,
      audit: {
        penroseCondition1RelativeResidual: relativeMatrixResidual(
          multiply(covarianceTimesPseudo, covariance),
          covariance,
        ),
        penroseCondition2RelativeResidual: relativeMatrixResidual(
          multiply(pseudoTimesCovariance, pseudoInverse),
          pseudoInverse,
        ),
        penroseCondition3AbsoluteResidual: maxAbs(
          subtract(covarianceTimesPseudo, transpose(covarianceTimesPseudo)),
        ),
        penroseCondition4AbsoluteResidual: maxAbs(
          subtract(pseudoTimesCovariance, transpose(pseudoTimesCovariance)),
        ),
        identifiableProjectorIdempotenceRelativeResidual: relativeMatrixResidual(
          multiply(identifiableProjector, identifiableProjector),
          identifiableProjector,
        ),
        unidentifiableProjectorIdempotenceRelativeResidual: relativeMatrixResidual(
          multiply(unidentifiableProjector, unidentifiableProjector),
          unidentifiableProjector,
        ),
        projectorComplementAbsoluteResidual: maxAbs(
          subtract(add(identifiableProjector, unidentifiableProjector), identity),
        ),
        projectorOrthogonalityAbsoluteResidual: maxAbs(
          multiply(identifiableProjector, unidentifiableProjector),
        ),
        identifiableProjectorTraceResidual: Math.abs(trace(identifiableProjector) - 1),
        unidentifiableProjectorTraceResidual: Math.abs(trace(unidentifiableProjector) - 4),
        algebraicPseudoInverseOnly: true as const,
        inverseNoiseCovarianceInterpretationAllowed: false as const,
      },
      unavailable: {
        inverseNoiseCovariance: "unavailable" as const,
        fisherInformation: "unavailable" as const,
        statisticalLikelihood: "unavailable" as const,
        detectorResponse: "unavailable" as const,
        parameterPosterior: "unavailable" as const,
      },
    };
    return Object.freeze({ ...rowUnsigned, rowSha256: canonicalSha(rowUnsigned) });
  }),
);

const max = (values: readonly number[]) => Math.max(...values);
const audit = {
  rayCount: 4 as const,
  identifiableDimensionCount: 4 as const,
  unidentifiableDimensionCount: 16 as const,
  penroseConditionAuditCount: 16 as const,
  singularMatrixCount: 4 as const,
  maximumPenroseRelativeResidual: max(
    rows.flatMap((row) => [
      row.audit.penroseCondition1RelativeResidual,
      row.audit.penroseCondition2RelativeResidual,
    ]),
  ),
  maximumPenroseSymmetryAbsoluteResidual: max(
    rows.flatMap((row) => [
      row.audit.penroseCondition3AbsoluteResidual,
      row.audit.penroseCondition4AbsoluteResidual,
    ]),
  ),
  maximumProjectorIdempotenceRelativeResidual: max(
    rows.flatMap((row) => [
      row.audit.identifiableProjectorIdempotenceRelativeResidual,
      row.audit.unidentifiableProjectorIdempotenceRelativeResidual,
    ]),
  ),
  maximumProjectorComplementAbsoluteResidual: max(
    rows.map((row) => row.audit.projectorComplementAbsoluteResidual),
  ),
  maximumProjectorOrthogonalityAbsoluteResidual: max(
    rows.map((row) => row.audit.projectorOrthogonalityAbsoluteResidual),
  ),
  maximumProjectorTraceResidual: max(
    rows.flatMap((row) => [
      row.audit.identifiableProjectorTraceResidual,
      row.audit.unidentifiableProjectorTraceResidual,
    ]),
  ),
  moorePenroseQualified: true as const,
  identifiableProjectorQualified: true as const,
  unidentifiableProjectorQualified: true as const,
  singularConditionQualified: true as const,
  fisherInformationQualified: false as const,
  likelihoodQualified: false as const,
  detectorObservableRows: 0 as const,
  sciencePixelRows: 0 as const,
  identifiabilityMutationCount: 0 as const,
  scienceWritebackCount: 0 as const,
};
if (
  audit.maximumPenroseRelativeResidual > 1e-12 ||
  audit.maximumPenroseSymmetryAbsoluteResidual > 1e-12 ||
  audit.maximumProjectorIdempotenceRelativeResidual > 1e-12 ||
  audit.maximumProjectorComplementAbsoluteResidual > 1e-12 ||
  audit.maximumProjectorOrthogonalityAbsoluteResidual > 1e-12 ||
  audit.maximumProjectorTraceResidual > 1e-12
) {
  throw new Error("v484-identifiability-analytic-gate");
}

const unsigned = {
  version: KERR_SPECTRAL_IDENTIFIABILITY_ARTIFACT_VERSION_V484,
  generatedAt: "2026-08-01T00:00:00Z",
  status: "algebraic-identifiability-qualified-fisher-likelihood-blocked-browser-pending" as const,
  source: {
    v483: fileSha(paths.v483),
    v482: fileSha(paths.v482),
    v481: fileSha(paths.v481),
    dense: fileSha(paths.dense),
    formal: fileSha(paths.formal),
  },
  sourceArtifactSha256: {
    v483: v483.artifactSha256,
    v482: v482.artifactSha256,
    v481: v481.artifactSha256,
  },
  contract: {
    rayCount: 4 as const,
    coordinateDimension: 5 as const,
    pseudoInverseMatrixCount: 4 as const,
    identifiableProjectorCount: 4 as const,
    unidentifiableProjectorCount: 4 as const,
    matrixElementCount: 300 as const,
    identifiableDimensionPerRay: 1 as const,
    unidentifiableDimensionPerRay: 4 as const,
    penroseConditionCountPerRay: 4 as const,
    penroseConditionAuditCount: 16 as const,
    moorePenroseRequired: true as const,
    projectorIdempotenceRequired: true as const,
    projectorComplementRequired: true as const,
    singularConditionNumberRequired: true as const,
    algebraicPseudoInverseOnly: true as const,
    inverseNoiseCovarianceAuthorityGranted: false as const,
    fisherInformationAuthorityGranted: false as const,
    likelihoodAuthorityGranted: false as const,
    unavailableIsNotZero: true as const,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    localShadowOnly: true as const,
    formalProductPointer: "v263" as const,
  },
  rows,
  payloadSha256: canonicalSha(rows),
  presentation: {
    science: v483.presentation.science,
    cinematic: v483.presentation.cinematic,
    sharedIdentifiabilityPayloadIdentity: true as const,
    scienceWritebackAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
  },
  audit,
  lifecycle: v483.lifecycle,
  boundary: {
    algebraicIdentifiabilityAuthorityGranted: true as const,
    algebraicPseudoInverseAuthorityGranted: true as const,
    inverseNoiseCovarianceAuthorityGranted: false as const,
    fisherInformationAuthorityGranted: false as const,
    statisticalLikelihoodAuthorityGranted: false as const,
    parameterPosteriorAuthorityGranted: false as const,
    physicalDetectorObservableAuthorityGranted: false as const,
    observedSpectrumAuthorityGranted: false as const,
    scienceRasterAuthorityGranted: false as const,
    presentationMayGrantScienceAuthority: false as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
    denseShardRunAllowed: false as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
    browserQualification: "not-run" as const,
    visualMatrixQualification: "not-run" as const,
    soakQualification: "not-run" as const,
    rtxWebGpuQualification: "not-run" as const,
  },
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
};
const artifact = parseKerrSpectralIdentifiabilityArtifactV484({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomic(paths.output, artifact);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      payloadSha256: artifact.payloadSha256,
      pseudoInverseMatrices: 4,
      identifiableDimensions: 4,
      unidentifiableDimensions: 16,
      penroseAudits: 16,
      maximumPenroseRelativeResidual: artifact.audit.maximumPenroseRelativeResidual,
      maximumPenroseSymmetryAbsoluteResidual:
        artifact.audit.maximumPenroseSymmetryAbsoluteResidual,
      maximumProjectorIdempotenceRelativeResidual:
        artifact.audit.maximumProjectorIdempotenceRelativeResidual,
      maximumProjectorComplementAbsoluteResidual:
        artifact.audit.maximumProjectorComplementAbsoluteResidual,
      maximumProjectorOrthogonalityAbsoluteResidual:
        artifact.audit.maximumProjectorOrthogonalityAbsoluteResidual,
      fisherInformationAuthority: false,
      likelihoodAuthority: false,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
