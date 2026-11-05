import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import {
  canonicalKerrSparseSciencePayloadV474,
  KERR_SPARSE_SCIENCE_PAYLOAD_ARTIFACT_VERSION_V474,
  parseKerrSparseSciencePayloadArtifactV474,
  type KerrSparseSciencePayloadRowV474,
  type KerrSparseUncertaintyReferenceV474,
} from "../app/lib/kerrSparseSciencePayloadV474";

type Json = Record<string, unknown>;

const root = process.cwd();
const paths = Object.freeze({
  v419: "dist/science/kerr-screen-coordinate-provenance-v419/screen-coordinate-provenance.json",
  v420: "dist/science/kerr-observer-plane-WCS-v420/observer-plane-WCS.json",
  v422: "dist/science/kerr-polarization-orientation-basis-v422/orientation-basis-catalog.json",
  v471: "dist/science/kerr-observable-provenance-v471/observable-matrix.json",
  v473: "dist/science/kerr-observable-uncertainty-v473/uncertainty-ledger.json",
  dense: "dist/science/kerr-campaign-v314/campaign-state.json",
  formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
  output: "dist/science/kerr-sparse-science-payload-v474/sparse-payload.json",
});
const read = (path: string): Json =>
  JSON.parse(readFileSync(resolve(root, path), "utf8")) as Json;
const fileSha = (path: string) =>
  createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
const canonicalSha = (value: unknown) =>
  createHash("sha256").update(canonicalKerrSparseSciencePayloadV474(value)).digest("hex");
const atomic = (path: string, value: unknown) => {
  const target = resolve(root, path);
  mkdirSync(dirname(target), { recursive: true });
  const part = target + "." + process.pid + ".part";
  writeFileSync(part, JSON.stringify(value, null, 2) + "\n", "utf8");
  renameSync(part, target);
};
const nested = (value: Json, key: string) => (value[key] ?? {}) as Json;
const array = (value: Json, key: string) => (value[key] ?? []) as Json[];

const docs = {
  v419: read(paths.v419),
  v420: read(paths.v420),
  v422: read(paths.v422),
  v471: read(paths.v471),
  v473: read(paths.v473),
  dense: read(paths.dense),
  formal: read(paths.formal),
};
const formalEvidence = read(String(docs.formal.source));
const view419 = nested(docs.v419, "view");
const view420 = nested(docs.v420, "view");
const view422 = nested(docs.v422, "view");
const rows419 = array(view419, "rows");
const rows420 = array(nested(view420, "catalog"), "rows");
const rows422 = array(view422, "rows");
const uncertaintyEntries = array(docs.v473, "entries");
const uncertaintyById = new Map(
  uncertaintyEntries.map((entry) => [String(entry.observableId), entry]),
);
const expectedRayIds = ["disk-00", "disk-01", "disk-02", "disk-03"];

if (
  docs.v419.status !== "qualified-four-ray-screen-coordinate-provenance-not-a-dense-image" ||
  docs.v420.status !== "qualified-linear-observer-plane-WCS-and-four-source-catalog-no-raster-values" ||
  docs.v422.status !== "qualified-four-source-mask-aware-orientation-basis-no-stokes-or-raster-values" ||
  docs.v471.status !== "observable-provenance-qualified-production-blocked-browser-pending" ||
  docs.v473.status !== "observable-uncertainty-qualified-production-ledger-open-browser-pending" ||
  rows419.length !== 4 ||
  rows420.length !== 4 ||
  rows422.length !== 4 ||
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
  throw new Error("v474-upstream-boundary");
}

for (const rows of [rows419, rows420, rows422]) {
  if (
    new Set(rows.map((row) => String(row.rayId))).size !== 4 ||
    JSON.stringify(rows.map((row) => String(row.rayId))) !== JSON.stringify(expectedRayIds)
  ) {
    throw new Error("v474-join-key-identity");
  }
}

const map420 = new Map(rows420.map((row) => [String(row.rayId), row]));
const map422 = new Map(rows422.map((row) => [String(row.rayId), row]));
const uncertaintyIds = [
  "geometry-classification",
  "emission-radius",
  "redshift-factor",
  "evpa",
  "screen-alpha-beta",
  "continuous-wcs-coordinate",
  "orientation-basis",
] as const;
const ledgerSha = String(docs.v473.artifactSha256);
const source419 = nested(view419, "source");
const observer = nested(view419, "observer");
let classificationMismatchCount = 0;
let spinMismatchCount = 0;
let redshiftMismatchCount = 0;
let evpaMismatchCount = 0;
let coordinateMismatchCount = 0;
let maximumContinuousCoordinateDifference = 0;
let maximumEvpaDifferenceDeg = 0;

