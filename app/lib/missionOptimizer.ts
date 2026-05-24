import { AU_METERS, C_LIGHT, DAY_SECONDS, G_SI } from "./physicalConstants";
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

const BODY_ORDER: MissionBodyId[] = ["earth", "venus", "jupiter", "saturn"];
const NOMINAL_TOF_DAYS: Record<string, number> = {
  "earth-venus": 155,
  "venus-jupiter": 720,
  "jupiter-saturn": 1160,
};
const FLYBY_BONUS_KMS: Partial<Record<MissionBodyId, number>> = {
  venus: 2.35,
  jupiter: 5.2,
};
const BODY_RADIUS_KM: Record<MissionBodyId, number> = {
  earth: 6378,
  venus: 6052,
  jupiter: 69911,
  saturn: 58232,
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

function predictBodyAu(body: MissionBodySnapshot, daysAfterSnapshot: number): [number, number, number] {
  const rAu = body.posAu;
  const vAuDay = body.velAuPerDay;
  const rM = norm(rAu) * AU_METERS;
  const h = cross(rAu, vAuDay);
  const axis = norm(h) > 1e-8 ? h : [0, 0, 1];
  const nRadS = Math.sqrt(SUN_MU / Math.max(rM * rM * rM, 1));
  const angle = nRadS * daysAfterSnapshot * DAY_SECONDS;
  return rotateAroundAxis(rAu, axis, angle);
}

function bodySpeedKms(body: MissionBodySnapshot): number {
  return (norm(body.velAuPerDay) * AU_METERS) / DAY_SECONDS / 1000;
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

function segmentDeltaV(
  from: MissionBodySnapshot,
  to: MissionBodySnapshot,
  fromPos: [number, number, number],
  toPos: [number, number, number],
  tofDays: number,
): number {
  const chordAu = norm(sub(toPos, fromPos));
  const transferKms = (chordAu * AU_METERS) / Math.max(tofDays * DAY_SECONDS, 1) / 1000;
  const circularBlend = Math.abs(bodySpeedKms(from) - bodySpeedKms(to)) * 0.18;
  const shapingPenalty = Math.max(0, chordAu - 4) * 0.12;
  return Math.max(0.35, transferKms * 0.42 + circularBlend + shapingPenalty);
}

function makeSegment(
  fromBody: MissionBodyId,
  toBody: MissionBodyId,
  departureDay: number,
  tofDays: number,
  snapshot: MissionPhysicsSnapshot,
  includeRelativity: boolean,
  variantScale: number,
): MissionSegment {
  const from = snapshot.bodies[fromBody];
  const to = snapshot.bodies[toBody];
  const arrivalDay = departureDay + tofDays;
  const fromPos = predictBodyAu(from, departureDay - snapshot.simDays);
  const toPos = predictBodyAu(to, arrivalDay - snapshot.simDays);
  const rawDv = segmentDeltaV(from, to, fromPos, toPos, tofDays) * variantScale;
  const bonus = FLYBY_BONUS_KMS[toBody] ?? 0;
  const deltaVKms = Math.max(0.18, rawDv - bonus);
  const c3Km2S2 = fromBody === "earth" ? Math.max(0.1, deltaVKms * deltaVKms - 11.2) : deltaVKms * deltaVKms * 0.28;
  const closestApproachKm =
    toBody === "saturn"
      ? BODY_RADIUS_KM.saturn * 18
      : BODY_RADIUS_KM[toBody] * (2.6 + Math.max(0, 1.15 - variantScale) * 1.4);
  const turnAngleDeg = toBody === "venus" ? 31 + (1.1 - variantScale) * 9 : toBody === "jupiter" ? 62 + (1.1 - variantScale) * 14 : 8;
  const earthAtArrival = predictBodyAu(snapshot.bodies.earth, arrivalDay - snapshot.simDays);
  const communicationDelayMin = (norm(sub(toPos, earthAtArrival)) * AU_METERS) / C_LIGHT / 60;
  const riskScalar =
    deltaVKms / 9 +
    (closestApproachKm < BODY_RADIUS_KM[toBody] * 3 ? 0.38 : 0) +
    (communicationDelayMin > 70 ? 0.22 : 0);
  const risk = riskFrom(riskScalar);
  const liftAu = Math.min(3.4, Math.max(0.18, norm(sub(toPos, fromPos)) * 0.16));

  return {
    id: `${fromBody}-${toBody}-${Math.round(departureDay)}`,
    fromBody,
    toBody,
    departureDay,
    arrivalDay,
    tofDays,
    deltaVKms,
    c3Km2S2,
    closestApproachKm,
    turnAngleDeg: Math.max(0, turnAngleDeg),
    communicationDelayMin,
    burnAttitude: fromBody === "earth" ? "LEO prograde injection" : "B-plane targeting trim",
    antennaPointing: communicationDelayMin > 60 ? "High-gain Earth-pointing with store-and-forward windows" : "Continuous high-gain Earth lock",
    solarArrayPointing: toBody === "jupiter" || toBody === "saturn" ? "Low-flux cruise bias, battery-positive margins" : "Sun-track cruise",
    kalmanSigmaKm: Math.max(12, 180 - turnAngleDeg * 1.8 + deltaVKms * 9),
    risk,
    trajectoryAu: trajectorySamples(fromPos, toPos, liftAu),
  };
}

function fuelEstimateKg(deltaVKms: number): number {
  const dryMassKg = 4200;
  const massRatio = Math.exp((deltaVKms * 1000) / (DEFAULT_ISP_S * G0));
  return Math.min(180_000, Math.max(1200, dryMassKg * (massRatio - 1)));
}

export function scoreMissionPlan(plan: MissionPlan): number {
  const riskPenalty = plan.risk === "high" ? 22 : plan.risk === "medium" ? 9 : 0;
  const durationPenalty = Math.max(0, (plan.durationDays - 2300) / 95);
  return Math.max(0, 100 - plan.totalDeltaVKms * 5.6 - durationPenalty - riskPenalty);
}

function buildPlan(
  departureDay: number,
  tofScale: number,
  variantScale: number,
  snapshot: MissionPhysicsSnapshot,
  options: MissionOptimizerOptions,
): MissionPlan {
  const segments: MissionSegment[] = [];
  let cursor = departureDay;
  for (let i = 0; i < options.sequence.length - 1; i++) {
    const from = options.sequence[i]!;
    const to = options.sequence[i + 1]!;
    const key = `${from}-${to}`;
    const baseTof = NOMINAL_TOF_DAYS[key] ?? 365;
    const seg = makeSegment(
      from,
      to,
      cursor,
      Math.round(baseTof * tofScale * (1 + i * 0.025)),
      snapshot,
      options.includeRelativity,
      variantScale + i * 0.018,
    );
    segments.push(seg);
    cursor = seg.arrivalDay;
  }

  const totalDeltaVKms = segments.reduce((sum, s) => sum + s.deltaVKms, 0);
  const maxCommunicationDelayMin = Math.max(...segments.map((s) => s.communicationDelayMin));
  const navigationUncertaintyKm = Math.max(...segments.map((s) => s.kalmanSigmaKm));
  const riskRank = Math.max(...segments.map((s) => (s.risk === "high" ? 2 : s.risk === "medium" ? 1 : 0)));
  const plan: MissionPlan = {
    id: `evjs-${Math.round(departureDay)}-${tofScale.toFixed(2)}-${variantScale.toFixed(2)}`,
    name: "Earth-Venus-Jupiter-Saturn Gravity Assist",
    sequence: [...options.sequence],
    departureDay,
    arrivalDay: cursor,
    durationDays: cursor - departureDay,
    totalDeltaVKms,
    fuelEstimateKg: fuelEstimateKg(totalDeltaVKms),
    score: 0,
    grCorrectionNote: options.includeRelativity
      ? "1PN reporting enabled; weak-field correction tracked outside the optimizer loop."
      : "Newtonian optimizer; 1PN reporting disabled.",
    attitudeEvents: segments.length * 2 + 1,
    maxCommunicationDelayMin,
    navigationUncertaintyKm,
    risk: riskRank >= 2 ? "high" : riskRank === 1 ? "medium" : "low",
    segments,
  };
  plan.score = scoreMissionPlan(plan);
  return plan;
}

function dedupePlans(plans: MissionPlan[]): MissionPlan[] {
  const seen = new Set<string>();
  const out: MissionPlan[] = [];
  for (const plan of plans) {
    const key = `${Math.round(plan.departureDay / 15)}:${Math.round(plan.durationDays / 20)}`;
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
  const tofScales = [0.92, 1.0, 1.08];
  const variantScales = [0.9, 1.0, 1.1];

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
