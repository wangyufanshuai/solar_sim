import { AU_METERS, C_LIGHT, DAY_SECONDS, G_SI } from "./physicalConstants";
import { solveLambertTransfer, type Vec3 } from "./lambertSolver";
import type {
  MissionBodyId,
  MissionBodySnapshot,
  MissionOptimizerOptions,
  MissionOptimizationResult,
  MissionPhysicsSnapshot,
  MissionPlan,
  MissionRiskLevel,
  MissionSegment,
  MissionChartPoint,
  MissionEngineeringConstraints,
  MissionConstraintCheck,
  MissionConstraintPreset,
  MissionValidationStatus,
  MissionEphemerisAudit,
  MissionEphemerisMode,
} from "./missionDesignerTypes";
import {
  JPL_EPHEMERIS_TABLE,
  interpolateJplState,
  jplStateDeltaKm,
} from "./jplEphemerisTable";

const SUN_MU = G_SI * 1.98847e30;
const G0 = 9.80665;
const SAMPLE_COUNT = 72;
const EARTH_MU_KM3S2 = 398600.4418;
const EARTH_RADIUS_KM = 6378;
const LAMBERT_TOLERANCE_SECONDS = 2;

const BODY_ORDER: MissionBodyId[] = ["earth", "venus", "jupiter", "saturn"];
const NOMINAL_TOF_DAYS: Record<string, number> = {
  "earth-venus": 155,
  "venus-jupiter": 720,
  "jupiter-saturn": 1160,
};
const BODY_RADIUS_KM: Record<MissionBodyId, number> = {
  earth: 6378,
  venus: 6052,
  jupiter: 69911,
  saturn: 58232,
};
const BODY_MU_KM3S2: Record<MissionBodyId, number> = {
  earth: EARTH_MU_KM3S2,
  venus: 324858.592,
  jupiter: 126686534,
  saturn: 37931207.8,
};

type BodyState = {
  posAu: [number, number, number];
  velAuPerDay: [number, number, number];
  posM: [number, number, number];
  velMps: [number, number, number];
  source: "live-circular" | "jpl-table";
  error?: string;
};

type TransferDraft = MissionSegment & {
  departureVinfVecKms: [number, number, number];
  arrivalVinfVecKms: [number, number, number];
};

export const DEFAULT_MISSION_OPTIONS: Omit<
  MissionOptimizerOptions,
  "departureStartDay" | "includeRelativity"
> = {
  sequence: ["earth", "venus", "jupiter", "saturn"],
  departureWindowDays: 720,
  departureStepDays: 45,
  maxCandidates: 8,
  ephemerisMode: "jpl-table",
  constraintPreset: "nominal",
};

export const MISSION_CONSTRAINT_PRESETS: Record<MissionConstraintPreset, MissionEngineeringConstraints> = {
  conservative: {
    preset: "conservative",
    dryMassKg: 5200,
    ispSeconds: 450,
    parkingOrbitAltitudeKm: 300,
    maxC3Km2S2: 72,
    maxTotalDeltaVKms: 8.5,
    maxDsmDeltaVKms: 1.1,
    maxDurationDays: 2800,
    minVenusFlybyAltitudeKm: 500,
    minJupiterFlybyAltitudeKm: 30000,
    maxNavigationUncertaintyKm: 260,
  },
  nominal: {
    preset: "nominal",
    dryMassKg: 4200,
    ispSeconds: 450,
    parkingOrbitAltitudeKm: 300,
    maxC3Km2S2: 90,
    maxTotalDeltaVKms: 10.5,
    maxDsmDeltaVKms: 1.8,
    maxDurationDays: 3200,
    minVenusFlybyAltitudeKm: 300,
    minJupiterFlybyAltitudeKm: 15000,
    maxNavigationUncertaintyKm: 360,
  },
  aggressive: {
    preset: "aggressive",
    dryMassKg: 3600,
    ispSeconds: 465,
    parkingOrbitAltitudeKm: 250,
    maxC3Km2S2: 220,
    maxTotalDeltaVKms: 20,
    maxDsmDeltaVKms: 3.2,
    maxDurationDays: 3800,
    minVenusFlybyAltitudeKm: 200,
    minJupiterFlybyAltitudeKm: 5000,
    maxNavigationUncertaintyKm: 520,
  },
};