const unsignedRows = rows419.map((row419) => {
  const rayId = String(row419.rayId);
  const row420 = map420.get(rayId);
  const row422 = map422.get(rayId);
  if (!row420 || !row422) throw new Error("v474-join-key-missing");
  const geometry = nested(row419, "geometry");
  const polarization = nested(row419, "polarization");
  const direction = nested(row419, "normalizedScreenDirection");
  const constants = nested(row419, "constants");
  const coordinate422 = nested(row422, "continuousCoordinate");
  const basis = nested(row422, "orientationBasis");
  const mask = nested(row422, "applicabilityMask");
  const measurements = nested(row422, "measurements");

  if (String(geometry.classification) !== String(row420.classification)) {
    classificationMismatchCount += 1;
  }
  if (Number(row419.spinA) !== Number(row420.spinA) || Number(row419.spinA) !== Number(row422.spinA)) {
    spinMismatchCount += 1;
  }
  const redshiftDifference = Math.abs(
    Number(geometry.redshiftFactor) - Number(row420.redshiftFactor),
  );
  if (redshiftDifference > 1e-12) redshiftMismatchCount += 1;
  const evpaDifferences = [
    Math.abs(
      Number(polarization.v313WalkerPenroseEvpaDeg) - Number(row420.authorityEvpaDeg),
    ),
    Math.abs(
      Number(polarization.v313WalkerPenroseEvpaDeg) - Number(row422.authorityEvpaDeg),
    ),
  ];
  maximumEvpaDifferenceDeg = Math.max(maximumEvpaDifferenceDeg, ...evpaDifferences);
  if (evpaDifferences.some((difference) => difference > 1e-12)) evpaMismatchCount += 1;
  const coordinateDifferences = [
    Math.abs(Number(row420.continuousPixelX) - Number(coordinate422.pixelX)),
    Math.abs(Number(row420.continuousPixelY) - Number(coordinate422.pixelY)),
  ];
  maximumContinuousCoordinateDifference = Math.max(
    maximumContinuousCoordinateDifference,
    ...coordinateDifferences,
  );
  if (coordinateDifferences.some((difference) => difference > 1e-12)) {
    coordinateMismatchCount += 1;
  }
  if (
    row420.intensity !== null ||
    row420.stokes !== null ||
    mask.orientationAvailable !== true ||
    mask.polarizationAmplitudeAvailable !== false ||
    mask.stokesMeasurementAvailable !== false ||
    mask.densePixelSampleAvailable !== false ||
    Object.values(measurements).some((value) => value !== null) ||
    row420.interpolationAllowed !== false ||
    row422.interpolationAllowed !== false ||
    row422.nearestPixelAssignmentAllowed !== false
  ) {
    throw new Error("v474-applicability-boundary");
  }

  const uncertainty = uncertaintyIds.map((observableId) => {
    const entry = uncertaintyById.get(observableId);
    if (
      !entry ||
      !Number.isFinite(entry.combinedValue) ||
      typeof entry.combinedUnits !== "string" ||
      entry.productionBudgetClosed !== false
    ) {
      throw new Error("v474-uncertainty-join:" + observableId);
    }
    return Object.freeze({
      observableId,
      ledgerArtifactSha256: ledgerSha,
      status: entry.status,
      combinedValue: Number(entry.combinedValue),
      combinedUnits: entry.combinedUnits,
      productionBudgetClosed: false as const,
    }) as KerrSparseUncertaintyReferenceV474;
  });

  return {
    rayId: rayId as KerrSparseSciencePayloadRowV474["rayId"],
    rayIndex: Number(row419.rayIndex) as KerrSparseSciencePayloadRowV474["rayIndex"],
    spinA: Number(row419.spinA),
    observer: {
      family: "finite-distance-ZAMO" as const,
      radiusM: Number(observer.radiusM) as 30,
      inclinationDeg: Number(observer.inclinationDeg) as 70,
      azimuthDeg: Number(observer.azimuthDeg) as 0,
    },
    screen: {
      alphaM: Number(row419.alphaM),
      betaM: Number(row419.betaM),
      radiusM: Number(row419.screenRadiusM),
      inward: Number(direction.inward),
      vertical: Number(direction.vertical),
      horizontal: Number(direction.horizontal),
    },
    constants: {
      energy: Number(constants.energy),
      angularMomentumZ: Number(constants.angularMomentumZ),
      carterConstant: Number(constants.carterConstant),
    },
    geometry: {
      classification: "disk-hit" as const,
      emissionRadiusM: Number(geometry.emissionRadiusM),
      redshiftFactor: Number(geometry.redshiftFactor),
    },
    polarization: {
      evpaDeg: Number(polarization.v313WalkerPenroseEvpaDeg),
      orientationQHat: Number(basis.qHat),
      orientationUHat: Number(basis.uHat),
      orientationAvailable: true as const,
      polarizationAmplitude: null,
      stokesI: null,
      stokesQ: null,
      stokesU: null,
      stokesV: null,
    },
    coordinate: {
      continuousPixelX: Number(row420.continuousPixelX),
      continuousPixelY: Number(row420.continuousPixelY),
      semantics: "FITS-1-based-continuous-source-coordinate-not-pixel-sample" as const,
      pixelSample: null,
      interpolationAllowed: false as const,
      nearestPixelAssignmentAllowed: false as const,
    },
    radiometry: {
      intensity: null,
      reason: "no-admitted-radiometric-payload" as const,
    },
    uncertainty,
    sourceAuthoritySha256: {
      geometry: String(source419.v312GeometryEvidenceSha256),
      polarization: String(source419.v313PolarizationEvidenceSha256),
      screenCoordinate: String(docs.v419.artifactSha256),
      wcs: String(docs.v420.artifactSha256),
      orientationBasis: String(docs.v422.artifactSha256),
    },
  };
});

