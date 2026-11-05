import { kerrIscoRadiusV278, novikovThorneFluxV278 } from "./strongGravityRenderingV278";
import {
  KERR_DENSE_RAY_PLAN_FILE_SHA256_V298R1,
  KERR_DENSE_RAY_PLAN_SHA256_V298R1,
  type KerrDenseRayPlanEntryV298R1,
} from "./kerrCampaignV298R1";
import { KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314 } from "./kerrCampaignV314";

export const STRONG_GRAVITY_RENDERING_V299_VERSION = "v299-strong-gravity-science-cinematic-boundary" as const;
export const KERR_SCIENCE_RELEASE_RESIDUAL_LIMIT_V299 = 1e-10;
export const KERR_SCIENCE_RELEASE_EVPA_DIFFERENCE_LIMIT_DEG_V299 = 0.5;
export const KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299 = 1e-10;
export const KERR_SCIENCE_RELEASE_POLARIZATION_ENDPOINT_LIMIT_V299 = 1e-8;
export const KERR_SCIENCE_KS_PULLBACK_LIMIT_V299 = 1e-12;
export const KERR_SCIENCE_KS_COVECTOR_LIMIT_V299 = 1e-12;
export const KERR_SCIENCE_KS_METRIC_DERIVATIVE_LIMIT_V299 = 1e-8;
export const KERR_SCIENCE_FORMULA_DISK_RADIUS_DIFFERENCE_LIMIT_M_V299 = 1e-8;
export const KERR_SCIENCE_FORMULA_REDSHIFT_DIFFERENCE_LIMIT_V299 = 0.005;
export const KERR_SCIENCE_TETRAD_RESIDUAL_LIMIT_V299 = 1e-12;
export const KERR_SCIENCE_OBSERVER_SOURCE_SHA256_V299 = "03b609562dad3efb149976b17fee81b5bbd865ef8ca90d2a9b64eb79a3848884" as const;
export const KERR_SCIENCE_OBSERVER_FRAME_VERSION_V299 = "finite-distance-zamo-r30-theta70-v299" as const;
export const KERR_SCIENCE_EMITTER_SOURCE_SHA256_V299 = "9af38d3306febbb6d2becd1a7a65d8c8fa970262bf7a3d2dd6aae441beda8326" as const;
export const KERR_SCIENCE_EMITTER_FRAME_VERSION_V299 = "equatorial-circular-geodesic-bl-v297" as const;
export const KERR_SCIENCE_DISK_INNER_EDGE_MODEL_V299 = "signed-spin-isco-v291" as const;
export const KERR_SCIENCE_DISK_OUTER_RADIUS_M_V299 = 20 as const;
export const KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299 = 1e-12;
export const KERR_SCIENCE_WALKER_PENROSE_MODEL_V299 = "standard-complex-kerr-walker-penrose" as const;
export const KERR_SCIENCE_PARALLEL_TRANSPORT_MODEL_V299 = "independent-cartesian-kerr-schild-hamiltonian-dop853" as const;
export const KERR_SCIENCE_PARALLEL_TRANSPORT_RELEASE_TOLERANCE_V299 = 1e-12;

export type StrongGravityRenderModeV299 = "science" | "cinematic";
export type KerrScienceAuthorityKindV299 =
  | "v296-v297-short-gate-sparse"
  | "v312-v313-short-gate-sparse"
  | "v298r1-dense-complete"
  | "v314-dense-complete";
export type KerrScienceErrorBudgetVersionV299 =
  | "v299-sparse-release-residual-budget-v1"
  | "v315-sparse-release-residual-budget-v1"
  | "v298r1-dense-kerr-error-budget-v1"
  | "v314-dense-kerr-error-budget-v1";

export type KerrScienceTransferPayloadV299 = {
  readonly version: typeof STRONG_GRAVITY_RENDERING_V299_VERSION;
  readonly authorityKind: KerrScienceAuthorityKindV299;
  readonly geometryEvidenceSha256: string;
  readonly polarizationEvidenceSha256: string;
  readonly rayPlanSha256: string;
  readonly denseAggregateSha256: string | null;
  readonly errorBudgetVersion: KerrScienceErrorBudgetVersionV299;
  readonly observerFrameVersion: typeof KERR_SCIENCE_OBSERVER_FRAME_VERSION_V299;
  readonly observerRadiusM: 30;
  readonly observerInclinationDeg: 70;
  readonly observerSourceSha256: typeof KERR_SCIENCE_OBSERVER_SOURCE_SHA256_V299;
  readonly emitterFrameVersion: typeof KERR_SCIENCE_EMITTER_FRAME_VERSION_V299;
  readonly emitterSourceSha256: typeof KERR_SCIENCE_EMITTER_SOURCE_SHA256_V299;
  readonly diskInnerEdgeModel: typeof KERR_SCIENCE_DISK_INNER_EDGE_MODEL_V299;
  readonly diskOuterRadiusM: typeof KERR_SCIENCE_DISK_OUTER_RADIUS_M_V299;
  readonly walkerPenroseModel: typeof KERR_SCIENCE_WALKER_PENROSE_MODEL_V299;
  readonly parallelTransportModel: typeof KERR_SCIENCE_PARALLEL_TRANSPORT_MODEL_V299;
  readonly sampleCount: number;
  readonly alphaM: Float64Array;
  readonly betaM: Float64Array;
  readonly spinA: Float64Array;
  readonly classification: Uint8Array;
  readonly kerrSchildClassification: Uint8Array;
  readonly selectedEventKind: Uint8Array;
  readonly selectedEventParameter: Float64Array;
  readonly selectedEventRadiusM: Float64Array;
  readonly eventCount: Uint16Array;
  readonly validEventCount: Uint16Array;
  readonly invalidEventCount: Uint16Array;
  readonly validDiskCrossingCount: Uint16Array;
  readonly emissionRadiusM: Float64Array;
  readonly kerrSchildEmissionRadiusM: Float64Array;
  readonly geometryDiskRadiusDifferenceM: Float64Array;
  readonly redshiftFactor: Float64Array;
  readonly kerrSchildRedshiftFactor: Float64Array;
  readonly geometryRedshiftDifference: Float64Array;
  readonly redshiftApplicable: Uint8Array;
  readonly photonEnergy: Float64Array;
  readonly photonAngularMomentumZ: Float64Array;
  readonly emitterAngularVelocity: Float64Array;
  readonly emitterUt: Float64Array;
  readonly emitterUphi: Float64Array;
  readonly emitterPhotonFrequency: Float64Array;
  readonly emitterFourVelocityNormResidual: Float64Array;
  readonly emitterWaveOrthogonalityResidual: Float64Array;
  readonly emitterPolarizationOrthogonalityResidual: Float64Array;
  readonly emitterPolarizationNormResidual: Float64Array;
  readonly diskEventCoordinateT: Float64Array;
  readonly diskEventCoordinateTheta: Float64Array;
  readonly diskEventCoordinatePhi: Float64Array;
  readonly photonWavevectorT: Float64Array;
  readonly photonWavevectorR: Float64Array;
  readonly photonWavevectorTheta: Float64Array;
  readonly photonWavevectorPhi: Float64Array;
  readonly polarizationVectorT: Float64Array;
  readonly polarizationVectorR: Float64Array;
  readonly polarizationVectorTheta: Float64Array;
  readonly polarizationVectorPhi: Float64Array;
  readonly walkerPenroseConstantReal: Float64Array;
  readonly walkerPenroseConstantImaginary: Float64Array;
  readonly parallelTransportSolverTolerance: Float64Array;
  readonly parallelTransportStepCount: Uint32Array;
  readonly parallelTransportSampleCount: Uint16Array;
  readonly parallelTransportFinalKsNormResidual: Float64Array;
  readonly imageOrder: Int16Array;
  readonly imageOrderApplicable: Uint8Array;
  readonly evpaDeg: Float64Array;
  readonly parallelTransportEvpaDeg: Float64Array;
  readonly evpaDifferenceDeg: Float64Array;
  readonly evpaApplicable: Uint8Array;
  readonly polarizationNullResidualNormalized: Float64Array;
  readonly polarizationOrthogonalityResidualNormalized: Float64Array;
  readonly polarizationNormResidual: Float64Array;
  readonly walkerPenroseInvariantDrift: Float64Array;
  readonly polarizationEndpointResidual: Float64Array;
  readonly screenDirectionResidual: Float64Array;
  readonly intensity: Float64Array;
  readonly massShellResidualNormalized: Float64Array;
  readonly carterResidualNormalized: Float64Array;
  readonly kerrSchildMassShellResidualNormalized: Float64Array;
  readonly metricPullbackResidual: Float64Array;
  readonly covectorRoundtripResidual: Float64Array;
  readonly metricDerivativeAuditResidual: Float64Array;
  readonly tetradResidual: Float64Array;
  readonly kerrSchildTetradResidual: Float64Array;
  readonly denseCampaignComplete: boolean;
  readonly boundary: "test-particle-kerr-thin-disk-not-grmhd";
};

