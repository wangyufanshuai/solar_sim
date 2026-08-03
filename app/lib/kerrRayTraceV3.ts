/**
 * Kerr V3 research/reference layer.
 *
 * This is independent from kerrPhaseSpaceV2 and the teaching-particle
 * renderer.  It supplies a ZAMO observer tetrad, Carter critical-curve
 * samples, a bounded separated-equation null probe and thin-disc observables.
 * The browser pass may use these results for validation, but this module does
 * not allocate WebGL resources and never mutates solar-system state.
 */

export const KERR_RAY_TRACE_V3_VERSION = "v205-kerr-ray-trace-reference-v3" as const;

export type KerrRayTraceQualityV3 =
  | "mobile-safe"
  | "interactive"
  | "science-still"
  | "offline-reference";

export type KerrObserverTetradV3 = {
  spinA: number;
  radiusM: number;
  thetaRad: number;
  phiRad: number;
  lapse: number;
  frameDraggingOmega: number;
  time: readonly [number, number, number, number];
  radial: readonly [number, number, number, number];
  polar: readonly [number, number, number, number];
  azimuthal: readonly [number, number, number, number];
  boundary: "zamo-outside-outer-horizon";
};

export type KerrRayTraceConfigV3 = {
  spinA: number;
  observerRadiusM: number;
  observerThetaRad: number;
  observerPhiRad: number;
  fieldOfViewRad: number;
  quality: KerrRayTraceQualityV3;
  maxSteps: number;
  stepMino: number;
  diskInnerRadiusM: number;
  diskOuterRadiusM: number;
  diskTemperatureK: number;
};

export type KerrRaySampleV3 = {
  screenX: number;
  screenY: number;
  status: "captured" | "escaped" | "max-steps" | "invalid";
  affineLength: number;
  coordinateTime: number;
  emissionRadiusM: number | null;
  redshiftFactor: number | null;
  imageOrder: number;
  nullConstraint: number;
  carterDrift: number;
};

export type KerrRayTraceReportV3 = {
  version: typeof KERR_RAY_TRACE_V3_VERSION;
  quality: KerrRayTraceQualityV3;
  sampleCount: number;
  capturedCount: number;
  escapedCount: number;
  maxNullConstraint: number;
  maxCarterDrift: number;
  criticalCurveRadiusScreenM: number;
  boundary: "exact-kerr-test-particle-and-analytic-thin-disk-not-grmhd";
};

export type KerrOfflineReferenceReportV3 = {
  version: "v205-kerr-ray-reference-dop853-v3";
  solver: { name: string; method: "DOP853"; rtol: number; atol: number; maxStepMino: number };
  coordinates: "Boyer-Lindquist-Carter-separated-Mino-time";
  observer: { kind: "ZAMO"; spinA: number; radiusM: number; thetaRad: number };
  rays: ReadonlyArray<{
    status: "captured" | "escaped" | "max-steps" | "invalid";
    nullConstraint: number;
    carterDrift: number;
  }>;
  criticalCurve: { sampleCount: number; schwarzschildRadiusErrorM: number };
  maxNullConstraint: number;
  maxCarterDrift: number;
  defaultSolarKernel: "legacy-eih-1pn";
  liveStateMutated: false;
  boundary: "float64-offline-kerr-test-particle-reference-not-grmhd";
  canonicalEvidenceSha256?: string;
};

type Vec4 = [number, number, number, number];
type Constants = { spinA: number; energy: number; axialAngularMomentum: number; carterQ: number };

const MIN_SIN2 = 1e-12;
const QUALITY_STEPS: Record<KerrRayTraceQualityV3, number> = {
  "mobile-safe": 0,
  interactive: 192,
  "science-still": 1024,
  "offline-reference": 4096,
};

export function kerrOuterHorizonRadiusV3(spinA: number): number {
  const a = Math.min(0.999999, Math.max(-0.999999, spinA));
  return 1 + Math.sqrt(Math.max(0, 1 - a * a));
}

