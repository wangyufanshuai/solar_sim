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
} from "./missionDesignerTypes";

const SUN_MU = G_SI * 1.98847e30;
const DEFAULT_ISP_S = 320;
const G0 = 9.80665;
const SAMPLE_COUNT = 72;
const EARTH_MU_KM3S2 = 398600.4418;
const PARKING_ORBIT_RADIUS_KM = 6678;

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
};

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
  };
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

function injectionDeltaVKms(vinfKms: number): number {
  const vc = Math.sqrt(EARTH_MU_KM3S2 / PARKING_ORBIT_RADIUS_KM);
  const vesc = Math.sqrt((2 * EARTH_MU_KM3S2) / PARKING_ORBIT_RADIUS_KM);
  return Math.max(0.05, Math.sqrt(vinfKms * vinfKms + vesc * vesc) - vc);
}

function fallbackLambertVelocity(from: BodyState, to: BodyState, tofDays: number): [number, number, number] {
  const dt = Math.max(tofDays * DAY_SECONDS, 1);
  return [
    (to.posM[0] - from.posM[0]) / dt,
    (to.posM[1] - from.posM[1]) / dt,
    (to.posM[2] - from.posM[2]) / dt,
  ];
}

function makeSegment(
  fromBody: MissionBodyId,
  toBody: MissionBodyId,
  departureDay: number,
  tofDays: number,
  snapshot: MissionPhysicsSnapshot,
): TransferDraft {
  const from = snapshot.bodies[fromBody];
  const to = snapshot.bodies[toBody];
  const arrivalDay = departureDay + tofDays;
  const fromState = predictBodyState(from, departureDay - snapshot.simDays);
  const toState = predictBodyState(to, arrivalDay - snapshot.simDays);
  const lambert = solveLambertTransfer({
    r1M: fromState.posM as Vec3,
    r2M: toState.posM as Vec3,
    tofSeconds: tofDays * DAY_SECONDS,
    mu: SUN_MU,
    prograde: true,
    toleranceSeconds: Math.max(2, tofDays * DAY_SECONDS * 3e-6),
  });
  const departureVelocityMps = lambert.converged
    ? lambert.departureVelocityMps
    : fallbackLambertVelocity(fromState, toState, tofDays);
  const arrivalVelocityMps = lambert.converged
    ? lambert.arrivalVelocityMps
    : fallbackLambertVelocity(fromState, toState, tofDays);
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
    c3Km2S2: fromBody === "earth" ? departureVinfinityKms * departureVinfinityKms : 0,
    lambertConverged: lambert.converged,
    lambertIterations: lambert.iterations,
    lambertResidual: lambert.residualSeconds,
    departureVinfinityKms,
    arrivalVinfinityKms,
    periapsisAltitudeKm: Number.POSITIVE_INFINITY,
    flybySafetyMargin: Number.POSITIVE_INFINITY,
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

function annotatePatchedConics(segments: TransferDraft[]): MissionSegment[] {
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    if (i === 0) {
      seg.deltaVKms = injectionDeltaVKms(seg.departureVinfinityKms) + 0.12;
    } else {
      const prev = segments[i - 1]!;
      const vinfMismatch = Math.abs(seg.departureVinfinityKms - prev.arrivalVinfinityKms);
      seg.deltaVKms = Math.max(0.08, vinfMismatch * 0.16 + (seg.lambertConverged ? 0.06 : 0.35));
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
      seg.turnAngleDeg = turnAngle;
      seg.closestApproachKm = rpKm;
      seg.periapsisAltitudeKm = altitudeKm;
      seg.flybySafetyMargin = safetyMargin;
      seg.risk = riskFrom(
        (turnAngle > maxTurnAtSafeAltitude ? 0.38 : 0) +
          (safetyMargin < 0.3 ? 0.34 : 0) +
          (seg.lambertConverged ? 0 : 0.26) +
          (seg.communicationDelayMin > 70 ? 0.18 : 0),
      );
      seg.kalmanSigmaKm = Math.max(8, 70 + turnAngle * 1.2 + Math.max(0, 0.4 - safetyMargin) * 240);
    } else if (seg.toBody === "saturn") {
      seg.deltaVKms = Math.max(seg.deltaVKms, seg.arrivalVinfinityKms * 0.42 + 0.25);
      seg.periapsisAltitudeKm = BODY_RADIUS_KM.saturn * 7;
      seg.flybySafetyMargin = 7;
      seg.closestApproachKm = BODY_RADIUS_KM.saturn * 8;
      seg.turnAngleDeg = 0;
      seg.risk = riskFrom(seg.arrivalVinfinityKms / 18 + (seg.communicationDelayMin > 80 ? 0.22 : 0));
    }
  }
  return segments.map(({ departureVinfVecKms: _a, arrivalVinfVecKms: _b, ...segment }) => segment);
}