export function resolveMissionConstraints(options: MissionOptimizerOptions): MissionEngineeringConstraints {
  const base = MISSION_CONSTRAINT_PRESETS[options.constraintPreset];
  return { ...base, ...options.constraints, preset: options.constraintPreset };
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}

function cross(a: readonly number[], b: readonly number[]): [number, number, number] {
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}

function norm(a: readonly number[]): number {
  return Math.hypot(a[0]!, a[1]!, a[2]!);
}

function scale(a: readonly number[], s: number): [number, number, number] {
  return [a[0]! * s, a[1]! * s, a[2]! * s];
}

function add(a: readonly number[], b: readonly number[]): [number, number, number] {
  return [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
}

function sub(a: readonly number[], b: readonly number[]): [number, number, number] {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}

function normalize(a: readonly number[]): [number, number, number] {
  const n = Math.max(norm(a), 1e-12);
  return [a[0]! / n, a[1]! / n, a[2]! / n];
}

function angleDeg(a: readonly number[], b: readonly number[]): number {
  const d = dot(a, b) / Math.max(norm(a) * norm(b), 1e-12);
  return (Math.acos(Math.max(-1, Math.min(1, d))) * 180) / Math.PI;
}

function rotateAroundAxis(
  v: readonly number[],
  axis: readonly number[],
  angle: number,
): [number, number, number] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const ax = normalize(axis);
  const term1 = scale(v, c);
  const term2 = scale(cross(ax, v), s);
  const term3 = scale(ax, dot(ax, v) * (1 - c));
  return add(add(term1, term2), term3);
}

function auToM(v: readonly number[]): [number, number, number] {
  return [v[0]! * AU_METERS, v[1]! * AU_METERS, v[2]! * AU_METERS];
}

function auDayToMps(v: readonly number[]): [number, number, number] {
  return [
    (v[0]! * AU_METERS) / DAY_SECONDS,
    (v[1]! * AU_METERS) / DAY_SECONDS,
    (v[2]! * AU_METERS) / DAY_SECONDS,
  ];
}

function mpsToKms(v: readonly number[]): [number, number, number] {
  return [v[0]! / 1000, v[1]! / 1000, v[2]! / 1000];
}

function predictBodyState(body: MissionBodySnapshot, daysAfterSnapshot: number): BodyState {
  const rAu = body.posAu;
  const vAuDay = body.velAuPerDay;
  const rM = norm(rAu) * AU_METERS;
  const h = cross(rAu, vAuDay);
  const axis = norm(h) > 1e-8 ? h : [0, 0, 1];
  const nRadS = Math.sqrt(SUN_MU / Math.max(rM * rM * rM, 1));
  const angle = nRadS * daysAfterSnapshot * DAY_SECONDS;
  const posAu = rotateAroundAxis(rAu, axis, angle);
  const velAuPerDay = rotateAroundAxis(vAuDay, axis, angle);
  return {
    posAu,
    velAuPerDay,
    posM: auToM(posAu),
    velMps: auDayToMps(velAuPerDay),
    source: "live-circular",
  };
}

function bodyStateAt(
  id: MissionBodyId,
  simDay: number,
  snapshot: MissionPhysicsSnapshot,
  mode: MissionEphemerisMode,
): BodyState {
  if (mode === "jpl-table") {
    const state = interpolateJplState(id, simDay);
    if ("reason" in state) {
      const fallback = snapshot.bodies[id];
      const live = predictBodyState(fallback, simDay - snapshot.simDays);
      return { ...live, source: "jpl-table", error: state.reason };
    }
    return {
      posAu: state.positionAu,
      velAuPerDay: state.velocityAuPerDay,
      posM: auToM(state.positionAu),
      velMps: auDayToMps(state.velocityAuPerDay),
      source: "jpl-table",
    };
  }
  return predictBodyState(snapshot.bodies[id], simDay - snapshot.simDays);
}

function trajectorySamples(
  start: [number, number, number],
  end: [number, number, number],
  liftAu: number,
): [number, number, number][] {
  const samples: [number, number, number][] = [];
  const midDir = normalize(add(start, end));
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const u = i / (SAMPLE_COUNT - 1);
    const smooth = u * u * (3 - 2 * u);
    const base = add(scale(start, 1 - smooth), scale(end, smooth));
    const arc = Math.sin(Math.PI * u) * liftAu;
    samples.push(add(base, scale(midDir, arc)));
  }
  return samples;
}

function riskFrom(value: number): MissionRiskLevel {
  if (value > 0.72) return "high";
  if (value > 0.42) return "medium";
  return "low";
}

