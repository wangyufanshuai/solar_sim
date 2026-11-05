import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrPhotonEvidenceWorkbenchV480,
  parseKerrPhotonEvidenceWorkbenchArtifactV480,
} from "../app/lib/kerrPhotonEvidenceWorkbenchV480";
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
  KERR_SPECTRAL_SENSITIVITY_MODE_IDS_V483,
  KERR_SPECTRAL_SENSITIVITY_MODES_ARTIFACT_VERSION_V483,
  parseKerrSpectralSensitivityArtifactV483,
  type KerrSpectralSensitivityBasisModeV483,
  type KerrSpectralSensitivityProjectionV483,
  type KerrSpectralSensitivityRowV483,
} from "../app/lib/kerrSpectralSensitivityModesV483";

type Json = Record<string, unknown>;
const root = process.cwd();
const paths = Object.freeze({
  v482: "dist/science/kerr-spectral-landmark-covariance-v482/covariance.json",
  v481: "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json",
  v480: "dist/science/kerr-photon-evidence-workbench-v480/workbench.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-spectral-sensitivity-modes-v483/sensitivity-modes.json",
});
const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const digest = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
const fileSha = (path: string) => digest(readFileSync(resolve(root, path)));
const canonicalSha = (value: unknown) => digest(canonicalKerrSpectralSensitivityModesV483(value));
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;
const dot = (left: readonly number[], right: readonly number[]) =>
  left.reduce((sum, value, index) => sum + value * right[index], 0);
const norm = (value: readonly number[]) => Math.sqrt(dot(value, value));
const scaled = (value: readonly number[], factor: number) => value.map((entry) => entry * factor);
const subtract = (left: readonly number[], right: readonly number[]) =>
  left.map((value, index) => value - right[index]);
const unit = (value: readonly number[]) => {
  const length = norm(value);
  if (!(length > 0)) throw new Error("v483-zero-vector");
  return scaled(value, 1 / length);
};
const matrixVector = (matrix: readonly (readonly number[])[], vector: readonly number[]) =>
  matrix.map((row) => dot(row, vector));
const matrixQuadratic = (matrix: readonly (readonly number[])[], vector: readonly number[]) =>
  dot(vector, matrixVector(matrix, vector));
const relativeToScale = (actual: number, expected: number, scale: number) =>
  Math.abs(actual - expected) / Math.max(Math.abs(scale), Number.MIN_VALUE);
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const v482 = parseKerrSpectralLandmarkCovarianceArtifactV482(read(paths.v482));
const v481 = parseKerrSpectralLandmarkArtifactV481(read(paths.v481));
const v480 = parseKerrPhotonEvidenceWorkbenchArtifactV480(read(paths.v480));
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(String(formal.source));
const formalScience = nested(formalEvidence, "science");
const formalContracts = nested(formalEvidence, "contracts");

if (
  digest(canonicalKerrSpectralLandmarkCovarianceV482(v482)) !== v482.artifactSha256 ||
  digest(canonicalKerrSpectralLandmarkTransportV481(v481)) !== v481.artifactSha256 ||
  digest(canonicalKerrPhotonEvidenceWorkbenchV480(v480)) !== v480.artifactSha256 ||
  v482.rows.length !== 4 ||
  v482.audit.rankOneMatrixCount !== 4 ||
  v482.boundary.statisticalCovarianceAuthorityGranted !== false ||
  v481.rows.length !== 4 ||
  v480.boundary.scienceRasterAuthorityGranted !== false ||
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
  throw new Error("v483-upstream-boundary");
}

const emitterCoordinates = Object.freeze([...v482.rows[0].emitterCoordinates]);
if (v482.rows.some((row) => JSON.stringify(row.emitterCoordinates) !== JSON.stringify(emitterCoordinates))) {
  throw new Error("v483-emitter-basis-identity");
}
const basisVectors: number[][] = [unit(emitterCoordinates)];
for (let axis = 0; axis < 5 && basisVectors.length < 5; axis += 1) {
  let candidate: number[] = Array.from(
    { length: 5 },
    (_, index) => (index === axis ? 1 : 0),
  );
  for (const existing of basisVectors) {
    candidate = subtract(candidate, scaled(existing, dot(candidate, existing)));
  }
  if (norm(candidate) > 1e-12) basisVectors.push(unit(candidate));
}
if (basisVectors.length !== 5) throw new Error("v483-basis-rank");

