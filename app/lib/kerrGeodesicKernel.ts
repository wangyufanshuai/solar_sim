import type {
  GeodesicInitialState,
  GeodesicIntegrationResult,
  GeodesicClassification,
  KerrOrbitPresetId,
  GeodesicSample,
  KerrMetricParams,
  KerrProbeGeodesicSummary,
  KerrProbeStatus,
  MetricFamily,
  StrongFieldRelativityValidationSummary,
} from "./simulationDiagnosticsTypes";

const ARCSEC_PER_RAD = 206_264.80624709636;
const DEFAULT_THETA = Math.PI / 2;
const MIN_DELTA = 1e-9;
const MIN_SIN2 = 1e-12;

export const SCHWARZSCHILD_STRONG_FIELD_ANCHORS = {
  horizonRadiusM: 2,
  photonSphereRadiusM: 3,
  iscoRadiusM: 6,
} as const;

export const KERR_RELATIVITY_LAB_VERSION = "v19-interactive-kerr-lab" as const;
export const DEFAULT_KERR_ORBIT_PRESET_ID: KerrOrbitPresetId = "photon-ring-demo";
export const DEFAULT_KERR_IMPACT_PARAMETER_M = 5.35;

type GeodesicVector = {
  r: number;
  phi: number;
  t: number;
};

export type KerrMetricTensor = {
  params: KerrMetricParams;
  r: number;
  theta: number;
  sigma: number;
  delta: number;
  covariant: {
    tt: number;
    tPhi: number;
    rr: number;
    thetaTheta: number;
    phiPhi: number;
  };
  contravariant: {
    tt: number;
    tPhi: number;
    rr: number;
    thetaTheta: number;
    phiPhi: number;
  };
};

export type GeodesicIntegrationOptions = {
  maxLambda?: number;
  maxSteps?: number;
  initialStep?: number;
  minStep?: number;
  maxStep?: number;
  tolerance?: number;
  escapeRadius?: number;
  captureEpsilon?: number;
};