export function injectionDeltaVKms(vinfKms: number, parkingOrbitAltitudeKm = 300): number {
  const parkingOrbitRadiusKm = EARTH_RADIUS_KM + parkingOrbitAltitudeKm;
  const vc = Math.sqrt(EARTH_MU_KM3S2 / parkingOrbitRadiusKm);
  const vesc = Math.sqrt((2 * EARTH_MU_KM3S2) / parkingOrbitRadiusKm);
  return Math.max(0.05, Math.sqrt(vinfKms * vinfKms + vesc * vesc) - vc);
}

function makeSegment(
  fromBody: MissionBodyId,
  toBody: MissionBodyId,
  departureDay: number,
  tofDays: number,
  snapshot: MissionPhysicsSnapshot,
  ephemerisMode: MissionEphemerisMode,
): TransferDraft {
  const arrivalDay = departureDay + tofDays;
  const fromState = bodyStateAt(fromBody, departureDay, snapshot, ephemerisMode);
  const toState = bodyStateAt(toBody, arrivalDay, snapshot, ephemerisMode);
  const ephemerisError = fromState.error ?? toState.error;
  const lambert = ephemerisError
    ? {
        converged: false,
        departureVelocityMps: fromState.velMps,
        arrivalVelocityMps: toState.velMps,
        iterations: 0,
        residualSeconds: Number.POSITIVE_INFINITY,
        transferAngleDeg: 0,
      }
    : solveLambertTransfer({
        r1M: fromState.posM as Vec3,
        r2M: toState.posM as Vec3,
        tofSeconds: tofDays * DAY_SECONDS,
        mu: SUN_MU,
        prograde: true,
        toleranceSeconds: Math.max(LAMBERT_TOLERANCE_SECONDS, tofDays * DAY_SECONDS * 3e-6),
      });
  const departureVelocityMps = lambert.converged ? lambert.departureVelocityMps : fromState.velMps;
  const arrivalVelocityMps = lambert.converged ? lambert.arrivalVelocityMps : toState.velMps;
  const departureVinfVecMps = sub(departureVelocityMps, fromState.velMps);
  const arrivalVinfVecMps = sub(arrivalVelocityMps, toState.velMps);
  const departureVinfinityKms = norm(departureVinfVecMps) / 1000;
  const arrivalVinfinityKms = norm(arrivalVinfVecMps) / 1000;
  const earthAtArrival = predictBodyState(snapshot.bodies.earth, arrivalDay - snapshot.simDays);
  const communicationDelayMin = (norm(sub(toState.posM, earthAtArrival.posM)) / C_LIGHT) / 60;
  const liftAu = Math.min(3.4, Math.max(0.18, norm(sub(toState.posAu, fromState.posAu)) * 0.16));

  return {
    id: `${fromBody}-${toBody}-${Math.round(departureDay)}-${Math.round(tofDays)}`,
    fromBody,
    toBody,
    departureDay,
    arrivalDay,
    tofDays,
    deltaVKms: Math.max(0.05, departureVinfinityKms * 0.12),
    dsmDeltaVKms: 0,
    c3Km2S2: fromBody === "earth" ? departureVinfinityKms * departureVinfinityKms : 0,
    lambertConverged: lambert.converged,
    lambertIterations: lambert.iterations,
    lambertResidual: lambert.residualSeconds,
    solverFailureReason: ephemerisError,
    departureVinfinityKms,
    arrivalVinfinityKms,
    periapsisAltitudeKm: Number.POSITIVE_INFINITY,
    flybySafetyMargin: Number.POSITIVE_INFINITY,
    flybyFeasible: true,
    requiredTurnAngleDeg: 0,
    maxTurnAngleDeg: 180,
    bPlaneRisk: lambert.converged ? "low" : "medium",
    closestApproachKm: toBody === "saturn" ? BODY_RADIUS_KM.saturn * 18 : BODY_RADIUS_KM[toBody] * 8,
    turnAngleDeg: lambert.transferAngleDeg,
    communicationDelayMin,
    burnAttitude: fromBody === "earth" ? "LEO prograde Lambert injection" : "B-plane targeting trim",
    antennaPointing: communicationDelayMin > 60 ? "High-gain Earth-pointing with store-and-forward windows" : "Continuous high-gain Earth lock",
    solarArrayPointing: toBody === "jupiter" || toBody === "saturn" ? "Low-flux cruise bias, battery-positive margins" : "Sun-track cruise",
    kalmanSigmaKm: Math.max(10, 160 + departureVinfinityKms * 7 + (lambert.converged ? 0 : 80)),
    risk: lambert.converged ? "low" : "medium",
    trajectoryAu: trajectorySamples(fromState.posAu, toState.posAu, liftAu),
    departureVinfVecKms: mpsToKms(departureVinfVecMps),
    arrivalVinfVecKms: mpsToKms(arrivalVinfVecMps),
  };
}

