import {
  createSparseKerrSciencePayloadV299,
  validateKerrScienceTransferPayloadV299,
} from "./strongGravityRenderingV299";
import {
  KERR_EMITTER_SOURCE_SHA256_V301,
  KERR_GEOMETRY_EVIDENCE_SHA256_V301,
  KERR_GEOMETRY_FILE_SHA256_V301,
  KERR_POLARIZATION_EVIDENCE_SHA256_V301,
  KERR_POLARIZATION_FILE_SHA256_V301,
  KERR_RAY_PLAN_FILE_SHA256_V301,
  KERR_RAY_PLAN_SHA256_V301,
  type KerrVector4V301,
} from "./kerrObserverEmitterReplayV301";
import {
  KERR_PARALLEL_TRANSPORT_MODEL_V304,
  KERR_POLARIZATION_VIEW_VERSION_V304,
  KERR_WALKER_PENROSE_MODEL_V304,
  computeKerrPolarizationMaximaV304,
  parseKerrPolarizationAuthorityViewV304,
  replayProjectedPolarizationV304,
  type KerrPolarizationExecutionV304,
  type KerrPolarizationRayViewV304,
} from "./kerrPolarizationViewV304";

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v304-server-${label}-invalid`);
  return value as UnknownRecord;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`v304-server-${label}-non-finite`);
  return value;
}

function vector4(values: readonly number[]): KerrVector4V301 {
  if (values.length !== 4 || !values.every(Number.isFinite)) throw new Error("v304-server-vector-invalid");
  return Object.freeze([...values]) as unknown as KerrVector4V301;
}

function execution(row: UnknownRecord): KerrPolarizationExecutionV304 {
  const transport = record(row.parallelTransport, "transport");
  const toleranceClass = row.toleranceClass === "release" ? "release" : row.toleranceClass === "internal" ? "internal" : null;
  const branch = row.branch === "A" ? "A" : row.branch === "B" ? "B" : null;
  if (!toleranceClass || !branch || transport.success !== true || row.passed !== true || row.applicability !== "applicable-disk-hit") {
    throw new Error("v304-server-execution-identity-invalid");
  }
  return Object.freeze({
    branch,
    toleranceClass,
    tolerance: finite(row.tolerance, "tolerance"),
    solverTolerance: finite(transport.solverTolerance, "solver-tolerance"),
    walkerPenroseEvpaDeg: finite(row.walkerPenroseEvpaDeg, "wp-evpa"),
    parallelTransportEvpaDeg: finite(row.parallelTransportEvpaDeg, "pt-evpa"),
    evpaDifferenceDeg: finite(row.evpaDifferenceDeg, "evpa-difference"),
    nullResidualNormalized: finite(transport.nullResidualNormalized, "null-residual"),
    orthogonalityResidualNormalized: finite(transport.orthogonalityResidualNormalized, "orthogonality-residual"),
    normResidual: finite(transport.normResidual, "norm-residual"),
    walkerPenroseInvariantDrift: finite(transport.walkerPenroseInvariantDrift, "wp-drift"),
    endpointResidual: finite(transport.endpointResidual, "endpoint-residual"),
    screenDirectionResidual: finite(row.screenDirectionResidual, "screen-direction-residual"),
    finalKsNormResidual: finite(transport.finalKsNormResidual, "final-ks-norm-residual"),
    stepCount: finite(transport.stepCount, "step-count"),
    sampleCount: finite(transport.sampleCount, "sample-count"),
  });
}

export function createKerrPolarizationAuthorityViewV304(
  geometryDocument: unknown,
  polarizationDocument: unknown,
  rayPlanDocument: unknown,
) {
  const geometry = record(geometryDocument, "geometry");
  const polarization = record(polarizationDocument, "polarization");
  const rayPlan = record(rayPlanDocument, "ray-plan");
  if (geometry.evidenceSha256 !== KERR_GEOMETRY_EVIDENCE_SHA256_V301
    || polarization.evidenceSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V301
    || rayPlan.planSha256 !== KERR_RAY_PLAN_SHA256_V301
    || !Array.isArray(rayPlan.rays) || rayPlan.rays.length !== 3097
    || !Array.isArray(polarization.payloads) || polarization.payloads.length !== 16) {
    throw new Error("v304-server-authority-lock-mismatch");
  }
  const canonicalRays = rayPlan.rays.slice(0, 16);
  const payload = createSparseKerrSciencePayloadV299(geometry, polarization, {
    version: "v299-kerr-canonical-ray-view-v1",
    planSha256: KERR_RAY_PLAN_SHA256_V301,
    planFileSha256: KERR_RAY_PLAN_FILE_SHA256_V301,
    canonicalRays,
  });
  const validation = validateKerrScienceTransferPayloadV299(payload);
  if (!validation.passed) throw new Error(`v304-server-sparse-payload-failed:${validation.failures.join(",")}`);
  const sourceRows = polarization.payloads.map((row) => record(row, "polarization-row"));
  const rays = [12, 13, 14, 15].map((index, localIndex) => {
    const rayId = `disk-0${localIndex}` as KerrPolarizationRayViewV304["rayId"];
    const rows = sourceRows.filter((row) => row.rayId === rayId);
    if (rows.length !== 4) throw new Error("v304-server-execution-matrix-count-failed");
    const release = ["A", "B"].map((branch) => execution(record(rows.find((row) => row.toleranceClass === "release" && row.branch === branch), "release-row"))) as [KerrPolarizationExecutionV304, KerrPolarizationExecutionV304];
    const internal = ["A", "B"].map((branch) => execution(record(rows.find((row) => row.toleranceClass === "internal" && row.branch === branch), "internal-row"))) as [KerrPolarizationExecutionV304, KerrPolarizationExecutionV304];
    const coordinatesBl = vector4([payload.diskEventCoordinateT[index], payload.emissionRadiusM[index], payload.diskEventCoordinateTheta[index], payload.diskEventCoordinatePhi[index]]);
    const wavevectorBl = vector4([payload.photonWavevectorT[index], payload.photonWavevectorR[index], payload.photonWavevectorTheta[index], payload.photonWavevectorPhi[index]]);
    const projectedSeed = replayProjectedPolarizationV304(payload.spinA[index], coordinatesBl, wavevectorBl);
    return Object.freeze({
      rayId,
      rayIndex: index as KerrPolarizationRayViewV304["rayIndex"],
      spinA: payload.spinA[index],
      emissionRadiusM: payload.emissionRadiusM[index],
      emitterModel: "projected-disk-normal" as const,
      projectedSeed,
      release: Object.freeze(release) as readonly [KerrPolarizationExecutionV304, KerrPolarizationExecutionV304],
      internal: Object.freeze(internal) as readonly [KerrPolarizationExecutionV304, KerrPolarizationExecutionV304],
      branchDeterministic: true as const,
    });
  });
  const symmetrySource = record(polarization.symmetryFixtures, "symmetry");
  const reflection = record(symmetrySource.reflection, "reflection");
  const signedSpin = record(symmetrySource.signedSpin, "signed-spin");
  const exactFaceOn = record(symmetrySource.exactFaceOn, "exact-face-on");
  if (symmetrySource.passed !== true
    || record(symmetrySource.schwarzschild, "schwarzschild").finite !== true
    || record(reflection.left, "reflection-left").finite !== true
    || record(reflection.right, "reflection-right").finite !== true
    || record(signedSpin.negative, "signed-negative").finite !== true
    || record(signedSpin.positive, "signed-positive").finite !== true
    || !Array.isArray(symmetrySource.nearFaceOn) || !symmetrySource.nearFaceOn.every((entry) => record(entry, "near-face-on").finite === true)
    || exactFaceOn.applicability !== "not-applicable-degenerate-emission-basis" || exactFaceOn.unavailable !== true) {
    throw new Error("v304-server-symmetry-fixture-failed");
  }
  const maxima = computeKerrPolarizationMaximaV304(rays);
  return parseKerrPolarizationAuthorityViewV304({
    version: KERR_POLARIZATION_VIEW_VERSION_V304,
    status: "polarization-authority-qualified",
    authority: {
      geometryEvidenceSha256: KERR_GEOMETRY_EVIDENCE_SHA256_V301,
      geometryFileSha256: KERR_GEOMETRY_FILE_SHA256_V301,
      polarizationEvidenceSha256: KERR_POLARIZATION_EVIDENCE_SHA256_V301,
      polarizationFileSha256: KERR_POLARIZATION_FILE_SHA256_V301,
      rayPlanSha256: KERR_RAY_PLAN_SHA256_V301,
      rayPlanFileSha256: KERR_RAY_PLAN_FILE_SHA256_V301,
      emitterSourceSha256: KERR_EMITTER_SOURCE_SHA256_V301,
    },
    models: { emitter: "projected-disk-normal", walkerPenrose: KERR_WALKER_PENROSE_MODEL_V304, parallelTransport: KERR_PARALLEL_TRANSPORT_MODEL_V304, evpaPeriodDeg: 180 },
    counts: { diskRayCount: 4, applicableExecutionCount: 16, captureEscapeNotApplicableCount: 96, kerrSchildGeometryCrossCheckExecutionCount: 16 },
    rays,
    symmetry: { passed: true, schwarzschildFinite: true, reflectionFinite: true, signedSpinFinite: true, nearFaceOnFinite: true, exactFaceOn: "not-applicable-degenerate-emission-basis" },
    maxima,
    boundary: "four-disk-rays-bounded-polarization-view-no-full-transport-trajectory",
    denseBoundary: "not-a-dense-polarization-map",
  });
}
