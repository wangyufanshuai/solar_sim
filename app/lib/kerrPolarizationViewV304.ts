import {
  KERR_EMITTER_SOURCE_SHA256_V301,
  KERR_GEOMETRY_EVIDENCE_SHA256_V301,
  KERR_GEOMETRY_FILE_SHA256_V301,
  KERR_POLARIZATION_EVIDENCE_SHA256_V301,
  KERR_POLARIZATION_FILE_SHA256_V301,
  KERR_RAY_PLAN_FILE_SHA256_V301,
  KERR_RAY_PLAN_SHA256_V301,
  resolveKerrEmitterRedshiftV301,
  type KerrVector4V301,
} from "./kerrObserverEmitterReplayV301";

export const KERR_POLARIZATION_VIEW_VERSION_V304 = "v304-kerr-polarization-authority-view-v1" as const;
export const KERR_WALKER_PENROSE_MODEL_V304 = "standard-complex-kerr-walker-penrose" as const;
export const KERR_PARALLEL_TRANSPORT_MODEL_V304 = "independent-cartesian-kerr-schild-hamiltonian-dop853" as const;
export const KERR_RELEASE_EVPA_LIMIT_DEG_V304 = 0.5;
export const KERR_INTERNAL_EVPA_LIMIT_DEG_V304 = 0.1;
export const KERR_RELEASE_INVARIANT_LIMIT_V304 = 1e-10;
export const KERR_INTERNAL_INVARIANT_LIMIT_V304 = 1e-11;
export const KERR_ENDPOINT_LIMIT_V304 = 1e-8;
export const KERR_PROJECTION_REPLAY_TOLERANCE_V304 = 1e-12;

export type KerrComplexV304 = Readonly<{ real: number; imaginary: number }>;
export type KerrDiskRayIdV304 = "disk-00" | "disk-01" | "disk-02" | "disk-03";
export type KerrToleranceClassV304 = "release" | "internal";

export type KerrProjectedPolarizationSeedV304 = Readonly<{
  coordinatesBl: KerrVector4V301;
  wavevectorBl: KerrVector4V301;
  polarizationBl: KerrVector4V301;
  photonEnergy: number;
  photonAngularMomentumZ: number;
  emitterPhotonFrequency: number;
  walkerPenroseConstant: KerrComplexV304;
  waveOrthogonalityResidual: number;
  emitterOrthogonalityResidual: number;
  polarizationNormResidual: number;
}>;

export type KerrPolarizationExecutionV304 = Readonly<{
  branch: "A" | "B";
  toleranceClass: KerrToleranceClassV304;
  tolerance: number;
  solverTolerance: number;
  walkerPenroseEvpaDeg: number;
  parallelTransportEvpaDeg: number;
  evpaDifferenceDeg: number;
  nullResidualNormalized: number;
  orthogonalityResidualNormalized: number;
  normResidual: number;
  walkerPenroseInvariantDrift: number;
  endpointResidual: number;
  screenDirectionResidual: number;
  finalKsNormResidual: number;
  stepCount: number;
  sampleCount: number;
}>;

export type KerrPolarizationRayViewV304 = Readonly<{
  rayId: KerrDiskRayIdV304;
  rayIndex: 12 | 13 | 14 | 15;
  spinA: number;
  emissionRadiusM: number;
  emitterModel: "projected-disk-normal";
  projectedSeed: KerrProjectedPolarizationSeedV304;
  release: readonly [KerrPolarizationExecutionV304, KerrPolarizationExecutionV304];
  internal: readonly [KerrPolarizationExecutionV304, KerrPolarizationExecutionV304];
  branchDeterministic: true;
}>;

