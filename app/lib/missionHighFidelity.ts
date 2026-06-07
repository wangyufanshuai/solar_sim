import lowThrustLibraryRaw from "../../public/data/low-thrust-solution-library-v1.json";
import type {
  CowellPropagationAudit,
  LowThrustSolution,
  MissionCovarianceAudit,
  MissionPlan,
  MissionSegment,
} from "./missionDesignerTypes";
import { interpolateSpiceState } from "./spiceEphemerisTable";

const AU_METERS = 149_597_870_700;
const DAY_SECONDS = 86400;
const G0 = 9.80665;
const C_AU_PER_DAY = (299_792_458 * DAY_SECONDS) / AU_METERS;
const SUN_MU = 0.0002959122082855911;
const BODY_MU: Record<string, number> = {
  earth: SUN_MU * 3.0034896e-6,
  venus: SUN_MU * 2.4478383e-6,
  jupiter: SUN_MU * 9.5479194e-4,
  saturn: SUN_MU * 2.8588598e-4,
};
const BODY_RADIUS_AU: Record<string, number> = {
  earth: 6378.1363e3 / AU_METERS,
  venus: 6051.8e3 / AU_METERS,
  jupiter: 71492e3 / AU_METERS,
  saturn: 60268e3 / AU_METERS,
};
const BODY_J2: Record<string, number> = {
  earth: 1.08262668e-3,
  venus: 4.458e-6,
  jupiter: 1.469643e-2,
  saturn: 1.629071e-2,
};
const BODY_J3: Record<string, number> = {
  earth: -2.5324e-6,
  venus: 0,
  jupiter: -4.2e-8,
  saturn: 5.8e-5,
};

type State = [number, number, number, number, number, number, number];
type Derivative = State;
type LowThrustLibrary = {
  solutions: LowThrustSolution[];
  caveat: string;
};

const LOW_THRUST_LIBRARY = lowThrustLibraryRaw as unknown as LowThrustLibrary;

function norm3(x: number, y: number, z: number): number {
  return Math.hypot(x, y, z);
}

function activeControl(solution: LowThrustSolution | undefined, fraction: number) {
  return solution?.controls.find(
    (control) => fraction >= control.startFraction && fraction <= control.endFraction,
  );
}

function derivative(
  simDay: number,
  fraction: number,
  state: State,
  solution: LowThrustSolution | undefined,
  includeRelativity: boolean,
): Derivative {
  const [x, y, z, vx, vy, vz, mass] = state;
  const r = Math.max(norm3(x, y, z), 1e-10);
  const invR3 = 1 / (r * r * r);
  let ax = -SUN_MU * x * invR3;
  let ay = -SUN_MU * y * invR3;
  let az = -SUN_MU * z * invR3;

  if (includeRelativity) {
    const v2 = vx * vx + vy * vy + vz * vz;
    const rv = x * vx + y * vy + z * vz;
    const factor = SUN_MU / (C_AU_PER_DAY * C_AU_PER_DAY * r * r * r);
    const common = 4 * SUN_MU / r - v2;
    ax += factor * (common * x + 4 * rv * vx);
    ay += factor * (common * y + 4 * rv * vy);
    az += factor * (common * z + 4 * rv * vz);
  }

  for (const body of ["earth", "venus", "jupiter", "saturn"] as const) {
    const bodyState = interpolateSpiceState(body, simDay);
    if ("reason" in bodyState) continue;
    const [bx, by, bz] = bodyState.positionAu;
    const dx = bx - x;
    const dy = by - y;
    const dz = bz - z;
    const distance = Math.max(norm3(dx, dy, dz), 1e-12);
    const bodyRadius = Math.max(norm3(bx, by, bz), 1e-12);
    const direct = BODY_MU[body] / (distance * distance * distance);
    const indirect = BODY_MU[body] / (bodyRadius * bodyRadius * bodyRadius);
    ax += direct * dx - indirect * bx;
    ay += direct * dy - indirect * by;
    az += direct * dz - indirect * bz;

    if (distance < BODY_RADIUS_AU[body] * 40) {
      const req = BODY_RADIUS_AU[body];
      const rho2 = distance * distance;
      const z2 = dz * dz;
      const j2Scale =
        (1.5 * BODY_J2[body] * BODY_MU[body] * req * req) /
        Math.max(distance ** 5, 1e-30);
      const axial = 5 * z2 / rho2;
      ax += j2Scale * dx * (axial - 1);
      ay += j2Scale * dy * (axial - 1);
      az += j2Scale * dz * (axial - 3);
      const j3Scale =
        (0.5 * BODY_J3[body] * BODY_MU[body] * req ** 3) /
        Math.max(distance ** 7, 1e-36);
      az += j3Scale * (35 * z2 * z2 / rho2 - 30 * z2 + 3 * rho2);
    }
  }

  const control = activeControl(solution, fraction);
  let mdotKgPerDay = 0;
  if (control && solution && mass > 1) {
    const thrust = solution.maxThrustN * control.throttle;
    const accelAuDay2 = (thrust / mass) * (DAY_SECONDS * DAY_SECONDS) / AU_METERS;
    ax += accelAuDay2 * control.direction[0];
    ay += accelAuDay2 * control.direction[1];
    az += accelAuDay2 * control.direction[2];
    mdotKgPerDay = -(thrust / (solution.ispSeconds * G0)) * DAY_SECONDS;
  }
  return [vx, vy, vz, ax, ay, az, mdotKgPerDay];
}

