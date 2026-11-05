import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrObservableProvenancePayloadV471,
  KERR_OBSERVABLE_PROVENANCE_ARTIFACT_VERSION_V471,
  parseKerrObservableProvenanceArtifactV471,
  type KerrObservableRowV471,
  type KerrObservableSourceV471,
  type KerrObservableVerificationV471,
} from "../app/lib/kerrObservableProvenanceV471";

type Json = Record<string, unknown>;

const root = process.cwd();
const paths = Object.freeze({
  v312: "dist/science/kerr-reference-v312/geometry-redshift-tolerance-short-gate.json",
  v313: "dist/science/kerr-reference-v313/polarization-short-gate.json",
  v419: "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json",
  v420: "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json",
  v422: "dist/science/kerr-polarization-orientation-basis-v422/orientation-basis-catalog.json",
  v463: "dist/science/kerr-science-payload-admission-v463/payload-admission.json",
  v465: "dist/science/kerr-detector-response-v465/response-contract.json",
  v466: "dist/science/kerr-radiative-transfer-v466/radiative-transfer.json",
  v467: "dist/science/kerr-thin-disk-analytic-v467/thin-disk-analytic.json",
  v468: "dist/science/kerr-thin-disk-radiative-coupling-v468/radiative-coupling.json",
  v470: "dist/science/kerr-evidence-dependency-v470/dependency-graph.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-observable-provenance-v471/observable-matrix.json",
});

const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const fileSha = (path: string) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalSha = (value: unknown) =>
  createHash("sha256")
    .update(canonicalKerrObservableProvenancePayloadV471(value))
    .digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;

const docs = {
  v312: read(paths.v312),
  v313: read(paths.v313),
  v419: read(paths.v419),
  v420: read(paths.v420),
  v422: read(paths.v422),
  v463: read(paths.v463),
  v465: read(paths.v465),
  v466: read(paths.v466),
  v467: read(paths.v467),
  v468: read(paths.v468),
  v470: read(paths.v470),
  dense: read(paths.dense),
  formal: read(paths.formal),
};
const formalEvidence = read(String(docs.formal.source));
const view419 = nested(docs.v419, "view");
const view420 = nested(docs.v420, "view");
const view422 = nested(docs.v422, "view");
const counts419 = nested(view419, "counts");
const mask422 = nested(view422, "maskContract");
const raster422 = nested(view422, "rasterAdmission");

if (
  docs.v312.status !== "corrected-authority-qualified" ||
  docs.v312.geometryRedshiftQualified !== true ||
  docs.v312.executionCount !== 128 ||
  docs.v312.criticalBracketCount !== 40 ||
  docs.v313.status !== "full-kerr-short-authority-qualified" ||
  docs.v313.qualified !== true ||
  docs.v313.applicableExecutionCount !== 16 ||
  docs.v313.captureEscapeNotApplicableCount !== 96 ||
  counts419.coordinateRowCount !== 4 ||
  counts419.pixelCoordinateCount !== 0 ||
  nested(view420, "wcs").width !== 384 ||
  nested(view420, "wcs").height !== 384 ||
  mask422.orientationAvailableCount !== 4 ||
  mask422.stokesMeasurementAvailableCount !== 0 ||
  raster422.sciencePixelValueCount !== 0 ||
  nested(docs.v463, "admission").sciencePayloadAllowed !== false ||
  nested(docs.v465, "boundary").productionResponseExecutable !== false ||
  nested(docs.v466, "boundary").productionRadiativeTransferAllowed !== false ||
  nested(docs.v467, "boundary").productionThinDiskAllowed !== false ||
  nested(docs.v468, "boundary").productionCouplingAllowed !== false ||
  nested(docs.v470, "outcomes").scienceRasterAuthorityGranted !== false ||
  docs.dense.status !== "incomplete-0-of-49" ||
  docs.dense.completedShardCount !== 0 ||
  docs.dense.attemptConsumed !== false ||
  docs.dense.aggregateAvailable !== false ||
  docs.formal.version !== "v263-current-product-evidence-pointer" ||
  nested(formalEvidence, "science").defaultKernel !== "legacy-eih-1pn" ||
  nested(formalEvidence, "contracts").singleCanvas !== true ||
  nested(formalEvidence, "contracts").legacyRootAttributes !== 603 ||
  nested(formalEvidence, "contracts").evidenceLedgerClaims !== 84
) {
  throw new Error("v471-upstream-boundary");
}