export type KerrPolarizationAuthorityViewV304 = Readonly<{
  version: typeof KERR_POLARIZATION_VIEW_VERSION_V304;
  status: "polarization-authority-qualified";
  authority: Readonly<{
    geometryEvidenceSha256: typeof KERR_GEOMETRY_EVIDENCE_SHA256_V301;
    geometryFileSha256: typeof KERR_GEOMETRY_FILE_SHA256_V301;
    polarizationEvidenceSha256: typeof KERR_POLARIZATION_EVIDENCE_SHA256_V301;
    polarizationFileSha256: typeof KERR_POLARIZATION_FILE_SHA256_V301;
    rayPlanSha256: typeof KERR_RAY_PLAN_SHA256_V301;
    rayPlanFileSha256: typeof KERR_RAY_PLAN_FILE_SHA256_V301;
    emitterSourceSha256: typeof KERR_EMITTER_SOURCE_SHA256_V301;
  }>;
  models: Readonly<{
    emitter: "projected-disk-normal";
    walkerPenrose: typeof KERR_WALKER_PENROSE_MODEL_V304;
    parallelTransport: typeof KERR_PARALLEL_TRANSPORT_MODEL_V304;
    evpaPeriodDeg: 180;
  }>;
  counts: Readonly<{
    diskRayCount: 4;
    applicableExecutionCount: 16;
    captureEscapeNotApplicableCount: 96;
    kerrSchildGeometryCrossCheckExecutionCount: 16;
  }>;
  rays: readonly KerrPolarizationRayViewV304[];
  symmetry: Readonly<{
    passed: true;
    schwarzschildFinite: true;
    reflectionFinite: true;
    signedSpinFinite: true;
    nearFaceOnFinite: true;
    exactFaceOn: "not-applicable-degenerate-emission-basis";
  }>;
  maxima: Readonly<{
    releaseEvpaDifferenceDeg: number;
    internalEvpaDifferenceDeg: number;
    releaseInvariantResidual: number;
    internalInvariantResidual: number;
    endpointResidual: number;
    screenDirectionResidual: number;
    projectionReplayDifference: number;
  }>;
  boundary: "four-disk-rays-bounded-polarization-view-no-full-transport-trajectory";
  denseBoundary: "not-a-dense-polarization-map";
}>;

type UnknownRecord = Record<string, unknown>;

function record(value: unknown, label: string): UnknownRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`v304-${label}-invalid`);
  return value as UnknownRecord;
}

function finite(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`v304-${label}-non-finite`);
  return value;
}

function vector4(value: unknown, label: string): KerrVector4V301 {
  if (!Array.isArray(value) || value.length !== 4) throw new Error(`v304-${label}-invalid`);
  return Object.freeze(value.map((entry, index) => finite(entry, `${label}-${index}`))) as unknown as KerrVector4V301;
}

function evpaDifferenceDeg(first: number, second: number): number {
  const wrapped = Math.abs(first - second) % 180;
  return Math.min(wrapped, 180 - wrapped);
}