const modes = Object.freeze(
  basisVectors.map((vector, index): KerrSpectralSensitivityBasisModeV483 =>
    Object.freeze({
      id: KERR_SPECTRAL_SENSITIVITY_MODE_IDS_V483[index],
      kind: index === 0 ? "common-scale-sensitive" : "common-scale-nullspace",
      vector: Object.freeze(vector),
      sensitivityDotEmitter: dot(vector, emitterCoordinates),
      expectedEigenvalueClass:
        index === 0 ? "principal" : "zero-under-common-scale-model",
    }),
  ),
);
let maximumOrthonormalityAbsoluteResidual = 0;
for (let left = 0; left < 5; left += 1) {
  for (let right = 0; right < 5; right += 1) {
    maximumOrthonormalityAbsoluteResidual = Math.max(
      maximumOrthonormalityAbsoluteResidual,
      Math.abs(dot(modes[left].vector, modes[right].vector) - (left === right ? 1 : 0)),
    );
  }
}
let maximumCompletenessAbsoluteResidual = 0;
for (let row = 0; row < 5; row += 1) {
  for (let column = 0; column < 5; column += 1) {
    const value = modes.reduce(
      (sum, mode) => sum + mode.vector[row] * mode.vector[column],
      0,
    );
    maximumCompletenessAbsoluteResidual = Math.max(
      maximumCompletenessAbsoluteResidual,
      Math.abs(value - (row === column ? 1 : 0)),
    );
  }
}
const maximumNullspaceEmitterDotAbsoluteResidual = Math.max(
  ...modes.slice(1).map((mode) => Math.abs(mode.sensitivityDotEmitter)),
);
const basis = Object.freeze({
  emitterCoordinates,
  modes,
  audit: Object.freeze({
    maximumOrthonormalityAbsoluteResidual,
    maximumCompletenessAbsoluteResidual,
    maximumNullspaceEmitterDotAbsoluteResidual,
    orthonormalityQualified: true as const,
    completenessQualified: true as const,
    nullspaceQualified: true as const,
  }),
});

