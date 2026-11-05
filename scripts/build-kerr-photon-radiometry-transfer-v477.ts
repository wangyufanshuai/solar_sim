import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrPhotonRadiometryTransferV477,
  evaluateKerrPhotonTransferCoefficientsV477,
  KERR_PHOTON_RADIOMETRY_ARTIFACT_VERSION_V477,
  parseKerrPhotonRadiometryTransferArtifactV477,
  propagateKerrPhotonTransferUncertaintyV477,
  type KerrPhotonRadiometryTransferRowV477,
} from "../app/lib/kerrPhotonRadiometryTransferV477";
import { canonicalKerrRadiativeTransferPayloadV466 } from "../app/lib/kerrRadiativeTransferV466";
import { canonicalKerrThinDiskRadiativeCouplingPayloadV468 } from "../app/lib/kerrThinDiskRadiativeCouplingV468";
import { canonicalKerrObservableUncertaintyPayloadV473 } from "../app/lib/kerrObservableUncertaintyV473";
import { canonicalKerrSparseSciencePayloadV474 } from "../app/lib/kerrSparseSciencePayloadV474";
import { canonicalKerrScienceProductAdmissionV476 } from "../app/lib/kerrScienceProductAdmissionV476";

type Json = Record<string, unknown>;

const root = process.cwd();
const paths = Object.freeze({
  v466: "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  v468: "dist/science/kerr-thin-disk-radiative-coupling-v468/radiative-coupling.json",
  v473: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  v474: "dist/science/kerr-sparse-science-payload-v474/sparse-payload.json",
  v476: "dist/science/kerr-science-product-admission-v476/admission.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-photon-radiometry-transfer-v477/transfer-payload.json",
});
const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const fileSha = (path: string) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const digest = (canonical: (value: unknown) => string, value: unknown) =>
  createHash("sha256").update(canonical(value)).digest("hex");
const canonicalSha = (value: unknown) =>
  digest(canonicalKerrPhotonRadiometryTransferV477, value);
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;
const rows = (value: Json, key: string) => (value[key] ?? []) as Json[];
const relativeDifference = (left: number, right: number) =>
  Math.abs(left - right) / Math.max(Math.abs(left), Math.abs(right), Number.MIN_VALUE);

const v466 = read(paths.v466);
const v468 = read(paths.v468);
const v473 = read(paths.v473);
const v474 = read(paths.v474);
const v476 = read(paths.v476);
const dense = read(paths.dense);
const formal = read(paths.formal);
const formalEvidence = read(String(formal.source));
const v466Fixture = nested(v466, "fixtureExecution");
const v468Fixture = nested(v468, "fixtureExecution");
const uncertaintyEntries = rows(v473, "entries");
const redshiftBudget = uncertaintyEntries.find((entry) => entry.observableId === "redshift-factor");
const observedRadianceBudget = uncertaintyEntries.find(
  (entry) => entry.observableId === "observed-radiance",
);
const sparseRows = rows(v474, "rows");

