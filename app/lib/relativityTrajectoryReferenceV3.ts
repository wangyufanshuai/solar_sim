import { calculateAcceleration } from "./physicsEngine";
import { C_LIGHT, G_SI } from "./physicalConstants";
import {
  DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG,
  calculateRelativityForceModelV2Delta,
  type RelativityForceModelV2Config,
} from "./relativityForceModelV2";
import {
  canonicalizeRelativityReferenceRunnerV3,
  type RelativityReferenceStateSampleV3,
  type RelativityReferenceVectorV3,
} from "./relativityReferenceRunnerV3";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";

export const RELATIVITY_TRAJECTORY_REFERENCE_V3_VERSION =
  "post-v593-relativity-trajectory-reference-v1" as const;
export const RELATIVITY_TRAJECTORY_REFERENCE_V3_BOUNDARY =
  "offline-fixed-step-rk4-shadow-no-live-or-worker-state-mutation" as const;

export type RelativityTrajectoryKernelV3 =
  | "newton"
  | "legacy-eih-1pn"
  | "eih-1pn-plus-v2-shadow";

export type RelativityTrajectoryReferenceInputV3 = Readonly<{
  bodyIds: readonly string[];
  initialState: RelativityReferenceStateSampleV3;
  durationSeconds: number;
  coarseStepSeconds: number;
  config?: RelativityForceModelV2Config;
}>;

export type RelativityTrajectoryConvergenceRowV3 = Readonly<{
  kernel: RelativityTrajectoryKernelV3;
  coarseStepSeconds: number;
  mediumStepSeconds: number;
  fineStepSeconds: number;
  coarseStepCount: number;
  mediumStepCount: number;
  fineStepCount: number;
  coarseMediumPositionRmsM: number;
  mediumFinePositionRmsM: number;
  coarseMediumVelocityRmsMS: number;
  mediumFineVelocityRmsMS: number;
  observedPositionOrder: number | null;
  observedVelocityOrder: number | null;
  expectedMethodOrder: 4;
  orderFloor: 3.5;
  qualified: boolean;
  finite: true;
  fineFinalState: Readonly<{
    positionM: readonly number[];
    velocityMS: readonly number[];
  }>;
}>;

export type RelativityTrajectoryReverseTimeRowV3 = Readonly<{
  kernel: RelativityTrajectoryKernelV3;
  stepSeconds: number;
  stepCountEachDirection: number;
  positionRmsErrorM: number;
  velocityRmsErrorMS: number;
  positionRelativeError: number;
  velocityRelativeError: number;
  solarSpinAngularMomentumReversedForBackwardLeg: boolean;
  relativeErrorLimit: 1e-9;
  qualified: boolean;
  finite: true;
}>;

export type RelativityTrajectoryPerBodyRowV3 = Readonly<{
  bodyId: string;
  bodyIndex: number;
  legacyMinusNewtonPositionM: RelativityReferenceVectorV3;
  legacyMinusNewtonVelocityMS: RelativityReferenceVectorV3;
  v2MinusLegacyPositionM: RelativityReferenceVectorV3;
  v2MinusLegacyVelocityMS: RelativityReferenceVectorV3;
  legacyMinusNewtonPositionNormM: number;
  legacyMinusNewtonVelocityNormMS: number;
  v2MinusLegacyPositionNormM: number;
  v2MinusLegacyVelocityNormMS: number;
  finite: true;
}>;