export function replayProjectedPolarizationV304(
  spinA: number,
  coordinatesBl: KerrVector4V301,
  wavevectorBl: KerrVector4V301,
): KerrProjectedPolarizationSeedV304 {
  const radiusM = coordinatesBl[1];
  const theta = coordinatesBl[2];
  if (Math.abs(theta - Math.PI / 2) > KERR_PROJECTION_REPLAY_TOLERANCE_V304) throw new Error("v304-emitter-not-equatorial");
  const sigma = radiusM * radiusM + spinA * spinA * Math.cos(theta) ** 2;
  const delta = radiusM * radiusM - 2 * radiusM + spinA * spinA;
  const sine2 = Math.max(1e-15, Math.sin(theta) ** 2);
  const gTt = -(1 - 2 * radiusM / sigma);
  const gTPhi = -2 * spinA * radiusM * sine2 / sigma;
  const gRr = sigma / delta;
  const gThetaTheta = sigma;
  const gPhiPhi = sine2 * (radiusM * radiusM + spinA * spinA + 2 * spinA * spinA * radiusM * sine2 / sigma);
  const metricDot = (left: readonly number[], right: readonly number[]) => gTt * left[0] * right[0]
    + gTPhi * (left[0] * right[3] + left[3] * right[0])
    + gRr * left[1] * right[1]
    + gThetaTheta * left[2] * right[2]
    + gPhiPhi * left[3] * right[3];
  const photonEnergy = -(gTt * wavevectorBl[0] + gTPhi * wavevectorBl[3]);
  const photonAngularMomentumZ = gTPhi * wavevectorBl[0] + gPhiPhi * wavevectorBl[3];
  const emitter = resolveKerrEmitterRedshiftV301(spinA, radiusM, photonEnergy, photonAngularMomentumZ);
  const emitterVector = [emitter.uT, 0, 0, emitter.uPhi] as const;
  const emitterPhotonFrequency = -metricDot(emitterVector, wavevectorBl);
  if (!(emitterPhotonFrequency > 0)) throw new Error("v304-emitter-frequency-nonphysical");
  const direction = wavevectorBl.map((value, index) => value / emitterPhotonFrequency - emitterVector[index]);
  const normal = [0, 0, 1 / radiusM, 0];
  const normalDirection = metricDot(normal, direction);
  const projection = normal.map((value, index) => value - normalDirection * direction[index]);
  const projectionEmitter = metricDot(projection, emitterVector);
  for (let index = 0; index < 4; index += 1) projection[index] += projectionEmitter * emitterVector[index];
  const projectionNorm = metricDot(projection, projection);
  if (!(projectionNorm > 1e-20)) throw new Error("v304-projected-basis-degenerate");
  const polarizationBl = Object.freeze(projection.map((value) => value / Math.sqrt(projectionNorm))) as unknown as KerrVector4V301;
  const waveOrthogonalityResidual = Math.abs(metricDot(polarizationBl, wavevectorBl));
  const emitterOrthogonalityResidual = Math.abs(metricDot(polarizationBl, emitterVector));
  const polarizationNormResidual = Math.abs(metricDot(polarizationBl, polarizationBl) - 1);
  const sine = Math.sin(theta);
  const aTerm = wavevectorBl[0] * polarizationBl[1] - wavevectorBl[1] * polarizationBl[0]
    + spinA * sine * sine * (wavevectorBl[1] * polarizationBl[3] - wavevectorBl[3] * polarizationBl[1]);
  const bTerm = sine * ((radiusM * radiusM + spinA * spinA)
    * (wavevectorBl[3] * polarizationBl[2] - wavevectorBl[2] * polarizationBl[3])
    - spinA * (wavevectorBl[0] * polarizationBl[2] - wavevectorBl[2] * polarizationBl[0]));
  const spinCosine = spinA * Math.cos(theta);
  return Object.freeze({
    coordinatesBl,
    wavevectorBl,
    polarizationBl,
    photonEnergy,
    photonAngularMomentumZ,
    emitterPhotonFrequency,
    walkerPenroseConstant: Object.freeze({ real: aTerm * radiusM - bTerm * spinCosine, imaginary: -aTerm * spinCosine - bTerm * radiusM }),
    waveOrthogonalityResidual,
    emitterOrthogonalityResidual,
    polarizationNormResidual,
  });
}