export type StrongGravityRendererBoundaryV299 = {
  readonly version: typeof STRONG_GRAVITY_RENDERING_V299_VERSION;
  readonly science: {
    readonly acceptedAuthority: readonly [
      "v296-v297-short-gate-sparse",
      "v312-v313-short-gate-sparse",
      "v298r1-dense-complete",
      "v314-dense-complete",
    ];
    readonly displayTransform: "fixed-linear-srgb";
    readonly bloom: false;
    readonly randomNoise: false;
    readonly partialDenseAggregateAccepted: false;
  };
  readonly cinematic: {
    readonly geometryMayBeDecorated: true;
    readonly scientificBuffersMutable: false;
    readonly noise: "seeded-only";
    readonly fallback: "legacy-v3-visual-approximation";
  };
  readonly cpuAuthority: "v312-geometry+v313-polarization";
};

export const STRONG_GRAVITY_RENDERER_BOUNDARY_V299: StrongGravityRendererBoundaryV299 = Object.freeze({
  version: STRONG_GRAVITY_RENDERING_V299_VERSION,
  science: Object.freeze({
    acceptedAuthority: [
      "v296-v297-short-gate-sparse",
      "v312-v313-short-gate-sparse",
      "v298r1-dense-complete",
      "v314-dense-complete",
    ] as const,
    displayTransform: "fixed-linear-srgb",
    bloom: false,
    randomNoise: false,
    partialDenseAggregateAccepted: false,
  }),
  cinematic: Object.freeze({
    geometryMayBeDecorated: true,
    scientificBuffersMutable: false,
    noise: "seeded-only",
    fallback: "legacy-v3-visual-approximation",
  }),
  cpuAuthority: "v312-geometry+v313-polarization",
});

export const KERR_CLASSIFICATION_V299 = Object.freeze({
  unavailable: 0,
  capture: 1,
  escape: 2,
  "disk-hit": 3,
} as const);

export type KerrSciencePixelV299 = readonly [number, number, number, number];

function displayByte(value: number): number {
  return Math.round(Math.max(0, Math.min(255, value)));
}

/**
 * Fixed, deterministic science-display encoding. Missing disk observables are
 * rendered as an explicit amber unavailable sentinel; they are never silently
 * interpreted as a unit redshift. Cinematic grading must not consume this
 * function or mutate its source payload.
 */
export function encodeKerrSciencePixelV299(
  classification: number,
  redshiftFactor: number,
  redshiftApplicable: boolean,
): KerrSciencePixelV299 {
  if (classification === KERR_CLASSIFICATION_V299.capture) return [76, 86, 104, 255];
  if (classification === KERR_CLASSIFICATION_V299["disk-hit"]) {
    if (!redshiftApplicable || !Number.isFinite(redshiftFactor) || redshiftFactor <= 0) {
      return [255, 191, 0, 255];
    }
    return [
      displayByte(150 * redshiftFactor),
      displayByte(96 + 48 / Math.max(redshiftFactor, 0.2)),
      54,
      255,
    ];
  }
  return [72, 164, 204, 230];
}

/** Deterministic sparse-authority observer intensity using Liouville g^3. */
export function observedThinDiskIntensityV299(spinA: number, radiusM: number, redshiftFactor: number): number {
  if (![spinA, radiusM, redshiftFactor].every(Number.isFinite) || radiusM <= 0 || redshiftFactor <= 0) return 0;
  return Math.max(0, novikovThorneFluxV278({ spinA, radiusM }) * redshiftFactor ** 3);
}

export type KerrCircularEmitterStateV299 = Readonly<{
  angularVelocity: number;
  uT: number;
  uPhi: number;
  photonFrequency: number;
  fourVelocityNormResidual: number;
}>;

export type KerrProjectedDiskNormalReplayV299 = Readonly<{
  polarization: readonly [number, number, number, number];
  photonEnergy: number;
  photonAngularMomentumZ: number;
  photonFrequency: number;
  waveOrthogonalityResidual: number;
  emitterOrthogonalityResidual: number;
  polarizationNormResidual: number;
  walkerPenroseConstantReal: number;
  walkerPenroseConstantImaginary: number;
}>;

/**
 * Replays the v296/v297 equatorial circular test-particle emitter in
 * dimensionless G=M=c=1 Boyer-Lindquist coordinates. The returned photon
 * frequency is -k.u_emitter = u^t(E - Omega Lz).
 */
export function resolveKerrCircularEmitterV299(
  spinA: number,
  radiusM: number,
  photonEnergy: number,
  photonAngularMomentumZ: number,
): KerrCircularEmitterStateV299 {
  const innerRadiusM = kerrIscoRadiusV278(spinA);
  if (![spinA, radiusM, photonEnergy, photonAngularMomentumZ].every(Number.isFinite)
    || Math.abs(spinA) > 0.998
    || radiusM < innerRadiusM
    || radiusM > KERR_SCIENCE_DISK_OUTER_RADIUS_M_V299) throw new Error("v299 emitter input is outside the frozen thin-disk boundary");
  const gTt = -(1 - 2 / radiusM);
  const gTPhi = -2 * spinA / radiusM;
  const gPhiPhi = radiusM * radiusM + spinA * spinA + 2 * spinA * spinA / radiusM;
  const angularVelocity = 1 / (radiusM ** 1.5 + spinA);
  const normalization = -(gTt + 2 * angularVelocity * gTPhi + angularVelocity * angularVelocity * gPhiPhi);
  if (!(normalization > 0)) throw new Error("v299 emitter four-velocity is nonphysical");
  const uT = 1 / Math.sqrt(normalization);
  const uPhi = angularVelocity * uT;
  const photonFrequency = uT * (photonEnergy - angularVelocity * photonAngularMomentumZ);
  if (!(photonFrequency > 0)) throw new Error("v299 emitter photon frequency is nonpositive");
  const fourVelocityNorm = gTt * uT * uT + 2 * gTPhi * uT * uPhi + gPhiPhi * uPhi * uPhi;
  return Object.freeze({
    angularVelocity,
    uT,
    uPhi,
    photonFrequency,
    fourVelocityNormResidual: Math.abs(fourVelocityNorm + 1),
  });
}

/** Independent browser-side replay of the frozen v297 projected disk normal. */
export function replayProjectedDiskNormalPolarizationV299(
  spinA: number,
  coordinatesBl: readonly number[],
  wavevectorBl: readonly number[],
): KerrProjectedDiskNormalReplayV299 {
  if (coordinatesBl.length !== 4 || wavevectorBl.length !== 4
    || !coordinatesBl.every(Number.isFinite) || !wavevectorBl.every(Number.isFinite)) throw new Error("v299 polarization seed is non-finite");
  const radiusM = coordinatesBl[1];
  const theta = coordinatesBl[2];
  if (Math.abs(theta - Math.PI / 2) > KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299) throw new Error("v299 disk emitter is not equatorial");
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
  const emitterState = resolveKerrCircularEmitterV299(spinA, radiusM, photonEnergy, photonAngularMomentumZ);
  const emitter = [emitterState.uT, 0, 0, emitterState.uPhi] as const;
  const photonFrequency = -metricDot(emitter, wavevectorBl);
  if (!(photonFrequency > 0)) throw new Error("v299 projected polarization frequency is nonpositive");
  const direction = wavevectorBl.map((value, index) => value / photonFrequency - emitter[index]);
  const normal = [0, 0, 1 / radiusM, 0];
  const normalDirection = metricDot(normal, direction);
  const projection = normal.map((value, index) => value - normalDirection * direction[index]);
  const projectionEmitter = metricDot(projection, emitter);
  for (let index = 0; index < 4; index += 1) projection[index] += projectionEmitter * emitter[index];
  const projectionNorm = metricDot(projection, projection);
  if (!(projectionNorm > 1e-20)) throw new Error("v299 projected polarization basis is degenerate");
  const polarization = projection.map((value) => value / Math.sqrt(projectionNorm)) as [number, number, number, number];
  const waveOrthogonalityResidual = Math.abs(metricDot(polarization, wavevectorBl));
  const emitterOrthogonalityResidual = Math.abs(metricDot(polarization, emitter));
  const polarizationNormResidual = Math.abs(metricDot(polarization, polarization) - 1);
  const sine = Math.sin(theta);
  const aTerm = wavevectorBl[0] * polarization[1] - wavevectorBl[1] * polarization[0]
    + spinA * sine * sine * (wavevectorBl[1] * polarization[3] - wavevectorBl[3] * polarization[1]);
  const bTerm = sine * ((radiusM * radiusM + spinA * spinA)
    * (wavevectorBl[3] * polarization[2] - wavevectorBl[2] * polarization[3])
    - spinA * (wavevectorBl[0] * polarization[2] - wavevectorBl[2] * polarization[0]));
  const spinCosine = spinA * Math.cos(theta);
  return Object.freeze({
    polarization: Object.freeze(polarization) as readonly [number, number, number, number],
    photonEnergy,
    photonAngularMomentumZ,
    photonFrequency,
    waveOrthogonalityResidual,
    emitterOrthogonalityResidual,
    polarizationNormResidual,
    walkerPenroseConstantReal: aTerm * radiusM - bTerm * spinCosine,
    walkerPenroseConstantImaginary: -aTerm * spinCosine - bTerm * radiusM,
  });
}

/** Minimal EVPA separation under the physical 180 degree polarization period. */
export function evpaDifferenceDegV299(firstDeg: number, secondDeg: number): number {
  if (!Number.isFinite(firstDeg) || !Number.isFinite(secondDeg)) return Number.NaN;
  const wrapped = Math.abs(firstDeg - secondDeg) % 180;
  return Math.min(wrapped, 180 - wrapped);
}