function buildEphemerisAudit(
  mode: MissionEphemerisMode,
  snapshot: MissionPhysicsSnapshot,
  segments: MissionSegment[],
): MissionEphemerisAudit {
  const liveVsTableDelta =
    mode === "jpl-table"
      ? BODY_ORDER.map((body) => {
          const delta = jplStateDeltaKm(body, snapshot.simDays, snapshot);
          return {
            body,
            positionDeltaKm: delta?.positionDeltaKm ?? Number.NaN,
            velocityDeltaMps: delta?.velocityDeltaMps ?? Number.NaN,
          };
        })
      : [];
  return {
    mode,
    source: mode === "jpl-table" ? "NASA/JPL Horizons API DE441 vectors" : "Live simulation snapshot with circular propagation",
    coverageSimDays:
      mode === "jpl-table"
        ? [JPL_EPHEMERIS_TABLE.startSimDay, JPL_EPHEMERIS_TABLE.stopSimDay]
        : [snapshot.simDays, snapshot.simDays],
    stepDays: mode === "jpl-table" ? JPL_EPHEMERIS_TABLE.stepDays : 0,
    interpolation: mode === "jpl-table" ? JPL_EPHEMERIS_TABLE.interpolation : "Circular state propagation from live snapshot",
    liveVsTableDelta,
    segmentStateSources: segments.map((segment) => ({
      segmentId: segment.id,
      departureBody: segment.fromBody,
      arrivalBody: segment.toBody,
      departureSimDay: segment.departureDay,
      arrivalSimDay: segment.arrivalDay,
      source: mode === "jpl-table" ? "JPL Horizons table interpolation" : "live-circular propagation",
    })),
    caveat: mode === "jpl-table"
      ? "JPL-table preliminary Lambert audit, not GMAT/STK/SPICE certification."
      : "Live-circular preliminary Lambert audit, not GMAT/STK/SPICE certification.",
  };
}

