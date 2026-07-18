import { kerrMetricAt, kerrOuterHorizonRadiusM } from "./kerrGeodesicKernel";

export const KERR_3D_GEODESIC_VERSION = "v129-kerr-3d-geodesics" as const;

export type KerrPhaseSpaceState = {
  lambda: number;
  t: number;
  r: number;
  theta: number;
  phi: number;
  radialDirection: -1 | 0 | 1;
  polarDirection: -1 | 0 | 1;
};

export type KerrConstantsOfMotion = {
  kind: "null" | "timelike";
  spinA: number;
  energy: number;
  axialAngularMomentum: number;
  carterQ: number;
};

export type KerrInvariantReport = {
  version: typeof KERR_3D_GEODESIC_VERSION;
  status: "captured" | "escaped" | "turning-point" | "max-steps" | "invalid";
  hamiltonianTarget: number;
  maxHamiltonianDrift: number;
  maxEnergyDrift: number;
  maxAxialAngularMomentumDrift: number;
  maxCarterDrift: number;
  horizonCrossingLambda: number | null;
  sampleCount: number;
  boundary: "test-particle-only-isolated-from-solar-nbody";
};

export type KerrPhaseSpaceSample = KerrPhaseSpaceState & {
  hamiltonian: number;
  reconstructedCarterQ: number;
};

export type KerrTurningPointEvent = {
  kind: "radial" | "polar";
  lambda: number;
  r: number;
  theta: number;
  previousDirection: -1 | 1;
  nextDirection: -1 | 1;
};

export type KerrPhaseSpaceIntegrationResult = {
  constants: KerrConstantsOfMotion;
  samples: KerrPhaseSpaceSample[];
  turningPoints: KerrTurningPointEvent[];
  report: KerrInvariantReport;
};

type KerrMinoDerivative = Pick<KerrPhaseSpaceState, "t" | "r" | "theta" | "phi">;

const MIN_DELTA = 1e-10;
const MIN_SIN2 = 1e-12;

export function kerrRadialPotential(
  r: number,
  constants: KerrConstantsOfMotion,
): number {
  const { spinA: a, energy: e, axialAngularMomentum: lz, carterQ: q } = constants;
  const mu2 = constants.kind === "timelike" ? 1 : 0;
  const delta = r * r - 2 * r + a * a;
  const p = e * (r * r + a * a) - a * lz;
  return p * p - delta * (mu2 * r * r + (lz - a * e) ** 2 + q);
}

export function kerrPolarPotential(
  theta: number,
  constants: KerrConstantsOfMotion,
): number {
  const { spinA: a, energy: e, axialAngularMomentum: lz, carterQ: q } = constants;
  const mu2 = constants.kind === "timelike" ? 1 : 0;
  const cos = Math.cos(theta);
  const sin2 = Math.max(MIN_SIN2, Math.sin(theta) ** 2);
  return q - cos * cos * (a * a * (mu2 - e * e) + (lz * lz) / sin2);
}

export function kerrMinoDerivatives(
  state: KerrPhaseSpaceState,
  constants: KerrConstantsOfMotion,
): KerrMinoDerivative {
  const { spinA: a, energy: e, axialAngularMomentum: lz } = constants;
  const radial = kerrRadialPotential(state.r, constants);
  const polar = kerrPolarPotential(state.theta, constants);
  if (radial < -1e-8 || polar < -1e-8) {
    throw new RangeError("Kerr phase-space state lies outside an allowed potential region");
  }
  const delta = state.r * state.r - 2 * state.r + a * a;
  if (Math.abs(delta) < MIN_DELTA) {
    throw new RangeError("Boyer-Lindquist horizon coordinate singularity reached");
  }
  const sin2 = Math.max(MIN_SIN2, Math.sin(state.theta) ** 2);
  const p = e * (state.r * state.r + a * a) - a * lz;
  return {
    r: state.radialDirection * Math.sqrt(Math.max(0, radial)),
    theta: state.polarDirection * Math.sqrt(Math.max(0, polar)),
    phi: lz / sin2 - a * e + (a * p) / delta,
    t:
      -a * (a * e * sin2 - lz) +
      ((state.r * state.r + a * a) * p) / delta,
  };
}