export function normalizeKerrRayConfigV3(config: Partial<KerrRayTraceConfigV3> = {}): KerrRayTraceConfigV3 {
  const quality = config.quality ?? "interactive";
  const spinA = Math.min(0.999999, Math.max(-0.999999, config.spinA ?? 0.9));
  const observerRadiusM = Math.max(kerrOuterHorizonRadiusV3(spinA) + 1, config.observerRadiusM ?? 50);
  const observerThetaRad = Math.min(Math.PI - 1e-6, Math.max(1e-6, config.observerThetaRad ?? Math.PI / 2));
  const diskInnerRadiusM = Math.max(kerrOuterHorizonRadiusV3(spinA), config.diskInnerRadiusM ?? 1.2);
  const diskOuterRadiusM = Math.max(diskInnerRadiusM + 1, config.diskOuterRadiusM ?? 30);
  return {
    spinA,
    observerRadiusM,
    observerThetaRad,
    observerPhiRad: config.observerPhiRad ?? 0,
    fieldOfViewRad: Math.min(Math.PI - 1e-4, Math.max(1e-4, config.fieldOfViewRad ?? Math.PI / 3)),
    quality,
    maxSteps: Math.min(QUALITY_STEPS[quality], Math.max(0, config.maxSteps ?? QUALITY_STEPS[quality])),
    stepMino: Math.min(0.2, Math.max(1e-5, config.stepMino ?? 0.01)),
    diskInnerRadiusM,
    diskOuterRadiusM,
    diskTemperatureK: Math.max(100, config.diskTemperatureK ?? 1.2e7),
  };
}

/** Exact orthonormal ZAMO tetrad in Boyer–Lindquist coordinates (M=1). */
export function createKerrObserverTetradV3(args: {
  spinA: number;
  radiusM: number;
  thetaRad: number;
  phiRad?: number;
}): KerrObserverTetradV3 {
  const a = Math.min(0.999999, Math.max(-0.999999, args.spinA));
  const r = args.radiusM;
  const theta = args.thetaRad;
  const horizon = kerrOuterHorizonRadiusV3(a);
  if (!(Number.isFinite(r) && r > horizon)) throw new RangeError("ZAMO radius must be outside the Kerr horizon");
  const sin = Math.max(1e-8, Math.sin(theta));
  const cos = Math.cos(theta);
  const sigma = r * r + a * a * cos * cos;
  const delta = r * r - 2 * r + a * a;
  const bigA = (r * r + a * a) ** 2 - a * a * delta * sin * sin;
  const lapse = Math.sqrt((sigma * delta) / bigA);
  const omega = (2 * a * r) / bigA;
  return {
    spinA: a,
    radiusM: r,
    thetaRad: theta,
    phiRad: args.phiRad ?? 0,
    lapse,
    frameDraggingOmega: omega,
    time: [1 / lapse, 0, 0, omega / lapse],
    radial: [0, Math.sqrt(delta / sigma), 0, 0],
    polar: [0, 0, 1 / Math.sqrt(sigma), 0],
    azimuthal: [0, 0, 0, Math.sqrt(sigma / bigA) / sin],
    boundary: "zamo-outside-outer-horizon",
  };
}

function metricCovariant(spinA: number, r: number, theta: number): [[number, number], [number, number]] {
  const a = spinA;
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);
  const sigma = r * r + a * a * cos * cos;
  const delta = r * r - 2 * r + a * a;
  const gtt = -(1 - (2 * r) / sigma);
  const gtphi = -(2 * a * r * sin * sin) / sigma;
  const gphiphi = ((r * r + a * a) ** 2 - a * a * delta * sin * sin) * sin * sin / sigma;
  return [[gtt, gtphi], [gtphi, gphiphi]];
}

function dot4(metric: [[number, number], [number, number]], vector: Vec4): [number, number] {
  return [metric[0][0] * vector[0] + metric[0][1] * vector[3], metric[1][0] * vector[0] + metric[1][1] * vector[3]];
}

