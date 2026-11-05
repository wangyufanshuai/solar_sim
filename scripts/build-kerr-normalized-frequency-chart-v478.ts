import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrNormalizedFrequencyChartV478,
  evaluateKerrNormalizedFrequencyCoordinateV478,
  KERR_NORMALIZED_FREQUENCY_ANCHORS_V478,
  KERR_NORMALIZED_FREQUENCY_ARTIFACT_VERSION_V478,
  parseKerrNormalizedFrequencyArtifactV478,
  type KerrNormalizedFrequencyRowV478,
} from "../app/lib/kerrNormalizedFrequencyChartV478";
import { canonicalKerrRadiativeTransferPayloadV466 } from "../app/lib/kerrRadiativeTransferV466";
import { canonicalKerrObservableUncertaintyPayloadV473 } from "../app/lib/kerrObservableUncertaintyV473";
import { canonicalKerrScienceProductAdmissionV476 } from "../app/lib/kerrScienceProductAdmissionV476";
import { canonicalKerrPhotonRadiometryTransferV477 } from "../app/lib/kerrPhotonRadiometryTransferV477";

type Json = Record<string, unknown>;
const root = process.cwd();
const paths = Object.freeze({
  v466: "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  v473: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  v476: "dist/science/kerr-science-product-admission-v476/admission.json",
  v477: "dist/science/kerr-photon-radiometry-transfer-v477/transfer-payload.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-normalized-frequency-chart-v478/frequency-chart.json",
});
const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const fileSha = (path: string) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const digest = (canonical: (value: unknown) => string, value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
const canonicalSha = (value: unknown) => digest(canonicalKerrNormalizedFrequencyChartV478, value);
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;
const rows = (value: Json, key: string) => (value[key] ?? []) as Json[];

const v466 = read(paths.v466);
const v473 = read(paths.v473);
const v476 = read(paths.v476);
const v477 = read(paths.v477);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(String(formal.source));
const redshiftBudget = rows(v473, "entries").find(
  (entry) => entry.observableId === "redshift-factor",
);
const transferRows = rows(v477, "rows");

if (
  v466.status !== "radiative-transfer-invariant-qualified-measured-input-blocked" ||
  digest(canonicalKerrRadiativeTransferPayloadV466, v466) !== v466.artifactSha256 ||
  nested(v466, "contract").redshiftDefinition !==
    "observed-frequency-over-emitter-frequency" ||
  Number(nested(v466, "fixtureExecution").maxFrequencyRoundTripRelativeError) >= 1e-12 ||
  v473.status !== "observable-uncertainty-qualified-production-ledger-open-browser-pending" ||
  digest(canonicalKerrObservableUncertaintyPayloadV473, v473) !== v473.artifactSha256 ||
  !redshiftBudget ||
  redshiftBudget.status !== "qualified-short-budget" ||
  !Number.isFinite(Number(redshiftBudget.combinedValue)) ||
  v476.status !== "science-product-admission-qualified-production-images-blocked-browser-pending" ||
  digest(canonicalKerrScienceProductAdmissionV476, v476) !== v476.artifactSha256 ||
  nested(v476, "audit").observedIntensityAvailable !== false ||
  nested(v476, "audit").scienceRasterAllowed !== false ||
  v477.status !== "photon-radiometry-transfer-qualified-measured-radiance-unavailable-browser-pending" ||
  digest(canonicalKerrPhotonRadiometryTransferV477, v477) !== v477.artifactSha256 ||
  digest(canonicalKerrPhotonRadiometryTransferV477, transferRows) !== v477.payloadSha256 ||
  transferRows.length !== 4 ||
  transferRows.some(
    (row) =>
      nested(row, "measurements").observedSpectralRadiance !== null ||
      nested(row, "measurements").detectorProjectedValue !== null,
  ) ||
  dense.status !== "incomplete-0-of-49" ||
  dense.completedShardCount !== 0 ||
  dense.attemptConsumed !== false ||
  dense.aggregateAvailable !== false ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  nested(formalEvidence, "science").defaultKernel !== "legacy-eih-1pn" ||
  nested(formalEvidence, "contracts").singleCanvas !== true ||
  nested(formalEvidence, "contracts").legacyRootAttributes !== 603 ||
  nested(formalEvidence, "contracts").evidenceLedgerClaims !== 84
) {
  throw new Error("v478-upstream-boundary");
}

const redshiftUncertainty = Number(redshiftBudget.combinedValue);
const chartRows = transferRows.map((sourceRow) => {
  const redshiftFactor = Number(sourceRow.redshiftFactor);
  const samples = KERR_NORMALIZED_FREQUENCY_ANCHORS_V478.map((anchor, index) =>
    Object.freeze({
      anchorIndex: index as 0 | 1 | 2 | 3 | 4,
      ...evaluateKerrNormalizedFrequencyCoordinateV478(
        redshiftFactor,
        anchor,
        redshiftUncertainty,
      ),
    }),
  );
  const strictlyIncreasing = samples.every(
    (sample, index) => index === 0 || sample.observerFrequencyOverReference > samples[index - 1]!.observerFrequencyOverReference,
  );
  if (!strictlyIncreasing) throw new Error("v478-frequency-monotonicity");
  const unsigned = {
    rayId: String(sourceRow.rayId) as KerrNormalizedFrequencyRowV478["rayId"],
    sourceRowSha256: String(sourceRow.rowSha256),
    redshiftFactor,
    shiftClass: redshiftFactor >= 1 ? ("blueshift" as const) : ("redshift" as const),
    coordinateSystem: "dimensionless-frequency-over-unspecified-reference" as const,
    samples,
    observerEnvelope: {
      minimumFrequencyOverReference: samples[0]!.observerFrequencyOverReference,
      maximumFrequencyOverReference: samples[4]!.observerFrequencyOverReference,
      strictlyIncreasing: true as const,
    },
    physicalApplicability: {
      referenceFrequencyHz: null,
      absoluteEmitterFrequencyHz: null,
      absoluteObserverFrequencyHz: null,
      physicalBandpassId: null,
      detectorThroughput: null,
      bandIntegratedRadiance: null,
      unavailableReason: "reference-frequency-bandpass-and-throughput-unavailable" as const,
    },
  };
  return Object.freeze({ ...unsigned, rowSha256: canonicalSha(unsigned) });
}) as KerrNormalizedFrequencyRowV478[];

const allSamples = chartRows.flatMap((row) => row.samples);
const maximumDirectOracleRelativeDifference = Math.max(
  ...allSamples.map((sample) => sample.directOracleRelativeDifference),
);
const maximumInverseRoundTripRelativeResidual = Math.max(
  ...allSamples.map((sample) => sample.inverseRoundTripRelativeResidual),
);
if (
  maximumDirectOracleRelativeDifference >= 1e-12 ||
  maximumInverseRoundTripRelativeResidual >= 1e-12
) {
  throw new Error("v478-frequency-oracle-boundary");
}

const source = {
  v466: fileSha(paths.v466),
  v473: fileSha(paths.v473),
  v476: fileSha(paths.v476),
  v477: fileSha(paths.v477),
  dense: fileSha(paths.dense),
};
const unsigned = {
  version: KERR_NORMALIZED_FREQUENCY_ARTIFACT_VERSION_V478,
  generatedAt: "2026-07-30T00:00:00Z",
  status: "normalized-frequency-chart-qualified-physical-bandpass-unavailable-browser-pending" as const,
  source,
  contract: {
    rowCount: 4 as const,
    anchorCountPerRow: 5 as const,
    sampleCount: 20 as const,
    normalizedFrequencyAnchors: KERR_NORMALIZED_FREQUENCY_ANCHORS_V478,
    mapping: "nu_observer_over_nu0_equals_g_times_nu_emitter_over_nu0" as const,
    inverseMapping: "nu_emitter_over_nu0_equals_nu_observer_over_nu0_divided_by_g" as const,
    directMultiplyAndLogExpOracleRequired: true as const,
    monotonicityRequired: true as const,
    firstOrderUncertaintyPropagation: true as const,
    normalizedCoordinatesOnly: true as const,
    physicalBandpassAuthorityRequiredForAbsoluteProducts: true as const,
    unavailableIsNotZero: true as const,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    localShadowOnly: true as const,
    formalProductPointer: "v263" as const,
  },
  rows: chartRows,
  audit: {
    sampleCount: 20 as const,
    blueshiftRowCount: chartRows.filter((row) => row.shiftClass === "blueshift").length as 1,
    redshiftRowCount: chartRows.filter((row) => row.shiftClass === "redshift").length as 3,
    monotonicRowCount: 4 as const,
    maximumDirectOracleRelativeDifference,
    maximumInverseRoundTripRelativeResidual,
    maximumV466FrequencyRoundTripRelativeError: Number(
      nested(v466, "fixtureExecution").maxFrequencyRoundTripRelativeError,
    ),
    directOracleQualified: true as const,
    inverseRoundTripQualified: true as const,
    monotonicityQualified: true as const,
    uncertaintyPropagationQualified: true as const,
    absoluteFrequencyRowCount: 0 as const,
    physicalBandpassRowCount: 0 as const,
    bandIntegratedRadianceRowCount: 0 as const,
    detectorThroughputRowCount: 0 as const,
    sciencePixelRows: 0 as const,
    presentationFieldInputCount: 0 as const,
    scientificFieldMutationCount: 0 as const,
  },
  applicability: {
    normalizedFrequencyCoordinateQualified: true as const,
    absoluteFrequencyCoordinateQualified: false as const,
    physicalBandpassQualified: false as const,
    bandIntegratedRadianceQualified: false as const,
    detectorProjectionQualified: false as const,
    denseSamplingAvailable: false as const,
    scienceRasterAllowed: false as const,
  },
  lifecycle: {
    existingCanvasCount: 1 as const,
    newCanvasCreated: false as const,
    sceneRevisionDelta: 0 as const,
    workers: 0 as const,
    gpuBuffers: 0 as const,
    pipelines: 0 as const,
    textures: 0 as const,
    renderTargets: 0 as const,
    typedArrayCaches: 0 as const,
    objectUrls: 0 as const,
    cameraLeases: 0 as const,
    subscriptions: 0 as const,
    allResourcesAtBaseline: true as const,
  },
  boundary: {
    productionAuthorityGranted: false as const,
    productionPayloadAllowed: false as const,
    absoluteFrequencyRows: 0 as const,
    physicalBandpassRows: 0 as const,
    bandIntegratedRadianceRows: 0 as const,
    detectorProjectedRows: 0 as const,
    sciencePixelRows: 0 as const,
    fitsImageRows: 0 as const,
    imageProductsGenerated: false as const,
    sciencePayloadMutationAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
    denseShardRunAllowed: false as const,
    browserQualification: "not-run" as const,
    visualMatrixQualification: "not-run" as const,
    soakQualification: "not-run" as const,
    rtxWebGpuQualification: "not-run" as const,
  },
  payloadSha256: canonicalSha(chartRows),
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
};
const artifact = parseKerrNormalizedFrequencyArtifactV478({
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
      rows: 4,
      anchorsPerRow: 5,
      samples: 20,
      blueshiftRows: artifact.audit.blueshiftRowCount,
      redshiftRows: artifact.audit.redshiftRowCount,
      maxDirectOracleRelativeDifference: maximumDirectOracleRelativeDifference,
      maxInverseRoundTripRelativeResidual: maximumInverseRoundTripRelativeResidual,
      absoluteFrequencyRows: 0,
      physicalBandpassRows: 0,
      bandIntegratedRadianceRows: 0,
      sciencePixels: 0,
      browserQualification: "not-run",
    },
    null,
    2,
  ),
);
