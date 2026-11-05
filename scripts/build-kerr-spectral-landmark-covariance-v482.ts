import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrFrequencyProvenanceViewerV479,
  parseKerrFrequencyProvenanceArtifactV479,
} from "../app/lib/kerrFrequencyProvenanceViewerV479";
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
  KERR_SPECTRAL_LANDMARK_COVARIANCE_ARTIFACT_VERSION_V482,
  parseKerrSpectralLandmarkCovarianceArtifactV482,
  type KerrSpectralLandmarkCovarianceRowV482,
} from "../app/lib/kerrSpectralLandmarkCovarianceV482";

type Json = Record<string, unknown>;
const root = process.cwd();
const paths = Object.freeze({
  v481: "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json",
  v480: "dist/science/kerr-photon-evidence-workbench-v480/workbench.json",
  v479: "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-spectral-landmark-covariance-v482/covariance.json",
});
const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const digest = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
const fileSha = (path: string) => digest(readFileSync(resolve(root, path)));
const canonicalSha = (value: unknown) => digest(canonicalKerrSpectralLandmarkCovarianceV482(value));
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;
const relativeResidual = (actual: number, expected: number) =>
  Math.abs(actual - expected) / Math.max(Math.abs(expected), Number.MIN_VALUE);
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = `${target}.${process.pid}.part`;
  writeFileSync(part, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  renameSync(part, target);
};

const v481 = parseKerrSpectralLandmarkArtifactV481(read(paths.v481));
const v480 = parseKerrPhotonEvidenceWorkbenchArtifactV480(read(paths.v480));
const v479 = parseKerrFrequencyProvenanceArtifactV479(read(paths.v479));
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(String(formal.source));
const formalScience = nested(formalEvidence, "science");
const formalContracts = nested(formalEvidence, "contracts");

if (
  digest(canonicalKerrSpectralLandmarkTransportV481(v481)) !== v481.artifactSha256 ||
  digest(canonicalKerrPhotonEvidenceWorkbenchV480(v480)) !== v480.artifactSha256 ||
  digest(canonicalKerrFrequencyProvenanceViewerV479(v479)) !== v479.artifactSha256 ||
  v481.rows.length !== 4 ||
  v481.audit.landmarkCount !== 20 ||
  v480.products.filter((product) => product.available).length !== 2 ||
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
  throw new Error("v482-upstream-boundary");
}

const rows = Object.freeze(
  v481.rows.map((sourceRow): KerrSpectralLandmarkCovarianceRowV482 => {
    const emitterCoordinates = sourceRow.features.map((feature) => feature.emitterCoordinate) as [
      number,
      number,
      number,
      number,
      number,
    ];
    const scaleEstimates = sourceRow.features.map(
      (feature) => feature.observerCoordinateUncertaintyUpperBound / feature.emitterCoordinate,
    );
    const commonScaleUncertaintyUpperBound = Math.max(...scaleEstimates);
    const scaleConsistencyMaxRelativeResidual = Math.max(
      ...scaleEstimates.map((estimate) =>
        relativeResidual(estimate, commonScaleUncertaintyUpperBound),
      ),
    );
    const covarianceUpperBound = emitterCoordinates.map((left) =>
      emitterCoordinates.map(
        (right) => left * right * commonScaleUncertaintyUpperBound ** 2,
      ),
    ) as [
      [number, number, number, number, number],
      [number, number, number, number, number],
      [number, number, number, number, number],
      [number, number, number, number, number],
      [number, number, number, number, number],
    ];
    const diagonalProjectionUpperBounds = covarianceUpperBound.map((row, index) => row[index]) as [
      number,
      number,
      number,
      number,
      number,
    ];
    for (let index = 0; index < 5; index += 1) {
      diagonalProjectionUpperBounds[index] = covarianceUpperBound[index][index];
    }
    const traceUpperBound = diagonalProjectionUpperBounds.reduce((sum, value) => sum + value, 0);
    const principalEigenvalueUpperBound =
      commonScaleUncertaintyUpperBound ** 2 *
      emitterCoordinates.reduce((sum, value) => sum + value ** 2, 0);
    const rowUnsigned = {
      rayId: sourceRow.rayId,
      sourceLandmarkRowSha256: sourceRow.rowSha256,
      emitterCoordinates,
      commonScaleUncertaintyUpperBound,
      scaleConsistencyMaxRelativeResidual,
      covarianceUpperBound,
      diagonalProjectionUpperBounds,
      audit: {
        symmetric: true as const,
        positiveSemidefiniteByOuterProduct: true as const,
        rankUpperBound: 1 as const,
        principalEigenvalueUpperBound,
        traceUpperBound,
        zeroEigenvalueCount: 4 as const,
        maximumDiagonalProjectionRelativeResidual: Math.max(
          ...sourceRow.features.map((feature, index) =>
            relativeResidual(
              diagonalProjectionUpperBounds[index],
              feature.observerCoordinateUncertaintyUpperBound ** 2,
            ),
          ),
        ),
        covarianceInterpretation: "deterministic-upper-bound-not-1sigma" as const,
        independentNoiseAssumed: false as const,
        correlationStructure: "fully-correlated-common-redshift-scale" as const,
      },
      unavailable: {
        statisticalCovarianceAuthority: "unavailable" as const,
        independentNoiseModel: "unavailable" as const,
        physicalLineIdentity: "unavailable" as const,
        detectorBandpass: "unavailable" as const,
        observedIntensity: "unavailable" as const,
      },
    };
    return Object.freeze({ ...rowUnsigned, rowSha256: canonicalSha(rowUnsigned) });
  }),
);