export type RelativityTrajectoryReferenceRunV3 = Readonly<{
  version: typeof RELATIVITY_TRAJECTORY_REFERENCE_V3_VERSION;
  boundary: typeof RELATIVITY_TRAJECTORY_REFERENCE_V3_BOUNDARY;
  mode: "shadow-read-only";
  integrator: "classic-rk4-fixed-step";
  coordinateGauge: "harmonic";
  timeScale: "TDB-compatible-SI-shadow";
  bodyIds: readonly string[];
  bodyCount: number;
  initialSampleId: string;
  durationSeconds: number;
  convergence: Readonly<{
    status: "evaluated";
    method: "three-level-richardson-observed-order";
    rows: readonly RelativityTrajectoryConvergenceRowV3[];
    allQualified: boolean;
  }>;
  reverseTimeRoundTrip: Readonly<{
    status: "evaluated";
    method: "forward-velocity-reversal-backward-round-trip";
    rows: readonly RelativityTrajectoryReverseTimeRowV3[];
    allQualified: boolean;
    fullTimeIntegration: true;
  }>;
  perBody: readonly RelativityTrajectoryPerBodyRowV3[];
  aggregate: Readonly<{
    legacyMinusNewtonPositionRmsM: number;
    legacyMinusNewtonVelocityRmsMS: number;
    v2MinusLegacyPositionRmsM: number;
    v2MinusLegacyVelocityRmsMS: number;
    finite: true;
  }>;
  effectIsolation: Readonly<{
    method: "independent-trajectory-integrations";
    twoPnPositionRmsM: number;
    twoPnVelocityRmsMS: number;
    lenseThirringPositionRmsM: number;
    lenseThirringVelocityRmsMS: number;
    combinedPositionRmsM: number;
    combinedVelocityRmsMS: number;
    additivityResidualPositionRmsM: number;
    additivityResidualVelocityRmsMS: number;
    finite: true;
  }>;
  deterministic: true;
  callerStateMutated: false;
  liveStateMutated: false;
  workerStateMutated: false;
  scientificPayloadWriteback: false;
  promotion: "not-a-promotion-decision";
  resultSha256: string;
}>;

type MutableState = {
  positionM: Float64Array;
  velocityMS: Float64Array;
  massKg: Float64Array;
};

type IntegrationResult = {
  state: MutableState;
  stepSeconds: number;
  stepCount: number;
};

type AccelerationWorkspace = {
  newton: Float64Array;
  potential: Float64Array;
  base: Float64Array;
  v2: Float64Array;
};

type Rk4Workspace = AccelerationWorkspace & {
  positionTemporary: Float64Array;
  velocityTemporary: Float64Array;
  kPosition: readonly [Float64Array, Float64Array, Float64Array, Float64Array];
  kVelocity: readonly [Float64Array, Float64Array, Float64Array, Float64Array];
};

const SHA256 = /^[a-f0-9]{64}$/;
const INVERSE_C2 = 1 / (C_LIGHT * C_LIGHT);
const KERNELS = Object.freeze([
  "newton",
  "legacy-eih-1pn",
  "eih-1pn-plus-v2-shadow",
] as const satisfies readonly RelativityTrajectoryKernelV3[]);

function finiteArray(value: ArrayLike<number>, expectedLength: number, label: string): Float64Array {
  if (!value || value.length !== expectedLength) throw new RangeError(`trajectory-reference-${label}-length`);
  const output = new Float64Array(expectedLength);
  for (let index = 0; index < expectedLength; index += 1) {
    const entry = Number(value[index]);
    if (!Number.isFinite(entry)) throw new RangeError(`trajectory-reference-${label}-finite`);
    output[index] = entry;
  }
  return output;
}