const rows = Object.freeze(
  v482.rows.map((covarianceRow): KerrSpectralSensitivityRowV483 => {
    const landmarkRow = v481.rows.find((row) => row.rayId === covarianceRow.rayId);
    if (!landmarkRow || covarianceRow.sourceLandmarkRowSha256 !== landmarkRow.rowSha256) {
      throw new Error(`v483-source-row:${covarianceRow.rayId}`);
    }
    const coordinateVector = Object.freeze(
      landmarkRow.features.map((feature) => feature.observerCoordinate),
    );
    const principalScale = covarianceRow.audit.principalEigenvalueUpperBound;
    const projections = Object.freeze(
      modes.map((mode, index): KerrSpectralSensitivityProjectionV483 => {
        const projectedCoordinate = dot(mode.vector, coordinateVector);
        const analyticProjectedCoordinateOracle =
          landmarkRow.redshiftFactor * mode.sensitivityDotEmitter;
        const varianceUpperBoundDirectRaw = matrixQuadratic(
          covarianceRow.covarianceUpperBound,
          mode.vector,
        );
        if (varianceUpperBoundDirectRaw < -1e-40) {
          throw new Error(`v483-negative-quadratic:${covarianceRow.rayId}:${mode.id}`);
        }
        const directRoundoffClamped = varianceUpperBoundDirectRaw < 0;
        const varianceUpperBoundDirect = directRoundoffClamped
          ? 0
          : varianceUpperBoundDirectRaw;
        const varianceUpperBoundOuterProductOracle =
          covarianceRow.commonScaleUncertaintyUpperBound ** 2 * mode.sensitivityDotEmitter ** 2;
        return Object.freeze({
          modeId: mode.id,
          kind: mode.kind,
          projectedCoordinate,
          analyticProjectedCoordinateOracle,
          projectedCoordinateAbsoluteResidual: Math.abs(
            projectedCoordinate - analyticProjectedCoordinateOracle,
          ),
          varianceUpperBoundDirectRaw,
          varianceUpperBoundDirect,
          directRoundoffClamped,
          varianceUpperBoundOuterProductOracle,
          varianceOracleRelativeResidual: relativeToScale(
            varianceUpperBoundDirect,
            varianceUpperBoundOuterProductOracle,
            principalScale,
          ),
          standardDeviationUpperBoundDisplayOnly: Math.sqrt(varianceUpperBoundDirect),
          applicability:
            index === 0
              ? "common-scale-sensitive-coordinate-mode"
              : "nullspace-under-common-scale-only-not-measurement-exact",
        });
      }),
    );
    const nullspace = projections.slice(1);
    const negativeRoundoff = projections.filter((projection) => projection.directRoundoffClamped);
    const rowUnsigned = {
      rayId: covarianceRow.rayId,
      sourceCovarianceRowSha256: covarianceRow.rowSha256,
      redshiftFactor: landmarkRow.redshiftFactor,
      coordinateVector,
      projections,
      audit: {
        commonModeCount: 1 as const,
        nullspaceModeCount: 4 as const,
        maximumProjectionAbsoluteResidual: Math.max(
          ...projections.map((projection) => projection.projectedCoordinateAbsoluteResidual),
        ),
        maximumVarianceOracleRelativeResidual: Math.max(
          ...projections.map((projection) => projection.varianceOracleRelativeResidual),
        ),
        maximumNullspaceCoordinateAbsoluteResidual: Math.max(
          ...nullspace.map((projection) => Math.abs(projection.projectedCoordinate)),
        ),
        maximumNullspaceVarianceUpperBound: Math.max(
          ...nullspace.map((projection) => projection.varianceUpperBoundDirect),
        ),
        directRoundoffClampCount: negativeRoundoff.length,
        maximumNegativeRoundoffAbsoluteValue:
          negativeRoundoff.length === 0
            ? 0
            : Math.max(
                ...negativeRoundoff.map((projection) =>
                  Math.abs(projection.varianceUpperBoundDirectRaw),
                ),
              ),
        nullspaceZeroDoesNotMeanMeasurementExact: true as const,
      },
      unavailable: {
        detectorWeightVector: "unavailable" as const,
        physicalObservableCalibration: "unavailable" as const,
        independentNoiseModel: "unavailable" as const,
        statisticalLikelihood: "unavailable" as const,
      },
    };
    return Object.freeze({ ...rowUnsigned, rowSha256: canonicalSha(rowUnsigned) });
  }),
);

const max = (values: readonly number[]) => Math.max(...values);
const audit = {
  projectionCount: 20 as const,
  commonScaleProjectionCount: 4 as const,
  nullspaceProjectionCount: 16 as const,
  maximumProjectionAbsoluteResidual: max(
    rows.map((row) => row.audit.maximumProjectionAbsoluteResidual),
  ),
  maximumVarianceOracleRelativeResidual: max(
    rows.map((row) => row.audit.maximumVarianceOracleRelativeResidual),
  ),
  maximumNullspaceCoordinateAbsoluteResidual: max(
    rows.map((row) => row.audit.maximumNullspaceCoordinateAbsoluteResidual),
  ),
  maximumNullspaceVarianceUpperBound: max(
    rows.map((row) => row.audit.maximumNullspaceVarianceUpperBound),
  ),
  directRoundoffClampCount: rows.reduce(
    (sum, row) => sum + row.audit.directRoundoffClampCount,
    0,
  ),
  maximumNegativeRoundoffAbsoluteValue: max(
    rows.map((row) => row.audit.maximumNegativeRoundoffAbsoluteValue),
  ),
  commonScaleModeQualified: true as const,
  nullspaceModesQualified: true as const,
  directOuterProductAgreementQualified: true as const,
  statisticalLikelihoodQualified: false as const,
  detectorObservableRows: 0 as const,
  observedIntensityRows: 0 as const,
  sciencePixelRows: 0 as const,
  sensitivityMutationCount: 0 as const,
  scienceWritebackCount: 0 as const,
};
const maximumPrincipalScale = Math.max(
  ...v482.rows.map((row) => row.audit.principalEigenvalueUpperBound),
);
if (
  maximumOrthonormalityAbsoluteResidual > 1e-14 ||
  maximumCompletenessAbsoluteResidual > 1e-14 ||
  maximumNullspaceEmitterDotAbsoluteResidual > 1e-14 ||
  audit.maximumProjectionAbsoluteResidual > 1e-14 ||
  audit.maximumVarianceOracleRelativeResidual > 1e-14 ||
  audit.maximumNullspaceCoordinateAbsoluteResidual > 1e-14 ||
  audit.maximumNullspaceVarianceUpperBound > maximumPrincipalScale * 1e-14 ||
  audit.maximumNegativeRoundoffAbsoluteValue > 1e-40
) {
  throw new Error("v483-sensitivity-analytic-gate");
}

