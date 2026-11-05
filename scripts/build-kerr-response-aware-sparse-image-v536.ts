import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  parseKerrResponseAwareSparseImageArtifactV536,
  type KerrResponseAwareSparseImageRowV536,
} from "../app/lib/kerrResponseAwareSparseImageV536";
import { parseKerrBandpassRedshiftCommutatorArtifactV534 } from "../app/lib/kerrBandpassRedshiftCommutatorV534";
import { parseKerrBandpassShiftJacobianArtifactV535 } from "../app/lib/kerrBandpassShiftJacobianV535";
const root = process.cwd(),
  paths = {
    v474: "dist/science/kerr-sparse-science-payload-v474/sparse-payload.json",
    v534: "dist/science/kerr-bandpass-redshift-commutator-v534/atlas.json",
    v535: "dist/science/kerr-bandpass-shift-jacobian-v535/atlas.json",
    detector: "dist/science/kerr-instrument-authority-matrix-v511/matrix.json",
    dense: "dist/science/kerr-campaign-v314/campaign-state.json",
    formal: "dist/release/orbit-atlas-current-product-evidence-v263.json",
    csv: "dist/science/kerr-response-aware-sparse-image-v536/sparse-image-plane.csv",
    output: "dist/science/kerr-response-aware-sparse-image-v536/atlas.json",
  } as const,
  transient = new Set([
    "generatedAt",
    "artifactSha256",
    "payloadSha256",
    "evidenceSha256",
    "pointerSha256",
    "stageChainSha256",
  ]),
  bytes = (path: string) => readFileSync(resolve(root, path)),
  read = (path: string) => JSON.parse(bytes(path).toString("utf8")),
  fileSha = (path: string) =>
    createHash("sha256").update(bytes(path)).digest("hex"),
  compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0),
  canonicalize = (value: unknown): unknown =>
    Array.isArray(value)
      ? value.map(canonicalize)
      : !value || typeof value !== "object"
        ? value
        : Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
              .filter(([key]) => !transient.has(key))
              .sort(([a], [b]) => compare(a, b))
              .map(([key, entry]) => [key, canonicalize(entry)]),
          ),
  sha = (value: unknown) =>
    createHash("sha256")
      .update(JSON.stringify(canonicalize(value)))
      .digest("hex"),
  atomic = (path: string, value: string) => {
    const target = resolve(root, path);
    mkdirSync(dirname(target), { recursive: true });
    const part = `${target}.${process.pid}.part`;
    writeFileSync(part, value);
    renameSync(part, target);
  };
type SparseSourceRowV474 = Readonly<{
  rayId: string;
  rayIndex: number;
  spinA: number;
  screen: Readonly<{ alphaM: number; betaM: number }>;
  geometry: Readonly<{ redshiftFactor: number }>;
  polarization: Readonly<{ evpaDeg: number; orientationQHat: number; orientationUHat: number }>;
  coordinate: Readonly<{ continuousPixelX: number; continuousPixelY: number }>;
  rowSha256: string;
}>;
const v474 = read(paths.v474),
  v534 = parseKerrBandpassRedshiftCommutatorArtifactV534(read(paths.v534)),
  v535 = parseKerrBandpassShiftJacobianArtifactV535(read(paths.v535)),
  detector = read(paths.detector),
  dense = read(paths.dense),
  formal = read(paths.formal),
  formalEvidence = read(formal.source);
if (
  v474.version !== "v474-kerr-sparse-science-payload-artifact-v1" ||
  v474.rows?.length !== 4 ||
  v474.qualification?.sparseAuthorityQualified !== true ||
  v474.boundary?.sciencePixelRows !== 0 ||
  v534.rows.length !== 4 ||
  v535.rows.length !== 4 ||
  detector.counts.measuredCalibrationFiles !== 0 ||
  dense.status !== "incomplete-0-of-49" ||
  formal.version !== "v263-current-product-evidence-pointer" ||
  formalEvidence.science?.defaultKernel !== "legacy-eih-1pn" ||
  formalEvidence.contracts?.singleCanvas !== true ||
  formalEvidence.contracts?.legacyRootAttributes !== 603 ||
  formalEvidence.contracts?.evidenceLedgerClaims !== 84
)
  throw new Error("v536-upstream-boundary");