function normalizeInput(input: RelativityTrajectoryReferenceInputV3): {
  bodyIds: string[];
  initial: MutableState;
  sampleId: string;
  durationSeconds: number;
  coarseStepSeconds: number;
  config: RelativityForceModelV2Config;
} {
  if (!input || typeof input !== "object" || !Array.isArray(input.bodyIds) || input.bodyIds.length < 2) {
    throw new TypeError("trajectory-reference-input");
  }
  const bodyIds = input.bodyIds.map((bodyId) => {
    if (typeof bodyId !== "string" || bodyId.length === 0) throw new TypeError("trajectory-reference-body-id");
    return bodyId;
  });
  if (new Set(bodyIds).size !== bodyIds.length) throw new RangeError("trajectory-reference-body-id-duplicate");
  const sample = input.initialState;
  if (!sample || typeof sample.sampleId !== "string" || sample.sampleId.length === 0) {
    throw new TypeError("trajectory-reference-sample-id");
  }
  const width = 3 * bodyIds.length;
  const initial = {
    positionM: finiteArray(sample.positionM, width, "position"),
    velocityMS: finiteArray(sample.velocityMS, width, "velocity"),
    massKg: finiteArray(sample.massKg, bodyIds.length, "mass"),
  };
  for (const mass of initial.massKg) if (!(mass > 0)) throw new RangeError("trajectory-reference-mass-positive");
  if (!(Number.isFinite(input.durationSeconds) && input.durationSeconds > 0)) throw new RangeError("trajectory-reference-duration");
  if (!(Number.isFinite(input.coarseStepSeconds) && input.coarseStepSeconds > 0)) throw new RangeError("trajectory-reference-step");
  const coarseSteps = input.durationSeconds / input.coarseStepSeconds;
  if (!Number.isInteger(coarseSteps) || coarseSteps < 2) throw new RangeError("trajectory-reference-integral-step-count");
  const source = input.config ?? DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG;
  if (source.mode !== "shadow" || source.coordinateGauge !== "harmonic" || source.timeScale !== "TDB-compatible-SI-shadow" || source.softeningMeters2 !== 0) {
    throw new RangeError("trajectory-reference-config-boundary");
  }
  if (!Number.isInteger(source.centralBodyIndex) || source.centralBodyIndex < 0 || source.centralBodyIndex >= bodyIds.length) {
    throw new RangeError("trajectory-reference-central-body");
  }
  const config: RelativityForceModelV2Config = {
    ...source,
    solarSpinAxisJ2000: [...source.solarSpinAxisJ2000],
  };
  return {
    bodyIds,
    initial,
    sampleId: sample.sampleId,
    durationSeconds: input.durationSeconds,
    coarseStepSeconds: input.coarseStepSeconds,
    config,
  };
}

function cloneState(state: MutableState): MutableState {
  return {
    positionM: state.positionM.slice(),
    velocityMS: state.velocityMS.slice(),
    massKg: state.massKg.slice(),
  };
}

function createRk4Workspace(bodyCount: number): Rk4Workspace {
  const width = 3 * bodyCount;
  const vector = () => new Float64Array(width);
  return {
    newton: vector(),
    potential: new Float64Array(bodyCount),
    base: vector(),
    v2: vector(),
    positionTemporary: vector(),
    velocityTemporary: vector(),
    kPosition: [vector(), vector(), vector(), vector()],
    kVelocity: [vector(), vector(), vector(), vector()],
  };
}

function acceleration(
  kernel: RelativityTrajectoryKernelV3,
  positionM: Float64Array,
  velocityMS: Float64Array,
  massKg: Float64Array,
  config: RelativityForceModelV2Config,
  workspace: AccelerationWorkspace,
  output: Float64Array,
): void {
  const bodyCount = massKg.length;
  calculateAcceleration(
    positionM,
    velocityMS,
    massKg,
    bodyCount,
    G_SI,
    kernel === "newton" ? 0 : INVERSE_C2,
    0,
    workspace.newton,
    workspace.potential,
    workspace.base,
  );
  output.set(workspace.base);
  if (kernel !== "eih-1pn-plus-v2-shadow") return;
  calculateRelativityForceModelV2Delta(positionM, velocityMS, massKg, bodyCount, workspace.v2, config);
  for (let index = 0; index < output.length; index += 1) output[index] += workspace.v2[index]!;
}

function evaluateStage(
  kernel: RelativityTrajectoryKernelV3,
  positionM: Float64Array,
  velocityMS: Float64Array,
  massKg: Float64Array,
  config: RelativityForceModelV2Config,
  workspace: Rk4Workspace,
  stage: 0 | 1 | 2 | 3,
): void {
  const kPosition = workspace.kPosition[stage];
  const kVelocity = workspace.kVelocity[stage];
  acceleration(kernel, positionM, velocityMS, massKg, config, workspace, kVelocity);
  kPosition.set(velocityMS);
}