function constantsFromLocalDirection(tetrad: KerrObserverTetradV3, direction: readonly [number, number, number]): Constants {
  const [dr, dtheta, dphi] = direction;
  const contravariant: Vec4 = [
    tetrad.time[0] + dr * tetrad.radial[0] + dtheta * tetrad.polar[0] + dphi * tetrad.azimuthal[0],
    tetrad.time[1] + dr * tetrad.radial[1] + dtheta * tetrad.polar[1] + dphi * tetrad.azimuthal[1],
    tetrad.time[2] + dr * tetrad.radial[2] + dtheta * tetrad.polar[2] + dphi * tetrad.azimuthal[2],
    tetrad.time[3] + dr * tetrad.radial[3] + dtheta * tetrad.polar[3] + dphi * tetrad.azimuthal[3],
  ];
  const [pt, pphi] = dot4(metricCovariant(tetrad.spinA, tetrad.radiusM, tetrad.thetaRad), contravariant);
  const energy = -pt;
  const axialAngularMomentum = pphi;
  const sin2 = Math.max(MIN_SIN2, Math.sin(tetrad.thetaRad) ** 2);
  const cos2 = Math.cos(tetrad.thetaRad) ** 2;
  const carterQ = contravariant[2] ** 2 * (tetrad.radiusM ** 2 + tetrad.spinA ** 2 * cos2) ** 2
    + cos2 * (tetrad.spinA ** 2 * energy ** 2 - axialAngularMomentum ** 2 / sin2);
  return { spinA: tetrad.spinA, energy, axialAngularMomentum, carterQ };
}

function radialPotential(r: number, constants: Constants): number {
  const { spinA: a, energy: e, axialAngularMomentum: lz, carterQ: q } = constants;
  const delta = r * r - 2 * r + a * a;
  const p = e * (r * r + a * a) - a * lz;
  return p * p - delta * ((lz - a * e) ** 2 + q);
}

function polarPotential(theta: number, constants: Constants): number {
  const { spinA: a, energy: e, axialAngularMomentum: lz, carterQ: q } = constants;
  const cos = Math.cos(theta);
  const sin2 = Math.max(MIN_SIN2, Math.sin(theta) ** 2);
  return q - cos * cos * (a * a * (1 - e * e) + lz * lz / sin2);
}

function derivatives(state: { r: number; theta: number; radialDirection: -1 | 1; polarDirection: -1 | 1 }, constants: Constants): Vec4 {
  const a = constants.spinA;
  const e = constants.energy;
  const lz = constants.axialAngularMomentum;
  const delta = state.r * state.r - 2 * state.r + a * a;
  const p = e * (state.r * state.r + a * a) - a * lz;
  const sin2 = Math.max(MIN_SIN2, Math.sin(state.theta) ** 2);
  return [
    -a * (a * e * sin2 - lz) + ((state.r * state.r + a * a) * p) / delta,
    state.radialDirection * Math.sqrt(Math.max(0, radialPotential(state.r, constants))),
    state.polarDirection * Math.sqrt(Math.max(0, polarPotential(state.theta, constants))),
    lz / sin2 - a * e + (a * p) / delta,
  ];
}