const source = (
  id: string,
  role: string,
  path: string,
  document: Json,
): KerrObservableSourceV471 =>
  Object.freeze({
    id,
    role,
    status: String(document.status),
    fileSha256: fileSha(path),
    authoritySha256: String(document.evidenceSha256 ?? document.artifactSha256),
  });

const sources = Object.freeze([
  source("v312", "geometry-redshift-short-authority", paths.v312, docs.v312),
  source("v313", "polarization-short-authority", paths.v313, docs.v313),
  source("v419", "screen-coordinate-provenance", paths.v419, docs.v419),
  source("v420", "linear-observer-plane-WCS", paths.v420, docs.v420),
  source("v422", "orientation-basis", paths.v422, docs.v422),
  source("v463", "production-payload-admission", paths.v463, docs.v463),
  source("v465", "detector-response-contract", paths.v465, docs.v465),
  source("v466", "radiative-transfer-invariant", paths.v466, docs.v466),
  source("v467", "analytic-thin-disk", paths.v467, docs.v467),
  source("v468", "single-redshift-coupling", paths.v468, docs.v468),
  source("v470", "causal-admission-state", paths.v470, docs.v470),
]);

const verify = (
  metric: string,
  observed: number,
  limit: number | null,
  relation: NonNullable<KerrObservableVerificationV471>["relation"],
  sourceId: string,
): KerrObservableVerificationV471 =>
  Object.freeze({ metric, observed, limit, relation, qualified: true as const, sourceId });

const row = (
  value: Omit<
    KerrObservableRowV471,
    | "productionAuthorityGranted"
    | "productionPayloadAllowed"
    | "sciencePixelMutationAllowed"
    | "cinematicWritebackAllowed"
  >,
): KerrObservableRowV471 =>
  Object.freeze({
    ...value,
    productionAuthorityGranted: false as const,
    productionPayloadAllowed: false as const,
    sciencePixelMutationAllowed: false as const,
    cinematicWritebackAllowed: false as const,
  });

const thresholds312 = nested(docs.v312, "thresholds");
const thresholds313 = nested(docs.v313, "thresholds");
const maxima419 = nested(view419, "maxima");
const thresholds419 = nested(view419, "thresholds");
const maxima420 = nested(view420, "maxima");
const thresholds420 = nested(view420, "thresholds");
const maxima422 = nested(view422, "maxima");
const thresholds422 = nested(view422, "thresholds");
const fixture466 = nested(docs.v466, "fixtureExecution");
const fixture467 = nested(docs.v467, "fixtureExecution");
const fixture468 = nested(docs.v468, "fixtureExecution");