export function integrateKerrPhaseSpace(
  initial: KerrPhaseSpaceState,
  constants: KerrConstantsOfMotion,
  options: {
    step?: number;
    maxSteps?: number;
    escapeRadiusM?: number;
    captureEpsilonM?: number;
  } = {},
): KerrPhaseSpaceIntegrationResult {
  validateInitial(initial, constants);
  const step = Math.min(0.02, Math.max(1e-5, options.step ?? 0.0025));
  const maxSteps = Math.min(50_000, Math.max(1, options.maxSteps ?? 8_000));
  const escapeRadius = Math.max(initial.r + 1, options.escapeRadiusM ?? 80);
  const captureEpsilon = Math.max(1e-6, options.captureEpsilonM ?? 1e-4);
  const horizon = kerrOuterHorizonRadiusM(constants.spinA);
  let state = { ...initial };
  const samples: KerrPhaseSpaceSample[] = [sampleState(state, constants)];
  const turningPoints: KerrTurningPointEvent[] = [];
  let status: KerrInvariantReport["status"] = "max-steps";
  let horizonCrossingLambda: number | null = null;

  for (let index = 0; index < maxSteps; index += 1) {
    if (state.r <= horizon + captureEpsilon) {
      status = "captured";
      horizonCrossingLambda = state.lambda;
      break;
    }
    if (state.r >= escapeRadius && state.radialDirection >= 0) {
      status = "escaped";
      break;
    }
    const radialPotential = kerrRadialPotential(state.r, constants);
    const polarPotential = kerrPolarPotential(state.theta, constants);
    if (state.radialDirection !== 0 && radialPotential < 1e-10) {
      const turned = continueThroughTurningPoint(state, constants, "radial", step);
      state = turned.state;
      turningPoints.push(turned.event);
    }
    if (state.polarDirection !== 0 && polarPotential < 1e-10) {
      const turned = continueThroughTurningPoint(state, constants, "polar", step);
      state = turned.state;
      turningPoints.push(turned.event);
    }
    try {
      state = rk4MinoStep(state, constants, step);
      samples.push(sampleState(state, constants));
    } catch {
      const radial = kerrRadialPotential(state.r, constants);
      const polar = kerrPolarPotential(state.theta, constants);
      const kind = state.polarDirection !== 0 && polar < radial ? "polar" : "radial";
      const direction = kind === "radial" ? state.radialDirection : state.polarDirection;
      if (direction === 0) { status = "invalid"; break; }
      const turned = continueThroughTurningPoint(state, constants, kind, step);
      state = turned.state;
      turningPoints.push(turned.event);
      try {
        state = rk4MinoStep(state, constants, step * 0.5);
        samples.push(sampleState(state, constants));
      } catch {
        status = "invalid";
        break;
      }
    }
  }

  const target = constants.kind === "timelike" ? -0.5 : 0;
  let maxHamiltonianDrift = 0;
  let maxCarterDrift = 0;
  for (const sample of samples) {
    maxHamiltonianDrift = Math.max(
      maxHamiltonianDrift,
      Math.abs(sample.hamiltonian - target),
    );
    maxCarterDrift = Math.max(
      maxCarterDrift,
      Math.abs(sample.reconstructedCarterQ - constants.carterQ),
    );
  }

  return {
    constants,
    samples,
    turningPoints,
    report: {
      version: KERR_3D_GEODESIC_VERSION,
      status,
      hamiltonianTarget: target,
      maxHamiltonianDrift,
      maxEnergyDrift: 0,
      maxAxialAngularMomentumDrift: 0,
      maxCarterDrift,
      horizonCrossingLambda,
      sampleCount: samples.length,
      boundary: "test-particle-only-isolated-from-solar-nbody",
    },
  };
}

function continueThroughTurningPoint(
  state: KerrPhaseSpaceState,
  constants: KerrConstantsOfMotion,
  kind: KerrTurningPointEvent["kind"],
  step: number,
): { state: KerrPhaseSpaceState; event: KerrTurningPointEvent } {
  const previousDirection = kind === "radial" ? state.radialDirection : state.polarDirection;
  if (previousDirection === 0) throw new RangeError("A zero direction cannot cross a turning point");
  const nextDirection = -previousDirection as -1 | 1;
  const epsilon = Math.max(1e-9, step * 1e-4);
  let nextState: KerrPhaseSpaceState = {
    ...state,
    radialDirection: kind === "radial" ? nextDirection : state.radialDirection,
    polarDirection: kind === "polar" ? nextDirection : state.polarDirection,
  };
  for (const scale of [1, 0.1, 0.01, 0]) {
    const candidate = {
      ...nextState,
      r: kind === "radial" ? state.r + nextDirection * epsilon * scale : state.r,
      theta: kind === "polar" ? state.theta + nextDirection * epsilon * scale : state.theta,
    };
    if (kerrRadialPotential(candidate.r, constants) >= -1e-10 && kerrPolarPotential(candidate.theta, constants) >= -1e-10) {
      nextState = candidate;
      break;
    }
  }
  return {
    state: nextState,
    event: {
      kind,
      lambda: state.lambda,
      r: state.r,
      theta: state.theta,
      previousDirection,
      nextDirection,
    },
  };
}

