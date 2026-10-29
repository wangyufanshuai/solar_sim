/**
 * Corrected v277 Kerr optics contracts.
 *
 * This module is an offline/reference boundary.  It deliberately does not
 * import the legacy V3 teaching tracer or any live physics worker.  The
 * photon Carter potential uses the null form a²(μ²-E²), with μ²=0 for rays.
 */

export const KERR_REFERENCE_V277_VERSION = "v277-corrected-kerr-optics-reference" as const;
export const KERR_REFERENCE_V277_BOUNDARY =
  "offline-kerr-test-particle-zamo-thin-disk-not-grmhd" as const;
export const KERR_REFERENCE_V277_CODE_SHA =
  "0debb41b96f001f92f498ef6a36ceff77ede7f0dd2bdbe3c6e9db3dfbf6090a8" as const;
export const KERR_REFERENCE_V277_SCREEN_SHA =
  "08f42a50bc787df62dc018ee56b5f7b58065dcafe2e2a3703e3e67f3e6d94037" as const;

export type KerrGeodesicKindV277 = "null" | "timelike";
export type KerrReferenceSolverV277 = "carter-mino-dop853" | "kerr-schild-hamiltonian-dop853";
export type KerrToleranceV277 = "fine" | "finer";
export type KerrRunV277 = "A" | "B";

export type KerrObserverFrameV277 = {
  spinA: number;
  radiusM: number;
  thetaRad: number;
  phiRad: number;
  horizonRadiusM: number;
  lapse: number;
  frameDraggingOmega: number;
  time: readonly [number, number, number, number];
  radial: readonly [number, number, number, number];
  polar: readonly [number, number, number, number];
  azimuthal: readonly [number, number, number, number];
  boundary: "finite-distance-zamo-outside-horizon";
};

export type KerrGeodesicConstantsV277 = {
  muSquared: number;
  energy: number;
  axialAngularMomentum: number;
  carterQ: number;
};

export type KerrRayReferenceResultV277 = {
  solver: KerrReferenceSolverV277 | "bounded-rk4-preview";
  tolerance: KerrToleranceV277;
  run: KerrRunV277;
  kind: KerrGeodesicKindV277;
  status: "captured" | "escaped" | "disk-intersection" | "max-steps" | "invalid" | "watchdog-timeout";
  coordinateTime: number | null;
  azimuth: number | null;
  emissionRadiusM: number | null;
  imageOrder: number;
  nullConstraint: number | null;
  carterDrift: number | null;
  outputSha256: string | null;
};

export type KerrErrorBudgetV277 = {
  tetradOrthonormality: number;
  observerNull: number;
  constantsRoundTrip: number;
  sphericalPhotonResidual: number;
  ksDerivativeRelative: number;
  maxNullConstraint: number;
  maxCarterDrift: number;
  redshiftRelative: number;
  intensityInvariantRelative: number;
  evpaDegrees: number;
};

export type KerrShortGateV277 = {
  version: typeof KERR_REFERENCE_V277_VERSION;
  selectedRayCount: 16;
  executionsPerRay: 8;
  expectedExecutionCount: 128;
  criticalBracketCount: 40;
  invalidCount: number;
  nonPhysicalCount: number;
  watchdogTimeoutCount: number;
  deterministicRerunPassed: boolean;
  classificationAgreement: number | null;
  criticalCurveMaxErrorPx: number | null;
  errorBudget: KerrErrorBudgetV277 | null;
  gatePassed: boolean;
  status: "not-run" | "passed" | "failed";
  promotionDecision: "shadow-retained";
  boundary: typeof KERR_REFERENCE_V277_BOUNDARY;
};

const MIN_SIN2 = 1e-24;

export function kerrOuterHorizonRadiusV277(spinA: number): number {
  const a = Math.max(-0.999999999999, Math.min(0.999999999999, spinA));
  return 1 + Math.sqrt(Math.max(0, 1 - a * a));
}

function metricCovariantV277(a: number, r: number, theta: number): number[][] {
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);
  const sigma = r * r + a * a * cos * cos;
  const delta = r * r - 2 * r + a * a;
  const bigA = (r * r + a * a) ** 2 - a * a * delta * sin * sin;
  return [
    [-(1 - 2 * r / sigma), 0, 0, -2 * a * r * sin * sin / sigma],
    [0, sigma / delta, 0, 0],
    [0, 0, sigma, 0],
    [-2 * a * r * sin * sin / sigma, 0, 0, bigA * sin * sin / sigma],
  ];
}