function annotatePatchedConics(
  segments: TransferDraft[],
  constraints: MissionEngineeringConstraints,
): MissionSegment[] {
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    if (i === 0) {
      seg.deltaVKms = injectionDeltaVKms(
        seg.departureVinfinityKms,
        constraints.parkingOrbitAltitudeKm,
      ) + 0.12;
    } else {
      const prev = segments[i - 1]!;
      const vinfMismatch = Math.abs(seg.departureVinfinityKms - prev.arrivalVinfinityKms);
      seg.dsmDeltaVKms = Math.max(0, Math.min(1.25, vinfMismatch * 0.11));
      seg.deltaVKms = Math.max(0.08, vinfMismatch * 0.08 + seg.dsmDeltaVKms + (seg.lambertConverged ? 0.06 : 0.35));
    }

    const next = segments[i + 1];
    if (next && (seg.toBody === "venus" || seg.toBody === "jupiter")) {
      const incoming = scale(seg.arrivalVinfVecKms, -1);
      const outgoing = next.departureVinfVecKms;
      const turnAngle = angleDeg(incoming, outgoing);
      const vinfAvg = Math.max(0.1, 0.5 * (seg.arrivalVinfinityKms + next.departureVinfinityKms));
      const mu = BODY_MU_KM3S2[seg.toBody];
      const radius = BODY_RADIUS_KM[seg.toBody];
      const sinHalf = Math.sin(THREE_DEG_TO_RAD * Math.max(0.1, Math.min(175, turnAngle)) * 0.5);
      const rpKm = Math.max(radius * 1.08, (mu / (vinfAvg * vinfAvg)) * (1 / Math.max(0.03, sinHalf) - 1));
      const altitudeKm = rpKm - radius;
      const safetyMargin = altitudeKm / radius;
      const maxTurnAtSafeAltitude =
        (2 * Math.asin(1 / (1 + ((radius * 1.25) * vinfAvg * vinfAvg) / mu)) * 180) / Math.PI;
      const feasible = turnAngle <= maxTurnAtSafeAltitude && safetyMargin >= 0.25;
      seg.turnAngleDeg = turnAngle;
      seg.requiredTurnAngleDeg = turnAngle;
      seg.maxTurnAngleDeg = maxTurnAtSafeAltitude;
      seg.closestApproachKm = rpKm;
      seg.periapsisAltitudeKm = altitudeKm;
      seg.flybySafetyMargin = safetyMargin;
      seg.flybyFeasible = feasible;
      seg.risk = riskFrom(
        (!feasible ? 0.38 : 0) +
          (safetyMargin < 0.3 ? 0.34 : 0) +
          (seg.lambertConverged ? 0 : 0.26) +
          (seg.communicationDelayMin > 70 ? 0.18 : 0),
      );
      seg.bPlaneRisk = seg.risk;
      seg.kalmanSigmaKm = Math.max(8, 70 + turnAngle * 1.2 + Math.max(0, 0.4 - safetyMargin) * 240);
    } else if (seg.toBody === "saturn") {
      seg.deltaVKms = Math.max(seg.deltaVKms, seg.arrivalVinfinityKms * 0.42 + 0.25);
      seg.dsmDeltaVKms = Math.max(seg.dsmDeltaVKms, Math.min(0.95, seg.arrivalVinfinityKms * 0.04));
      seg.periapsisAltitudeKm = BODY_RADIUS_KM.saturn * 7;
      seg.flybySafetyMargin = 7;
      seg.flybyFeasible = true;
      seg.requiredTurnAngleDeg = 0;
      seg.maxTurnAngleDeg = 0;
      seg.closestApproachKm = BODY_RADIUS_KM.saturn * 8;
      seg.turnAngleDeg = 0;
      seg.risk = riskFrom(seg.arrivalVinfinityKms / 18 + (seg.communicationDelayMin > 80 ? 0.22 : 0));
      seg.bPlaneRisk = seg.risk;
    }
  }
  return segments.map(({ departureVinfVecKms: _a, arrivalVinfVecKms: _b, ...segment }) => segment);
}

const THREE_DEG_TO_RAD = Math.PI / 180;

export function propellantEstimateKg(
  deltaVKms: number,
  dryMassKg: number,
  ispSeconds: number,
): number {
  if (deltaVKms <= 0 || dryMassKg <= 0 || ispSeconds <= 0) return 0;
  const massRatio = Math.exp((deltaVKms * 1000) / (ispSeconds * G0));
  return dryMassKg * (massRatio - 1);
}

function maximumCheck(
  id: string,
  label: string,
  actual: number,
  limit: number,
  unit: string,
): MissionConstraintCheck {
  const ratio = actual / Math.max(limit, 1e-9);
  const status: MissionValidationStatus = ratio > 1 ? "fail" : ratio > 0.85 ? "warning" : "pass";
  return {
    id,
    label,
    actual,
    limit,
    margin: limit - actual,
    unit,
    status,
    explanation: status === "fail"
      ? `${label} exceeds the engineering limit.`
      : status === "warning"
        ? `${label} is within 15% of the engineering limit.`
        : `${label} retains engineering margin.`,
  };
}

function minimumCheck(
  id: string,
  label: string,
  actual: number,
  limit: number,
  unit: string,
): MissionConstraintCheck {
  const ratio = actual / Math.max(limit, 1e-9);
  const status: MissionValidationStatus = ratio < 1 ? "fail" : ratio < 1.25 ? "warning" : "pass";
  return {
    id,
    label,
    actual,
    limit,
    margin: actual - limit,
    unit,
    status,
    explanation: status === "fail"
      ? `${label} is below the required clearance.`
      : status === "warning"
        ? `${label} has less than 25% clearance margin.`
        : `${label} retains clearance margin.`,
  };
}