if (
  v466.status !== "radiative-transfer-invariant-qualified-measured-input-blocked" ||
  digest(canonicalKerrRadiativeTransferPayloadV466, v466) !== v466.artifactSha256 ||
  nested(v466, "contract").spectralExponent !== 3 ||
  nested(v466, "contract").bolometricExponent !== 4 ||
  v466Fixture.spectralExponentVerified !== true ||
  v466Fixture.bolometricExponentVerified !== true ||
  Number(v466Fixture.maxLiouvilleInvariantRelativeError) >= 1e-12 ||
  v468.status !== "thin-disk-radiative-coupling-qualified-measured-input-blocked" ||
  digest(canonicalKerrThinDiskRadiativeCouplingPayloadV468, v468) !== v468.artifactSha256 ||
  v468Fixture.redshiftAppliedExactlyOnce !== true ||
  Number(v468Fixture.maxSpectralInverseRelativeError) >= 1e-12 ||
  Number(v468Fixture.maxBolometricInverseRelativeError) >= 1e-12 ||
  v473.status !== "observable-uncertainty-qualified-production-ledger-open-browser-pending" ||
  digest(canonicalKerrObservableUncertaintyPayloadV473, v473) !== v473.artifactSha256 ||
  !redshiftBudget ||
  redshiftBudget.status !== "qualified-short-budget" ||
  !Number.isFinite(Number(redshiftBudget.combinedValue)) ||
  Number(redshiftBudget.combinedValue) < 0 ||
  redshiftBudget.combinationPolicy !== "single-component" ||
  redshiftBudget.productionBudgetClosed !== false ||
  !observedRadianceBudget ||
  observedRadianceBudget.status !== "qualified-analytic-partial-budget" ||
  observedRadianceBudget.combinationPolicy !== "separate-physical-channels" ||
  observedRadianceBudget.productionBudgetClosed !== false ||
  v474.status !== "sparse-science-envelope-qualified-production-payload-blocked-browser-pending" ||
  digest(canonicalKerrSparseSciencePayloadV474, v474) !== v474.artifactSha256 ||
  sparseRows.length !== 4 ||
  sparseRows.some(
    (row) =>
      nested(row, "geometry").classification !== "disk-hit" ||
      nested(row, "radiometry").intensity !== null,
  ) ||
  v476.status !== "science-product-admission-qualified-production-images-blocked-browser-pending" ||
  digest(canonicalKerrScienceProductAdmissionV476, v476) !== v476.artifactSha256 ||
  nested(v476, "audit").observedIntensityAvailable !== false ||
  nested(v476, "audit").scienceRasterAllowed !== false ||
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
  throw new Error("v477-upstream-boundary");
}

const redshiftUncertainty = Number(redshiftBudget.combinedValue);
const transferRows = sparseRows.map((sourceRow) => {
  const rayId = String(sourceRow.rayId) as KerrPhotonRadiometryTransferRowV477["rayId"];
  const redshiftFactor = Number(nested(sourceRow, "geometry").redshiftFactor);
  const coefficients = evaluateKerrPhotonTransferCoefficientsV477(redshiftFactor);
  const uncertainty = propagateKerrPhotonTransferUncertaintyV477(
    redshiftFactor,
    redshiftUncertainty,
  );
  const unsigned = {
    rayId,
    sourceRowSha256: String(sourceRow.rowSha256),
    classification: "disk-hit" as const,
    applicability: "analytic-transfer-coefficients-only" as const,
    redshiftFactor,
    frequencyRatioObservedToEmitter: coefficients.frequencyRatio,
    spectralRadianceTransferG3: coefficients.spectralG3,
    bolometricRadianceTransferG4: coefficients.bolometricG4,
    oracle: {
      spectralLogExp: coefficients.spectralLogExp,
      bolometricLogExp: coefficients.bolometricLogExp,
      spectralRelativeDifference: relativeDifference(
        coefficients.spectralG3,
        coefficients.spectralLogExp,
      ),
      bolometricRelativeDifference: relativeDifference(
        coefficients.bolometricG4,
        coefficients.bolometricLogExp,
      ),
      spectralInverseRoundTripResidual: Math.abs(
        coefficients.spectralG3 * (1 / coefficients.spectralG3) - 1,
      ),
      bolometricInverseRoundTripResidual: Math.abs(
        coefficients.bolometricG4 * (1 / coefficients.bolometricG4) - 1,
      ),
    },
    uncertainty: {
      method: "first-order-analytic-derivative" as const,
      combinationPolicy: "shared-redshift-channel-not-combined" as const,
      ...uncertainty,
      independenceProven: false as const,
      productionBudgetClosed: false as const,
    },
    measurements: {
      emittedSpectralRadiance: null,
      observedSpectralRadiance: null,
      emittedBolometricRadiance: null,
      observedBolometricRadiance: null,
      detectorProjectedValue: null,
      stokesI: null,
      stokesQ: null,
      stokesU: null,
      stokesV: null,
      unavailableReason: "measured-emission-and-detector-authority-unavailable" as const,
    },
  };
  return Object.freeze({ ...unsigned, rowSha256: canonicalSha(unsigned) });
}) as KerrPhotonRadiometryTransferRowV477[];