const rows = Object.freeze([
  row({ id: "geometry-classification", domain: "geometry", label: "Capture / escape / disk-hit", semantics: "earliest-valid-geodesic-event-classification", units: "categorical", status: "available-short-authority", available: true, scientificValueQualified: true, applicability: "all-128-short-gate-executions", recordCount: 128, notApplicableCount: 0, sourceIds: ["v312"], verification: verify("classificationAgreement", Number(thresholds312.classificationAgreement), 0.999, ">=", "v312"), unavailableReason: null }),
  row({ id: "emission-radius", domain: "geometry", label: "Disk emission radius", semantics: "first-valid-disk-crossing-radius", units: "geometrized-M", status: "available-short-authority", available: true, scientificValueQualified: true, applicability: "disk-hit-only", recordCount: 32, notApplicableCount: 96, sourceIds: ["v312"], verification: verify("maxDiskRadiusDifferenceM", Number(thresholds312.maxDiskRadiusDifferenceM), null, "qualified-by-source", "v312"), unavailableReason: null }),
  row({ id: "redshift-factor", domain: "radiometry", label: "Observer / emitter redshift factor", semantics: "observed-frequency-over-emitter-frequency-k-dot-u", units: "dimensionless", status: "available-short-authority", available: true, scientificValueQualified: true, applicability: "disk-hit-only", recordCount: 32, notApplicableCount: 96, sourceIds: ["v312", "v468"], verification: verify("maxRedshiftDifference", Number(thresholds312.maxRedshiftDifference), 0.005, "<", "v312"), unavailableReason: null }),
  row({ id: "evpa", domain: "polarization", label: "Electric-vector position angle", semantics: "ZAMO-screen-axial-angle-Walker-Penrose-vs-independent-parallel-transport", units: "degree-modulo-180", status: "available-short-authority", available: true, scientificValueQualified: true, applicability: "four-disk-rays-two-tolerances-A-B", recordCount: 16, notApplicableCount: 96, sourceIds: ["v313"], verification: verify("maxReleaseEvpaDifferenceDeg", Number(thresholds313.maxReleaseEvpaDifferenceDeg), Number(thresholds313.releaseEvpaDifferenceLimitDeg), "<", "v313"), unavailableReason: null }),
  row({ id: "screen-alpha-beta", domain: "astrometry", label: "Continuous screen alpha / beta", semantics: "finite-distance-ZAMO-screen-coordinate-not-pixel-sample", units: "geometrized-M", status: "available-coordinate-authority", available: true, scientificValueQualified: true, applicability: "four-authority-disk-rays", recordCount: 4, notApplicableCount: 0, sourceIds: ["v419"], verification: verify("coordinateReplayResidualM", Number(maxima419.coordinateReplayResidualM), Number(thresholds419.coordinateReplayResidualM), "<", "v419"), unavailableReason: null }),
  row({ id: "continuous-wcs-coordinate", domain: "astrometry", label: "Continuous WCS source coordinate", semantics: "FITS-one-based-continuous-coordinate-not-raster-value", units: "continuous-pixel-coordinate", status: "available-coordinate-authority", available: true, scientificValueQualified: true, applicability: "four-authority-source-records", recordCount: 4, notApplicableCount: 0, sourceIds: ["v420"], verification: verify("tsWorldPixelWorldRoundtripResidualM", Number(maxima420.tsWorldPixelWorldRoundtripResidualM), Number(thresholds420.tsWorldPixelWorldRoundtripResidualM), "<", "v420"), unavailableReason: null }),
  row({ id: "orientation-basis", domain: "polarization", label: "Unit double-angle orientation basis", semantics: "q-hat-cos-2chi-u-hat-sin-2chi-not-Stokes-measurement", units: "dimensionless-unit-basis", status: "available-coordinate-authority", available: true, scientificValueQualified: true, applicability: "four-authority-source-records", recordCount: 4, notApplicableCount: 0, sourceIds: ["v422"], verification: verify("basisNormResidual", Number(maxima422.basisNormResidual), Number(thresholds422.basisNormResidual), "<", "v422"), unavailableReason: null }),
  row({ id: "thin-disk-local-emission", domain: "radiometry", label: "Analytic thin-disk local emission", semantics: "Page-Thorne-zero-torque-ISCO-analytic-fixture", units: "relative-analytic-flux", status: "available-analytic-fixture", available: true, scientificValueQualified: true, applicability: "test-particle-analytic-fixture-only", recordCount: Number(fixture467.emissionCaseCount), notApplicableCount: 0, sourceIds: ["v467"], verification: verify("maxDerivativeFiniteDifferenceAuditRelativeError", Number(fixture467.maxDerivativeFiniteDifferenceAuditRelativeError), null, "qualified-by-source", "v467"), unavailableReason: null }),
  row({ id: "observed-radiance", domain: "radiometry", label: "Observed spectral / bolometric radiance", semantics: "Liouville-g-cubed-and-g-fourth-single-redshift-coupling", units: "relative-radiance", status: "available-analytic-fixture", available: true, scientificValueQualified: true, applicability: "analytic-disk-hit-fixture-only", recordCount: Number(fixture468.applicableDiskHitCount), notApplicableCount: Number(fixture468.notApplicableCaptureEscapeCount), sourceIds: ["v466", "v468"], verification: verify("maxLiouvilleInvariantRelativeError", Number(fixture466.maxLiouvilleInvariantRelativeError), 1e-12, "<", "v466"), unavailableReason: null }),
  row({ id: "detector-response", domain: "detector", label: "Detector response", semantics: "measured-electron-per-ADU-production-calibration", units: "electron-per-ADU", status: "unavailable-production-authority", available: false, scientificValueQualified: false, applicability: "production-measured-detector-only", recordCount: 0, notApplicableCount: 0, sourceIds: ["v465", "v470"], verification: null, unavailableReason: "production-calibration-unavailable" }),
  row({ id: "stokes-iquv", domain: "polarization", label: "Measured Stokes I/Q/U/V", semantics: "instrument-dependent-polarimetric-measurement-not-orientation-basis", units: "instrument-calibrated", status: "unavailable-production-authority", available: false, scientificValueQualified: false, applicability: "measured-polarimeter-only", recordCount: 0, notApplicableCount: 0, sourceIds: ["v422", "v465", "v470"], verification: null, unavailableReason: "no-I-Q-U-V-measurements" }),
  row({ id: "science-raster-pixel", domain: "science-product", label: "Science raster pixel", semantics: "dense-admitted-detector-projected-science-value", units: "detector-calibrated-pixel", status: "unavailable-production-authority", available: false, scientificValueQualified: false, applicability: "requires-v314-49-of-49-and-v463-admission", recordCount: 0, notApplicableCount: 0, sourceIds: ["v463", "v420", "v422", "v470"], verification: null, unavailableReason: "payload-admission-and-dense-aggregate-unavailable" }),
  row({ id: "fits-science-image", domain: "science-product", label: "FITS science image", semantics: "raster-image-HDU-with-admitted-science-pixels", units: "FITS-image-HDU", status: "unavailable-production-authority", available: false, scientificValueQualified: false, applicability: "requires-authorized-science-raster", recordCount: 0, notApplicableCount: 0, sourceIds: ["v463", "v420", "v422", "v470"], verification: null, unavailableReason: "no-raster-science-values" }),
]);