type EvidenceExecution = {
  rayId?: unknown;
  spin?: unknown;
  formulation?: unknown;
  toleranceClass?: unknown;
  branch?: unknown;
  classification?: unknown;
  diskRadiusM?: unknown;
  redshift?: unknown;
  massShellResidualNormalized?: unknown;
  carterResidualNormalized?: unknown;
  metricPullbackResidual?: unknown;
  covectorRoundtripResidual?: unknown;
  metricDerivativeAuditResidual?: unknown;
  tetradResidual?: unknown;
  polarizationSeed?: unknown;
  selectedEvent?: unknown;
  events?: unknown;
};

type PolarizationExecution = {
  rayId?: unknown;
  toleranceClass?: unknown;
  branch?: unknown;
  applicability?: unknown;
  walkerPenroseEvpaDeg?: unknown;
  parallelTransportEvpaDeg?: unknown;
  evpaDifferenceDeg?: unknown;
  emissionRadiusM?: unknown;
  emitterModel?: unknown;
  emitterResiduals?: unknown;
  walkerPenroseConstant?: unknown;
  passed?: unknown;
  parallelTransport?: unknown;
  screenDirectionResidual?: unknown;
};

type CanonicalRayViewV299 = {
  version?: unknown;
  planSha256?: unknown;
  planFileSha256?: unknown;
  canonicalRays?: unknown;
};