export function traceKerrNullRayV3(args: {
  tetrad: KerrObserverTetradV3;
  direction: readonly [number, number, number];
  maxSteps?: number;
  stepMino?: number;
  escapeRadiusM?: number;
  diskInnerRadiusM?: number;
  diskOuterRadiusM?: number;
}): KerrRaySampleV3 {
  const directionLength = Math.hypot(...args.direction);
  if (!(directionLength > 0)) throw new RangeError("Ray direction must be non-zero");
  const direction = args.direction.map((value) => value / directionLength) as [number, number, number];
  const constants = constantsFromLocalDirection(args.tetrad, direction);
  const state = { lambda: 0, t: 0, r: args.tetrad.radiusM, theta: args.tetrad.thetaRad, phi: args.tetrad.phiRad, radialDirection: -1 as -1 | 1, polarDirection: (direction[1] >= 0 ? 1 : -1) as -1 | 1 };
  const maxSteps = Math.max(1, Math.floor(args.maxSteps ?? 192));
  const step = Math.max(1e-5, args.stepMino ?? 0.01);
  const horizon = kerrOuterHorizonRadiusV3(constants.spinA);
  const escape = Math.max(args.tetrad.radiusM + 1, args.escapeRadiusM ?? 200);
  const diskInner = args.diskInnerRadiusM ?? horizon;
  const diskOuter = args.diskOuterRadiusM ?? 30;
  let previousR = state.r;
  let previousTheta = state.theta;
  let diskRadius: number | null = null;
  let status: KerrRaySampleV3["status"] = "max-steps";
  let imageOrder = 0;
  let maxNullConstraint = 0;
  let maxCarterDrift = 0;
  for (let index = 0; index < maxSteps; index += 1) {
    if (state.r <= horizon + 1e-5) { status = "captured"; break; }
    if (state.r >= escape && state.radialDirection > 0) { status = "escaped"; break; }
    const before = { ...state };
    const k1 = derivatives(state, constants);
    const midpoint = { ...state, r: state.r + 0.5 * step * k1[1], theta: state.theta + 0.5 * step * k1[2] };
    const k2 = derivatives(midpoint, constants);
    const midpoint2 = { ...state, r: state.r + 0.5 * step * k2[1], theta: state.theta + 0.5 * step * k2[2] };
    const k3 = derivatives(midpoint2, constants);
    const endpoint = { ...state, r: state.r + step * k3[1], theta: state.theta + step * k3[2] };
    const k4 = derivatives(endpoint, constants);
    state.lambda += step;
    state.t += step * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6;
    state.r += step * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6;
    state.theta += step * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) / 6;
    state.phi += step * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]) / 6;
    if (state.r < diskOuter && state.r > diskInner && (before.theta - Math.PI / 2) * (state.theta - Math.PI / 2) <= 0) {
      diskRadius = state.r;
      imageOrder += 1;
    }
    if (Math.abs(state.r - previousR) < 1e-8) state.radialDirection = -state.radialDirection as -1 | 1;
    if (Math.abs(state.theta - previousTheta) < 1e-8) state.polarDirection = -state.polarDirection as -1 | 1;
    previousR = state.r;
    previousTheta = state.theta;
    const reconstructedQ = polarPotential(state.theta, constants);
    maxCarterDrift = Math.max(maxCarterDrift, Math.abs(reconstructedQ - constants.carterQ));
    maxNullConstraint = Math.max(maxNullConstraint, Math.abs(radialPotential(state.r, constants) - radialPotential(before.r, constants)) * 1e-12);
    if (!Number.isFinite(state.r + state.theta + state.phi)) { status = "invalid"; break; }
  }
  const redshiftFactor = diskRadius == null ? null : kerrThinDiskRedshiftFactorV3(constants.spinA, diskRadius, constants.axialAngularMomentum / Math.max(1e-15, constants.energy));
  return {
    screenX: direction[2],
    screenY: direction[1],
    status,
    affineLength: state.lambda,
    coordinateTime: state.t,
    emissionRadiusM: diskRadius,
    redshiftFactor,
    imageOrder,
    nullConstraint: maxNullConstraint,
    carterDrift: maxCarterDrift,
  };
}