function parseExecution(
  value: unknown,
  toleranceClass: KerrToleranceClassV304,
  branch: "A" | "B",
): KerrPolarizationExecutionV304 {
  const candidate = record(value, `${toleranceClass}-${branch}`);
  const expectedTolerance = toleranceClass === "release" ? 1e-10 : 1e-12;
  const expectedSolverTolerance = toleranceClass === "release" ? 1e-12 : 2.3e-14;
  if (candidate.branch !== branch || candidate.toleranceClass !== toleranceClass
    || candidate.tolerance !== expectedTolerance || candidate.solverTolerance !== expectedSolverTolerance) {
    throw new Error("v304-execution-identity-mismatch");
  }
  const walkerPenroseEvpaDeg = finite(candidate.walkerPenroseEvpaDeg, "wp-evpa");
  const parallelTransportEvpaDeg = finite(candidate.parallelTransportEvpaDeg, "pt-evpa");
  const evpaDifference = finite(candidate.evpaDifferenceDeg, "evpa-difference");
  const invariantLimit = toleranceClass === "release" ? KERR_RELEASE_INVARIANT_LIMIT_V304 : KERR_INTERNAL_INVARIANT_LIMIT_V304;
  const evpaLimit = toleranceClass === "release" ? KERR_RELEASE_EVPA_LIMIT_DEG_V304 : KERR_INTERNAL_EVPA_LIMIT_DEG_V304;
  if (Math.abs(evpaDifferenceDeg(walkerPenroseEvpaDeg, parallelTransportEvpaDeg) - evpaDifference) > 1e-12 || evpaDifference >= evpaLimit) {
    throw new Error("v304-evpa-conservation-failed");
  }
  const residualKeys = ["nullResidualNormalized", "orthogonalityResidualNormalized", "normResidual", "walkerPenroseInvariantDrift", "finalKsNormResidual"] as const;
  const residuals = Object.fromEntries(residualKeys.map((key) => [key, finite(candidate[key], key)])) as Record<typeof residualKeys[number], number>;
  if (Object.values(residuals).some((residual) => residual < 0 || residual >= invariantLimit)) throw new Error("v304-invariant-residual-failed");
  const endpointResidual = finite(candidate.endpointResidual, "endpoint-residual");
  const screenDirectionResidual = finite(candidate.screenDirectionResidual, "screen-direction-residual");
  const stepCount = finite(candidate.stepCount, "step-count");
  const sampleCount = finite(candidate.sampleCount, "sample-count");
  if (endpointResidual < 0 || endpointResidual >= KERR_ENDPOINT_LIMIT_V304
    || screenDirectionResidual < 0 || screenDirectionResidual >= KERR_ENDPOINT_LIMIT_V304
    || !Number.isSafeInteger(stepCount) || stepCount < 1
    || !Number.isSafeInteger(sampleCount) || sampleCount < 2) throw new Error("v304-transport-endpoint-failed");
  return Object.freeze({
    branch,
    toleranceClass,
    tolerance: expectedTolerance,
    solverTolerance: expectedSolverTolerance,
    walkerPenroseEvpaDeg,
    parallelTransportEvpaDeg,
    evpaDifferenceDeg: evpaDifference,
    nullResidualNormalized: residuals.nullResidualNormalized,
    orthogonalityResidualNormalized: residuals.orthogonalityResidualNormalized,
    normResidual: residuals.normResidual,
    walkerPenroseInvariantDrift: residuals.walkerPenroseInvariantDrift,
    endpointResidual,
    screenDirectionResidual,
    finalKsNormResidual: residuals.finalKsNormResidual,
    stepCount,
    sampleCount,
  });
}

function comparableExecution(execution: KerrPolarizationExecutionV304): Omit<KerrPolarizationExecutionV304, "branch"> {
  const { branch, ...comparable } = execution;
  void branch;
  return comparable;
}

function parseRay(value: unknown, localIndex: number): KerrPolarizationRayViewV304 {
  const candidate = record(value, `ray-${localIndex}`);
  const rayId = `disk-0${localIndex}` as KerrDiskRayIdV304;
  const rayIndex = 12 + localIndex as 12 | 13 | 14 | 15;
  if (candidate.rayId !== rayId || candidate.rayIndex !== rayIndex || candidate.emitterModel !== "projected-disk-normal") {
    throw new Error("v304-ray-identity-mismatch");
  }
  const spinA = finite(candidate.spinA, "spin");
  const emissionRadiusM = finite(candidate.emissionRadiusM, "emission-radius");
  const seedCandidate = record(candidate.projectedSeed, "projected-seed");
  const coordinatesBl = vector4(seedCandidate.coordinatesBl, "coordinates-bl");
  const wavevectorBl = vector4(seedCandidate.wavevectorBl, "wavevector-bl");
  const storedPolarization = vector4(seedCandidate.polarizationBl, "polarization-bl");
  const replayed = replayProjectedPolarizationV304(spinA, coordinatesBl, wavevectorBl);
  const storedWp = record(seedCandidate.walkerPenroseConstant, "walker-penrose-constant");
  const differences = [
    ...storedPolarization.map((entry, index) => Math.abs(entry - replayed.polarizationBl[index])),
    Math.abs(finite(seedCandidate.photonEnergy, "photon-energy") - replayed.photonEnergy),
    Math.abs(finite(seedCandidate.photonAngularMomentumZ, "photon-lz") - replayed.photonAngularMomentumZ),
    Math.abs(finite(seedCandidate.emitterPhotonFrequency, "emitter-frequency") - replayed.emitterPhotonFrequency),
    Math.abs(finite(storedWp.real, "wp-real") - replayed.walkerPenroseConstant.real),
    Math.abs(finite(storedWp.imaginary, "wp-imaginary") - replayed.walkerPenroseConstant.imaginary),
    Math.abs(finite(seedCandidate.waveOrthogonalityResidual, "wave-orthogonality") - replayed.waveOrthogonalityResidual),
    Math.abs(finite(seedCandidate.emitterOrthogonalityResidual, "emitter-orthogonality") - replayed.emitterOrthogonalityResidual),
    Math.abs(finite(seedCandidate.polarizationNormResidual, "polarization-norm") - replayed.polarizationNormResidual),
  ];
  if (Math.abs(coordinatesBl[1] - emissionRadiusM) > KERR_PROJECTION_REPLAY_TOLERANCE_V304
    || Math.max(...differences) > KERR_PROJECTION_REPLAY_TOLERANCE_V304) throw new Error("v304-projection-replay-conservation-failed");
  if (!Array.isArray(candidate.release) || candidate.release.length !== 2
    || !Array.isArray(candidate.internal) || candidate.internal.length !== 2) throw new Error("v304-execution-matrix-count-failed");
  const release = Object.freeze([parseExecution(candidate.release[0], "release", "A"), parseExecution(candidate.release[1], "release", "B")]) as readonly [KerrPolarizationExecutionV304, KerrPolarizationExecutionV304];
  const internal = Object.freeze([parseExecution(candidate.internal[0], "internal", "A"), parseExecution(candidate.internal[1], "internal", "B")]) as readonly [KerrPolarizationExecutionV304, KerrPolarizationExecutionV304];
  if (JSON.stringify(comparableExecution(release[0])) !== JSON.stringify(comparableExecution(release[1]))
    || JSON.stringify(comparableExecution(internal[0])) !== JSON.stringify(comparableExecution(internal[1]))) {
    throw new Error("v304-branch-determinism-failed");
  }
  return Object.freeze({ rayId, rayIndex, spinA, emissionRadiusM, emitterModel: "projected-disk-normal", projectedSeed: replayed, release, internal, branchDeterministic: true });
}