function dotMetricV277(metric: number[][], left: readonly number[], right: readonly number[]): number {
  let result = 0;
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) result += left[i] * metric[i][j] * right[j];
  return result;
}

export function createKerrObserverFrameV277(args: {
  spinA: number;
  radiusM: number;
  thetaRad: number;
  phiRad?: number;
}): KerrObserverFrameV277 {
  const a = Math.max(-0.999999999999, Math.min(0.999999999999, args.spinA));
  const horizonRadiusM = kerrOuterHorizonRadiusV277(a);
  if (!(Number.isFinite(args.radiusM) && args.radiusM > horizonRadiusM)) {
    throw new RangeError("ZAMO radius must be outside the Kerr horizon");
  }
  const thetaRad = Math.max(1e-8, Math.min(Math.PI - 1e-8, args.thetaRad));
  const sin = Math.sin(thetaRad);
  const cos = Math.cos(thetaRad);
  const r = args.radiusM;
  const sigma = r * r + a * a * cos * cos;
  const delta = r * r - 2 * r + a * a;
  const bigA = (r * r + a * a) ** 2 - a * a * delta * sin * sin;
  const lapse = Math.sqrt((sigma * delta) / bigA);
  const omega = (2 * a * r) / bigA;
  return {
    spinA: a,
    radiusM: r,
    thetaRad,
    phiRad: args.phiRad ?? 0,
    horizonRadiusM,
    lapse,
    frameDraggingOmega: omega,
    time: [1 / lapse, 0, 0, omega / lapse],
    radial: [0, Math.sqrt(delta / sigma), 0, 0],
    polar: [0, 0, 1 / Math.sqrt(sigma), 0],
    azimuthal: [0, 0, 0, Math.sqrt(sigma / bigA) / sin],
    boundary: "finite-distance-zamo-outside-horizon",
  };
}

export function observerFrameOrthonormalityErrorV277(frame: KerrObserverFrameV277): number {
  const metric = metricCovariantV277(frame.spinA, frame.radiusM, frame.thetaRad);
  const basis = [frame.time, frame.radial, frame.polar, frame.azimuthal];
  const expected = [-1, 1, 1, 1];
  let maxError = 0;
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) {
    const target = i === j ? expected[i] : 0;
    maxError = Math.max(maxError, Math.abs(dotMetricV277(metric, basis[i], basis[j]) - target));
  }
  return maxError;
}

export function kerrCarterQFromCovectorV277(args: {
  spinA: number;
  thetaRad: number;
  energy: number;
  axialAngularMomentum: number;
  pTheta: number;
  muSquared?: number;
}): number {
  const muSquared = args.muSquared ?? 0;
  const cos = Math.cos(args.thetaRad);
  const sin2 = Math.max(MIN_SIN2, Math.sin(args.thetaRad) ** 2);
  return args.pTheta ** 2 + cos ** 2 * (
    args.spinA ** 2 * (muSquared - args.energy ** 2) + args.axialAngularMomentum ** 2 / sin2
  );
}

export function kerrNullRadialPotentialV277(
  spinA: number,
  radiusM: number,
  energy: number,
  axialAngularMomentum: number,
  carterQ: number,
): number {
  const delta = radiusM * radiusM - 2 * radiusM + spinA * spinA;
  const p = energy * (radiusM * radiusM + spinA * spinA) - spinA * axialAngularMomentum;
  return p * p - delta * ((axialAngularMomentum - spinA * energy) ** 2 + carterQ);
}

export function kerrNullPolarPotentialV277(
  spinA: number,
  thetaRad: number,
  energy: number,
  axialAngularMomentum: number,
  carterQ: number,
): number {
  const cos = Math.cos(thetaRad);
  const sin2 = Math.max(MIN_SIN2, Math.sin(thetaRad) ** 2);
  return carterQ + spinA * spinA * energy * energy * cos * cos - axialAngularMomentum * axialAngularMomentum * cos * cos / sin2;
}