const unsigned = {
  version: KERR_OBSERVABLE_PROVENANCE_ARTIFACT_VERSION_V471,
  generatedAt: "2026-07-30T00:00:00Z",
  status: "observable-provenance-qualified-production-blocked-browser-pending" as const,
  sources,
  contract: {
    rowCount: 13 as const,
    sourceCount: 11 as const,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    sourceShaRequired: true as const,
    unavailableIsNotZero: true as const,
    sparseAuthorityIsNotDenseAuthority: true as const,
    analyticFixtureIsNotMeasuredAuthority: true as const,
    scienceCinematicWritebackForbidden: true as const,
    formalProductPointer: "v263" as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
  },
  rows,
  summary: {
    availableRowCount: 9 as const,
    unavailableRowCount: 4 as const,
    shortAuthorityRowCount: 4 as const,
    coordinateAuthorityRowCount: 3 as const,
    analyticFixtureRowCount: 2 as const,
    productionAuthorityGrantedRowCount: 0 as const,
    sciencePixelRows: 0 as const,
    stokesMeasurementRows: 0 as const,
    fitsImageRows: 0 as const,
  },
  admission: {
    geometryShortAuthorityQualified: true as const,
    polarizationShortAuthorityQualified: true as const,
    screenCoordinateAuthorityQualified: true as const,
    continuousWcsQualified: true as const,
    orientationBasisQualified: true as const,
    detectorProjectionAllowed: false as const,
    stokesMeasurementAvailable: false as const,
    denseAggregateAvailable: false as const,
    scienceRasterAllowed: false as const,
    fitsImageAllowed: false as const,
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
    fullExecutionArraysIncluded: false as const,
    rasterArraysIncluded: false as const,
    sciencePayloadMutationAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
    fitsWriteAllowed: false as const,
    pngWriteAllowed: false as const,
    imageProductsGenerated: false as const,
    networkAttempted: false as const,
    automaticRetryApplied: false as const,
    denseShardRunAllowed: false as const,
    browserQualification: "not-run" as const,
    visualMatrixQualification: "not-run" as const,
    soakQualification: "not-run" as const,
    rtxWebGpuQualification: "not-run" as const,
  },
  formalProductPointer: "v263" as const,
  formalDefaultKernel: "legacy-eih-1pn" as const,
};

const artifact = parseKerrObservableProvenanceArtifactV471({
  ...unsigned,
  artifactSha256: canonicalSha(unsigned),
});
atomic(paths.output, artifact);

console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      rowCount: artifact.rows.length,
      available: artifact.summary.availableRowCount,
      unavailable: artifact.summary.unavailableRowCount,
      shortAuthority: artifact.summary.shortAuthorityRowCount,
      coordinateAuthority: artifact.summary.coordinateAuthorityRowCount,
      analyticFixture: artifact.summary.analyticFixtureRowCount,
      productionAuthority: 0,
      sciencePixelRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
    },
    null,
    2,
  ),
);