const THREE_DEG_TO_RAD = Math.PI / 180;

function fuelEstimateKg(deltaVKms: number): number {
  const dryMassKg = 4200;
  const massRatio = Math.exp((deltaVKms * 1000) / (DEFAULT_ISP_S * G0));
  return Math.min(180_000, Math.max(1200, dryMassKg * (massRatio - 1)));
}

export function scoreMissionPlan(plan: MissionPlan): number {
  const riskPenalty = plan.risk === "high" ? 22 : plan.risk === "medium" ? 9 : 0;
  const durationPenalty = Math.max(0, (plan.durationDays - 2500) / 110);
  const convergencePenalty = plan.segments.filter((s) => !s.lambertConverged).length * 16;
  const c3Penalty = Math.max(0, (plan.segments[0]?.c3Km2S2 ?? 0) - 85) * 0.09;
  return Math.max(0, 100 - plan.totalDeltaVKms * 4.4 - durationPenalty - riskPenalty - convergencePenalty - c3Penalty);
}

function buildPlan(
  departureDay: number,
  tofScale: number,
  variantScale: number,
  snapshot: MissionPhysicsSnapshot,
  options: MissionOptimizerOptions,
): MissionPlan {
  const drafts: TransferDraft[] = [];
  let cursor = departureDay;
  for (let i = 0; i < options.sequence.length - 1; i++) {
    const from = options.sequence[i]!;
    const to = options.sequence[i + 1]!;
    const key = `${from}-${to}`;
    const baseTof = NOMINAL_TOF_DAYS[key] ?? 365;
    const tofDays = Math.round(baseTof * tofScale * variantScale * (1 + i * 0.025));
    const seg = makeSegment(from, to, cursor, tofDays, snapshot);
    drafts.push(seg);
    cursor = seg.arrivalDay;
  }

  const segments = annotatePatchedConics(drafts);
  const totalDeltaVKms = segments.reduce((sum, s) => sum + s.deltaVKms, 0);
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
    fuelEstimateKg: fuelEstimateKg(totalDeltaVKms),
    score: 0,
    grCorrectionNote: options.includeRelativity
      ? "1PN reporting enabled; Lambert transfer remains Newtonian two-body with separate weak-field note."
      : "Newtonian Lambert transfer; 1PN reporting disabled.",
    attitudeEvents: segments.length * 2 + 1,
    maxCommunicationDelayMin,
    navigationUncertaintyKm,
    risk: lambertFailures > 0 ? "medium" : riskRank >= 2 ? "high" : riskRank === 1 ? "medium" : "low",
    segments,
  };
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

export function optimizeMission(
  options: MissionOptimizerOptions,
  physicsSnapshot: MissionPhysicsSnapshot,
): MissionOptimizationResult {
  const sequence = options.sequence.length >= 2 ? options.sequence : BODY_ORDER;
  const normalized: MissionOptimizerOptions = { ...options, sequence };
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
        plans.push(buildPlan(dep, tofScale, variantScale, physicsSnapshot, normalized));
      }
    }
  }

  const ranked = dedupePlans(plans)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(3, normalized.maxCandidates));

  return {
    options: normalized,
    plans: ranked,
    bestPlan: ranked[0] ?? null,
    generatedAt: Date.now(),
  };
}