export function auditMissionPlan(
  plan: Pick<
    MissionPlan,
    "segments" | "totalDeltaVKms" | "dsmReserveDeltaVKms" | "durationDays" | "navigationUncertaintyKm"
  >,
  constraints: MissionEngineeringConstraints,
): { checks: MissionConstraintCheck[]; status: MissionValidationStatus; rejectionReasons: string[] } {
  const venus = plan.segments.find((segment) => segment.toBody === "venus");
  const jupiter = plan.segments.find((segment) => segment.toBody === "jupiter");
  const checks: MissionConstraintCheck[] = [
    maximumCheck("c3", "Earth departure C3", plan.segments[0]?.c3Km2S2 ?? Number.POSITIVE_INFINITY, constraints.maxC3Km2S2, "km²/s²"),
    maximumCheck("delta-v", "Total delta-v", plan.totalDeltaVKms, constraints.maxTotalDeltaVKms, "km/s"),
    maximumCheck("dsm", "DSM reserve", plan.dsmReserveDeltaVKms, constraints.maxDsmDeltaVKms, "km/s"),
    maximumCheck("duration", "Mission duration", plan.durationDays, constraints.maxDurationDays, "days"),
    maximumCheck("navigation", "Navigation uncertainty", plan.navigationUncertaintyKm, constraints.maxNavigationUncertaintyKm, "km"),
  ];
  if (venus) {
    checks.push(minimumCheck("venus-flyby", "Venus flyby altitude", venus.periapsisAltitudeKm, constraints.minVenusFlybyAltitudeKm, "km"));
  }
  if (jupiter) {
    checks.push(minimumCheck("jupiter-flyby", "Jupiter flyby altitude", jupiter.periapsisAltitudeKm, constraints.minJupiterFlybyAltitudeKm, "km"));
  }
  for (const segment of plan.segments) {
    if (!segment.lambertConverged) {
      const segmentTolerance = Math.max(
        LAMBERT_TOLERANCE_SECONDS,
        segment.tofDays * DAY_SECONDS * 3e-6,
      );
      checks.push({
        id: `lambert-${segment.id}`,
        label: `${segment.fromBody}-${segment.toBody} Lambert convergence`,
        actual: segment.lambertResidual,
        limit: segmentTolerance,
        margin: segmentTolerance - segment.lambertResidual,
        unit: "s residual",
        status: "fail",
        explanation: segment.solverFailureReason ?? "The Lambert leg did not converge and is excluded from feasible ranking.",
      });
    }
  }
  const status: MissionValidationStatus = checks.some((check) => check.status === "fail")
    ? "fail"
    : checks.some((check) => check.status === "warning")
      ? "warning"
      : "pass";
  return {
    checks,
    status,
    rejectionReasons: checks.filter((check) => check.status === "fail").map((check) => check.explanation),
  };
}

function chartSeriesForSegments(segments: MissionSegment[]): MissionChartPoint[] {
  return segments.map((seg) => ({
    label: `${seg.fromBody.toUpperCase()}-${seg.toBody.toUpperCase()}`,
    day: seg.arrivalDay,
    c3Km2S2: seg.c3Km2S2,
    deltaVKms: seg.deltaVKms,
    dsmDeltaVKms: seg.dsmDeltaVKms,
    departureVinfinityKms: seg.departureVinfinityKms,
    arrivalVinfinityKms: seg.arrivalVinfinityKms,
    communicationDelayMin: seg.communicationDelayMin,
    flybySafetyMargin: Number.isFinite(seg.flybySafetyMargin) ? seg.flybySafetyMargin : null,
  }));
}

export function scoreMissionPlan(plan: MissionPlan): number {
  const riskPenalty = plan.risk === "high" ? 22 : plan.risk === "medium" ? 9 : 0;
  const validationPenalty = plan.validationStatus === "fail" ? 45 : plan.validationStatus === "warning" ? 8 : 0;
  const durationPenalty = Math.max(0, (plan.durationDays - 2500) / 110);
  const convergencePenalty = plan.segments.filter((s) => !s.lambertConverged).length * 16;
  const c3Penalty = Math.max(0, (plan.segments[0]?.c3Km2S2 ?? 0) - 85) * 0.09;
  return Math.max(0, 100 - plan.totalDeltaVKms * 4.4 - durationPenalty - riskPenalty - validationPenalty - convergencePenalty - c3Penalty);
}