const maximumPowerOracleRelativeDifference = Math.max(
  ...transferRows.flatMap((row) => [
    row.oracle.spectralRelativeDifference,
    row.oracle.bolometricRelativeDifference,
  ]),
);
const maximumInverseRoundTripResidual = Math.max(
  ...transferRows.flatMap((row) => [
    row.oracle.spectralInverseRoundTripResidual,
    row.oracle.bolometricInverseRoundTripResidual,
  ]),
);
if (maximumPowerOracleRelativeDifference >= 1e-12 || maximumInverseRoundTripResidual >= 1e-12) {
  throw new Error("v477-analytic-oracle-boundary");
}

const source = {
  v466: fileSha(paths.v466),
  v468: fileSha(paths.v468),
  v473: fileSha(paths.v473),
  v474: fileSha(paths.v474),
  v476: fileSha(paths.v476),
  dense: fileSha(paths.dense),
};
const unsigned = {
  version: KERR_PHOTON_RADIOMETRY_ARTIFACT_VERSION_V477,
  generatedAt: "2026-07-30T00:00:00Z",
  status: "photon-radiometry-transfer-qualified-measured-radiance-unavailable-browser-pending" as const,
  source,
  contract: {
    rowCount: 4 as const,
    frequencyExponent: 1 as const,
    spectralExponent: 3 as const,
    bolometricExponent: 4 as const,
    liouvilleInvariant: "I_nu_over_nu_cubed" as const,
    redshiftAppliedExactlyOnce: true as const,
    directPowerAndLogExpOracleRequired: true as const,
    firstOrderAnalyticUncertaintyPropagation: true as const,
    sharedRedshiftUncertaintyNotIndependent: true as const,
    noRssAcrossDerivedChannels: true as const,
    transferCoefficientsAreNotMeasuredRadiance: true as const,
    unavailableIsNotZero: true as const,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    localShadowOnly: true as const,
    formalProductPointer: "v263" as const,
  },
  rows: transferRows,
  audit: {
    applicableRowCount: 4 as const,
    coefficientCount: 12 as const,
    uncertaintyBoundCount: 12 as const,
    maximumPowerOracleRelativeDifference,
    maximumInverseRoundTripResidual,
    v466MaximumLiouvilleInvariantRelativeError: Number(
      v466Fixture.maxLiouvilleInvariantRelativeError,
    ),
    v468MaximumSpectralInverseRelativeError: Number(
      v468Fixture.maxSpectralInverseRelativeError,
    ),
    v468MaximumBolometricInverseRelativeError: Number(
      v468Fixture.maxBolometricInverseRelativeError,
    ),
    directPowerOracleQualified: true as const,
    inverseRoundTripQualified: true as const,
    liouvilleFixtureQualified: true as const,
    singleRedshiftApplicationQualified: true as const,
    measuredRadianceRowCount: 0 as const,
    detectorProjectedRowCount: 0 as const,
    stokesMeasurementRowCount: 0 as const,
    sciencePixelRows: 0 as const,
    presentationFieldInputCount: 0 as const,
    scientificFieldMutationCount: 0 as const,
  },
  applicability: {
    analyticTransferQualified: true as const,
    productionRadiometryQualified: false as const,
    measuredEmitterSpectrumAvailable: false as const,
    measuredAccretionParametersAvailable: false as const,
    detectorThroughputAvailable: false as const,
    backgroundReadNoiseAvailable: false as const,
    modelDiscrepancyClosed: false as const,
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
    observedIntensityRows: 0 as const,
    stokesMeasurementRows: 0 as const,
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
  payloadSha256: canonicalSha(transferRows),
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
};
const artifact = parseKerrPhotonRadiometryTransferArtifactV477({
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
      coefficients: 12,
      uncertaintyBounds: 12,
      maxPowerOracleRelativeDifference: maximumPowerOracleRelativeDifference,
      maxInverseRoundTripResidual: maximumInverseRoundTripResidual,
      measuredRadianceRows: 0,
      detectorProjectedRows: 0,
      stokesRows: 0,
      sciencePixels: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
    },
    null,
    2,
  ),
);