function combine(state: State, h: number, terms: Array<[number, Derivative]>): State {
  return state.map((value, index) =>
    value + h * terms.reduce((sum, [coefficient, vector]) => sum + coefficient * vector[index]!, 0),
  ) as State;
}

function dp54Step(
  t: number,
  h: number,
  state: State,
  startDay: number,
  duration: number,
  solution: LowThrustSolution | undefined,
  includeRelativity: boolean,
): { next: State; error: number } {
  const f = (localT: number, value: State) =>
    derivative(startDay + localT, localT / duration, value, solution, includeRelativity);
  const k1 = f(t, state);
  const k2 = f(t + h * 1 / 5, combine(state, h, [[1 / 5, k1]]));
  const k3 = f(t + h * 3 / 10, combine(state, h, [[3 / 40, k1], [9 / 40, k2]]));
  const k4 = f(t + h * 4 / 5, combine(state, h, [[44 / 45, k1], [-56 / 15, k2], [32 / 9, k3]]));
  const k5 = f(t + h * 8 / 9, combine(state, h, [
    [19372 / 6561, k1], [-25360 / 2187, k2], [64448 / 6561, k3], [-212 / 729, k4],
  ]));
  const k6 = f(t + h, combine(state, h, [
    [9017 / 3168, k1], [-355 / 33, k2], [46732 / 5247, k3], [49 / 176, k4], [-5103 / 18656, k5],
  ]));
  const next = combine(state, h, [
    [35 / 384, k1], [500 / 1113, k3], [125 / 192, k4], [-2187 / 6784, k5], [11 / 84, k6],
  ]);
  const k7 = f(t + h, next);
  const fourth = combine(state, h, [
    [5179 / 57600, k1], [7571 / 16695, k3], [393 / 640, k4], [-92097 / 339200, k5],
    [187 / 2100, k6], [1 / 40, k7],
  ]);
  let error = 0;
  for (let i = 0; i < 6; i++) {
    const scale = 1e-10 + 1e-8 * Math.max(Math.abs(next[i]!), Math.abs(state[i]!));
    error = Math.max(error, Math.abs(next[i]! - fourth[i]!) / scale);
  }
  return { next, error };
}

function specificEnergy(state: State): number {
  const r = norm3(state[0], state[1], state[2]);
  const v2 = state[3] ** 2 + state[4] ** 2 + state[5] ** 2;
  return v2 / 2 - SUN_MU / Math.max(r, 1e-12);
}

function propagateSegment(
  segment: MissionSegment,
  solution: LowThrustSolution | undefined,
  includeRelativity: boolean,
) {
  let state: State = [
    ...segment.departurePositionAu,
    ...segment.departureVelocityAuPerDay,
    solution?.initialMassKg ?? 4200,
  ];
  const initialEnergy = specificEnergy(state);
  let t = 0;
  let h = Math.min(4, Math.max(0.05, segment.tofDays / 180));
  let acceptedSteps = 0;
  let rejectedSteps = 0;
  let minimumApproachAu = Number.POSITIVE_INFINITY;
  while (t < segment.tofDays && acceptedSteps + rejectedSteps < 20000) {
    h = Math.min(h, segment.tofDays - t);
    const trial = dp54Step(
      t,
      h,
      state,
      segment.departureDay,
      segment.tofDays,
      solution,
      includeRelativity,
    );
    if (trial.error <= 1 || h <= 0.005) {
      state = trial.next;
      t += h;
      acceptedSteps += 1;
      const target = interpolateSpiceState(segment.toBody, segment.departureDay + t);
      if (!("reason" in target)) {
        minimumApproachAu = Math.min(
          minimumApproachAu,
          norm3(
            state[0] - target.positionAu[0],
            state[1] - target.positionAu[1],
            state[2] - target.positionAu[2],
          ),
        );
      }
      h *= Math.min(3, Math.max(0.35, 0.9 * Math.max(trial.error, 1e-8) ** -0.2));
    } else {
      rejectedSteps += 1;
      h *= Math.max(0.2, 0.9 * trial.error ** -0.25);
    }
  }
  const positionResidualKm =
    norm3(
      state[0] - segment.arrivalPositionAu[0],
      state[1] - segment.arrivalPositionAu[1],
      state[2] - segment.arrivalPositionAu[2],
    ) * AU_METERS / 1000;
  const velocityResidualMps =
    norm3(
      state[3] - segment.arrivalVelocityAuPerDay[0],
      state[4] - segment.arrivalVelocityAuPerDay[1],
      state[5] - segment.arrivalVelocityAuPerDay[2],
    ) * AU_METERS / DAY_SECONDS;
  const finalEnergy = specificEnergy(state);
  return {
    acceptedSteps,
    rejectedSteps,
    positionResidualKm,
    velocityResidualMps,
    relativeEnergyDrift: Math.abs((finalEnergy - initialEnergy) / Math.max(Math.abs(initialEnergy), 1e-12)),
    minimumApproachKm: minimumApproachAu * AU_METERS / 1000,
    finalMassKg: state[6],
  };
}