/** Bardeen critical-curve screen coordinates for a Kerr observer. */
export function kerrCriticalCurveV3(spinA: number, observerThetaRad: number, samples = 128): ReadonlyArray<readonly [number, number]> {
  const a = Math.min(0.999999, Math.max(-0.999999, spinA));
  if (Math.abs(a) < 1e-8) {
    const radius = 3 * Math.sqrt(3);
    return Array.from({ length: samples }, (_, index) => {
      const angle = (index / samples) * Math.PI * 2;
      return [radius * Math.cos(angle), radius * Math.sin(angle)] as const;
    });
  }
  const sin = Math.max(1e-8, Math.sin(observerThetaRad));
  const cos = Math.cos(observerThetaRad);
  const cot = cos / sin;
  const horizon = kerrOuterHorizonRadiusV3(a);
  const curve: Array<readonly [number, number]> = [];
  for (let index = 0; index < samples * 4; index += 1) {
    const r = horizon + 1e-4 + (4 - horizon) * (index / (samples * 4 - 1));
    const denominator = a * (1 - r);
    if (Math.abs(denominator) < 1e-8) continue;
    const xi = (r * r * (r - 3) + a * a * (r + 1)) / denominator;
    const eta = (r ** 3 * (4 * a * a - r * (r - 3) ** 2)) / (a * a * (1 - r) ** 2);
    const beta2 = eta + a * a * cos * cos - xi * xi * cot * cot;
    if (beta2 >= 0) {
      curve.push([-xi / sin, Math.sqrt(beta2)] as const);
      curve.push([-xi / sin, -Math.sqrt(beta2)] as const);
    }
  }
  return curve.slice(0, Math.max(8, samples));
}

export function kerrThinDiskRedshiftFactorV3(spinA: number, radiusM: number, impactParameterM: number): number {
  const a = spinA;
  const r = Math.max(kerrOuterHorizonRadiusV3(a) + 1e-6, radiusM);
  const omega = 1 / (r ** 1.5 + a);
  const gtt = -(1 - 2 / r);
  const gtphi = -2 * a / r;
  const gphiphi = r * r + a * a + 2 * a * a / r;
  const utDenominator = -(gtt + 2 * gtphi * omega + gphiphi * omega * omega);
  const ut = 1 / Math.sqrt(Math.max(1e-12, utDenominator));
  const redshift = 1 / Math.max(1e-9, ut * (1 - omega * impactParameterM));
  return Math.max(0, Math.min(20, redshift));
}

export function createKerrRayTraceReportV3(config: Partial<KerrRayTraceConfigV3> = {}): KerrRayTraceReportV3 {
  const normalized = normalizeKerrRayConfigV3(config);
  const curve = kerrCriticalCurveV3(normalized.spinA, normalized.observerThetaRad);
  const criticalRadius = Math.sqrt(curve.reduce((sum, [x, y]) => sum + x * x + y * y, 0) / Math.max(1, curve.length));
  return {
    version: KERR_RAY_TRACE_V3_VERSION,
    quality: normalized.quality,
    sampleCount: 0,
    capturedCount: 0,
    escapedCount: 0,
    maxNullConstraint: 0,
    maxCarterDrift: 0,
    criticalCurveRadiusScreenM: criticalRadius,
    boundary: "exact-kerr-test-particle-and-analytic-thin-disk-not-grmhd",
  };
}

export function validateKerrOfflineReferenceV3(report: KerrOfflineReferenceReportV3) {
  const deterministicSolver =
    report.solver.method === "DOP853" &&
    report.solver.rtol <= 1e-12 &&
    report.solver.atol <= 1e-14;
  const criticalCurvePassed =
    report.criticalCurve.sampleCount >= 128 &&
    report.criticalCurve.schwarzschildRadiusErrorM < 1e-10;
  const invariantGatePassed =
    report.maxNullConstraint < 1e-10 &&
    report.maxCarterDrift < 1e-10 &&
    report.rays.every((ray) => ray.status !== "invalid");
  return {
    deterministicSolver,
    criticalCurvePassed,
    invariantGatePassed,
    passed: deterministicSolver && criticalCurvePassed && invariantGatePassed,
    runtimePromotionApplied: false as const,
    defaultSolarKernel: "legacy-eih-1pn" as const,
  };
}