function kerrMinoDerivativesV277(
  state: { radiusM: number; thetaRad: number; radialSign: -1 | 1; polarSign: -1 | 1 },
  constants: KerrGeodesicConstantsV277 & { spinA: number },
): readonly [number, number, number, number] {
  const { spinA: a, energy, axialAngularMomentum: lz, carterQ: q } = constants;
  const r = state.radiusM;
  const delta = r * r - 2 * r + a * a;
  const p = energy * (r * r + a * a) - a * lz;
  const sin2 = Math.max(MIN_SIN2, Math.sin(state.thetaRad) ** 2);
  const radial = Math.max(0, kerrNullRadialPotentialV277(a, r, energy, lz, q));
  const polar = Math.max(0, kerrNullPolarPotentialV277(a, state.thetaRad, energy, lz, q));
  return [
    -a * (a * energy * sin2 - lz) + (r * r + a * a) * p / Math.max(1e-24, delta),
    state.radialSign * Math.sqrt(radial),
    state.polarSign * Math.sqrt(polar),
    lz / sin2 - a * energy + a * p / Math.max(1e-24, delta),
  ];
}

/** Bounded corrected Carter–Mino null probe for local preview and fixtures. */
export function traceKerrNullRayV277(args: {
  frame: KerrObserverFrameV277;
  direction: readonly [number, number, number];
  maxSteps?: number;
  stepMino?: number;
  escapeRadiusM?: number;
  diskInnerRadiusM?: number;
  diskOuterRadiusM?: number;
}): KerrRayReferenceResultV277 & { screenDirection: readonly [number, number, number] } {
  const length = Math.hypot(...args.direction);
  if (!(length > 0)) throw new RangeError("local direction must be non-zero");
  const direction = args.direction.map((value) => value / length) as [number, number, number];
  const metric = metricCovariantV277(args.frame.spinA, args.frame.radiusM, args.frame.thetaRad);
  const vector = [
    args.frame.time[0] + direction[0] * args.frame.radial[0] + direction[1] * args.frame.polar[0] + direction[2] * args.frame.azimuthal[0],
    args.frame.time[1] + direction[0] * args.frame.radial[1] + direction[1] * args.frame.polar[1] + direction[2] * args.frame.azimuthal[1],
    args.frame.time[2] + direction[0] * args.frame.radial[2] + direction[1] * args.frame.polar[2] + direction[2] * args.frame.azimuthal[2],
    args.frame.time[3] + direction[0] * args.frame.radial[3] + direction[1] * args.frame.polar[3] + direction[2] * args.frame.azimuthal[3],
  ];
  const covector = metric.map((row) => row.reduce((sum, value, index) => sum + value * vector[index], 0));
  const energy = -covector[0];
  const lz = covector[3];
  const sigma = args.frame.radiusM ** 2 + args.frame.spinA ** 2 * Math.cos(args.frame.thetaRad) ** 2;
  const pTheta = sigma * vector[2];
  const q = kerrCarterQFromCovectorV277({ spinA: args.frame.spinA, thetaRad: args.frame.thetaRad, energy, axialAngularMomentum: lz, pTheta });
  const constants = { spinA: args.frame.spinA, muSquared: 0, energy, axialAngularMomentum: lz, carterQ: q };
  const state = { radiusM: args.frame.radiusM, thetaRad: args.frame.thetaRad, t: 0, phiRad: args.frame.phiRad, radialSign: direction[0] < 0 ? -1 as const : 1 as const, polarSign: direction[1] < 0 ? -1 as const : 1 as const };
  const maxSteps = Math.max(1, Math.floor(args.maxSteps ?? 1024));
  const step = Math.max(1e-5, args.stepMino ?? 0.01);
  const escape = Math.max(args.frame.radiusM + 1, args.escapeRadiusM ?? 200);
  const diskInner = Math.max(args.frame.horizonRadiusM, args.diskInnerRadiusM ?? args.frame.horizonRadiusM);
  const diskOuter = Math.max(diskInner + 1, args.diskOuterRadiusM ?? 30);
  const diskRadius = { value: null as number | null };
  let previousTheta = state.thetaRad;
  let imageOrder = 0;
  let status: KerrRayReferenceResultV277["status"] = "max-steps";
  let maxConstraint = 0;
  for (let index = 0; index < maxSteps; index += 1) {
    if (state.radiusM <= args.frame.horizonRadiusM + 1e-6) { status = "captured"; break; }
    if (state.radiusM >= escape && state.radialSign > 0) { status = "escaped"; break; }
    const k1 = kerrMinoDerivativesV277(state, constants);
    const m1 = { ...state, radiusM: state.radiusM + 0.5 * step * k1[1], thetaRad: state.thetaRad + 0.5 * step * k1[2] };
    const k2 = kerrMinoDerivativesV277(m1, constants);
    const m2 = { ...state, radiusM: state.radiusM + 0.5 * step * k2[1], thetaRad: state.thetaRad + 0.5 * step * k2[2] };
    const k3 = kerrMinoDerivativesV277(m2, constants);
    const end = { ...state, radiusM: state.radiusM + step * k3[1], thetaRad: state.thetaRad + step * k3[2] };
    const k4 = kerrMinoDerivativesV277(end, constants);
    state.t += step * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6;
    state.radiusM += step * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6;
    state.thetaRad += step * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) / 6;
    state.phiRad += step * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]) / 6;
    if ((previousTheta - Math.PI / 2) * (state.thetaRad - Math.PI / 2) <= 0 && state.radiusM > diskInner && state.radiusM < diskOuter) {
      diskRadius.value = state.radiusM;
      imageOrder += 1;
      status = "disk-intersection";
    }
    previousTheta = state.thetaRad;
    const radialResidual = Math.abs(kerrMinoDerivativesV277(state, constants)[1] ** 2 - kerrNullRadialPotentialV277(args.frame.spinA, state.radiusM, energy, lz, q));
    const polarResidual = Math.abs(kerrMinoDerivativesV277(state, constants)[2] ** 2 - kerrNullPolarPotentialV277(args.frame.spinA, state.thetaRad, energy, lz, q));
    maxConstraint = Math.max(maxConstraint, radialResidual, polarResidual);
    if (!Number.isFinite(state.radiusM + state.thetaRad + state.t + state.phiRad)) { status = "invalid"; break; }
    if (status === "disk-intersection") break;
  }
  return {
    solver: "bounded-rk4-preview",
    tolerance: "fine",
    run: "A",
    kind: "null",
    status,
    coordinateTime: state.t,
    azimuth: state.phiRad,
    emissionRadiusM: diskRadius.value,
    imageOrder,
    nullConstraint: maxConstraint,
    carterDrift: maxConstraint,
    outputSha256: null,
    screenDirection: direction,
  };
}

