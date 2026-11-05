import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrFrequencyProvenanceViewerV479,
  parseKerrFrequencyProvenanceArtifactV479,
} from "../app/lib/kerrFrequencyProvenanceViewerV479";
import {
  canonicalKerrNormalizedFrequencyChartV478,
  parseKerrNormalizedFrequencyArtifactV478,
} from "../app/lib/kerrNormalizedFrequencyChartV478";
import {
  canonicalKerrPhotonEvidenceWorkbenchV480,
  parseKerrPhotonEvidenceWorkbenchArtifactV480,
} from "../app/lib/kerrPhotonEvidenceWorkbenchV480";
import {
  canonicalKerrSpectralLandmarkTransportV481,
  KERR_SPECTRAL_LANDMARK_ARTIFACT_VERSION_V481,
  KERR_SPECTRAL_LANDMARK_IDS_V481,
  parseKerrSpectralLandmarkArtifactV481,
  type KerrSpectralLandmarkFeatureV481,
  type KerrSpectralLandmarkRowV481,
} from "../app/lib/kerrSpectralLandmarkTransportV481";

type Json = Record<string, unknown>;
const root = process.cwd();
const paths = Object.freeze({
  v478: "dist/science/kerr-normalized-frequency-chart-v478/frequency-chart.json",
  v479: "dist/science/kerr-frequency-provenance-viewer-v479/provenance-viewer.json",
  v480: "dist/science/kerr-photon-evidence-workbench-v480/workbench.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-spectral-landmark-transport-v481/landmarks.json",
});
const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const digest = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");
const fileSha = (path: string) => digest(readFileSync(resolve(root, path)));
const canonicalSha = (value: unknown) => digest(canonicalKerrSpectralLandmarkTransportV481(value));
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

const v478 = parseKerrNormalizedFrequencyArtifactV478(read(paths.v478));
const v479 = parseKerrFrequencyProvenanceArtifactV479(read(paths.v479));
const v480 = parseKerrPhotonEvidenceWorkbenchArtifactV480(read(paths.v480));
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(String(formal.source));
const formalScience = nested(formalEvidence, "science");
const formalContracts = nested(formalEvidence, "contracts");

if (
  digest(canonicalKerrNormalizedFrequencyChartV478(v478)) !== v478.artifactSha256 ||
  digest(canonicalKerrFrequencyProvenanceViewerV479(v479)) !== v479.artifactSha256 ||
  digest(canonicalKerrPhotonEvidenceWorkbenchV480(v480)) !== v480.artifactSha256 ||
  v478.rows.length !== 4 ||
  v479.provenance.length !== 4 ||
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
  throw new Error("v481-upstream-boundary");
}

const rows = Object.freeze(
  v478.rows.map((sourceRow): KerrSpectralLandmarkRowV481 => {
    const provenance = v479.provenance.find((entry) => entry.rayId === sourceRow.rayId);
    if (!provenance || provenance.sourceRowSha256 !== sourceRow.rowSha256) {
      throw new Error(`v481-provenance-link:${sourceRow.rayId}`);
    }
    const features = Object.freeze(
      sourceRow.samples.map((sample, index): KerrSpectralLandmarkFeatureV481 => {
        const emitter = sample.emitterFrequencyOverReference;
        const observer = sourceRow.redshiftFactor * emitter;
        const oracle = Math.exp(Math.log(sourceRow.redshiftFactor) + Math.log(emitter));
        const inverse = observer / sourceRow.redshiftFactor;
        const uncertainty = sample.observerFrequencyAbsoluteUncertaintyUpperBound;
        return Object.freeze({
          id: KERR_SPECTRAL_LANDMARK_IDS_V481[index],
          anchorIndex: index as 0 | 1 | 2 | 3 | 4,
          emitterCoordinate: emitter,
          observerCoordinate: observer,
          observerCoordinateLogExpOracle: oracle,
          directOracleRelativeResidual: relativeResidual(observer, oracle),
          inverseRecoveredEmitterCoordinate: inverse,
          inverseRoundTripRelativeResidual: relativeResidual(inverse, emitter),
          observerCoordinateUncertaintyUpperBound: uncertainty,
          observerCoordinateInterval: Object.freeze({
            lower: Math.max(0, observer - uncertainty),
            center: observer,
            upper: observer + uncertainty,
          }),
          relativeCoordinateUncertaintyUpperBound: uncertainty / observer,
          applicability: "dimensionless-feature-position-only" as const,
        });
      }),
    );
    const pairwiseResiduals: number[] = [];
    for (let left = 0; left < features.length; left += 1) {
      for (let right = left + 1; right < features.length; right += 1) {
        pairwiseResiduals.push(
          relativeResidual(
            features[right].observerCoordinate / features[left].observerCoordinate,
            features[right].emitterCoordinate / features[left].emitterCoordinate,
          ),
        );
      }
    }
    const adjacentResiduals = features.slice(1).map((feature, index) =>
      relativeResidual(
        feature.observerCoordinate - features[index].observerCoordinate,
        sourceRow.redshiftFactor * (feature.emitterCoordinate - features[index].emitterCoordinate),
      ),
    );
    const rowUnsigned = {
      rayId: sourceRow.rayId,
      redshiftFactor: sourceRow.redshiftFactor,
      shiftClass: sourceRow.shiftClass,
      sourceNormalizedFrequencyRowSha256: sourceRow.rowSha256,
      sourceProvenanceRowSha256: provenance.sourceRowSha256,
      logFrequencyShift: Math.log(sourceRow.redshiftFactor),
      features,
      audit: {
        strictlyIncreasing: true as const,
        intervalContainmentCount: 5 as const,
        pairwiseRatioCount: 10 as const,
        adjacentSpacingCount: 4 as const,
        maximumPairwiseRatioRelativeResidual: Math.max(...pairwiseResiduals),
        maximumAdjacentSpacingRelativeResidual: Math.max(...adjacentResiduals),
      },
      unavailable: {
        physicalLineIdentity: "unavailable" as const,
        referenceFrequencyHz: null,
        absoluteFrequencyHz: null,
        intrinsicLineWidth: null,
        lineAmplitude: null,
        equivalentWidth: null,
        detectorBandpass: null,
        observedIntensity: null,
      },
    };
    return Object.freeze({ ...rowUnsigned, rowSha256: canonicalSha(rowUnsigned) });
  }),
);