let missing = 0,
  spinMismatch = 0,
  redshiftMismatch = 0;
const rows: readonly KerrResponseAwareSparseImageRowV536[] = Object.freeze(
  (v474.rows as readonly SparseSourceRowV474[]).map((base) => {
    const radiometry = v534.rows.find((row) => row.rayIndex === base.rayIndex),
      jacobian = v535.rows.find((row) => row.rayIndex === base.rayIndex);
    if (!radiometry || !jacobian) {
      missing += 1;
      throw new Error(`v536-missing:${base.rayIndex}`);
    }
    if (base.spinA !== radiometry.spinA || base.spinA !== jacobian.spinA)
      spinMismatch += 1;
    if (
      base.geometry.redshiftFactor !== radiometry.redshiftFactor ||
      base.geometry.redshiftFactor !== jacobian.redshiftFactor
    )
      redshiftMismatch += 1;
    const unsigned = {
      rayId: base.rayId,
      rayIndex: base.rayIndex,
      spinA: base.spinA,
      classification: "disk-hit" as const,
      screen: Object.freeze({
        alphaM: base.screen.alphaM,
        betaM: base.screen.betaM,
      }),
      coordinate: Object.freeze({
        continuousPixelX: base.coordinate.continuousPixelX,
        continuousPixelY: base.coordinate.continuousPixelY,
        semantics:
          "FITS-1-based-continuous-source-coordinate-not-pixel-sample" as const,
        pixelSample: null,
        interpolationAllowed: false as const,
        nearestPixelAssignmentAllowed: false as const,
      }),
      polarization: Object.freeze({
        evpaDeg: base.polarization.evpaDeg,
        orientationQHat: base.polarization.orientationQHat,
        orientationUHat: base.polarization.orientationUHat,
        stokesI: null,
        stokesQ: null,
        stokesU: null,
        stokesV: null,
      }),
      responseAwareRadiometry: Object.freeze({
        bandId: "visible" as const,
        observerBandpassPhotonRadiancePerSM2Sr:
          radiometry.observerBandpassPhotonRadiancePerSM2Sr,
        redshiftFactor: radiometry.redshiftFactor,
        responseShiftLogJacobian: jacobian.analyticResponseShiftLogJacobian,
        finiteShiftNonlinearRemainderRelative:
          jacobian.nonlinearRemainderSignedRelative,
        measuredWavelengthCalibrationSigmaLn: null,
        projectedInstrumentUncertaintyRelative: null,
        totalScientificUncertaintyRelative: "unavailable" as const,
      }),
      sourceRowSha256: Object.freeze({
        v474: base.rowSha256,
        v534: v534.artifactSha256,
        v535Artifact: v535.artifactSha256,
      }),
    };
    return Object.freeze({ ...unsigned, rowSha256: sha(unsigned) });
  }),
);
if (
  missing ||
  spinMismatch ||
  redshiftMismatch ||
  new Set(rows.map((row) => row.rayIndex)).size !== 4
)
  throw new Error("v536-join-boundary");