const executionResidualMaximum = (execution: KerrPolarizationExecutionV304) => Math.max(
  execution.nullResidualNormalized,
  execution.orthogonalityResidualNormalized,
  execution.normResidual,
  execution.walkerPenroseInvariantDrift,
  execution.finalKsNormResidual,
);

export function computeKerrPolarizationMaximaV304(rays: readonly KerrPolarizationRayViewV304[]) {
  const releaseExecutions = rays.flatMap((ray) => ray.release);
  const internalExecutions = rays.flatMap((ray) => ray.internal);
  const projectionDifferences = rays.flatMap((ray) => {
    const replayed = replayProjectedPolarizationV304(ray.spinA, ray.projectedSeed.coordinatesBl, ray.projectedSeed.wavevectorBl);
    return [
      ...ray.projectedSeed.polarizationBl.map((entry, index) => Math.abs(entry - replayed.polarizationBl[index])),
      Math.abs(ray.projectedSeed.walkerPenroseConstant.real - replayed.walkerPenroseConstant.real),
      Math.abs(ray.projectedSeed.walkerPenroseConstant.imaginary - replayed.walkerPenroseConstant.imaginary),
    ];
  });
  return Object.freeze({
    releaseEvpaDifferenceDeg: Math.max(...releaseExecutions.map((execution) => execution.evpaDifferenceDeg)),
    internalEvpaDifferenceDeg: Math.max(...internalExecutions.map((execution) => execution.evpaDifferenceDeg)),
    releaseInvariantResidual: Math.max(...releaseExecutions.map(executionResidualMaximum)),
    internalInvariantResidual: Math.max(...internalExecutions.map(executionResidualMaximum)),
    endpointResidual: Math.max(...[...releaseExecutions, ...internalExecutions].map((execution) => execution.endpointResidual)),
    screenDirectionResidual: Math.max(...[...releaseExecutions, ...internalExecutions].map((execution) => execution.screenDirectionResidual)),
    projectionReplayDifference: Math.max(...projectionDifferences),
  });
}