const max = (values: readonly number[]) => Math.max(...values);
const audit = {
  rayCount: 4 as const,
  covarianceMatrixCount: 4 as const,
  covarianceElementCount: 100 as const,
  rankOneMatrixCount: 4 as const,
  symmetricMatrixCount: 4 as const,
  positiveSemidefiniteMatrixCount: 4 as const,
  zeroEigenvalueCount: 16 as const,
  maximumScaleConsistencyRelativeResidual: max(
    rows.map((row) => row.scaleConsistencyMaxRelativeResidual),
  ),
  maximumDiagonalProjectionRelativeResidual: max(
    rows.map((row) => row.audit.maximumDiagonalProjectionRelativeResidual),
  ),
  maximumPrincipalEigenvalueTraceRelativeResidual: max(
    rows.map((row) =>
      relativeResidual(row.audit.principalEigenvalueUpperBound, row.audit.traceUpperBound),
    ),
  ),
  deterministicUpperBoundQualified: true as const,
  rankOneQualified: true as const,
  symmetryQualified: true as const,
  positiveSemidefiniteQualified: true as const,
  statisticalOneSigmaQualified: false as const,
  physicalLineRows: 0 as const,
  observedIntensityRows: 0 as const,
  sciencePixelRows: 0 as const,
  covarianceMutationCount: 0 as const,
  scienceWritebackCount: 0 as const,
};
if (
  audit.maximumScaleConsistencyRelativeResidual > 2e-15 ||
  audit.maximumDiagonalProjectionRelativeResidual > 2e-15 ||
  audit.maximumPrincipalEigenvalueTraceRelativeResidual > 2e-15
) {
  throw new Error("v482-covariance-analytic-gate");
}

const unsigned = {
  version: KERR_SPECTRAL_LANDMARK_COVARIANCE_ARTIFACT_VERSION_V482,
  generatedAt: "2026-07-30T00:00:00Z",
  status:
    "correlated-landmark-uncertainty-qualified-statistical-covariance-blocked-browser-pending" as const,
  source: {
    v481: fileSha(paths.v481),
    v480: fileSha(paths.v480),
    v479: fileSha(paths.v479),
    dense: fileSha(paths.dense),
    formal: fileSha(paths.formal),
  },
  sourceArtifactSha256: {
    v481: v481.artifactSha256,
    v480: v480.artifactSha256,
    v479: v479.artifactSha256,
  },
  contract: {
    rayCount: 4 as const,
    landmarkDimension: 5 as const,
    covarianceMatrixCount: 4 as const,
    covarianceElementCount: 100 as const,
    rankUpperBound: 1 as const,
    zeroEigenvalueCountPerMatrix: 4 as const,
    commonScaleParameterCount: 1 as const,
    deterministicUpperBoundOnly: true as const,
    independentNoiseAssumed: false as const,
    statisticalOneSigmaAuthorityGranted: false as const,
    physicalLineIdentityRequiredForLineClaims: true as const,
    physicalBandpassRequiredForObservedSpectrum: true as const,
    unavailableIsNotZero: true as const,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    localShadowOnly: true as const,
    formalProductPointer: "v263" as const,
  },
  rows,
  payloadSha256: canonicalSha(rows),
  presentation: {
    science: v481.presentation.science,
    cinematic: v481.presentation.cinematic,
    sharedCovariancePayloadIdentity: true as const,
    scienceWritebackAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
  },
  audit,
  lifecycle: v481.lifecycle,
  boundary: {
    correlatedUncertaintyUpperBoundAuthorityGranted: true as const,
    statisticalCovarianceAuthorityGranted: false as const,
    independentNoiseAuthorityGranted: false as const,
    physicalLineIdentityAuthorityGranted: false as const,
    absoluteFrequencyAuthorityGranted: false as const,
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
const artifact = parseKerrSpectralLandmarkCovarianceArtifactV482({
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
      rays: 4,
      covarianceMatrices: 4,
      covarianceElements: 100,
      rankOneMatrices: 4,
      zeroEigenvalues: 16,
      maximumScaleConsistencyRelativeResidual: artifact.audit.maximumScaleConsistencyRelativeResidual,
      maximumDiagonalProjectionRelativeResidual: artifact.audit.maximumDiagonalProjectionRelativeResidual,
      maximumPrincipalEigenvalueTraceRelativeResidual:
        artifact.audit.maximumPrincipalEigenvalueTraceRelativeResidual,
      statisticalOneSigmaAuthority: false,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
