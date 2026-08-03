import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import { calculateAcceleration, stateAuToSi } from "./physicsEngine";
import { C_LIGHT, DAY_SECONDS, G_SI } from "./physicalConstants";
import { calculateRelativityForceModelV2Delta } from "./relativityForceModelV2";
import { compareStateToHorizonsCheckpoint } from "./relativityValidation";
import type { HorizonsComparisonCheckpoint, HorizonsValidationDataset } from "./simulationDiagnosticsTypes";
import type { HorizonsValidationMassMap } from "./horizonsValidationRunner";
import { createScientificPromotionEvidenceV3, type ScientificPromotionEvidenceV3 } from "./atlasReleaseProgram";

export const RELATIVITY_PROMOTION_V3_RUNNER_VERSION = "v137-independent-de440-shadow-runner" as const;

export type RelativityPromotionMode = "newton" | "legacy-eih-1pn" | "eih-1pn-2pn-lt";

export type RelativityPromotionModeReport = {
  mode: RelativityPromotionMode;
  checkpoints: readonly HorizonsComparisonCheckpoint[];
  rmsPositionKm: number;
  rmsVelocityMS: number;
};

export type RelativityPromotionV3Report = {
  version: typeof RELATIVITY_PROMOTION_V3_RUNNER_VERSION;
  fixtureVariant: string;
  coordinateFrame: "DE440-barycentric-J2000-ecliptic";
  dtDays: number;
  eps2Meters: 0;
  modes: readonly RelativityPromotionModeReport[];
  convergence: { durationDays: number; positionRmsKm: number; velocityRmsMS: number };
  timeReversal: { durationDays: number; positionRmsM: number; velocityRmsMS: number };
  promotion: ScientificPromotionEvidenceV3;
  liveStateMutated: false;
};

type State = { pos: Float64Array; vel: Float64Array; mass: Float64Array; bodyIds: string[] };

type Workspace = {
  aNewt: Float64Array; phi: Float64Array; acceleration: Float64Array; v2: Float64Array;
  p2: Float64Array; v2State: Float64Array; p3: Float64Array; v3State: Float64Array; p4: Float64Array; v4State: Float64Array;
  a1: Float64Array; a2: Float64Array; a3: Float64Array; a4: Float64Array;
};

function initialState(dataset: HorizonsValidationDataset, masses?: HorizonsValidationMassMap): State {
  const checkpoint = dataset.checkpoints.find((value) => value.label === "J2000");
  if (!checkpoint) throw new Error("V137 fixture missing J2000 state");
  const n = checkpoint.bodies.length;
  const posAu = new Float64Array(n * 3);
  const velAuD = new Float64Array(n * 3);
  const mass = new Float64Array(n);
  const bodyIds = checkpoint.bodies.map((body) => body.id);
  const defaults = new Map(SOLAR_SYSTEM_BODIES.map((body) => [body.id, body.massKg]));
  for (let index = 0; index < n; index += 1) {
    const body = checkpoint.bodies[index]!;
    posAu.set([body.x_au, body.y_au, body.z_au], index * 3);
    velAuD.set([body.vx_au_d, body.vy_au_d, body.vz_au_d], index * 3);
    mass[index] = massValue(masses, body.id) ?? defaults.get(body.id) ?? 0;
  }
  const pos = new Float64Array(n * 3);
  const vel = new Float64Array(n * 3);
  stateAuToSi(posAu, velAuD, n, pos, vel);
  return { pos, vel, mass, bodyIds };
}

function massValue(values: HorizonsValidationMassMap | undefined, id: string): number | null {
  if (!values) return null;
  if ("get" in values && typeof values.get === "function") return values.get(id) ?? null;
  const value = (values as Readonly<Record<string, number>>)[id];
  return Number.isFinite(value) ? value : null;
}

function workspace(width: number, n: number): Workspace {
  return {
    aNewt: new Float64Array(width), phi: new Float64Array(n), acceleration: new Float64Array(width), v2: new Float64Array(width),
    p2: new Float64Array(width), v2State: new Float64Array(width), p3: new Float64Array(width), v3State: new Float64Array(width), p4: new Float64Array(width), v4State: new Float64Array(width),
    a1: new Float64Array(width), a2: new Float64Array(width), a3: new Float64Array(width), a4: new Float64Array(width),
  };
}

function acceleration(state: State, pos: Float64Array, vel: Float64Array, mode: RelativityPromotionMode, out: Float64Array, work: Workspace): void {
  const invC2 = mode === "newton" ? 0 : 1 / (C_LIGHT * C_LIGHT);
  calculateAcceleration(pos, vel, state.mass, state.mass.length, G_SI, invC2, 0, work.aNewt, work.phi, out);
  if (mode !== "eih-1pn-2pn-lt") return;
  calculateRelativityForceModelV2Delta(pos, vel, state.mass, state.mass.length, work.v2);
  for (let index = 0; index < out.length; index += 1) out[index] += work.v2[index];
}

function rk4ShadowStep(state: State, dtSeconds: number, mode: RelativityPromotionMode, work: Workspace): void {
  const { pos, vel } = state;
  acceleration(state, pos, vel, mode, work.a1, work);
  for (let i = 0; i < pos.length; i += 1) { work.p2[i] = pos[i] + vel[i] * dtSeconds * 0.5; work.v2State[i] = vel[i] + work.a1[i] * dtSeconds * 0.5; }
  acceleration(state, work.p2, work.v2State, mode, work.a2, work);
  for (let i = 0; i < pos.length; i += 1) { work.p3[i] = pos[i] + work.v2State[i] * dtSeconds * 0.5; work.v3State[i] = vel[i] + work.a2[i] * dtSeconds * 0.5; }
  acceleration(state, work.p3, work.v3State, mode, work.a3, work);
  for (let i = 0; i < pos.length; i += 1) { work.p4[i] = pos[i] + work.v3State[i] * dtSeconds; work.v4State[i] = vel[i] + work.a3[i] * dtSeconds; }
  acceleration(state, work.p4, work.v4State, mode, work.a4, work);
  for (let i = 0; i < pos.length; i += 1) {
    pos[i] += dtSeconds * (vel[i] + 2 * work.v2State[i] + 2 * work.v3State[i] + work.v4State[i]) / 6;
    vel[i] += dtSeconds * (work.a1[i] + 2 * work.a2[i] + 2 * work.a3[i] + work.a4[i]) / 6;
  }
}