function stageState(
  state: MutableState,
  workspace: Rk4Workspace,
  stage: 0 | 1 | 2,
  dt: number,
  scale: number,
): void {
  const kPosition = workspace.kPosition[stage];
  const kVelocity = workspace.kVelocity[stage];
  const h = dt * scale;
  for (let index = 0; index < state.positionM.length; index += 1) {
    workspace.positionTemporary[index] = state.positionM[index]! + h * kPosition[index]!;
    workspace.velocityTemporary[index] = state.velocityMS[index]! + h * kVelocity[index]!;
  }
}

function rk4Step(
  state: MutableState,
  kernel: RelativityTrajectoryKernelV3,
  dt: number,
  config: RelativityForceModelV2Config,
  workspace: Rk4Workspace,
): void {
  evaluateStage(kernel, state.positionM, state.velocityMS, state.massKg, config, workspace, 0);
  stageState(state, workspace, 0, dt, 0.5);
  evaluateStage(kernel, workspace.positionTemporary, workspace.velocityTemporary, state.massKg, config, workspace, 1);
  stageState(state, workspace, 1, dt, 0.5);
  evaluateStage(kernel, workspace.positionTemporary, workspace.velocityTemporary, state.massKg, config, workspace, 2);
  stageState(state, workspace, 2, dt, 1);
  evaluateStage(kernel, workspace.positionTemporary, workspace.velocityTemporary, state.massKg, config, workspace, 3);
  const h6 = dt / 6;
  for (let index = 0; index < state.positionM.length; index += 1) {
    state.positionM[index] += h6 * (
      workspace.kPosition[0][index]!
      + 2 * workspace.kPosition[1][index]!
      + 2 * workspace.kPosition[2][index]!
      + workspace.kPosition[3][index]!
    );
    state.velocityMS[index] += h6 * (
      workspace.kVelocity[0][index]!
      + 2 * workspace.kVelocity[1][index]!
      + 2 * workspace.kVelocity[2][index]!
      + workspace.kVelocity[3][index]!
    );
  }
}

function integrate(
  initial: MutableState,
  kernel: RelativityTrajectoryKernelV3,
  stepSeconds: number,
  stepCount: number,
  config: RelativityForceModelV2Config,
): IntegrationResult {
  const state = cloneState(initial);
  const workspace = createRk4Workspace(state.massKg.length);
  for (let step = 0; step < stepCount; step += 1) rk4Step(state, kernel, stepSeconds, config, workspace);
  assertFiniteState(state, kernel);
  return { state, stepSeconds, stepCount };
}

function assertFiniteState(state: MutableState, label: string): void {
  for (const value of state.positionM) if (!Number.isFinite(value)) throw new Error(`trajectory-reference-${label}-position-non-finite`);
  for (const value of state.velocityMS) if (!Number.isFinite(value)) throw new Error(`trajectory-reference-${label}-velocity-non-finite`);
}

function rmsDifference(left: Float64Array, right: Float64Array): number {
  if (left.length !== right.length) throw new RangeError("trajectory-reference-rms-length");
  let sum = 0;
  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index]! - right[index]!;
    sum += delta * delta;
  }
  return Math.sqrt(sum / Math.max(left.length, 1));
}

function rmsNorm(values: Float64Array): number {
  let sum = 0;
  for (const value of values) sum += value * value;
  return Math.sqrt(sum / Math.max(values.length, 1));
}

function observedOrder(coarseMedium: number, mediumFine: number): number | null {
  if (!(coarseMedium > 0 && mediumFine > 0)) return null;
  const order = Math.log2(coarseMedium / mediumFine);
  return Number.isFinite(order) ? order : null;
}