if (
  classificationMismatchCount !== 0 ||
  spinMismatchCount !== 0 ||
  redshiftMismatchCount !== 0 ||
  evpaMismatchCount !== 0 ||
  coordinateMismatchCount !== 0
) {
  throw new Error("v474-atomic-join-mismatch");
}

const rows = unsignedRows.map((row) =>
  Object.freeze({ ...row, rowSha256: canonicalSha(row) }),
) as readonly KerrSparseSciencePayloadRowV474[];
const payloadSha256 = canonicalSha(rows);
const source = Object.fromEntries(
  Object.entries(paths)
    .filter(([key]) => !["formal", "output"].includes(key))
    .map(([key, path]) => [key, fileSha(path)]),
);
const unsigned = {
  version: KERR_SPARSE_SCIENCE_PAYLOAD_ARTIFACT_VERSION_V474,
  generatedAt: "2026-07-30T00:00:00Z",
  status: "sparse-science-envelope-qualified-production-payload-blocked-browser-pending" as const,
  source,
  contract: {
    rowCount: 4 as const,
    uncertaintyReferenceCountPerRow: 7 as const,
    atomicJoinRequired: true as const,
    exactRayIdJoinRequired: true as const,
    exactRayIndexJoinRequired: true as const,
    sourceShaRequired: true as const,
    rowShaRequired: true as const,
    payloadShaRequired: true as const,
    continuousCoordinateIsNotPixelSample: true as const,
    orientationBasisIsNotStokes: true as const,
    sparseAuthorityIsNotDenseAuthority: true as const,
    boundedSummaryOnly: true as const,
    maximumResponseBytes: 131072 as const,
    formalProductPointer: "v263" as const,
    denseCampaignStatus: "incomplete-0-of-49" as const,
  },
  join: {
    sourceRowCounts: { v419: 4 as const, v420: 4 as const, v422: 4 as const },
    joinedRowCount: 4 as const,
    exactJoinKeyCount: 4 as const,
    duplicateJoinKeyCount: 0 as const,
    missingJoinKeyCount: 0 as const,
    classificationMismatchCount: 0 as const,
    spinMismatchCount: 0 as const,
    redshiftMismatchCount: 0 as const,
    evpaMismatchCount: 0 as const,
    coordinateMismatchCount: 0 as const,
    maximumContinuousCoordinateDifference,
    maximumEvpaDifferenceDeg,
    atomicJoinCommitted: true as const,
    partialJoinPublished: false as const,
  },
  rows,
  payloadSha256,
  qualification: {
    sparseAuthorityQualified: true as const,
    provenanceJoined: true as const,
    uncertaintyJoined: true as const,
    applicabilityExplicit: true as const,
    denseAuthorityQualified: false as const,
    productionPayloadQualified: false as const,
    scienceRasterQualified: false as const,
    fitsImageQualified: false as const,
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
    offlineSparseEnvelopeBuilt: true as const,
    productionSciencePayloadAllowed: false as const,
    sciencePixelRows: 0 as const,
    stokesMeasurementRows: 0 as const,
    fitsImageRows: 0 as const,
    runtimeSciencePayloadMutationAllowed: false as const,
    cinematicScienceWritebackAllowed: false as const,
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
const artifact = parseKerrSparseSciencePayloadArtifactV474({
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
      rowCount: artifact.rows.length,
      uncertaintyReferences: artifact.rows.reduce((sum, row) => sum + row.uncertainty.length, 0),
      joinMismatches: 0,
      maximumContinuousCoordinateDifference,
      maximumEvpaDifferenceDeg,
      sparseAuthority: true,
      productionPayload: false,
      sciencePixelRows: 0,
      denseCampaign: "0/49",
      browserQualification: "not-run",
    },
    null,
    2,
  ),
);