const unsigned = {
  version: KERR_SPECTRAL_SENSITIVITY_MODES_ARTIFACT_VERSION_V483,
  generatedAt: "2026-08-01T00:00:00Z",
  status: "spectral-sensitivity-modes-qualified-detector-observables-blocked-browser-pending" as const,
  source: {
    v482: fileSha(paths.v482),
    v481: fileSha(paths.v481),
    v480: fileSha(paths.v480),
    dense: fileSha(paths.dense),
    formal: fileSha(paths.formal),
  },
  sourceArtifactSha256: {
    v482: v482.artifactSha256,
    v481: v481.artifactSha256,
    v480: v480.artifactSha256,
  },
  contract: {
    rayCount: 4 as const,
    coordinateDimension: 5 as const,
    basisModeCount: 5 as const,
    commonScaleModeCount: 1 as const,
    nullspaceModeCount: 4 as const,
    projectionCount: 20 as const,
    commonScaleProjectionCount: 4 as const,
    nullspaceProjectionCount: 16 as const,
    orthonormalBasisRequired: true as const,
    completenessRequired: true as const,
    directMatrixProjectionRequired: true as const,
    outerProductOracleRequired: true as const,
    roundoffClampAbsoluteLimit: 1e-40 as const,
    nullspaceZeroDoesNotMeanMeasurementExact: true as const,
    deterministicUpperBoundOnly: true as const,
    detectorWeightsRequiredForPhysicalObservable: true as const,
    unavailableIsNotZero: true as const,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    localShadowOnly: true as const,
    formalProductPointer: "v263" as const,
  },
  basis,
  rows,
  payloadSha256: canonicalSha({ basis, rows }),
  presentation: {
    science: v482.presentation.science,
    cinematic: v482.presentation.cinematic,
    sharedSensitivityPayloadIdentity: true as const,
    scienceWritebackAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
  },
  audit,
  lifecycle: v482.lifecycle,
  boundary: {
    dimensionlessSensitivityModeAuthorityGranted: true as const,
    physicalDetectorObservableAuthorityGranted: false as const,
    statisticalLikelihoodAuthorityGranted: false as const,
    independentNoiseAuthorityGranted: false as const,
    physicalBandpassAuthorityGranted: false as const,
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
const artifact = parseKerrSpectralSensitivityArtifactV483({
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
      modes: 5,
      projections: 20,
      commonScaleProjections: 4,
      nullspaceProjections: 16,
      maximumOrthonormalityAbsoluteResidual:
        artifact.basis.audit.maximumOrthonormalityAbsoluteResidual,
      maximumCompletenessAbsoluteResidual:
        artifact.basis.audit.maximumCompletenessAbsoluteResidual,
      maximumProjectionAbsoluteResidual: artifact.audit.maximumProjectionAbsoluteResidual,
      maximumVarianceOracleRelativeResidual:
        artifact.audit.maximumVarianceOracleRelativeResidual,
      directRoundoffClampCount: artifact.audit.directRoundoffClampCount,
      detectorObservableRows: 0,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