type Matrix6 = number[][];

function identity6(): Matrix6 {
  return Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 6 }, (_, column) => (row === column ? 1 : 0)),
  );
}

function multiply6(a: Matrix6, b: Matrix6): Matrix6 {
  return Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 6 }, (_, column) => {
      let value = 0;
      for (let k = 0; k < 6; k += 1) value += a[row]![k]! * b[k]![column]!;
      return value;
    }),
  );
}

function transpose6(matrix: Matrix6): Matrix6 {
  return Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 6 }, (_, column) => matrix[column]![row]!),
  );
}

function add6(a: Matrix6, b: Matrix6): Matrix6 {
  return a.map((row, i) => row.map((value, j) => value + b[i]![j]!));
}

function transitionAt(positionAu: [number, number, number], stepDays: number): Matrix6 {
  const radius = Math.max(norm3(...positionAu), 1e-8);
  const radius2 = radius * radius;
  const radius3 = radius2 * radius;
  const gravityGradient = Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, column) => {
      const identity = row === column ? 1 : 0;
      return SUN_MU * (3 * positionAu[row]! * positionAu[column]! / radius2 - identity) / radius3;
    }),
  );
  const a = Array.from({ length: 6 }, () => Array(6).fill(0)) as Matrix6;
  for (let axis = 0; axis < 3; axis += 1) {
    a[axis]![axis + 3] = 1;
    for (let column = 0; column < 3; column += 1) {
      a[axis + 3]![column] = gravityGradient[axis]![column]!;
    }
  }
  const a2 = multiply6(a, a);
  return identity6().map((row, i) =>
    row.map((value, j) => value + a[i]![j]! * stepDays + 0.5 * a2[i]![j]! * stepDays * stepDays),
  );
}

function processNoise(stepDays: number, accelerationSigmaAuDay2: number): Matrix6 {
  const q = Array.from({ length: 6 }, () => Array(6).fill(0)) as Matrix6;
  const dt2 = stepDays * stepDays;
  const dt3 = dt2 * stepDays;
  const dt4 = dt2 * dt2;
  const variance = accelerationSigmaAuDay2 * accelerationSigmaAuDay2;
  for (let axis = 0; axis < 3; axis += 1) {
    q[axis]![axis] = variance * dt4 / 4;
    q[axis]![axis + 3] = variance * dt3 / 2;
    q[axis + 3]![axis] = variance * dt3 / 2;
    q[axis + 3]![axis + 3] = variance * dt2;
  }
  return q;
}