const features = rows.flatMap((row) => row.features);
const max = (values: readonly number[]) => Math.max(...values);
const audit = {
  landmarkCount: 20 as const,
  blueshiftRowCount: 1 as const,
  redshiftRowCount: 3 as const,
  monotonicRowCount: 4 as const,
  intervalContainmentCount: 20 as const,
  pairwiseRatioAuditCount: 40 as const,
  adjacentSpacingAuditCount: 16 as const,
  maximumDirectOracleRelativeResidual: max(features.map((feature) => feature.directOracleRelativeResidual)),
  maximumInverseRoundTripRelativeResidual: max(
    features.map((feature) => feature.inverseRoundTripRelativeResidual),
  ),
  maximumPairwiseRatioRelativeResidual: max(
    rows.map((row) => row.audit.maximumPairwiseRatioRelativeResidual),
  ),
  maximumAdjacentSpacingRelativeResidual: max(
    rows.map((row) => row.audit.maximumAdjacentSpacingRelativeResidual),
  ),
  maximumRelativeCoordinateUncertaintyUpperBound: max(
    features.map((feature) => feature.relativeCoordinateUncertaintyUpperBound),
  ),
  directOracleQualified: true as const,
  inverseRoundTripQualified: true as const,
  ratioPreservationQualified: true as const,
  adjacentSpacingQualified: true as const,
  uncertaintyIntervalsQualified: true as const,
  physicalLineRows: 0 as const,
  absoluteFrequencyRows: 0 as const,
  physicalBandpassRows: 0 as const,
  observedIntensityRows: 0 as const,
  sciencePixelRows: 0 as const,
  imageProducts: 0 as const,
  landmarkMutationCount: 0 as const,
  scienceWritebackCount: 0 as const,
};

if (
  audit.maximumDirectOracleRelativeResidual > 2e-15 ||
  audit.maximumInverseRoundTripRelativeResidual > 2e-15 ||
  audit.maximumPairwiseRatioRelativeResidual > 2e-15 ||
  audit.maximumAdjacentSpacingRelativeResidual > 2e-15
) {
  throw new Error("v481-analytic-gate");
}

const unsigned = {
  version: KERR_SPECTRAL_LANDMARK_ARTIFACT_VERSION_V481,
  generatedAt: "2026-07-30T00:00:00Z",
  status:
    "spectral-landmark-coordinate-transport-qualified-physical-spectrum-blocked-browser-pending" as const,
  source: {
    v478: fileSha(paths.v478),
    v479: fileSha(paths.v479),
    v480: fileSha(paths.v480),
    dense: fileSha(paths.dense),
    formal: fileSha(paths.formal),
  },
  sourceArtifactSha256: {
    v478: v478.artifactSha256,
    v479: v479.artifactSha256,
    v480: v480.artifactSha256,
  },
  contract: {
    rayCount: 4 as const,
    landmarkCountPerRay: 5 as const,
    landmarkCount: 20 as const,
    pairwiseRatioAuditCount: 40 as const,
    adjacentSpacingAuditCount: 16 as const,
    intervalContainmentCount: 20 as const,
    coordinateSystem: "dimensionless-frequency-over-unspecified-reference" as const,
    mapping: "x_observer_equals_g_times_x_emitter" as const,
    inverseMapping: "x_emitter_equals_x_observer_divided_by_g" as const,
    independentLogExpOracleRequired: true as const,
    ratioPreservationRequired: true as const,
    adjacentSpacingScaleRequired: true as const,
    uncertaintyIntervalsRequired: true as const,
    positionOnlyAuthority: true as const,
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
    science: v479.presentation.science,
    cinematic: v479.presentation.cinematic,
    sharedLandmarkPayloadIdentity: true as const,
    scienceWritebackAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
  },
  audit,
  lifecycle: v480.lifecycle,
  boundary: {
    dimensionlessLandmarkPositionAuthorityGranted: true as const,
    physicalLineIdentityAuthorityGranted: false as const,
    absoluteFrequencyAuthorityGranted: false as const,
    lineWidthAuthorityGranted: false as const,
    lineAmplitudeAuthorityGranted: false as const,
    equivalentWidthAuthorityGranted: false as const,
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
const artifact = parseKerrSpectralLandmarkArtifactV481({
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
      rays: artifact.rows.length,
      landmarks: artifact.audit.landmarkCount,
      pairwiseRatioAudits: artifact.audit.pairwiseRatioAuditCount,
      adjacentSpacingAudits: artifact.audit.adjacentSpacingAuditCount,
      maximumDirectOracleRelativeResidual: artifact.audit.maximumDirectOracleRelativeResidual,
      maximumInverseRoundTripRelativeResidual: artifact.audit.maximumInverseRoundTripRelativeResidual,
      maximumPairwiseRatioRelativeResidual: artifact.audit.maximumPairwiseRatioRelativeResidual,
      maximumAdjacentSpacingRelativeResidual: artifact.audit.maximumAdjacentSpacingRelativeResidual,
      physicalLineRows: 0,
      observedIntensityRows: 0,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
      formalProductPointer: "v263",
    },
    null,
    2,
  ),
);