const csv = [
  "ray_id,ray_index,spin_a,continuous_pixel_x,continuous_pixel_y,alpha_m,beta_m,redshift_factor,evpa_deg,orientation_q_hat,orientation_u_hat,observer_bandpass_photon_radiance_per_s_m2_sr,response_shift_log_jacobian,finite_shift_nonlinear_remainder_relative,physical_uncertainty_status,pixel_sample\n",
  ...rows.map(
    (row) =>
      `${row.rayId},${row.rayIndex},${row.spinA},${row.coordinate.continuousPixelX},${row.coordinate.continuousPixelY},${row.screen.alphaM},${row.screen.betaM},${row.responseAwareRadiometry.redshiftFactor},${row.polarization.evpaDeg},${row.polarization.orientationQHat},${row.polarization.orientationUHat},${row.responseAwareRadiometry.observerBandpassPhotonRadiancePerSM2Sr},${row.responseAwareRadiometry.responseShiftLogJacobian},${row.responseAwareRadiometry.finiteShiftNonlinearRemainderRelative},unavailable,\n`,
  ),
].join("");
atomic(paths.csv, csv);
const sourcePaths = [
    paths.v474,
    paths.v534,
    paths.v535,
    paths.detector,
    paths.dense,
    paths.formal,
    "app/lib/kerrResponseAwareSparseImageV536.ts",
    "scripts/build-kerr-response-aware-sparse-image-v536.ts",
  ],
  sourceManifest = sourcePaths
    .map((path) => ({ path, sha256: fileSha(path) }))
    .sort((a, b) => compare(a.path, b.path)),
  unsigned = {
    version: "v536-kerr-response-aware-sparse-image-plane-v1" as const,
    generatedAt: "2026-08-02T00:00:00Z",
    status:
      "response-aware-sparse-image-plane-qualified-raster-unavailable" as const,
    source: Object.freeze({
      v474SparsePayloadSha256: v474.artifactSha256,
      v534BandpassArtifactSha256: v534.artifactSha256,
      v535JacobianArtifactSha256: v535.artifactSha256,
      denseAggregateSha256: null,
    }),
    contract: Object.freeze({
      rowCount: 4 as const,
      exactRayIndexJoinRequired: true as const,
      exactSpinAndRedshiftJoinRequired: true as const,
      continuousCoordinateIsNotPixelSample: true as const,
      sparseSamplesAreNotRaster: true as const,
      interpolationAllowed: false as const,
      nearestPixelAssignmentAllowed: false as const,
      rowShaRequired: true as const,
      payloadShaRequired: true as const,
    }),
    rows,
    joinAudit: Object.freeze({
      sourceRowCountV474: 4,
      sourceRowCountV534: 4,
      sourceRowCountV535: 4,
      joinedRowCount: 4,
      missingJoinCount: missing,
      spinMismatchCount: spinMismatch,
      redshiftMismatchCount: redshiftMismatch,
      duplicateJoinCount: 0,
      atomicJoinCommitted: true,
      partialJoinPublished: false,
    }),
    counts: Object.freeze({
      sparseAuthoritySampleCount: 4 as const,
      responseAwareRadiometryRowCount: 4 as const,
      continuousCoordinateCount: 4 as const,
      evpaOrientationCount: 4 as const,
      physicalUncertaintyIntervalCount: 0 as const,
      pixelSampleCount: 0 as const,
      rasterPixelCount: 0 as const,
      fitsImageCount: 0 as const,
      pngImageCount: 0 as const,
    }),
    export: Object.freeze({
      csvPath: paths.csv,
      csvFileSha256: fileSha(paths.csv),
      rowCount: 4 as const,
    }),
    payloadSha256: sha(rows),
    qualification: Object.freeze({
      responseAwareSparsePayloadQualified: true as const,
      coordinateProvenanceQualified: true as const,
      radiometryProvenanceQualified: true as const,
      jacobianProvenanceQualified: true as const,
      scienceCinematicIsolationQualified: true as const,
      denseAuthorityQualified: false as const,
      scienceRasterQualified: false as const,
      productionImageQualified: false as const,
    }),
    boundary: Object.freeze({
      sparseImagePlaneSampleNotRaster: true as const,
      sourceDossierStatus: "incomplete-1-of-7" as const,
      measuredCalibrationFiles: 0 as const,
      requiredMeasuredCalibrationFiles: 6 as const,
      sciencePayloadMutationAllowed: false as const,
      cinematicScienceWritebackAllowed: false as const,
      networkAttempted: false as const,
      denseCampaignStatus: "incomplete-0-of-49" as const,
      browserQualification: "not-run" as const,
      formalProductPointer: "v263" as const,
      formalDefaultKernel: "legacy-eih-1pn" as const,
    }),
    sourceManifest,
    sourceSha256: sha(sourceManifest),
  },
  artifact = parseKerrResponseAwareSparseImageArtifactV536({
    ...unsigned,
    artifactSha256: sha(unsigned),
  });
atomic(paths.output, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      status: artifact.status,
      artifactSha256: artifact.artifactSha256,
      payloadSha256: artifact.payloadSha256,
      rows: 4,
      rasterPixels: 0,
      fitsImages: 0,
      pngImages: 0,
      csvSha256: artifact.export.csvFileSha256,
    },
    null,
    2,
  ),
);