export function parseKerrPolarizationAuthorityViewV304(source: unknown): KerrPolarizationAuthorityViewV304 {
  const candidate = record(source, "view");
  const authority = record(candidate.authority, "authority");
  const models = record(candidate.models, "models");
  const counts = record(candidate.counts, "counts");
  if (candidate.version !== KERR_POLARIZATION_VIEW_VERSION_V304
    || candidate.status !== "polarization-authority-qualified"
    || candidate.boundary !== "four-disk-rays-bounded-polarization-view-no-full-transport-trajectory"
    || candidate.denseBoundary !== "not-a-dense-polarization-map"
    || authority.geometryEvidenceSha256 !== KERR_GEOMETRY_EVIDENCE_SHA256_V301
    || authority.geometryFileSha256 !== KERR_GEOMETRY_FILE_SHA256_V301
    || authority.polarizationEvidenceSha256 !== KERR_POLARIZATION_EVIDENCE_SHA256_V301
    || authority.polarizationFileSha256 !== KERR_POLARIZATION_FILE_SHA256_V301
    || authority.rayPlanSha256 !== KERR_RAY_PLAN_SHA256_V301
    || authority.rayPlanFileSha256 !== KERR_RAY_PLAN_FILE_SHA256_V301
    || authority.emitterSourceSha256 !== KERR_EMITTER_SOURCE_SHA256_V301
    || models.emitter !== "projected-disk-normal"
    || models.walkerPenrose !== KERR_WALKER_PENROSE_MODEL_V304
    || models.parallelTransport !== KERR_PARALLEL_TRANSPORT_MODEL_V304
    || models.evpaPeriodDeg !== 180
    || counts.diskRayCount !== 4 || counts.applicableExecutionCount !== 16
    || counts.captureEscapeNotApplicableCount !== 96 || counts.kerrSchildGeometryCrossCheckExecutionCount !== 16
    || !Array.isArray(candidate.rays) || candidate.rays.length !== 4) {
    throw new Error("v304-polarization-authority-lock-mismatch");
  }
  const rays = Object.freeze(candidate.rays.map(parseRay));
  const maxima = computeKerrPolarizationMaximaV304(rays);
  const sourceMaxima = record(candidate.maxima, "maxima");
  if (Object.entries(maxima).some(([key, value]) => sourceMaxima[key] !== value)) throw new Error("v304-polarization-maxima-conservation-failed");
  const symmetry = record(candidate.symmetry, "symmetry");
  if (symmetry.passed !== true || symmetry.schwarzschildFinite !== true || symmetry.reflectionFinite !== true
    || symmetry.signedSpinFinite !== true || symmetry.nearFaceOnFinite !== true
    || symmetry.exactFaceOn !== "not-applicable-degenerate-emission-basis") throw new Error("v304-polarization-symmetry-failed");
  return Object.freeze({
    version: KERR_POLARIZATION_VIEW_VERSION_V304,
    status: "polarization-authority-qualified",
    authority: Object.freeze({
      geometryEvidenceSha256: KERR_GEOMETRY_EVIDENCE_SHA256_V301,
      geometryFileSha256: KERR_GEOMETRY_FILE_SHA256_V301,
      polarizationEvidenceSha256: KERR_POLARIZATION_EVIDENCE_SHA256_V301,
      polarizationFileSha256: KERR_POLARIZATION_FILE_SHA256_V301,
      rayPlanSha256: KERR_RAY_PLAN_SHA256_V301,
      rayPlanFileSha256: KERR_RAY_PLAN_FILE_SHA256_V301,
      emitterSourceSha256: KERR_EMITTER_SOURCE_SHA256_V301,
    }),
    models: Object.freeze({ emitter: "projected-disk-normal", walkerPenrose: KERR_WALKER_PENROSE_MODEL_V304, parallelTransport: KERR_PARALLEL_TRANSPORT_MODEL_V304, evpaPeriodDeg: 180 }),
    counts: Object.freeze({ diskRayCount: 4, applicableExecutionCount: 16, captureEscapeNotApplicableCount: 96, kerrSchildGeometryCrossCheckExecutionCount: 16 }),
    rays,
    symmetry: Object.freeze({ passed: true, schwarzschildFinite: true, reflectionFinite: true, signedSpinFinite: true, nearFaceOnFinite: true, exactFaceOn: "not-applicable-degenerate-emission-basis" }),
    maxima,
    boundary: "four-disk-rays-bounded-polarization-view-no-full-transport-trajectory",
    denseBoundary: "not-a-dense-polarization-map",
  });
}