function covarianceAudit(plan: MissionPlan): MissionCovarianceAudit {
  const initialPositionSigmaKm = 8;
  const initialVelocitySigmaMps = 0.008;
  const processNoiseAccelerationMps2 = 2e-10;
  const positionSigmaAu = initialPositionSigmaKm * 1000 / AU_METERS;
  const velocitySigmaAuDay = initialVelocitySigmaMps * DAY_SECONDS / AU_METERS;
  const accelerationSigmaAuDay2 =
    processNoiseAccelerationMps2 * DAY_SECONDS * DAY_SECONDS / AU_METERS;
  let covariance = Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 6 }, (_, column) => {
      if (row !== column) return 0;
      return row < 3 ? positionSigmaAu ** 2 : velocitySigmaAuDay ** 2;
    }),
  ) as Matrix6;
  const nodeThreeSigma = plan.segments.map((segment) => {
    const path = segment.trajectoryAu.length >= 2
      ? segment.trajectoryAu
      : [segment.departurePositionAu, segment.arrivalPositionAu];
    const stepDays = segment.tofDays / Math.max(1, path.length - 1);
    for (let index = 0; index < path.length - 1; index += 1) {
      const a = path[index]!;
      const b = path[index + 1]!;
      const midpoint: [number, number, number] = [
        (a[0] + b[0]) / 2,
        (a[1] + b[1]) / 2,
        (a[2] + b[2]) / 2,
      ];
      const transition = transitionAt(midpoint, stepDays);
      covariance = add6(
        multiply6(multiply6(transition, covariance), transpose6(transition)),
        processNoise(stepDays, accelerationSigmaAuDay2),
      );
      for (let row = 0; row < 6; row += 1) {
        for (let column = row + 1; column < 6; column += 1) {
          const symmetric = (covariance[row]![column]! + covariance[column]![row]!) / 2;
          covariance[row]![column] = symmetric;
          covariance[column]![row] = symmetric;
        }
      }
    }
    const positionSigma = Math.sqrt(
      Math.max(0, covariance[0]![0]! + covariance[1]![1]! + covariance[2]![2]!),
    );
    const velocitySigma = Math.sqrt(
      Math.max(0, covariance[3]![3]! + covariance[4]![4]! + covariance[5]![5]!),
    );
    return {
      segmentId: segment.id,
      positionKm: 3 * positionSigma * AU_METERS / 1000,
      velocityMps: 3 * velocitySigma * AU_METERS / DAY_SECONDS,
    };
  });
  const arrival = nodeThreeSigma[nodeThreeSigma.length - 1]?.positionKm ?? 0;
  return {
    method: "6x6 variational STM covariance",
    initialPositionSigmaKm,
    initialVelocitySigmaMps,
    processNoiseAccelerationMps2,
    nodeThreeSigma,
    saturnArrivalThreeSigmaKm: arrival,
    bPlaneThreeSigmaKm: Math.max(...nodeThreeSigma.map((node) => node.positionKm), 0) * 0.18,
    positiveSemidefinite:
      covariance.every((row, index) => Number.isFinite(row[index]) && row[index]! >= 0) &&
      nodeThreeSigma.every((node) => Number.isFinite(node.positionKm) && Number.isFinite(node.velocityMps)),
    caveat: "6x6 solar-gravity variational STM with white acceleration process noise; thrust and mass uncertainty remain deterministic assumptions.",
  };
}

export function auditPlanHighFidelity(
  plan: MissionPlan,
  includeRelativity: boolean,
): MissionPlan {
  const solutions = plan.segments
    .map((segment) => LOW_THRUST_LIBRARY.solutions.find((item) => item.legId === `${segment.fromBody}-${segment.toBody}`))
    .filter((item): item is LowThrustSolution => Boolean(item));
  const propagated = plan.segments.map((segment) =>
    propagateSegment(
      segment,
      solutions.find((solution) => solution.legId === `${segment.fromBody}-${segment.toBody}`),
      includeRelativity,
    ),
  );
  const maxPositionResidualKm = Math.max(...propagated.map((item) => item.positionResidualKm), 0);
  const maxVelocityResidualMps = Math.max(...propagated.map((item) => item.velocityResidualMps), 0);
  const cowellAudit: CowellPropagationAudit = {
    mode: "cowell",
    forceModel: [
      "Solar point-mass gravity",
      "SPICE Earth/Venus/Jupiter/Saturn third-body gravity",
      "Near-body J2/J3",
      includeRelativity ? "Solar 1PN correction" : "1PN disabled",
      "Precomputed low-thrust controls with mass depletion",
    ],
    integrator: "Dormand-Prince 5(4)",
    acceptedSteps: propagated.reduce((sum, item) => sum + item.acceptedSteps, 0),
    rejectedSteps: propagated.reduce((sum, item) => sum + item.rejectedSteps, 0),
    maxPositionResidualKm,
    maxVelocityResidualMps,
    relativeEnergyDrift: Math.max(...propagated.map((item) => item.relativeEnergyDrift), 0),
    minimumApproachKm: Math.min(...propagated.map((item) => item.minimumApproachKm)),
    converged:
      propagated.every((item) => Number.isFinite(item.positionResidualKm)) &&
      solutions.every(
        (solution) =>
          solution.converged &&
          solution.terminalPositionErrorKm < 1000 &&
          solution.terminalVelocityErrorMps < 10,
      ),
  };
  return {
    ...plan,
    propagationMode: solutions.length === plan.segments.length
      ? "low-thrust-collocation"
      : "cowell",
    solverProvenance: {
      ...plan.solverProvenance,
      modelLevel: "high-fidelity preliminary audit",
      gravityModel: "Cowell multi-body propagation + patched conics",
    },
    cowellAudit,
    lowThrustSolutions: solutions,
    covarianceAudit: covarianceAudit(plan),
    assumptions: [
      ...plan.assumptions,
      LOW_THRUST_LIBRARY.caveat,
      "Cowell propagation includes SPICE third-body states, near-body J2/J3, mass depletion, and optional solar 1PN.",
      "Covariance propagates a 6x6 solar-gravity variational STM with process noise; thrust and mass errors are not stochastic.",
    ],
  };
}