function buildPlan(
  departureDay: number,
  tofScale: number,
  variantScale: number,
  snapshot: MissionPhysicsSnapshot,
  options: MissionOptimizerOptions,
  constraints: MissionEngineeringConstraints,
): MissionPlan {
  const ephemerisMode = options.ephemerisMode ?? "jpl-table";
  const drafts: TransferDraft[] = [];
  let cursor = departureDay;
  for (let i = 0; i < options.sequence.length - 1; i++) {
    const from = options.sequence[i]!;
    const to = options.sequence[i + 1]!;
    const key = `${from}-${to}`;
    const baseTof = NOMINAL_TOF_DAYS[key] ?? 365;
    const tofDays = Math.round(baseTof * tofScale * variantScale * (1 + i * 0.025));
    const seg = makeSegment(from, to, cursor, tofDays, snapshot, ephemerisMode);
    drafts.push(seg);
    cursor = seg.arrivalDay;
  }

  const segments = annotatePatchedConics(drafts, constraints);
  const totalDeltaVKms = segments.reduce((sum, s) => sum + s.deltaVKms, 0);
  const dsmReserveDeltaVKms = segments.reduce((sum, s) => sum + s.dsmDeltaVKms, 0);
  const deterministicDeltaVKms = Math.max(0, totalDeltaVKms - dsmReserveDeltaVKms);
  const maxCommunicationDelayMin = Math.max(...segments.map((s) => s.communicationDelayMin));
  const navigationUncertaintyKm = Math.max(...segments.map((s) => s.kalmanSigmaKm));
  const riskRank = Math.max(...segments.map((s) => (s.risk === "high" ? 2 : s.risk === "medium" ? 1 : 0)));
  const lambertFailures = segments.filter((s) => !s.lambertConverged).length;
  const plan: MissionPlan = {
    id: `evjs-lambert-${Math.round(departureDay)}-${tofScale.toFixed(2)}-${variantScale.toFixed(2)}`,
    name: "Earth-Venus-Jupiter-Saturn Lambert Patched-Conics",
    sequence: [...options.sequence],
    departureDay,
    arrivalDay: cursor,
    durationDays: cursor - departureDay,
    totalDeltaVKms,
    deterministicDeltaVKms,
    dsmReserveDeltaVKms,
    fuelEstimateKg: propellantEstimateKg(
      totalDeltaVKms,
      constraints.dryMassKg,
      constraints.ispSeconds,
    ),
    score: 0,
    grCorrectionNote: options.includeRelativity
      ? "1PN reporting enabled; Lambert transfer remains Newtonian two-body with separate weak-field note."
      : "Newtonian Lambert transfer; 1PN reporting disabled.",
    attitudeEvents: segments.length * 2 + 1,
    maxCommunicationDelayMin,
    navigationUncertaintyKm,
    risk: lambertFailures > 0 ? "medium" : riskRank >= 2 ? "high" : riskRank === 1 ? "medium" : "low",
    validationStatus: "fail",
    constraintChecks: [],
    assumptions: [
      "Heliocentric two-body Lambert legs with patched-conic flybys.",
      ephemerisMode === "jpl-table"
        ? "Body states originate from NASA/JPL Horizons table interpolation for the mission window."
        : "Body states originate from the live simulation epoch and use circular state propagation.",
      "Deterministic burns and DSM reserve are combined for the rocket-equation propellant estimate.",
      "No finite-burn, covariance propagation, launch vehicle, thermal, power, or communications link-budget certification.",
    ],
    solverProvenance: {
      modelLevel: "medium-fidelity preliminary design",
      epochSimDays: snapshot.simDays,
      gravityModel: "heliocentric two-body Lambert + patched conics",
      ephemerisSource: ephemerisMode === "jpl-table" ? "JPL Horizons table interpolation" : "live simulation state with circular state propagation",
      lambertToleranceSeconds: Math.max(
        ...segments.map((segment) =>
          Math.max(LAMBERT_TOLERANCE_SECONDS, segment.tofDays * DAY_SECONDS * 3e-6),
        ),
      ),
      candidateCount: 0,
      convergedCandidateCount: 0,
    },
    ephemerisAudit: buildEphemerisAudit(ephemerisMode, snapshot, segments),
    sensitivitySummary: null,
    rejectionReasons: [],
    segments,
    chartSeries: chartSeriesForSegments(segments),
  };
  const audit = auditMissionPlan(plan, constraints);
  plan.constraintChecks = audit.checks;
  plan.validationStatus = audit.status;
  plan.rejectionReasons = audit.rejectionReasons;
  plan.score = scoreMissionPlan(plan);
  return plan;
}