function convergenceRow(
  kernel: RelativityTrajectoryKernelV3,
  initial: MutableState,
  durationSeconds: number,
  coarseStepSeconds: number,
  config: RelativityForceModelV2Config,
): { row: RelativityTrajectoryConvergenceRowV3; fine: IntegrationResult } {
  const coarseStepCount = durationSeconds / coarseStepSeconds;
  const coarse = integrate(initial, kernel, coarseStepSeconds, coarseStepCount, config);
  const medium = integrate(initial, kernel, coarseStepSeconds / 2, coarseStepCount * 2, config);
  const fine = integrate(initial, kernel, coarseStepSeconds / 4, coarseStepCount * 4, config);
  const coarseMediumPositionRmsM = rmsDifference(coarse.state.positionM, medium.state.positionM);
  const mediumFinePositionRmsM = rmsDifference(medium.state.positionM, fine.state.positionM);
  const coarseMediumVelocityRmsMS = rmsDifference(coarse.state.velocityMS, medium.state.velocityMS);
  const mediumFineVelocityRmsMS = rmsDifference(medium.state.velocityMS, fine.state.velocityMS);
  const observedPositionOrder = observedOrder(coarseMediumPositionRmsM, mediumFinePositionRmsM);
  const observedVelocityOrder = observedOrder(coarseMediumVelocityRmsMS, mediumFineVelocityRmsMS);
  const qualified = observedPositionOrder !== null
    && observedVelocityOrder !== null
    && observedPositionOrder >= 3.5
    && observedVelocityOrder >= 3.5;
  return {
    row: {
      kernel,
      coarseStepSeconds,
      mediumStepSeconds: coarseStepSeconds / 2,
      fineStepSeconds: coarseStepSeconds / 4,
      coarseStepCount,
      mediumStepCount: coarseStepCount * 2,
      fineStepCount: coarseStepCount * 4,
      coarseMediumPositionRmsM,
      mediumFinePositionRmsM,
      coarseMediumVelocityRmsMS,
      mediumFineVelocityRmsMS,
      observedPositionOrder,
      observedVelocityOrder,
      expectedMethodOrder: 4,
      orderFloor: 3.5,
      qualified,
      finite: true,
      fineFinalState: {
        positionM: Array.from(fine.state.positionM),
        velocityMS: Array.from(fine.state.velocityMS),
      },
    },
    fine,
  };
}

function reverseTimeRow(
  kernel: RelativityTrajectoryKernelV3,
  initial: MutableState,
  forward: IntegrationResult,
  config: RelativityForceModelV2Config,
): RelativityTrajectoryReverseTimeRowV3 {
  const reversedInitial = cloneState(forward.state);
  for (let index = 0; index < reversedInitial.velocityMS.length; index += 1) {
    reversedInitial.velocityMS[index] = -reversedInitial.velocityMS[index]!;
  }
  const reverseSpin = kernel === "eih-1pn-plus-v2-shadow";
  const backwardConfig: RelativityForceModelV2Config = reverseSpin
    ? { ...config, solarSpinAngularMomentumKgM2S: -config.solarSpinAngularMomentumKgM2S }
    : config;
  const returned = integrate(
    reversedInitial,
    kernel,
    forward.stepSeconds,
    forward.stepCount,
    backwardConfig,
  ).state;
  for (let index = 0; index < returned.velocityMS.length; index += 1) returned.velocityMS[index] = -returned.velocityMS[index]!;
  const positionRmsErrorM = rmsDifference(returned.positionM, initial.positionM);
  const velocityRmsErrorMS = rmsDifference(returned.velocityMS, initial.velocityMS);
  const positionRelativeError = positionRmsErrorM / Math.max(rmsNorm(initial.positionM), 1);
  const velocityRelativeError = velocityRmsErrorMS / Math.max(rmsNorm(initial.velocityMS), 1);
  return {
    kernel,
    stepSeconds: forward.stepSeconds,
    stepCountEachDirection: forward.stepCount,
    positionRmsErrorM,
    velocityRmsErrorMS,
    positionRelativeError,
    velocityRelativeError,
    solarSpinAngularMomentumReversedForBackwardLeg: reverseSpin,
    relativeErrorLimit: 1e-9,
    qualified: positionRelativeError < 1e-9 && velocityRelativeError < 1e-9,
    finite: true,
  };
}

function difference(left: Float64Array, right: Float64Array): Float64Array {
  const output = new Float64Array(left.length);
  for (let index = 0; index < output.length; index += 1) output[index] = left[index]! - right[index]!;
  return output;
}