function integrateDays(state: State, days: number, dtDays: number, mode: RelativityPromotionMode): void {
  const work = workspace(state.pos.length, state.mass.length);
  const direction = Math.sign(days) || 1;
  let elapsed = 0;
  while (Math.abs(elapsed) < Math.abs(days) - 1e-12) {
    const step = direction * Math.min(Math.abs(dtDays), Math.abs(days - elapsed));
    rk4ShadowStep(state, step * DAY_SECONDS, mode, work);
    elapsed += step;
  }
}

function rmsDifference(a: Float64Array, b: Float64Array, scale = 1): number {
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) { const delta = (a[index] - b[index]) * scale; sum += delta * delta; }
  return Math.sqrt(sum / Math.max(1, a.length));
}

function reportRms(checkpoints: readonly HorizonsComparisonCheckpoint[], field: "rmsPositionKm" | "rmsVelocityMs"): number {
  return Math.sqrt(checkpoints.reduce((sum, checkpoint) => {
    const value = checkpoint[field] ?? Number.NaN;
    return sum + value * value;
  }, 0) / Math.max(1, checkpoints.length));
}

function runMode(dataset: HorizonsValidationDataset, masses: HorizonsValidationMassMap, mode: RelativityPromotionMode, dtDays: number, maxDays: number): { report: RelativityPromotionModeReport; state: State } {
  const state = initialState(dataset, masses);
  const checkpoints = dataset.checkpoints.filter((checkpoint) => checkpoint.label !== "J2000" && checkpoint.offsetDays <= maxDays);
  const comparisons: HorizonsComparisonCheckpoint[] = [];
  let elapsed = 0;
  for (const checkpoint of checkpoints) {
    integrateDays(state, checkpoint.offsetDays - elapsed, dtDays, mode);
    elapsed = checkpoint.offsetDays;
    comparisons.push(compareStateToHorizonsCheckpoint({ posM: state.pos, velM: state.vel, bodyIds: state.bodyIds, checkpoint }));
  }
  return { report: { mode, checkpoints: comparisons, rmsPositionKm: reportRms(comparisons, "rmsPositionKm"), rmsVelocityMS: reportRms(comparisons, "rmsVelocityMs") }, state };
}

export async function runRelativityPromotionV3(args: {
  dataset: HorizonsValidationDataset;
  massKgByBodyId: HorizonsValidationMassMap;
  dtDays?: number;
  convergenceDays?: number;
  reversalDays?: number;
  maxDays?: number;
}): Promise<RelativityPromotionV3Report> {
  const dtDays = args.dtDays ?? 0.125;
  const availableMax = Math.max(...args.dataset.checkpoints.map((checkpoint) => checkpoint.offsetDays));
  const maxDays = Math.min(args.maxDays ?? availableMax, availableMax);
  const modes = (["newton", "legacy-eih-1pn", "eih-1pn-2pn-lt"] as const).map((mode) => runMode(args.dataset, args.massKgByBodyId, mode, dtDays, maxDays));
  const convergenceDays = Math.min(args.convergenceDays ?? 365, maxDays);
  const coarse = initialState(args.dataset, args.massKgByBodyId);
  const fine = initialState(args.dataset, args.massKgByBodyId);
  integrateDays(coarse, convergenceDays, dtDays, "eih-1pn-2pn-lt");
  integrateDays(fine, convergenceDays, dtDays / 2, "eih-1pn-2pn-lt");
  const reversalDays = Math.min(args.reversalDays ?? 30, maxDays);
  const reversal = initialState(args.dataset, args.massKgByBodyId);
  const initialPos = reversal.pos.slice();
  const initialVel = reversal.vel.slice();
  integrateDays(reversal, reversalDays, dtDays, "eih-1pn-2pn-lt");
  integrateDays(reversal, -reversalDays, dtDays, "eih-1pn-2pn-lt");
  const v2 = modes[2]!.report;
  const tenYear = v2.checkpoints.find((checkpoint) => checkpoint.label === "+10y");
  return {
    version: RELATIVITY_PROMOTION_V3_RUNNER_VERSION,
    fixtureVariant: args.dataset.variant ?? "legacy-center-reference",
    coordinateFrame: "DE440-barycentric-J2000-ecliptic",
    dtDays,
    eps2Meters: 0,
    modes: modes.map((value) => value.report),
    convergence: { durationDays: convergenceDays, positionRmsKm: rmsDifference(coarse.pos, fine.pos, 1 / 1000), velocityRmsMS: rmsDifference(coarse.vel, fine.vel) },
    timeReversal: { durationDays: reversalDays, positionRmsM: rmsDifference(reversal.pos, initialPos), velocityRmsMS: rmsDifference(reversal.vel, initialVel) },
    promotion: createScientificPromotionEvidenceV3({ positionRmsKm: tenYear?.rmsPositionKm ?? undefined, velocityRmsMS: tenYear?.rmsVelocityMs ?? undefined }),
    liveStateMutated: false,
  };
}