function finite(value: unknown, fallback = Number.NaN): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nearlyEqual(first: number, second: number, tolerance = 1e-12): boolean {
  return Number.isFinite(first) && Number.isFinite(second)
    && Math.abs(first - second) <= tolerance * Math.max(1, Math.abs(first), Math.abs(second));
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function sha(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

export function createSparseKerrSciencePayloadV299(
  geometryDocument: unknown,
  polarizationDocument: unknown,
  canonicalRayViewDocument: unknown,
): KerrScienceTransferPayloadV299 {
  const geometry = record(geometryDocument);
  const polarization = record(polarizationDocument);
  const canonicalRayView = record(canonicalRayViewDocument) as CanonicalRayViewV299;
  if (geometry.geometryRedshiftQualified !== true || polarization.qualified !== true
    || !sha(geometry.evidenceSha256) || !sha(polarization.evidenceSha256)) {
    throw new Error("v299 qualified short-authority evidence is unavailable");
  }
  if (geometry.baseAuthoritySource !== "scripts/run-kerr-authority-v291.py"
    || geometry.baseAuthoritySourceSha256 !== KERR_SCIENCE_OBSERVER_SOURCE_SHA256_V299) {
    throw new Error("v299 observer authority source mismatch");
  }
  const polarizationScience = record(polarization.science);
  if (polarizationScience.emitterModel !== "projected-disk-normal"
    || polarizationScience.walkerPenroseModel !== KERR_SCIENCE_WALKER_PENROSE_MODEL_V299
    || polarizationScience.parallelTransportModel !== KERR_SCIENCE_PARALLEL_TRANSPORT_MODEL_V299) {
    throw new Error("v299 polarization authority model mismatch");
  }
  const canonicalRays = Array.isArray(canonicalRayView.canonicalRays)
    ? canonicalRayView.canonicalRays as KerrDenseRayPlanEntryV298R1[]
    : [];
  if (canonicalRayView.version !== "v299-kerr-canonical-ray-view-v1"
    || canonicalRayView.planSha256 !== KERR_DENSE_RAY_PLAN_SHA256_V298R1
    || canonicalRayView.planFileSha256 !== KERR_DENSE_RAY_PLAN_FILE_SHA256_V298R1
    || canonicalRays.length !== 16
    || canonicalRays.some((ray, index) => ray.rayIndex !== index
      || ray.stratum !== "canonical"
      || typeof ray.rayId !== "string"
      || !Number.isFinite(ray.alphaM)
      || !Number.isFinite(ray.betaM)
      || !Number.isFinite(ray.spinA))) throw new Error("v299 canonical ray-plan authority is unavailable");
  const canonicalRayById = new Map(canonicalRays.map((ray) => [ray.rayId, ray]));
  if (canonicalRayById.size !== 16) throw new Error("v299 canonical ray-plan identity collision");
  const geometryRows = Array.isArray(geometry.executions) ? geometry.executions as EvidenceExecution[] : [];
  const selected = geometryRows.filter((row) => row.formulation === "carter-mino-dop853-constraint-stabilized-v296"
    && row.toleranceClass === "release" && row.branch === "A");
  if (selected.length !== 16) throw new Error("v299 sparse geometry conservation failed");
  const kerrSchildByRay = new Map(geometryRows
    .filter((row) => row.formulation === "cartesian-kerr-schild-hamiltonian-dop853-v292"
      && row.toleranceClass === "release" && row.branch === "A")
    .map((row) => [String(row.rayId), row]));
  if (kerrSchildByRay.size !== 16) throw new Error("v299 sparse KS geometry conservation failed");
  const polarizationRows = Array.isArray(polarization.payloads) ? polarization.payloads as PolarizationExecution[] : [];
  const polarizationByRay = new Map(polarizationRows
    .filter((row) => row.toleranceClass === "release" && row.branch === "A")
    .map((row) => [String(row.rayId), row]));
  if (polarizationByRay.size !== 4) throw new Error("v299 sparse polarization conservation failed");
  const sampleCount = selected.length;
  const alphaM = new Float64Array(sampleCount);
  const betaM = new Float64Array(sampleCount);
  const spinA = new Float64Array(sampleCount);
  const classification = new Uint8Array(sampleCount);
  const kerrSchildClassification = new Uint8Array(sampleCount);
  const selectedEventKind = new Uint8Array(sampleCount);
  const selectedEventParameter = new Float64Array(sampleCount).fill(Number.NaN);
  const selectedEventRadiusM = new Float64Array(sampleCount).fill(Number.NaN);
  const eventCount = new Uint16Array(sampleCount);
  const validEventCount = new Uint16Array(sampleCount);
  const invalidEventCount = new Uint16Array(sampleCount);
  const validDiskCrossingCount = new Uint16Array(sampleCount);
  const emissionRadiusM = new Float64Array(sampleCount).fill(Number.NaN);
  const kerrSchildEmissionRadiusM = new Float64Array(sampleCount).fill(Number.NaN);
  const geometryDiskRadiusDifferenceM = new Float64Array(sampleCount).fill(Number.NaN);
  const redshiftFactor = new Float64Array(sampleCount).fill(Number.NaN);
  const kerrSchildRedshiftFactor = new Float64Array(sampleCount).fill(Number.NaN);
  const geometryRedshiftDifference = new Float64Array(sampleCount).fill(Number.NaN);
  const redshiftApplicable = new Uint8Array(sampleCount);
  const photonEnergy = new Float64Array(sampleCount).fill(Number.NaN);
  const photonAngularMomentumZ = new Float64Array(sampleCount).fill(Number.NaN);
  const emitterAngularVelocity = new Float64Array(sampleCount).fill(Number.NaN);
  const emitterUt = new Float64Array(sampleCount).fill(Number.NaN);
  const emitterUphi = new Float64Array(sampleCount).fill(Number.NaN);
  const emitterPhotonFrequency = new Float64Array(sampleCount).fill(Number.NaN);
  const emitterFourVelocityNormResidual = new Float64Array(sampleCount).fill(Number.NaN);
  const emitterWaveOrthogonalityResidual = new Float64Array(sampleCount).fill(Number.NaN);
  const emitterPolarizationOrthogonalityResidual = new Float64Array(sampleCount).fill(Number.NaN);
  const emitterPolarizationNormResidual = new Float64Array(sampleCount).fill(Number.NaN);
  const diskEventCoordinateT = new Float64Array(sampleCount).fill(Number.NaN);
  const diskEventCoordinateTheta = new Float64Array(sampleCount).fill(Number.NaN);
  const diskEventCoordinatePhi = new Float64Array(sampleCount).fill(Number.NaN);
  const photonWavevectorT = new Float64Array(sampleCount).fill(Number.NaN);
  const photonWavevectorR = new Float64Array(sampleCount).fill(Number.NaN);
  const photonWavevectorTheta = new Float64Array(sampleCount).fill(Number.NaN);
  const photonWavevectorPhi = new Float64Array(sampleCount).fill(Number.NaN);
  const polarizationVectorT = new Float64Array(sampleCount).fill(Number.NaN);
  const polarizationVectorR = new Float64Array(sampleCount).fill(Number.NaN);
  const polarizationVectorTheta = new Float64Array(sampleCount).fill(Number.NaN);
  const polarizationVectorPhi = new Float64Array(sampleCount).fill(Number.NaN);
  const walkerPenroseConstantReal = new Float64Array(sampleCount).fill(Number.NaN);
  const walkerPenroseConstantImaginary = new Float64Array(sampleCount).fill(Number.NaN);
  const parallelTransportSolverTolerance = new Float64Array(sampleCount).fill(Number.NaN);
  const parallelTransportStepCount = new Uint32Array(sampleCount);
  const parallelTransportSampleCount = new Uint16Array(sampleCount);
  const parallelTransportFinalKsNormResidual = new Float64Array(sampleCount).fill(Number.NaN);
  const imageOrder = new Int16Array(sampleCount).fill(-1);
  const imageOrderApplicable = new Uint8Array(sampleCount);
  const evpaDeg = new Float64Array(sampleCount).fill(Number.NaN);
  const parallelTransportEvpaDeg = new Float64Array(sampleCount).fill(Number.NaN);
  const evpaDifferenceDeg = new Float64Array(sampleCount).fill(Number.NaN);
  const evpaApplicable = new Uint8Array(sampleCount);
  const polarizationNullResidualNormalized = new Float64Array(sampleCount).fill(Number.NaN);
  const polarizationOrthogonalityResidualNormalized = new Float64Array(sampleCount).fill(Number.NaN);
  const polarizationNormResidual = new Float64Array(sampleCount).fill(Number.NaN);
  const walkerPenroseInvariantDrift = new Float64Array(sampleCount).fill(Number.NaN);
  const polarizationEndpointResidual = new Float64Array(sampleCount).fill(Number.NaN);
  const screenDirectionResidual = new Float64Array(sampleCount).fill(Number.NaN);
  const intensity = new Float64Array(sampleCount);
  const massShellResidualNormalized = new Float64Array(sampleCount);
  const carterResidualNormalized = new Float64Array(sampleCount);
  const kerrSchildMassShellResidualNormalized = new Float64Array(sampleCount);
  const metricPullbackResidual = new Float64Array(sampleCount);
  const covectorRoundtripResidual = new Float64Array(sampleCount);
  const metricDerivativeAuditResidual = new Float64Array(sampleCount);
  const tetradResidual = new Float64Array(sampleCount);
  const kerrSchildTetradResidual = new Float64Array(sampleCount);

  selected.forEach((row, index) => {
    const rayId = String(row.rayId);
    const planRay = canonicalRayById.get(rayId);
    if (!planRay) throw new Error(`unknown v299 canonical ray: ${rayId}`);
    const rowSpin = finite(row.spin);
    if (!Number.isFinite(rowSpin) || Math.abs(rowSpin - planRay.spinA) > 1e-12) throw new Error(`v299 canonical spin mismatch: ${rayId}`);
    alphaM[index] = planRay.alphaM;
    betaM[index] = planRay.betaM;
    spinA[index] = planRay.spinA;
    const family = String(row.classification) as keyof typeof KERR_CLASSIFICATION_V299;
    if (planRay.expectedFamily !== family) throw new Error(`v299 canonical family mismatch: ${rayId}`);
    classification[index] = KERR_CLASSIFICATION_V299[family] ?? 0;
    const kerrSchildRow = kerrSchildByRay.get(rayId);
    const kerrSchildFamily = String(kerrSchildRow?.classification) as keyof typeof KERR_CLASSIFICATION_V299;
    if (!kerrSchildRow || kerrSchildFamily !== family) throw new Error(`v299 Carter/KS classification mismatch: ${rayId}`);
    kerrSchildClassification[index] = KERR_CLASSIFICATION_V299[kerrSchildFamily] ?? 0;
    const events = Array.isArray(row.events) ? row.events.map(record) : [];
    const validEvents = events.filter((event) => event.valid === true
      && (event.kind === "capture" || event.kind === "escape" || event.kind === "disk-hit")
      && Number.isFinite(event.parameter)
      && Number(event.parameter) >= 0
      && Number.isFinite(event.radiusM)
      && Number(event.radiusM) > 0);
    const earliestValidEvent = validEvents.reduce<Record<string, unknown> | null>((earliest, event) => (
      !earliest || Number(event.parameter) < Number(earliest.parameter) ? event : earliest
    ), null);
    const selectedEvent = record(row.selectedEvent);
    const selectedParameter = finite(selectedEvent.parameter);
    const selectedRadius = finite(selectedEvent.radiusM);
    if (!earliestValidEvent
      || selectedEvent.valid !== true
      || selectedEvent.kind !== family
      || earliestValidEvent.kind !== family
      || !nearlyEqual(selectedParameter, Number(earliestValidEvent.parameter))
      || !nearlyEqual(selectedRadius, Number(earliestValidEvent.radiusM))) throw new Error(`v299 earliest valid event mismatch: ${rayId}`);
    eventCount[index] = events.length;
    validEventCount[index] = validEvents.length;
    invalidEventCount[index] = events.length - validEvents.length;
    validDiskCrossingCount[index] = validEvents.filter((event) => event.kind === "disk-hit").length;
    selectedEventKind[index] = KERR_CLASSIFICATION_V299[family] ?? 0;
    selectedEventParameter[index] = selectedParameter;
    selectedEventRadiusM[index] = selectedRadius;
    massShellResidualNormalized[index] = finite(row.massShellResidualNormalized, Number.POSITIVE_INFINITY);
    carterResidualNormalized[index] = finite(row.carterResidualNormalized, Number.POSITIVE_INFINITY);
    kerrSchildMassShellResidualNormalized[index] = finite(kerrSchildRow.massShellResidualNormalized, Number.POSITIVE_INFINITY);
    metricPullbackResidual[index] = finite(kerrSchildRow.metricPullbackResidual, Number.POSITIVE_INFINITY);
    covectorRoundtripResidual[index] = finite(kerrSchildRow.covectorRoundtripResidual, Number.POSITIVE_INFINITY);
    metricDerivativeAuditResidual[index] = finite(kerrSchildRow.metricDerivativeAuditResidual, Number.POSITIVE_INFINITY);
    tetradResidual[index] = finite(row.tetradResidual, Number.POSITIVE_INFINITY);
    kerrSchildTetradResidual[index] = finite(kerrSchildRow.tetradResidual, Number.POSITIVE_INFINITY);
    if (family !== "disk-hit") return;
    const radius = finite(row.diskRadiusM);
    const redshift = finite(row.redshift);
    const polarizationSeed = record(row.polarizationSeed);
    const energy = finite(polarizationSeed.energy);
    const angularMomentumZ = finite(polarizationSeed.angularMomentumZ);
    if (polarizationSeed.emitterModel !== "projected-disk-normal") throw new Error(`v299 emitter model mismatch: ${rayId}`);
    const coordinatesBl = Array.isArray(polarizationSeed.coordinatesBl) ? polarizationSeed.coordinatesBl.map((value) => finite(value)) : [];
    const wavevectorBl = Array.isArray(polarizationSeed.wavevectorBl) ? polarizationSeed.wavevectorBl.map((value) => finite(value)) : [];
    const projectionReplay = replayProjectedDiskNormalPolarizationV299(spinA[index], coordinatesBl, wavevectorBl);
    if (!nearlyEqual(coordinatesBl[1], radius, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)
      || !nearlyEqual(projectionReplay.photonEnergy, energy, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)
      || !nearlyEqual(projectionReplay.photonAngularMomentumZ, angularMomentumZ, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)) {
      throw new Error(`v299 polarization seed replay mismatch: ${rayId}`);
    }
    const emitter = resolveKerrCircularEmitterV299(spinA[index], radius, energy, angularMomentumZ);
    const replayedRedshift = 1 / emitter.photonFrequency;
    if (!nearlyEqual(replayedRedshift, redshift, 1e-12)) throw new Error(`v299 emitter redshift replay mismatch: ${rayId}`);
    if (Number.isFinite(radius)) emissionRadiusM[index] = radius;
    if (Number.isFinite(redshift)) {
      redshiftFactor[index] = redshift;
      redshiftApplicable[index] = 1;
      intensity[index] = observedThinDiskIntensityV299(spinA[index], radius, redshift);
    }
    photonEnergy[index] = energy;
    photonAngularMomentumZ[index] = angularMomentumZ;
    emitterAngularVelocity[index] = emitter.angularVelocity;
    emitterUt[index] = emitter.uT;
    emitterUphi[index] = emitter.uPhi;
    emitterPhotonFrequency[index] = emitter.photonFrequency;
    emitterFourVelocityNormResidual[index] = emitter.fourVelocityNormResidual;
    diskEventCoordinateT[index] = coordinatesBl[0];
    diskEventCoordinateTheta[index] = coordinatesBl[2];
    diskEventCoordinatePhi[index] = coordinatesBl[3];
    photonWavevectorT[index] = wavevectorBl[0];
    photonWavevectorR[index] = wavevectorBl[1];
    photonWavevectorTheta[index] = wavevectorBl[2];
    photonWavevectorPhi[index] = wavevectorBl[3];
    polarizationVectorT[index] = projectionReplay.polarization[0];
    polarizationVectorR[index] = projectionReplay.polarization[1];
    polarizationVectorTheta[index] = projectionReplay.polarization[2];
    polarizationVectorPhi[index] = projectionReplay.polarization[3];
    const kerrSchildRadius = finite(kerrSchildRow.diskRadiusM);
    const kerrSchildRedshift = finite(kerrSchildRow.redshift);
    const radiusDifference = Math.abs(radius - kerrSchildRadius);
    const redshiftDifference = Math.abs(redshift - kerrSchildRedshift);
    if (!Number.isFinite(kerrSchildRadius)
      || !Number.isFinite(kerrSchildRedshift)
      || !Number.isFinite(radiusDifference)
      || !Number.isFinite(redshiftDifference)
      || radiusDifference >= KERR_SCIENCE_FORMULA_DISK_RADIUS_DIFFERENCE_LIMIT_M_V299
      || redshiftDifference >= KERR_SCIENCE_FORMULA_REDSHIFT_DIFFERENCE_LIMIT_V299) throw new Error(`v299 Carter/KS disk observable mismatch: ${rayId}`);
    kerrSchildEmissionRadiusM[index] = kerrSchildRadius;
    geometryDiskRadiusDifferenceM[index] = radiusDifference;
    kerrSchildRedshiftFactor[index] = kerrSchildRedshift;
    geometryRedshiftDifference[index] = redshiftDifference;
    const diskIntersectionCount = validDiskCrossingCount[index];
    if (diskIntersectionCount > 0) {
      imageOrder[index] = diskIntersectionCount - 1;
      imageOrderApplicable[index] = 1;
    }
    const evpa = polarizationByRay.get(rayId);
    const walkerPenroseAngle = finite(evpa?.walkerPenroseEvpaDeg);
    const parallelTransportAngle = finite(evpa?.parallelTransportEvpaDeg);
    const reportedDifference = finite(evpa?.evpaDifferenceDeg);
    const polarizationRadius = finite(evpa?.emissionRadiusM);
    const recomputedDifference = evpaDifferenceDegV299(walkerPenroseAngle, parallelTransportAngle);
    const transport = record(evpa?.parallelTransport);
    const nullResidual = finite(transport.nullResidualNormalized);
    const orthogonalityResidual = finite(transport.orthogonalityResidualNormalized);
    const normResidual = finite(transport.normResidual);
    const invariantDrift = finite(transport.walkerPenroseInvariantDrift);
    const endpointResidual = finite(transport.endpointResidual);
    const transportSolverTolerance = finite(transport.solverTolerance);
    const transportStepCount = finite(transport.stepCount);
    const transportSampleCount = finite(transport.sampleCount);
    const transportFinalKsNormResidual = finite(transport.finalKsNormResidual);
    const screenResidual = finite(evpa?.screenDirectionResidual);
    const emitterResiduals = record(evpa?.emitterResiduals);
    const emitterWaveResidual = finite(emitterResiduals.waveOrthogonality);
    const emitterPolarizationResidual = finite(emitterResiduals.emitterOrthogonality);
    const emitterNormResidual = finite(emitterResiduals.norm);
    const invariantResiduals = [nullResidual, orthogonalityResidual, normResidual, invariantDrift];
    const emitterProjectionResiduals = [emitterWaveResidual, emitterPolarizationResidual, emitterNormResidual];
    const walkerPenroseConstant = record(evpa?.walkerPenroseConstant);
    const reportedWpReal = finite(walkerPenroseConstant.real);
    const reportedWpImaginary = finite(walkerPenroseConstant.imaginary);
    if (evpa?.applicability !== "applicable-disk-hit"
      || evpa.passed !== true
      || evpa.emitterModel !== "projected-disk-normal"
      || transport.success !== true
      || transportSolverTolerance !== KERR_SCIENCE_PARALLEL_TRANSPORT_RELEASE_TOLERANCE_V299
      || !Number.isSafeInteger(transportStepCount)
      || transportStepCount < 1
      || !Number.isSafeInteger(transportSampleCount)
      || transportSampleCount < 2
      || !Number.isFinite(transportFinalKsNormResidual)
      || transportFinalKsNormResidual < 0
      || transportFinalKsNormResidual >= KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299
      || !Number.isFinite(walkerPenroseAngle)
      || !Number.isFinite(parallelTransportAngle)
      || !Number.isFinite(recomputedDifference)
      || !Number.isFinite(reportedDifference)
      || Math.abs(recomputedDifference - reportedDifference) > 1e-10
      || recomputedDifference >= KERR_SCIENCE_RELEASE_EVPA_DIFFERENCE_LIMIT_DEG_V299
      || !Number.isFinite(polarizationRadius)
      || Math.abs(polarizationRadius - radius) >= 1e-8
      || invariantResiduals.some((residual) => !Number.isFinite(residual)
        || residual < 0
        || residual >= KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299)
      || emitterProjectionResiduals.some((residual) => !Number.isFinite(residual)
        || residual < 0
        || residual >= KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299)
      || !nearlyEqual(reportedWpReal, projectionReplay.walkerPenroseConstantReal, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)
      || !nearlyEqual(reportedWpImaginary, projectionReplay.walkerPenroseConstantImaginary, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)
      || !Number.isFinite(endpointResidual)
      || endpointResidual < 0
      || endpointResidual >= KERR_SCIENCE_RELEASE_POLARIZATION_ENDPOINT_LIMIT_V299
      || !Number.isFinite(screenResidual)
      || screenResidual < 0
      || screenResidual >= KERR_SCIENCE_RELEASE_POLARIZATION_ENDPOINT_LIMIT_V299) throw new Error(`v299 sparse polarization mismatch: ${rayId}`);
    evpaDeg[index] = walkerPenroseAngle;
    parallelTransportEvpaDeg[index] = parallelTransportAngle;
    evpaDifferenceDeg[index] = recomputedDifference;
    evpaApplicable[index] = 1;
    polarizationNullResidualNormalized[index] = nullResidual;
    polarizationOrthogonalityResidualNormalized[index] = orthogonalityResidual;
    polarizationNormResidual[index] = normResidual;
    walkerPenroseInvariantDrift[index] = invariantDrift;
    polarizationEndpointResidual[index] = endpointResidual;
    screenDirectionResidual[index] = screenResidual;
    emitterWaveOrthogonalityResidual[index] = emitterWaveResidual;
    emitterPolarizationOrthogonalityResidual[index] = emitterPolarizationResidual;
    emitterPolarizationNormResidual[index] = emitterNormResidual;
    walkerPenroseConstantReal[index] = reportedWpReal;
    walkerPenroseConstantImaginary[index] = reportedWpImaginary;
    parallelTransportSolverTolerance[index] = transportSolverTolerance;
    parallelTransportStepCount[index] = transportStepCount;
    parallelTransportSampleCount[index] = transportSampleCount;
    parallelTransportFinalKsNormResidual[index] = transportFinalKsNormResidual;
  });
  const payload: KerrScienceTransferPayloadV299 = Object.freeze({
    version: STRONG_GRAVITY_RENDERING_V299_VERSION,
    authorityKind: "v296-v297-short-gate-sparse",
    geometryEvidenceSha256: geometry.evidenceSha256,
    polarizationEvidenceSha256: polarization.evidenceSha256,
    rayPlanSha256: KERR_DENSE_RAY_PLAN_SHA256_V298R1,
    denseAggregateSha256: null,
    errorBudgetVersion: "v299-sparse-release-residual-budget-v1",
    observerFrameVersion: KERR_SCIENCE_OBSERVER_FRAME_VERSION_V299,
    observerRadiusM: 30,
    observerInclinationDeg: 70,
    observerSourceSha256: KERR_SCIENCE_OBSERVER_SOURCE_SHA256_V299,
    emitterFrameVersion: KERR_SCIENCE_EMITTER_FRAME_VERSION_V299,
    emitterSourceSha256: KERR_SCIENCE_EMITTER_SOURCE_SHA256_V299,
    diskInnerEdgeModel: KERR_SCIENCE_DISK_INNER_EDGE_MODEL_V299,
    diskOuterRadiusM: KERR_SCIENCE_DISK_OUTER_RADIUS_M_V299,
    walkerPenroseModel: KERR_SCIENCE_WALKER_PENROSE_MODEL_V299,
    parallelTransportModel: KERR_SCIENCE_PARALLEL_TRANSPORT_MODEL_V299,
    sampleCount,
    alphaM,
    betaM,
    spinA,
    classification,
    kerrSchildClassification,
    selectedEventKind,
    selectedEventParameter,
    selectedEventRadiusM,
    eventCount,
    validEventCount,
    invalidEventCount,
    validDiskCrossingCount,
    emissionRadiusM,
    kerrSchildEmissionRadiusM,
    geometryDiskRadiusDifferenceM,
    redshiftFactor,
    kerrSchildRedshiftFactor,
    geometryRedshiftDifference,
    redshiftApplicable,
    photonEnergy,
    photonAngularMomentumZ,
    emitterAngularVelocity,
    emitterUt,
    emitterUphi,
    emitterPhotonFrequency,
    emitterFourVelocityNormResidual,
    emitterWaveOrthogonalityResidual,
    emitterPolarizationOrthogonalityResidual,
    emitterPolarizationNormResidual,
    diskEventCoordinateT,
    diskEventCoordinateTheta,
    diskEventCoordinatePhi,
    photonWavevectorT,
    photonWavevectorR,
    photonWavevectorTheta,
    photonWavevectorPhi,
    polarizationVectorT,
    polarizationVectorR,
    polarizationVectorTheta,
    polarizationVectorPhi,
    walkerPenroseConstantReal,
    walkerPenroseConstantImaginary,
    parallelTransportSolverTolerance,
    parallelTransportStepCount,
    parallelTransportSampleCount,
    parallelTransportFinalKsNormResidual,
    imageOrder,
    imageOrderApplicable,
    evpaDeg,
    parallelTransportEvpaDeg,
    evpaDifferenceDeg,
    evpaApplicable,
    polarizationNullResidualNormalized,
    polarizationOrthogonalityResidualNormalized,
    polarizationNormResidual,
    walkerPenroseInvariantDrift,
    polarizationEndpointResidual,
    screenDirectionResidual,
    intensity,
    massShellResidualNormalized,
    carterResidualNormalized,
    kerrSchildMassShellResidualNormalized,
    metricPullbackResidual,
    covectorRoundtripResidual,
    metricDerivativeAuditResidual,
    tetradResidual,
    kerrSchildTetradResidual,
    denseCampaignComplete: false,
    boundary: "test-particle-kerr-thin-disk-not-grmhd",
  });
  const validation = validateKerrScienceTransferPayloadV299(payload);
  if (!validation.passed) throw new Error(`invalid v299 science payload: ${validation.failures.join(",")}`);
  return payload;
}

export function validateKerrScienceTransferPayloadV299(payload: KerrScienceTransferPayloadV299): { passed: boolean; failures: string[] } {
  const failures: string[] = [];
  const length = payload.sampleCount;
  if (payload.version !== STRONG_GRAVITY_RENDERING_V299_VERSION || length < 1) failures.push("identity");
  const legacySparseAuthority = payload.authorityKind === "v296-v297-short-gate-sparse";
  const correctedSparseAuthority = payload.authorityKind === "v312-v313-short-gate-sparse";
  const legacyDenseAuthority = payload.authorityKind === "v298r1-dense-complete";
  const correctedDenseAuthority = payload.authorityKind === "v314-dense-complete";
  const sparseAuthority = legacySparseAuthority || correctedSparseAuthority;
  const denseAuthority = legacyDenseAuthority || correctedDenseAuthority;
  if (!sha(payload.geometryEvidenceSha256) || !sha(payload.polarizationEvidenceSha256)
    || !sha(payload.rayPlanSha256)) failures.push("authority-sha");
  if ((legacySparseAuthority || legacyDenseAuthority) && payload.rayPlanSha256 !== KERR_DENSE_RAY_PLAN_SHA256_V298R1) failures.push("authority-sha");
  if ((correctedSparseAuthority || correctedDenseAuthority) && payload.rayPlanSha256 !== KERR_CORRECTED_DENSE_RAY_PLAN_SHA256_V314) failures.push("authority-sha");
  if (!sparseAuthority && !denseAuthority) failures.push("authority-kind");
  if (sparseAuthority && (payload.denseCampaignComplete || length !== 16 || payload.denseAggregateSha256 !== null)) failures.push("sparse-authority-boundary");
  if (denseAuthority && (!payload.denseCampaignComplete || length !== 3097 || !sha(payload.denseAggregateSha256))) failures.push("dense-authority-incomplete");
  if (legacySparseAuthority && payload.errorBudgetVersion !== "v299-sparse-release-residual-budget-v1") failures.push("error-budget-identity");
  if (correctedSparseAuthority && payload.errorBudgetVersion !== "v315-sparse-release-residual-budget-v1") failures.push("error-budget-identity");
  if (legacyDenseAuthority && payload.errorBudgetVersion !== "v298r1-dense-kerr-error-budget-v1") failures.push("error-budget-identity");
  if (correctedDenseAuthority && payload.errorBudgetVersion !== "v314-dense-kerr-error-budget-v1") failures.push("error-budget-identity");
  if (payload.observerFrameVersion !== KERR_SCIENCE_OBSERVER_FRAME_VERSION_V299
    || payload.observerRadiusM !== 30
    || payload.observerInclinationDeg !== 70
    || payload.observerSourceSha256 !== KERR_SCIENCE_OBSERVER_SOURCE_SHA256_V299) failures.push("observer-frame-identity");
  if (payload.emitterFrameVersion !== KERR_SCIENCE_EMITTER_FRAME_VERSION_V299
    || payload.emitterSourceSha256 !== KERR_SCIENCE_EMITTER_SOURCE_SHA256_V299
    || payload.diskInnerEdgeModel !== KERR_SCIENCE_DISK_INNER_EDGE_MODEL_V299
    || payload.diskOuterRadiusM !== KERR_SCIENCE_DISK_OUTER_RADIUS_M_V299) failures.push("emitter-frame-identity");
  if (payload.walkerPenroseModel !== KERR_SCIENCE_WALKER_PENROSE_MODEL_V299
    || payload.parallelTransportModel !== KERR_SCIENCE_PARALLEL_TRANSPORT_MODEL_V299) failures.push("polarization-model-identity");
  const buffers = [payload.alphaM, payload.betaM, payload.spinA, payload.classification, payload.kerrSchildClassification,
    payload.selectedEventKind, payload.selectedEventParameter, payload.selectedEventRadiusM,
    payload.eventCount, payload.validEventCount, payload.invalidEventCount, payload.validDiskCrossingCount,
    payload.emissionRadiusM, payload.kerrSchildEmissionRadiusM, payload.geometryDiskRadiusDifferenceM,
    payload.redshiftFactor, payload.kerrSchildRedshiftFactor, payload.geometryRedshiftDifference,
    payload.redshiftApplicable, payload.photonEnergy, payload.photonAngularMomentumZ,
    payload.emitterAngularVelocity, payload.emitterUt, payload.emitterUphi, payload.emitterPhotonFrequency,
    payload.emitterFourVelocityNormResidual, payload.emitterWaveOrthogonalityResidual,
    payload.emitterPolarizationOrthogonalityResidual, payload.emitterPolarizationNormResidual,
    payload.diskEventCoordinateT, payload.diskEventCoordinateTheta, payload.diskEventCoordinatePhi,
    payload.photonWavevectorT, payload.photonWavevectorR, payload.photonWavevectorTheta, payload.photonWavevectorPhi,
    payload.polarizationVectorT, payload.polarizationVectorR, payload.polarizationVectorTheta, payload.polarizationVectorPhi,
    payload.walkerPenroseConstantReal, payload.walkerPenroseConstantImaginary,
    payload.parallelTransportSolverTolerance, payload.parallelTransportStepCount,
    payload.parallelTransportSampleCount, payload.parallelTransportFinalKsNormResidual,
    payload.imageOrder, payload.imageOrderApplicable,
    payload.evpaDeg, payload.parallelTransportEvpaDeg, payload.evpaDifferenceDeg,
    payload.evpaApplicable, payload.polarizationNullResidualNormalized,
    payload.polarizationOrthogonalityResidualNormalized, payload.polarizationNormResidual,
    payload.walkerPenroseInvariantDrift, payload.polarizationEndpointResidual,
    payload.screenDirectionResidual, payload.intensity, payload.massShellResidualNormalized,
    payload.carterResidualNormalized, payload.kerrSchildMassShellResidualNormalized,
    payload.metricPullbackResidual, payload.covectorRoundtripResidual, payload.metricDerivativeAuditResidual,
    payload.tetradResidual, payload.kerrSchildTetradResidual];
  if (buffers.some((buffer) => buffer.length !== length)) failures.push("buffer-length");
  for (let index = 0; index < length; index += 1) {
    if (!Number.isFinite(payload.alphaM[index]) || !Number.isFinite(payload.betaM[index]) || !Number.isFinite(payload.spinA[index])) failures.push("screen-coordinate");
    if (payload.classification[index] < 1 || payload.classification[index] > 3) failures.push("classification");
    if (payload.kerrSchildClassification[index] !== payload.classification[index]) failures.push("formula-classification-agreement");
    if (payload.selectedEventKind[index] !== payload.classification[index]) failures.push("selected-event-classification");
    if (!Number.isFinite(payload.selectedEventParameter[index]) || payload.selectedEventParameter[index] < 0
      || !Number.isFinite(payload.selectedEventRadiusM[index]) || payload.selectedEventRadiusM[index] <= 0) failures.push("selected-event-coordinate");
    if (payload.validEventCount[index] < 1
      || payload.eventCount[index] !== payload.validEventCount[index] + payload.invalidEventCount[index]) failures.push("event-count-conservation");
    if (payload.redshiftApplicable[index] > 1 || payload.imageOrderApplicable[index] > 1 || payload.evpaApplicable[index] > 1) failures.push("applicability-encoding");
    const diskHit = payload.classification[index] === KERR_CLASSIFICATION_V299["disk-hit"];
    if (diskHit) {
      if (!Number.isFinite(payload.emissionRadiusM[index]) || payload.emissionRadiusM[index] <= 0) failures.push("disk-radius-unavailable");
      if (payload.emissionRadiusM[index] < kerrIscoRadiusV278(payload.spinA[index])
        || payload.emissionRadiusM[index] > KERR_SCIENCE_DISK_OUTER_RADIUS_M_V299) failures.push("disk-radius-boundary");
      if (payload.validDiskCrossingCount[index] < 1
        || payload.imageOrder[index] !== payload.validDiskCrossingCount[index] - 1
        || !nearlyEqual(payload.selectedEventRadiusM[index], payload.emissionRadiusM[index])) failures.push("disk-event-order-conservation");
      if (!Number.isFinite(payload.kerrSchildEmissionRadiusM[index]) || payload.kerrSchildEmissionRadiusM[index] <= 0
        || !Number.isFinite(payload.geometryDiskRadiusDifferenceM[index])
        || Math.abs(payload.emissionRadiusM[index] - payload.kerrSchildEmissionRadiusM[index]) !== payload.geometryDiskRadiusDifferenceM[index]
        || payload.geometryDiskRadiusDifferenceM[index] >= KERR_SCIENCE_FORMULA_DISK_RADIUS_DIFFERENCE_LIMIT_M_V299) failures.push("formula-disk-radius-agreement");
      if (payload.redshiftApplicable[index] !== 1 || !Number.isFinite(payload.redshiftFactor[index]) || payload.redshiftFactor[index] <= 0) failures.push("disk-redshift-unavailable");
      try {
        const replayedEmitter = resolveKerrCircularEmitterV299(
          payload.spinA[index],
          payload.emissionRadiusM[index],
          payload.photonEnergy[index],
          payload.photonAngularMomentumZ[index],
        );
        if (!nearlyEqual(payload.emitterAngularVelocity[index], replayedEmitter.angularVelocity)
          || !nearlyEqual(payload.emitterUt[index], replayedEmitter.uT)
          || !nearlyEqual(payload.emitterUphi[index], replayedEmitter.uPhi)
          || !nearlyEqual(payload.emitterPhotonFrequency[index], replayedEmitter.photonFrequency)
          || !nearlyEqual(payload.redshiftFactor[index], 1 / replayedEmitter.photonFrequency)
          || !nearlyEqual(payload.emitterFourVelocityNormResidual[index], replayedEmitter.fourVelocityNormResidual)
          || payload.emitterFourVelocityNormResidual[index] < 0
          || payload.emitterFourVelocityNormResidual[index] >= KERR_SCIENCE_TETRAD_RESIDUAL_LIMIT_V299) failures.push("emitter-four-velocity-conservation");
      } catch {
        failures.push("emitter-four-velocity-conservation");
      }
      const emitterProjectionResiduals = [
        payload.emitterWaveOrthogonalityResidual[index],
        payload.emitterPolarizationOrthogonalityResidual[index],
        payload.emitterPolarizationNormResidual[index],
      ];
      if (emitterProjectionResiduals.some((residual) => !Number.isFinite(residual)
        || residual < 0
        || residual >= KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299)) failures.push("emitter-polarization-projection");
      if (payload.parallelTransportSolverTolerance[index] !== KERR_SCIENCE_PARALLEL_TRANSPORT_RELEASE_TOLERANCE_V299
        || payload.parallelTransportStepCount[index] < 1
        || payload.parallelTransportSampleCount[index] < 2
        || !Number.isFinite(payload.parallelTransportFinalKsNormResidual[index])
        || payload.parallelTransportFinalKsNormResidual[index] < 0
        || payload.parallelTransportFinalKsNormResidual[index] >= KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299) failures.push("parallel-transport-execution");
      try {
        const replayedProjection = replayProjectedDiskNormalPolarizationV299(
          payload.spinA[index],
          [payload.diskEventCoordinateT[index], payload.emissionRadiusM[index], payload.diskEventCoordinateTheta[index], payload.diskEventCoordinatePhi[index]],
          [payload.photonWavevectorT[index], payload.photonWavevectorR[index], payload.photonWavevectorTheta[index], payload.photonWavevectorPhi[index]],
        );
        const storedPolarization = [payload.polarizationVectorT[index], payload.polarizationVectorR[index], payload.polarizationVectorTheta[index], payload.polarizationVectorPhi[index]];
        if (!nearlyEqual(payload.photonEnergy[index], replayedProjection.photonEnergy, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)
          || !nearlyEqual(payload.photonAngularMomentumZ[index], replayedProjection.photonAngularMomentumZ, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)
          || !nearlyEqual(payload.emitterPhotonFrequency[index], replayedProjection.photonFrequency, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)
          || storedPolarization.some((value, component) => !nearlyEqual(value, replayedProjection.polarization[component], KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299))
          || !nearlyEqual(payload.emitterWaveOrthogonalityResidual[index], replayedProjection.waveOrthogonalityResidual, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)
          || !nearlyEqual(payload.emitterPolarizationOrthogonalityResidual[index], replayedProjection.emitterOrthogonalityResidual, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)
          || !nearlyEqual(payload.emitterPolarizationNormResidual[index], replayedProjection.polarizationNormResidual, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)
          || !nearlyEqual(payload.walkerPenroseConstantReal[index], replayedProjection.walkerPenroseConstantReal, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)
          || !nearlyEqual(payload.walkerPenroseConstantImaginary[index], replayedProjection.walkerPenroseConstantImaginary, KERR_SCIENCE_POLARIZATION_REPLAY_TOLERANCE_V299)) failures.push("polarization-projection-replay");
      } catch {
        failures.push("polarization-projection-replay");
      }
      if (!Number.isFinite(payload.kerrSchildRedshiftFactor[index]) || payload.kerrSchildRedshiftFactor[index] <= 0
        || !Number.isFinite(payload.geometryRedshiftDifference[index])
        || Math.abs(payload.redshiftFactor[index] - payload.kerrSchildRedshiftFactor[index]) !== payload.geometryRedshiftDifference[index]
        || payload.geometryRedshiftDifference[index] >= KERR_SCIENCE_FORMULA_REDSHIFT_DIFFERENCE_LIMIT_V299) failures.push("formula-redshift-agreement");
      if (payload.imageOrderApplicable[index] !== 1 || payload.imageOrder[index] < 0) failures.push("disk-image-order-unavailable");
      if (payload.evpaApplicable[index] !== 1
        || !Number.isFinite(payload.evpaDeg[index])
        || !Number.isFinite(payload.parallelTransportEvpaDeg[index])
        || !Number.isFinite(payload.evpaDifferenceDeg[index])) failures.push("disk-evpa-unavailable");
      const recomputedEvpaDifference = evpaDifferenceDegV299(payload.evpaDeg[index], payload.parallelTransportEvpaDeg[index]);
      if (!Number.isFinite(recomputedEvpaDifference)
        || Math.abs(recomputedEvpaDifference - payload.evpaDifferenceDeg[index]) > 1e-10
        || recomputedEvpaDifference >= KERR_SCIENCE_RELEASE_EVPA_DIFFERENCE_LIMIT_DEG_V299) failures.push("disk-evpa-conservation");
      const polarizationInvariantResiduals = [
        payload.polarizationNullResidualNormalized[index],
        payload.polarizationOrthogonalityResidualNormalized[index],
        payload.polarizationNormResidual[index],
        payload.walkerPenroseInvariantDrift[index],
      ];
      if (polarizationInvariantResiduals.some((residual) => !Number.isFinite(residual)
        || residual < 0
        || residual >= KERR_SCIENCE_RELEASE_POLARIZATION_INVARIANT_LIMIT_V299)) failures.push("disk-polarization-invariant");
      if (!Number.isFinite(payload.polarizationEndpointResidual[index])
        || payload.polarizationEndpointResidual[index] < 0
        || payload.polarizationEndpointResidual[index] >= KERR_SCIENCE_RELEASE_POLARIZATION_ENDPOINT_LIMIT_V299
        || !Number.isFinite(payload.screenDirectionResidual[index])
        || payload.screenDirectionResidual[index] < 0
        || payload.screenDirectionResidual[index] >= KERR_SCIENCE_RELEASE_POLARIZATION_ENDPOINT_LIMIT_V299) failures.push("disk-polarization-endpoint");
      if (sparseAuthority) {
        const expectedIntensity = observedThinDiskIntensityV299(payload.spinA[index], payload.emissionRadiusM[index], payload.redshiftFactor[index]);
        const tolerance = Math.max(1e-18, Math.abs(expectedIntensity) * 1e-12);
        if (Math.abs(payload.intensity[index] - expectedIntensity) > tolerance) failures.push("disk-intensity-conservation");
      }
    } else {
      if (payload.validDiskCrossingCount[index] !== 0 || payload.imageOrder[index] !== -1) failures.push("nondisk-event-order-conservation");
      if (payload.redshiftApplicable[index] !== 0 || payload.imageOrderApplicable[index] !== 0 || payload.evpaApplicable[index] !== 0) failures.push("nondisk-observable-applicability");
      if (Number.isFinite(payload.emissionRadiusM[index])
        || Number.isFinite(payload.kerrSchildEmissionRadiusM[index])
        || Number.isFinite(payload.geometryDiskRadiusDifferenceM[index])
        || Number.isFinite(payload.redshiftFactor[index])
        || Number.isFinite(payload.kerrSchildRedshiftFactor[index])
        || Number.isFinite(payload.geometryRedshiftDifference[index])
        || Number.isFinite(payload.photonEnergy[index])
        || Number.isFinite(payload.photonAngularMomentumZ[index])
        || Number.isFinite(payload.emitterAngularVelocity[index])
        || Number.isFinite(payload.emitterUt[index])
        || Number.isFinite(payload.emitterUphi[index])
        || Number.isFinite(payload.emitterPhotonFrequency[index])
        || Number.isFinite(payload.emitterFourVelocityNormResidual[index])
        || Number.isFinite(payload.emitterWaveOrthogonalityResidual[index])
        || Number.isFinite(payload.emitterPolarizationOrthogonalityResidual[index])
        || Number.isFinite(payload.emitterPolarizationNormResidual[index])
        || Number.isFinite(payload.diskEventCoordinateT[index])
        || Number.isFinite(payload.diskEventCoordinateTheta[index])
        || Number.isFinite(payload.diskEventCoordinatePhi[index])
        || Number.isFinite(payload.photonWavevectorT[index])
        || Number.isFinite(payload.photonWavevectorR[index])
        || Number.isFinite(payload.photonWavevectorTheta[index])
        || Number.isFinite(payload.photonWavevectorPhi[index])
        || Number.isFinite(payload.polarizationVectorT[index])
        || Number.isFinite(payload.polarizationVectorR[index])
        || Number.isFinite(payload.polarizationVectorTheta[index])
        || Number.isFinite(payload.polarizationVectorPhi[index])
        || Number.isFinite(payload.walkerPenroseConstantReal[index])
        || Number.isFinite(payload.walkerPenroseConstantImaginary[index])
        || Number.isFinite(payload.parallelTransportSolverTolerance[index])
        || payload.parallelTransportStepCount[index] !== 0
        || payload.parallelTransportSampleCount[index] !== 0
        || Number.isFinite(payload.parallelTransportFinalKsNormResidual[index])
        || payload.imageOrder[index] !== -1
        || Number.isFinite(payload.evpaDeg[index])
        || Number.isFinite(payload.parallelTransportEvpaDeg[index])
        || Number.isFinite(payload.evpaDifferenceDeg[index])
        || Number.isFinite(payload.polarizationNullResidualNormalized[index])
        || Number.isFinite(payload.polarizationOrthogonalityResidualNormalized[index])
        || Number.isFinite(payload.polarizationNormResidual[index])
        || Number.isFinite(payload.walkerPenroseInvariantDrift[index])
        || Number.isFinite(payload.polarizationEndpointResidual[index])
        || Number.isFinite(payload.screenDirectionResidual[index])
        || payload.intensity[index] !== 0) failures.push("nondisk-observable-value");
    }
    if (!Number.isFinite(payload.intensity[index]) || payload.intensity[index] < 0) failures.push("intensity");
    const massShellResidual = payload.massShellResidualNormalized[index];
    const carterResidual = payload.carterResidualNormalized[index];
    const kerrSchildMassShellResidual = payload.kerrSchildMassShellResidualNormalized[index];
    if (!Number.isFinite(massShellResidual) || massShellResidual < 0 || massShellResidual >= KERR_SCIENCE_RELEASE_RESIDUAL_LIMIT_V299) failures.push("mass-shell-residual");
    if (!Number.isFinite(carterResidual) || carterResidual < 0 || carterResidual >= KERR_SCIENCE_RELEASE_RESIDUAL_LIMIT_V299) failures.push("carter-residual");
    if (!Number.isFinite(kerrSchildMassShellResidual) || kerrSchildMassShellResidual < 0 || kerrSchildMassShellResidual >= KERR_SCIENCE_RELEASE_RESIDUAL_LIMIT_V299) failures.push("ks-mass-shell-residual");
    if (!Number.isFinite(payload.metricPullbackResidual[index]) || payload.metricPullbackResidual[index] < 0 || payload.metricPullbackResidual[index] >= KERR_SCIENCE_KS_PULLBACK_LIMIT_V299) failures.push("ks-metric-pullback-residual");
    if (!Number.isFinite(payload.covectorRoundtripResidual[index]) || payload.covectorRoundtripResidual[index] < 0 || payload.covectorRoundtripResidual[index] >= KERR_SCIENCE_KS_COVECTOR_LIMIT_V299) failures.push("ks-covector-roundtrip-residual");
    if (!Number.isFinite(payload.metricDerivativeAuditResidual[index]) || payload.metricDerivativeAuditResidual[index] < 0 || payload.metricDerivativeAuditResidual[index] >= KERR_SCIENCE_KS_METRIC_DERIVATIVE_LIMIT_V299) failures.push("ks-metric-derivative-residual");
    if (!Number.isFinite(payload.tetradResidual[index]) || payload.tetradResidual[index] < 0 || payload.tetradResidual[index] >= KERR_SCIENCE_TETRAD_RESIDUAL_LIMIT_V299) failures.push("carter-tetrad-residual");
    if (!Number.isFinite(payload.kerrSchildTetradResidual[index]) || payload.kerrSchildTetradResidual[index] < 0 || payload.kerrSchildTetradResidual[index] >= KERR_SCIENCE_TETRAD_RESIDUAL_LIMIT_V299) failures.push("ks-tetrad-residual");
  }
  return { passed: failures.length === 0, failures: [...new Set(failures)] };
}

export function cloneKerrScienceTransferPayloadV299(payload: KerrScienceTransferPayloadV299): KerrScienceTransferPayloadV299 {
  return {
    ...payload,
    alphaM: payload.alphaM.slice(), betaM: payload.betaM.slice(), spinA: payload.spinA.slice(),
    classification: payload.classification.slice(), kerrSchildClassification: payload.kerrSchildClassification.slice(),
    selectedEventKind: payload.selectedEventKind.slice(), selectedEventParameter: payload.selectedEventParameter.slice(),
    selectedEventRadiusM: payload.selectedEventRadiusM.slice(), eventCount: payload.eventCount.slice(),
    validEventCount: payload.validEventCount.slice(), invalidEventCount: payload.invalidEventCount.slice(),
    validDiskCrossingCount: payload.validDiskCrossingCount.slice(),
    emissionRadiusM: payload.emissionRadiusM.slice(), kerrSchildEmissionRadiusM: payload.kerrSchildEmissionRadiusM.slice(),
    geometryDiskRadiusDifferenceM: payload.geometryDiskRadiusDifferenceM.slice(),
    redshiftFactor: payload.redshiftFactor.slice(), kerrSchildRedshiftFactor: payload.kerrSchildRedshiftFactor.slice(),
    geometryRedshiftDifference: payload.geometryRedshiftDifference.slice(), redshiftApplicable: payload.redshiftApplicable.slice(),
    photonEnergy: payload.photonEnergy.slice(), photonAngularMomentumZ: payload.photonAngularMomentumZ.slice(),
    emitterAngularVelocity: payload.emitterAngularVelocity.slice(), emitterUt: payload.emitterUt.slice(),
    emitterUphi: payload.emitterUphi.slice(), emitterPhotonFrequency: payload.emitterPhotonFrequency.slice(),
    emitterFourVelocityNormResidual: payload.emitterFourVelocityNormResidual.slice(),
    emitterWaveOrthogonalityResidual: payload.emitterWaveOrthogonalityResidual.slice(),
    emitterPolarizationOrthogonalityResidual: payload.emitterPolarizationOrthogonalityResidual.slice(),
    emitterPolarizationNormResidual: payload.emitterPolarizationNormResidual.slice(),
    diskEventCoordinateT: payload.diskEventCoordinateT.slice(), diskEventCoordinateTheta: payload.diskEventCoordinateTheta.slice(),
    diskEventCoordinatePhi: payload.diskEventCoordinatePhi.slice(), photonWavevectorT: payload.photonWavevectorT.slice(),
    photonWavevectorR: payload.photonWavevectorR.slice(), photonWavevectorTheta: payload.photonWavevectorTheta.slice(),
    photonWavevectorPhi: payload.photonWavevectorPhi.slice(), polarizationVectorT: payload.polarizationVectorT.slice(),
    polarizationVectorR: payload.polarizationVectorR.slice(), polarizationVectorTheta: payload.polarizationVectorTheta.slice(),
    polarizationVectorPhi: payload.polarizationVectorPhi.slice(), walkerPenroseConstantReal: payload.walkerPenroseConstantReal.slice(),
    walkerPenroseConstantImaginary: payload.walkerPenroseConstantImaginary.slice(),
    parallelTransportSolverTolerance: payload.parallelTransportSolverTolerance.slice(),
    parallelTransportStepCount: payload.parallelTransportStepCount.slice(),
    parallelTransportSampleCount: payload.parallelTransportSampleCount.slice(),
    parallelTransportFinalKsNormResidual: payload.parallelTransportFinalKsNormResidual.slice(),
    imageOrder: payload.imageOrder.slice(), imageOrderApplicable: payload.imageOrderApplicable.slice(),
    evpaDeg: payload.evpaDeg.slice(), parallelTransportEvpaDeg: payload.parallelTransportEvpaDeg.slice(),
    evpaDifferenceDeg: payload.evpaDifferenceDeg.slice(), evpaApplicable: payload.evpaApplicable.slice(),
    polarizationNullResidualNormalized: payload.polarizationNullResidualNormalized.slice(),
    polarizationOrthogonalityResidualNormalized: payload.polarizationOrthogonalityResidualNormalized.slice(),
    polarizationNormResidual: payload.polarizationNormResidual.slice(), walkerPenroseInvariantDrift: payload.walkerPenroseInvariantDrift.slice(),
    polarizationEndpointResidual: payload.polarizationEndpointResidual.slice(), screenDirectionResidual: payload.screenDirectionResidual.slice(),
    intensity: payload.intensity.slice(),
    massShellResidualNormalized: payload.massShellResidualNormalized.slice(), carterResidualNormalized: payload.carterResidualNormalized.slice(),
    kerrSchildMassShellResidualNormalized: payload.kerrSchildMassShellResidualNormalized.slice(),
    metricPullbackResidual: payload.metricPullbackResidual.slice(), covectorRoundtripResidual: payload.covectorRoundtripResidual.slice(),
    metricDerivativeAuditResidual: payload.metricDerivativeAuditResidual.slice(),
    tetradResidual: payload.tetradResidual.slice(), kerrSchildTetradResidual: payload.kerrSchildTetradResidual.slice(),
  };
}