function additivityResidual(
  combined: Float64Array,
  twoPn: Float64Array,
  lenseThirring: Float64Array,
  legacy: Float64Array,
): Float64Array {
  const output = new Float64Array(combined.length);
  for (let index = 0; index < output.length; index += 1) {
    output[index] = combined[index]! - twoPn[index]! - lenseThirring[index]! + legacy[index]!;
  }
  return output;
}

function vector(values: Float64Array, bodyIndex: number): RelativityReferenceVectorV3 {
  const offset = 3 * bodyIndex;
  return [values[offset]!, values[offset + 1]!, values[offset + 2]!];
}

function vectorNorm(values: RelativityReferenceVectorV3): number {
  return Math.hypot(values[0], values[1], values[2]);
}

function unsigned(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(unsigned);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== "resultSha256")
        .map(([key, entry]) => [key, unsigned(entry)]),
    );
  }
  return value;
}

export function canonicalRelativityTrajectoryReferenceV3(value: unknown): string {
  return JSON.stringify(canonicalizeRelativityReferenceRunnerV3(unsigned(value)));
}

export function sha256RelativityTrajectoryReferenceV3(value: unknown): string {
  return sha256Utf8HexV566(canonicalRelativityTrajectoryReferenceV3(value));
}

export function runRelativityTrajectoryReferenceV3(
  input: RelativityTrajectoryReferenceInputV3,
): RelativityTrajectoryReferenceRunV3 {
  const normalized = normalizeInput(input);
  const convergenceRuns = KERNELS.map((kernel) => convergenceRow(
    kernel,
    normalized.initial,
    normalized.durationSeconds,
    normalized.coarseStepSeconds,
    normalized.config,
  ));
  const finalByKernel = Object.fromEntries(
    convergenceRuns.map((run) => [run.row.kernel, run.fine]),
  ) as Record<RelativityTrajectoryKernelV3, IntegrationResult>;
  const convergenceRows = convergenceRuns.map((run) => run.row);
  const reverseRows = KERNELS.map((kernel) => reverseTimeRow(
    kernel,
    normalized.initial,
    finalByKernel[kernel],
    normalized.config,
  ));
  const newton = finalByKernel.newton.state;
  const legacy = finalByKernel["legacy-eih-1pn"].state;
  const combined = finalByKernel["eih-1pn-plus-v2-shadow"].state;
  const legacyMinusNewtonPosition = difference(legacy.positionM, newton.positionM);
  const legacyMinusNewtonVelocity = difference(legacy.velocityMS, newton.velocityMS);
  const v2MinusLegacyPosition = difference(combined.positionM, legacy.positionM);
  const v2MinusLegacyVelocity = difference(combined.velocityMS, legacy.velocityMS);
  const perBody: RelativityTrajectoryPerBodyRowV3[] = normalized.bodyIds.map((bodyId, bodyIndex) => {
    const legacyPosition = vector(legacyMinusNewtonPosition, bodyIndex);
    const legacyVelocity = vector(legacyMinusNewtonVelocity, bodyIndex);
    const v2Position = vector(v2MinusLegacyPosition, bodyIndex);
    const v2Velocity = vector(v2MinusLegacyVelocity, bodyIndex);
    return {
      bodyId,
      bodyIndex,
      legacyMinusNewtonPositionM: legacyPosition,
      legacyMinusNewtonVelocityMS: legacyVelocity,
      v2MinusLegacyPositionM: v2Position,
      v2MinusLegacyVelocityMS: v2Velocity,
      legacyMinusNewtonPositionNormM: vectorNorm(legacyPosition),
      legacyMinusNewtonVelocityNormMS: vectorNorm(legacyVelocity),
      v2MinusLegacyPositionNormM: vectorNorm(v2Position),
      v2MinusLegacyVelocityNormMS: vectorNorm(v2Velocity),
      finite: true,
    };
  });
  const fineStepSeconds = normalized.coarseStepSeconds / 4;
  const fineStepCount = normalized.durationSeconds / fineStepSeconds;
  const twoPnConfig = { ...normalized.config, includeSolar2PnMonopole: true, includeSolarLenseThirring: false };
  const ltConfig = { ...normalized.config, includeSolar2PnMonopole: false, includeSolarLenseThirring: true };
  const twoPn = integrate(normalized.initial, "eih-1pn-plus-v2-shadow", fineStepSeconds, fineStepCount, twoPnConfig).state;
  const lenseThirring = integrate(normalized.initial, "eih-1pn-plus-v2-shadow", fineStepSeconds, fineStepCount, ltConfig).state;
  const twoPnPosition = difference(twoPn.positionM, legacy.positionM);
  const twoPnVelocity = difference(twoPn.velocityMS, legacy.velocityMS);
  const ltPosition = difference(lenseThirring.positionM, legacy.positionM);
  const ltVelocity = difference(lenseThirring.velocityMS, legacy.velocityMS);
  const unsignedRun = {
    version: RELATIVITY_TRAJECTORY_REFERENCE_V3_VERSION,
    boundary: RELATIVITY_TRAJECTORY_REFERENCE_V3_BOUNDARY,
    mode: "shadow-read-only" as const,
    integrator: "classic-rk4-fixed-step" as const,
    coordinateGauge: "harmonic" as const,
    timeScale: "TDB-compatible-SI-shadow" as const,
    bodyIds: normalized.bodyIds,
    bodyCount: normalized.bodyIds.length,
    initialSampleId: normalized.sampleId,
    durationSeconds: normalized.durationSeconds,
    convergence: {
      status: "evaluated" as const,
      method: "three-level-richardson-observed-order" as const,
      rows: convergenceRows,
      allQualified: convergenceRows.every((row) => row.qualified),
    },
    reverseTimeRoundTrip: {
      status: "evaluated" as const,
      method: "forward-velocity-reversal-backward-round-trip" as const,
      rows: reverseRows,
      allQualified: reverseRows.every((row) => row.qualified),
      fullTimeIntegration: true as const,
    },
    perBody,
    aggregate: {
      legacyMinusNewtonPositionRmsM: rmsNorm(legacyMinusNewtonPosition),
      legacyMinusNewtonVelocityRmsMS: rmsNorm(legacyMinusNewtonVelocity),
      v2MinusLegacyPositionRmsM: rmsNorm(v2MinusLegacyPosition),
      v2MinusLegacyVelocityRmsMS: rmsNorm(v2MinusLegacyVelocity),
      finite: true as const,
    },
    effectIsolation: {
      method: "independent-trajectory-integrations" as const,
      twoPnPositionRmsM: rmsNorm(twoPnPosition),
      twoPnVelocityRmsMS: rmsNorm(twoPnVelocity),
      lenseThirringPositionRmsM: rmsNorm(ltPosition),
      lenseThirringVelocityRmsMS: rmsNorm(ltVelocity),
      combinedPositionRmsM: rmsNorm(v2MinusLegacyPosition),
      combinedVelocityRmsMS: rmsNorm(v2MinusLegacyVelocity),
      additivityResidualPositionRmsM: rmsNorm(additivityResidual(combined.positionM, twoPn.positionM, lenseThirring.positionM, legacy.positionM)),
      additivityResidualVelocityRmsMS: rmsNorm(additivityResidual(combined.velocityMS, twoPn.velocityMS, lenseThirring.velocityMS, legacy.velocityMS)),
      finite: true as const,
    },
    deterministic: true as const,
    callerStateMutated: false as const,
    liveStateMutated: false as const,
    workerStateMutated: false as const,
    scientificPayloadWriteback: false as const,
    promotion: "not-a-promotion-decision" as const,
  };
  const resultSha256 = sha256RelativityTrajectoryReferenceV3(unsignedRun);
  if (!SHA256.test(resultSha256)) throw new Error("trajectory-reference-sha");
  return Object.freeze({ ...unsignedRun, resultSha256 });
}