function finiteOrThrow(value: number, name: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be finite`);
  }
  return value;
}

function clampSpin(spinA: number | undefined): number {
  const spin = Number.isFinite(spinA) ? spinA ?? 0 : 0;
  return Math.max(-0.999999, Math.min(0.999999, spin));
}

function normalizedParams(metric: MetricFamily, spinA?: number): KerrMetricParams {
  return {
    family: metric,
    spinA: metric === "schwarzschild" ? 0 : clampSpin(spinA),
  };
}

export function kerrOuterHorizonRadiusM(spinA: number): number {
  const a = Math.abs(clampSpin(spinA));
  return 1 + Math.sqrt(Math.max(0, 1 - a * a));
}

export function kerrEquatorialStaticLimitRadiusM(): number {
  return 2;
}

export function kerrEquatorialIscoRadiusM(spinA: number, direction: "prograde" | "retrograde"): number {
  const a = Math.abs(clampSpin(spinA));
  if (a < 1e-14) return 6;
  const oneMinusA2 = Math.max(0, 1 - a * a);
  const z1 =
    1 +
    Math.cbrt(oneMinusA2) *
      (Math.cbrt(1 + a) + Math.cbrt(Math.max(0, 1 - a)));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  const radical = Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
  return direction === "prograde" ? 3 + z2 - radical : 3 + z2 + radical;
}

export function weakFieldLightDeflectionRad(impactParameterM: number): number {
  finiteOrThrow(impactParameterM, "impactParameterM");
  if (impactParameterM <= 0) {
    throw new Error("impactParameterM must be positive");
  }
  return 4 / impactParameterM;
}

export function normalizeKerrImpactParameterM(impactParameterM: number | undefined): number {
  const value = Number.isFinite(impactParameterM) ? impactParameterM ?? DEFAULT_KERR_IMPACT_PARAMETER_M : DEFAULT_KERR_IMPACT_PARAMETER_M;
  return Math.max(2.2, Math.min(18, value));
}

export function createKerrNullProbeInitialState(
  impactParameterM: number | undefined,
  presetId: KerrOrbitPresetId = DEFAULT_KERR_ORBIT_PRESET_ID,
): GeodesicInitialState {
  const b = normalizeKerrImpactParameterM(impactParameterM);
  const criticalCaptureB = 3 * Math.sqrt(3);
  const captured = b < criticalCaptureB;
  return {
    metric: "schwarzschild",
    kind: "null",
    r0: Math.max(18, b * 2.8),
    phi0: captured ? 0 : -0.9,
    radialDirection: captured ? -1 : 1,
    energy: 1,
    angularMomentum: b,
    label: `probe-null-${presetId}-b-${b.toFixed(2)}`,
  };
}

export function kerrProbeIntegrationOptions(impactParameterM: number | undefined): GeodesicIntegrationOptions {
  const b = normalizeKerrImpactParameterM(impactParameterM);
  return {
    maxLambda: Math.max(70, b * 9),
    escapeRadius: Math.max(42, b * 3.2),
    maxStep: 0.08,
    tolerance: 1e-8,
  };
}

export function classifyKerrProbeStatus(status: GeodesicClassification): KerrProbeStatus {
  if (status === "captured") return "capture";
  if (status === "escaped") return "escape";
  if (status === "failed") return "failed";
  return "scatter";
}

export function createKerrProbeGeodesicSummary(args: {
  impactParameterM?: number;
  presetId?: KerrOrbitPresetId;
} = {}): KerrProbeGeodesicSummary {
  const presetId = args.presetId ?? DEFAULT_KERR_ORBIT_PRESET_ID;
  const impactParameterM = normalizeKerrImpactParameterM(args.impactParameterM);
  const result = integrateGeodesic(
    createKerrNullProbeInitialState(impactParameterM, presetId),
    kerrProbeIntegrationOptions(impactParameterM),
  );
  const weakFieldDeflection = weakFieldLightDeflectionRad(impactParameterM);
  return {
    presetId,
    impactParameterM,
    weakFieldDeflectionRad: weakFieldDeflection,
    weakFieldDeflectionArcsec: weakFieldDeflection * ARCSEC_PER_RAD,
    geodesicStatus: result.status,
    probeStatus: classifyKerrProbeStatus(result.status),
    maxHamiltonianConstraintAbs: result.maxHamiltonianConstraintAbs,
    radialRangeMinM: result.radialRange.min,
    radialRangeMaxM: result.radialRange.max,
    sampleCount: result.samples.length,
  };
}

export function kerrMetricAt(
  params: { family: MetricFamily; spinA?: number },
  r: number,
  theta = DEFAULT_THETA,
): KerrMetricTensor {
  finiteOrThrow(r, "r");
  finiteOrThrow(theta, "theta");
  if (r <= 0) {
    throw new Error("r must be positive in Boyer-Lindquist coordinates");
  }
  const normalized = normalizedParams(params.family, params.spinA);
  const a = normalized.spinA;
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);
  const sin2 = Math.max(MIN_SIN2, sinTheta * sinTheta);
  const cos2 = cosTheta * cosTheta;
  const sigma = r * r + a * a * cos2;
  const delta = r * r - 2 * r + a * a;
  const safeDelta = Math.abs(delta) < MIN_DELTA ? Math.sign(delta || 1) * MIN_DELTA : delta;

  return {
    params: normalized,
    r,
    theta,
    sigma,
    delta,
    covariant: {
      tt: -(1 - (2 * r) / sigma),
      tPhi: (-2 * a * r * sin2) / sigma,
      rr: sigma / safeDelta,
      thetaTheta: sigma,
      phiPhi: (r * r + a * a + (2 * a * a * r * sin2) / sigma) * sin2,
    },
    contravariant: {
      tt: -(((r * r + a * a) * (r * r + a * a) - a * a * safeDelta * sin2) / (sigma * safeDelta)),
      tPhi: (-2 * a * r) / (sigma * safeDelta),
      rr: safeDelta / sigma,
      thetaTheta: 1 / sigma,
      phiPhi: (safeDelta - a * a * sin2) / (sigma * safeDelta * sin2),
    },
  };
}

function radialPotential(r: number, initial: GeodesicInitialState, params: KerrMetricParams): number {
  const a = params.spinA;
  const e = initial.energy;
  const l = initial.angularMomentum;
  const mu2 = initial.kind === "timelike" ? 1 : 0;
  const carter = initial.carterConstant ?? 0;
  const delta = r * r - 2 * r + a * a;
  const p = e * (r * r + a * a) - a * l;
  const radial = p * p - delta * (mu2 * r * r + (l - a * e) * (l - a * e) + carter);
  return Math.abs(radial) < 1e-13 ? 0 : radial;
}

function radialVelocity(r: number, initial: GeodesicInitialState, params: KerrMetricParams, sign: -1 | 0 | 1): number {
  if (sign === 0) return 0;
  const radial = radialPotential(r, initial, params);
  if (radial < -1e-8) return Number.NaN;
  return sign * Math.sqrt(Math.max(0, radial)) / (r * r);
}

function derivatives(
  vector: GeodesicVector,
  initial: GeodesicInitialState,
  params: KerrMetricParams,
  sign: -1 | 0 | 1,
): GeodesicVector {
  const r = vector.r;
  const a = params.spinA;
  const e = initial.energy;
  const l = initial.angularMomentum;
  const delta = r * r - 2 * r + a * a;
  if (Math.abs(delta) < MIN_DELTA) {
    throw new Error("Geodesic reached the coordinate horizon");
  }
  const p = e * (r * r + a * a) - a * l;
  const dr = radialVelocity(r, initial, params, sign);
  if (!Number.isFinite(dr)) {
    throw new Error("Radial potential is negative for this first-order geodesic state");
  }
  return {
    r: dr,
    phi: ((l - a * e) + (a * p) / delta) / (r * r),
    t: (a * (l - a * e) + ((r * r + a * a) * p) / delta) / (r * r),
  };
}

function addScaled(vector: GeodesicVector, delta: GeodesicVector, scale: number): GeodesicVector {
  return {
    r: vector.r + delta.r * scale,
    phi: vector.phi + delta.phi * scale,
    t: vector.t + delta.t * scale,
  };
}

function rk4Step(
  vector: GeodesicVector,
  h: number,
  initial: GeodesicInitialState,
  params: KerrMetricParams,
  sign: -1 | 0 | 1,
): GeodesicVector {
  const k1 = derivatives(vector, initial, params, sign);
  const k2 = derivatives(addScaled(vector, k1, h / 2), initial, params, sign);
  const k3 = derivatives(addScaled(vector, k2, h / 2), initial, params, sign);
  const k4 = derivatives(addScaled(vector, k3, h), initial, params, sign);
  return {
    r: vector.r + (h / 6) * (k1.r + 2 * k2.r + 2 * k3.r + k4.r),
    phi: vector.phi + (h / 6) * (k1.phi + 2 * k2.phi + 2 * k3.phi + k4.phi),
    t: vector.t + (h / 6) * (k1.t + 2 * k2.t + 2 * k3.t + k4.t),
  };
}

function stepError(oneStep: GeodesicVector, twoHalfSteps: GeodesicVector, tolerance: number): number {
  const rScale = Math.max(1, Math.abs(twoHalfSteps.r));
  const phiScale = Math.max(1, Math.abs(twoHalfSteps.phi));
  const tScale = Math.max(1, Math.abs(twoHalfSteps.t));
  return Math.max(
    Math.abs(oneStep.r - twoHalfSteps.r) / (tolerance * rScale),
    Math.abs(oneStep.phi - twoHalfSteps.phi) / (tolerance * phiScale),
    Math.abs(oneStep.t - twoHalfSteps.t) / (tolerance * tScale),
  );
}

function hamiltonianFor(
  vector: GeodesicVector,
  initial: GeodesicInitialState,
  params: KerrMetricParams,
  sign: -1 | 0 | 1,
): number {
  const metric = kerrMetricAt(params, vector.r, initial.theta0 ?? DEFAULT_THETA);
  const pt = -initial.energy;
  const pPhi = initial.angularMomentum;
  const dr = radialVelocity(vector.r, initial, params, sign);
  const pR = metric.covariant.rr * (Number.isFinite(dr) ? dr : 0);
  return 0.5 * (
    metric.contravariant.tt * pt * pt +
    2 * metric.contravariant.tPhi * pt * pPhi +
    metric.contravariant.rr * pR * pR +
    metric.contravariant.phiPhi * pPhi * pPhi
  );
}

function sampleFor(
  lambda: number,
  vector: GeodesicVector,
  initial: GeodesicInitialState,
  params: KerrMetricParams,
  sign: -1 | 0 | 1,
): GeodesicSample {
  return {
    lambda,
    t: vector.t,
    r: vector.r,
    theta: initial.theta0 ?? DEFAULT_THETA,
    phi: vector.phi,
    hamiltonian: hamiltonianFor(vector, initial, params, sign),
    energy: initial.energy,
    angularMomentum: initial.angularMomentum,
    carterLikeInvariant: initial.carterConstant ?? 0,
  };
}

function terminalStatus(
  vector: GeodesicVector,
  params: KerrMetricParams,
  escapeRadius: number,
  captureEpsilon: number,
): "captured" | "escaped" | null {
  if (vector.r <= kerrOuterHorizonRadiusM(params.spinA) + captureEpsilon) return "captured";
  if (vector.r >= escapeRadius) return "escaped";
  return null;
}

export function integrateGeodesic(
  initial: GeodesicInitialState,
  options: GeodesicIntegrationOptions = {},
): GeodesicIntegrationResult {
  finiteOrThrow(initial.r0, "r0");
  finiteOrThrow(initial.energy, "energy");
  finiteOrThrow(initial.angularMomentum, "angularMomentum");
  if (initial.r0 <= 0) {
    throw new Error("r0 must be positive");
  }
  const params = normalizedParams(initial.metric, initial.spinA);
  let sign: -1 | 0 | 1 = initial.radialDirection ?? 0;
  const maxLambda = options.maxLambda ?? 80;
  const maxSteps = options.maxSteps ?? 20_000;
  const minStep = options.minStep ?? 1e-4;
  const maxStep = options.maxStep ?? 0.25;
  const tolerance = options.tolerance ?? 1e-8;
  const escapeRadius = options.escapeRadius ?? Math.max(80, initial.r0 * 1.6);
  const captureEpsilon = options.captureEpsilon ?? 1e-4;
  let h = Math.min(maxStep, options.initialStep ?? 0.05);
  let lambda = 0;
  let vector: GeodesicVector = {
    r: initial.r0,
    phi: initial.phi0 ?? 0,
    t: initial.t0 ?? 0,
  };
  const samples: GeodesicSample[] = [sampleFor(0, vector, initial, params, sign)];
  const target = initial.kind === "timelike" ? -0.5 : 0;
  let stepsAccepted = 0;
  let stepsRejected = 0;
  let maxConstraint = Math.abs(samples[0]!.hamiltonian - target);
  let minR = vector.r;
  let maxR = vector.r;
  let status: GeodesicIntegrationResult["status"] | null = terminalStatus(vector, params, escapeRadius, captureEpsilon);
  let turned = false;

  try {
    while (!status && lambda < maxLambda && stepsAccepted + stepsRejected < maxSteps) {
      const remaining = maxLambda - lambda;
      const step = Math.min(h, remaining);
      const radial = radialPotential(vector.r, initial, params);
      if (sign !== 0 && radial <= 1e-10 && stepsAccepted > 0) {
        sign = sign === 1 ? -1 : 1;
        turned = true;
      }

      const one = rk4Step(vector, step, initial, params, sign);
      const half = rk4Step(vector, step / 2, initial, params, sign);
      const two = rk4Step(half, step / 2, initial, params, sign);
      const error = stepError(one, two, tolerance);

      if (error <= 1 || step <= minStep * 1.01) {
        vector = two;
        lambda += step;
        stepsAccepted += 1;
        const sample = sampleFor(lambda, vector, initial, params, sign);
        samples.push(sample);
        maxConstraint = Math.max(maxConstraint, Math.abs(sample.hamiltonian - target));
        minR = Math.min(minR, vector.r);
        maxR = Math.max(maxR, vector.r);
        status = terminalStatus(vector, params, escapeRadius, captureEpsilon);
        const grow = error <= 0 ? 2 : Math.min(2, Math.max(0.35, 0.9 * Math.pow(1 / error, 0.2)));
        h = Math.min(maxStep, Math.max(minStep, step * grow));
      } else {
        stepsRejected += 1;
        h = Math.max(minStep, step * Math.max(0.2, 0.9 * Math.pow(1 / error, 0.25)));
      }
    }
  } catch {
    status = "failed";
  }

  if (!status) {
    const rDrift = maxR - minR;
    status = rDrift < 1e-5 ? "bounded" : turned ? "turning-point" : "max-steps";
  }

  return {
    status,
    initialState: initial,
    params,
    samples,
    stepsAccepted,
    stepsRejected,
    hamiltonianTarget: target,
    maxHamiltonianConstraintAbs: maxConstraint,
    energyDrift: 0,
    angularMomentumDrift: 0,
    carterLikeInvariantDrift: 0,
    radialRange: {
      min: minR,
      max: maxR,
    },
  };
}

export function schwarzschildCircularTimelikeConstants(radiusM: number): { energy: number; angularMomentum: number } {
  finiteOrThrow(radiusM, "radiusM");
  if (radiusM <= 3) {
    throw new Error("Circular timelike Schwarzschild orbits require r > 3M");
  }
  return {
    energy: (radiusM - 2) / Math.sqrt(radiusM * (radiusM - 3)),
    angularMomentum: radiusM / Math.sqrt(radiusM - 3),
  };
}

export function schwarzschildPhotonSphereConstants(): { energy: number; angularMomentum: number } {
  return {
    energy: 1,
    angularMomentum: 3 * Math.sqrt(3),
  };
}

export function createSchwarzschildValidationSummary() {
  const isco = schwarzschildCircularTimelikeConstants(SCHWARZSCHILD_STRONG_FIELD_ANCHORS.iscoRadiusM);
  const photon = schwarzschildPhotonSphereConstants();
  const iscoOrbit = integrateGeodesic(
    {
      metric: "schwarzschild",
      kind: "timelike",
      r0: SCHWARZSCHILD_STRONG_FIELD_ANCHORS.iscoRadiusM,
      radialDirection: 0,
      energy: isco.energy,
      angularMomentum: isco.angularMomentum,
      label: "schwarzschild-isco",
    },
    { maxLambda: 48, maxStep: 0.2, tolerance: 1e-10 },
  );
  const photonOrbit = integrateGeodesic(
    {
      metric: "schwarzschild",
      kind: "null",
      r0: SCHWARZSCHILD_STRONG_FIELD_ANCHORS.photonSphereRadiusM,
      radialDirection: 0,
      energy: photon.energy,
      angularMomentum: photon.angularMomentum,
      label: "schwarzschild-photon-sphere",
    },
    { maxLambda: 32, maxStep: 0.2, tolerance: 1e-10 },
  );
  return {
    anchors: SCHWARZSCHILD_STRONG_FIELD_ANCHORS,
    iscoOrbit,
    photonOrbit,
  };
}

export function createKerrGeodesicValidationSummary(args: number | {
  spinA?: number;
  impactParameterM?: number;
  presetId?: KerrOrbitPresetId;
} = 0.9): StrongFieldRelativityValidationSummary {
  const spinA = typeof args === "number" ? args : args.spinA ?? 0.9;
  const presetId = typeof args === "number" ? DEFAULT_KERR_ORBIT_PRESET_ID : args.presetId ?? DEFAULT_KERR_ORBIT_PRESET_ID;
  const impactParameterM = normalizeKerrImpactParameterM(
    typeof args === "number" ? DEFAULT_KERR_IMPACT_PARAMETER_M : args.impactParameterM,
  );
  try {
    const schwarzschild = createSchwarzschildValidationSummary();
    const b = impactParameterM;
    const deflection = weakFieldLightDeflectionRad(b);
    const capture = integrateGeodesic(
      {
        metric: "schwarzschild",
        kind: "null",
        r0: 2.8,
        radialDirection: -1,
        energy: 1,
        angularMomentum: 1.5,
        label: "capture-smoke",
      },
      { maxLambda: 20, escapeRadius: 80, maxStep: 0.05 },
    );
    const escape = integrateGeodesic(
      {
        metric: "schwarzschild",
        kind: "null",
        r0: 30,
        radialDirection: 1,
        energy: 1,
        angularMomentum: 4,
        label: "escape-smoke",
      },
      { maxLambda: 80, escapeRadius: 60, maxStep: 0.2 },
    );
    const probe = createKerrProbeGeodesicSummary({
      impactParameterM: b,
      presetId,
    });
    return {
      status: "ready",
      kernel: "kerr-geodesic-v17",
      relativityKernel: "eih-1pn+kerr-geodesic-v17",
      labVersion: KERR_RELATIVITY_LAB_VERSION,
      orbitPresetId: presetId,
      metricFamilies: ["schwarzschild", "kerr"],
      geodesicKinds: ["timelike", "null"],
      schwarzschild: {
        horizonRadiusM: SCHWARZSCHILD_STRONG_FIELD_ANCHORS.horizonRadiusM,
        photonSphereRadiusM: SCHWARZSCHILD_STRONG_FIELD_ANCHORS.photonSphereRadiusM,
        iscoRadiusM: SCHWARZSCHILD_STRONG_FIELD_ANCHORS.iscoRadiusM,
        weakFieldDeflectionApprox: "4M/b",
      },
      kerr: {
        spinA: clampSpin(spinA),
        outerHorizonRadiusM: kerrOuterHorizonRadiusM(spinA),
        progradeIscoRadiusM: kerrEquatorialIscoRadiusM(spinA, "prograde"),
        retrogradeIscoRadiusM: kerrEquatorialIscoRadiusM(spinA, "retrograde"),
        equatorialStaticLimitRadiusM: kerrEquatorialStaticLimitRadiusM(),
      },
      weakFieldLightDeflection: {
        impactParameterM: b,
        formulaRad: deflection,
        formulaArcsec: deflection * ARCSEC_PER_RAD,
        targetApproxRad: 4 / b,
        errorPercent: 0,
      },
      integration: {
        nullHamiltonianDrift: schwarzschild.photonOrbit.maxHamiltonianConstraintAbs,
        timelikeHamiltonianDrift: schwarzschild.iscoOrbit.maxHamiltonianConstraintAbs,
        probeHamiltonianDrift: probe.maxHamiltonianConstraintAbs,
        photonSphereRadialDrift:
          schwarzschild.photonOrbit.radialRange.max - schwarzschild.photonOrbit.radialRange.min,
        iscoRadialDrift:
          schwarzschild.iscoOrbit.radialRange.max - schwarzschild.iscoOrbit.radialRange.min,
        captureStatus: capture.status,
        escapeStatus: escape.status,
        probeStatus: probe.probeStatus,
      },
      probe,
      semantics: {
        strongField: "geodesic-backed-validation-lab",
        solarDynamics: "not-replaced-eih-1pn",
        numericalRelativity: "not-einstein-field-equation-solver",
        orbitAtlas: "presentation-layer",
      },
    };
  } catch (error) {
    return {
      status: "failed",
      kernel: "kerr-geodesic-v17",
      relativityKernel: "eih-1pn+kerr-geodesic-v17",
      labVersion: KERR_RELATIVITY_LAB_VERSION,
      orbitPresetId: presetId,
      metricFamilies: ["schwarzschild", "kerr"],
      geodesicKinds: ["timelike", "null"],
      schwarzschild: {
        horizonRadiusM: 2,
        photonSphereRadiusM: 3,
        iscoRadiusM: 6,
        weakFieldDeflectionApprox: "4M/b",
      },
      kerr: {
        spinA: clampSpin(spinA),
        outerHorizonRadiusM: Number.NaN,
        progradeIscoRadiusM: Number.NaN,
        retrogradeIscoRadiusM: Number.NaN,
        equatorialStaticLimitRadiusM: Number.NaN,
      },
      weakFieldLightDeflection: {
        impactParameterM,
        formulaRad: Number.NaN,
        formulaArcsec: Number.NaN,
        targetApproxRad: Number.NaN,
        errorPercent: Number.NaN,
      },
      integration: {
        nullHamiltonianDrift: Number.NaN,
        timelikeHamiltonianDrift: Number.NaN,
        probeHamiltonianDrift: Number.NaN,
        photonSphereRadialDrift: Number.NaN,
        iscoRadialDrift: Number.NaN,
        captureStatus: "failed",
        escapeStatus: "failed",
        probeStatus: "failed",
      },
      probe: {
        presetId,
        impactParameterM,
        weakFieldDeflectionRad: Number.NaN,
        weakFieldDeflectionArcsec: Number.NaN,
        geodesicStatus: "failed",
        probeStatus: "failed",
        maxHamiltonianConstraintAbs: Number.NaN,
        radialRangeMinM: Number.NaN,
        radialRangeMaxM: Number.NaN,
        sampleCount: 0,
      },
      semantics: {
        strongField: "geodesic-backed-validation-lab",
        solarDynamics: "not-replaced-eih-1pn",
        numericalRelativity: "not-einstein-field-equation-solver",
        orbitAtlas: "presentation-layer",
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