function dedupePlans(plans: MissionPlan[]): MissionPlan[] {
  const seen = new Set<string>();
  const out: MissionPlan[] = [];
  for (const plan of plans) {
    const key = `${Math.round(plan.departureDay / 15)}:${Math.round(plan.durationDays / 20)}:${plan.segments.filter((s) => s.lambertConverged).length}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(plan);
  }
  return out;
}

function minimumFlybyMarginKm(plan: MissionPlan): number {
  const margins = plan.segments
    .filter((segment) => segment.toBody === "venus" || segment.toBody === "jupiter")
    .map((segment) => segment.periapsisAltitudeKm);
  return margins.length ? Math.min(...margins) : 0;
}

function withSensitivity(
  plan: MissionPlan,
  snapshot: MissionPhysicsSnapshot,
  options: MissionOptimizerOptions,
  constraints: MissionEngineeringConstraints,
): MissionPlan {
  const departurePerturbationDays = Math.max(3, options.departureStepDays * 0.5);
  const tofPerturbationFraction = 0.02;
  const samples = [
    buildPlan(plan.departureDay - departurePerturbationDays, 1, 1, snapshot, options, constraints),
    buildPlan(plan.departureDay + departurePerturbationDays, 1, 1, snapshot, options, constraints),
    buildPlan(plan.departureDay, 1 - tofPerturbationFraction, 1, snapshot, options, constraints),
    buildPlan(plan.departureDay, 1 + tofPerturbationFraction, 1, snapshot, options, constraints),
  ];
  const deltaVs = samples.map((sample) => sample.totalDeltaVKms);
  const c3Values = samples.map((sample) => sample.segments[0]?.c3Km2S2 ?? Number.POSITIVE_INFINITY);
  const scores = samples.map((sample) => sample.score);
  const failed = samples.filter((sample) => sample.validationStatus === "fail").length;
  const scoreSpread = Math.max(...scores) - Math.min(...scores);
  const deltaVSpread = Math.max(...deltaVs) - Math.min(...deltaVs);
  plan.sensitivitySummary = {
    samples: samples.length,
    departurePerturbationDays,
    tofPerturbationFraction,
    deltaVRangeKms: [Math.min(...deltaVs), Math.max(...deltaVs)],
    c3RangeKm2S2: [Math.min(...c3Values), Math.max(...c3Values)],
    minimumFlybyMarginKm: Math.min(...samples.map(minimumFlybyMarginKm)),
    scoreRange: [Math.min(...scores), Math.max(...scores)],
    robustnessScore: Math.max(0, 100 - failed * 22 - scoreSpread * 1.4 - deltaVSpread * 5),
  };
  return plan;
}

export function optimizeMission(
  options: MissionOptimizerOptions,
  physicsSnapshot: MissionPhysicsSnapshot,
): MissionOptimizationResult {
  const sequence = options.sequence.length >= 2 ? options.sequence : BODY_ORDER;
  const normalized: MissionOptimizerOptions = { ...options, sequence };
  const constraints = resolveMissionConstraints(normalized);
  const plans: MissionPlan[] = [];
  const tofScales = [0.88, 0.96, 1.04, 1.12];
  const variantScales = [0.96, 1.0, 1.04];

  for (
    let dep = normalized.departureStartDay;
    dep <= normalized.departureStartDay + normalized.departureWindowDays;
    dep += normalized.departureStepDays
  ) {
    for (const tofScale of tofScales) {
      for (const variantScale of variantScales) {
        plans.push(buildPlan(dep, tofScale, variantScale, physicsSnapshot, normalized, constraints));
      }
    }
  }

  const uniquePlans = dedupePlans(plans);
  const convergedCandidateCount = uniquePlans.filter((plan) => plan.segments.every((segment) => segment.lambertConverged)).length;
  for (const plan of uniquePlans) {
    plan.solverProvenance.candidateCount = uniquePlans.length;
    plan.solverProvenance.convergedCandidateCount = convergedCandidateCount;
  }
  const rejectedPlans = uniquePlans
    .filter((plan) => plan.validationStatus === "fail")
    .sort((a, b) => b.score - a.score);
  const ranked = uniquePlans
    .filter((plan) => plan.validationStatus !== "fail")
    .sort((a, b) => b.score - a.score || a.totalDeltaVKms - b.totalDeltaVKms)
    .slice(0, Math.max(3, normalized.maxCandidates));
  if (ranked[0]) {
    withSensitivity(ranked[0], physicsSnapshot, normalized, constraints);
  }

  return {
    options: normalized,
    constraints,
    plans: ranked,
    rejectedPlans: rejectedPlans.slice(0, Math.max(3, normalized.maxCandidates)),
    bestPlan: ranked[0] ?? null,
    generatedAt: Date.now(),
  };
}