function rk4MinoStep(
  state: KerrPhaseSpaceState,
  constants: KerrConstantsOfMotion,
  h: number,
): KerrPhaseSpaceState {
  const k1 = kerrMinoDerivatives(state, constants);
  const k2 = kerrMinoDerivatives(addDerivative(state, k1, h / 2), constants);
  const k3 = kerrMinoDerivatives(addDerivative(state, k2, h / 2), constants);
  const k4 = kerrMinoDerivatives(addDerivative(state, k3, h), constants);
  return {
    ...state,
    lambda: state.lambda + h,
    t: state.t + (h / 6) * (k1.t + 2 * k2.t + 2 * k3.t + k4.t),
    r: state.r + (h / 6) * (k1.r + 2 * k2.r + 2 * k3.r + k4.r),
    theta:
      state.theta +
      (h / 6) * (k1.theta + 2 * k2.theta + 2 * k3.theta + k4.theta),
    phi: state.phi + (h / 6) * (k1.phi + 2 * k2.phi + 2 * k3.phi + k4.phi),
  };
}

function addDerivative(
  state: KerrPhaseSpaceState,
  derivative: KerrMinoDerivative,
  scale: number,
): KerrPhaseSpaceState {
  return {
    ...state,
    lambda: state.lambda + scale,
    t: state.t + derivative.t * scale,
    r: state.r + derivative.r * scale,
    theta: state.theta + derivative.theta * scale,
    phi: state.phi + derivative.phi * scale,
  };
}

function sampleState(
  state: KerrPhaseSpaceState,
  constants: KerrConstantsOfMotion,
): KerrPhaseSpaceSample {
  const derivative = kerrMinoDerivatives(state, constants);
  const metric = kerrMetricAt(
    { family: Math.abs(constants.spinA) < 1e-14 ? "schwarzschild" : "kerr", spinA: constants.spinA },
    state.r,
    state.theta,
  );
  const delta = state.r * state.r - 2 * state.r + constants.spinA ** 2;
  const pT = -constants.energy;
  const pPhi = constants.axialAngularMomentum;
  const pR = derivative.r / delta;
  const pTheta = derivative.theta;
  const hamiltonian =
    0.5 *
    (metric.contravariant.tt * pT * pT +
      2 * metric.contravariant.tPhi * pT * pPhi +
      metric.contravariant.rr * pR * pR +
      metric.contravariant.thetaTheta * pTheta * pTheta +
      metric.contravariant.phiPhi * pPhi * pPhi);
  const mu2 = constants.kind === "timelike" ? 1 : 0;
  const sin2 = Math.max(MIN_SIN2, Math.sin(state.theta) ** 2);
  const cos2 = Math.cos(state.theta) ** 2;
  const reconstructedCarterQ =
    pTheta * pTheta +
    cos2 *
      (constants.spinA ** 2 * (mu2 - constants.energy ** 2) +
        constants.axialAngularMomentum ** 2 / sin2);
  return { ...state, hamiltonian, reconstructedCarterQ };
}

function validateInitial(
  state: KerrPhaseSpaceState,
  constants: KerrConstantsOfMotion,
): void {
  const values = [
    state.lambda,
    state.t,
    state.r,
    state.theta,
    state.phi,
    constants.spinA,
    constants.energy,
    constants.axialAngularMomentum,
    constants.carterQ,
  ];
  if (!values.every(Number.isFinite)) throw new TypeError("Kerr state must be finite");
  if (Math.abs(constants.spinA) >= 1) throw new RangeError("Kerr spin must satisfy |a| < 1");
  if (state.r <= kerrOuterHorizonRadiusM(constants.spinA)) {
    throw new RangeError("Initial Kerr state must be outside the outer horizon");
  }
  if (state.theta <= 0 || state.theta >= Math.PI) {
    throw new RangeError("Initial polar angle must lie in (0, pi)");
  }
  kerrMinoDerivatives(state, constants);
}