export function kerrMassShellResidualV277(args: {
  frame: KerrObserverFrameV277;
  direction: readonly [number, number, number];
  muSquared?: number;
  localSpeed?: number;
}): number {
  const length = Math.hypot(...args.direction);
  if (!(length > 0)) throw new RangeError("local direction must be non-zero");
  const direction = args.direction.map((v) => v / length);
  const muSquared = args.muSquared ?? 0;
  const speed = muSquared === 0 ? 1 : Math.max(0, Math.min(1 - 1e-12, args.localSpeed ?? 0.5));
  const gamma = muSquared === 0 ? 1 : 1 / Math.sqrt(1 - speed * speed);
  const vector = [0, 1, 2, 3].map((index) => gamma * args.frame.time[index]
    + gamma * speed * (direction[0] * args.frame.radial[index] + direction[1] * args.frame.polar[index] + direction[2] * args.frame.azimuthal[index]));
  const metric = metricCovariantV277(args.frame.spinA, args.frame.radiusM, args.frame.thetaRad);
  return Math.abs(dotMetricV277(metric, vector, vector) + muSquared);
}

export function createKerrShortGateSkeletonV277(): KerrShortGateV277 {
  return {
    version: KERR_REFERENCE_V277_VERSION,
    selectedRayCount: 16,
    executionsPerRay: 8,
    expectedExecutionCount: 128,
    criticalBracketCount: 40,
    invalidCount: 0,
    nonPhysicalCount: 0,
    watchdogTimeoutCount: 0,
    deterministicRerunPassed: false,
    classificationAgreement: null,
    criticalCurveMaxErrorPx: null,
    errorBudget: null,
    gatePassed: false,
    status: "not-run",
    promotionDecision: "shadow-retained",
    boundary: KERR_REFERENCE_V277_BOUNDARY,
  };
}
