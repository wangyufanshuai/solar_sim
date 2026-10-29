import {
  DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG,
  RELATIVITY_FORCE_MODEL_V2_VERSION,
  calculateRelativityForceModelV2Delta,
  compareRelativityForceModelsShadow,
  type RelativityForceModelV2Config,
  type RelativityShadowComparison,
} from "./relativityForceModelV2";
import { sha256Utf8HexV566 } from "./sha256BrowserV566";

/**
 * A small, deliberately offline reference runner around the already audited
 * V2 force-model APIs.  This module is a diagnostics/evidence lane only: it
 * does not integrate a trajectory, call a worker, or mutate a live state.
 */
export const RELATIVITY_REFERENCE_RUNNER_V3_VERSION =
  "v3-relativity-reference-runner-shadow-read-only" as const;

export const RELATIVITY_REFERENCE_RUNNER_V3_BOUNDARY =
  "independent-v2-reference-runner-no-live-or-worker-physics-mutation" as const;

export type RelativityReferenceVectorV3 = readonly [number, number, number];

export type RelativityReferenceStateSampleV3 = Readonly<{
  /** Stable caller-provided label. It is part of the deterministic identity. */
  sampleId: string;
  /** SI barycentric positions, packed as x/y/z per body. */
  positionM: ArrayLike<number>;
  /** SI barycentric velocities, packed as vx/vy/vz per body. */
  velocityMS: ArrayLike<number>;
  /** Body masses in kilograms. */
  massKg: ArrayLike<number>;
}>;

export type RelativityReferenceConvergenceInputV3 = Readonly<{
  /** Coarse and fine are paired by index (or by sampleId when labels match). */
  coarse: RelativityReferenceStateSampleV3 | readonly RelativityReferenceStateSampleV3[];
  fine: RelativityReferenceStateSampleV3 | readonly RelativityReferenceStateSampleV3[];
  coarseStepLabel?: string;
  fineStepLabel?: string;
}>;

export type RelativityReferenceReverseTimeInputV3 = Readonly<{
  /** Optional alternate samples. By default the primary samples are used. */
  samples?: readonly RelativityReferenceStateSampleV3[];
  /** Only -1 is supported; a different sign would be a different experiment. */
  velocitySign?: -1;
}>;

export type RelativityReferenceRunnerInputV3 = Readonly<{
  bodyIds: readonly string[];
  samples: readonly RelativityReferenceStateSampleV3[];
  config?: RelativityForceModelV2Config;
  convergence?: RelativityReferenceConvergenceInputV3;
  /** `false` opts out of the instantaneous velocity-reversal diagnostic. */
  reverseTime?: boolean | RelativityReferenceReverseTimeInputV3;
}>;

export type RelativityReferencePerBodyResultV3 = Readonly<{
  sampleId: string;
  bodyId: string;
  bodyIndex: number;
  /** Isolated solar 2PN monopole acceleration contribution. */
  twoPnDeltaMS2: RelativityReferenceVectorV3;
  /** Isolated solar Lense–Thirring acceleration contribution. */
  lenseThirringDeltaMS2: RelativityReferenceVectorV3;
  /** Combined V2 (2PN + Lense–Thirring) acceleration contribution. */
  combinedV2DeltaMS2: RelativityReferenceVectorV3;
  twoPnDeltaNormMS2: number;
  lenseThirringDeltaNormMS2: number;
  combinedV2DeltaNormMS2: number;
  finite: true;
}>;

export type RelativityReferenceAggregateResultV3 = Readonly<{
  sampleId: string;
  bodyCount: number;
  /** Values returned by compareRelativityForceModelsShadow. */
  newtonAccelerationRmsMS2: number;
  eih1PnDeltaRmsMS2: number;
  solar2PnAndLtDeltaRmsMS2: number;
  combinedV2DeltaRmsMS2: number;
  /** RMS of the isolated/effect vectors over all packed components. */
  twoPnDeltaRmsMS2: number;
  lenseThirringDeltaRmsMS2: number;
  v2OnlyDeltaRmsMS2: number;
  maxTwoPnDeltaNormMS2: number;
  maxLenseThirringDeltaNormMS2: number;
  maxCombinedV2DeltaNormMS2: number;
  comparison: RelativityShadowComparison;
  finite: true;
}>;

export type RelativityReferenceEffectIsolationSampleV3 = Readonly<{
  sampleId: string;
  twoPnDeltaRmsMS2: number;
  lenseThirringDeltaRmsMS2: number;
  combinedV2DeltaRmsMS2: number;
  /** Non-additivity residual; it should be numerically close to zero. */
  additivityResidualRmsMS2: number;
  /** The V2 API was called separately with each effect flag. */
  isolatedWithV2Apis: true;
  finite: true;
}>;

export type RelativityReferenceEffectIsolationResultV3 = Readonly<{
  status: "complete";
  samples: readonly RelativityReferenceEffectIsolationSampleV3[];
  sampleCount: number;
  twoPnDeltaRmsMS2: number;
  lenseThirringDeltaRmsMS2: number;
  combinedV2DeltaRmsMS2: number;
  additivityResidualRmsMS2: number;
  isolatedWithV2Apis: true;
  liveStateMutated: false;
}>;

export type RelativityReferenceConvergencePairV3 = Readonly<{
  sampleId: string;
  coarseSampleId: string;
  fineSampleId: string;
  coarseCombinedV2DeltaRmsMS2: number;
  fineCombinedV2DeltaRmsMS2: number;
  absoluteDifferenceMS2: number;
  relativeDifference: number;
  finite: true;
}>;

export type RelativityReferenceConvergenceResultV3 = Readonly<{
  status: "evaluated" | "not-requested";
  method: "paired-instantaneous-v2-evaluations";
  pairCount: number;
  pairs: readonly RelativityReferenceConvergencePairV3[];
  maxAbsoluteDifferenceMS2: number;
  rmsAbsoluteDifferenceMS2: number;
  /** No order is inferred because this runner does not invent a time integrator. */
  observedOrder: number | null;
  coarseStepLabel: string | null;
  fineStepLabel: string | null;
  liveStateMutated: false;
}>;

export type RelativityReferenceReverseTimeSampleV3 = Readonly<{
  sampleId: string;
  originalCombinedV2DeltaRmsMS2: number;
  reversedCombinedV2DeltaRmsMS2: number;
  twoPnParityResidualRmsMS2: number;
  lenseThirringOddParityResidualRmsMS2: number;
  finite: true;
}>;

export type RelativityReferenceReverseTimeResultV3 = Readonly<{
  status: "evaluated" | "not-requested";
  method: "instantaneous-velocity-sign-diagnostic";
  velocitySign: -1;
  samples: readonly RelativityReferenceReverseTimeSampleV3[];
  sampleCount: number;
  maxTwoPnParityResidualRmsMS2: number;
  maxLenseThirringOddParityResidualRmsMS2: number;
  /** This is not a forward/backward trajectory integration claim. */
  fullTimeIntegration: false;
  liveStateMutated: false;
}>;

export type RelativityReferenceRunV3 = Readonly<{
  version: typeof RELATIVITY_REFERENCE_RUNNER_V3_VERSION;
  forceModelVersion: typeof RELATIVITY_FORCE_MODEL_V2_VERSION;
  mode: "shadow-read-only";
  bodyIds: readonly string[];
  bodyCount: number;
  sampleCount: number;
  perBody: readonly RelativityReferencePerBodyResultV3[];
  aggregate: readonly RelativityReferenceAggregateResultV3[];
  /** Singular aliases make the contract convenient for one-sample callers. */
  perBodyResults: readonly RelativityReferencePerBodyResultV3[];
  aggregateResults: readonly RelativityReferenceAggregateResultV3[];
  effectIsolation: RelativityReferenceEffectIsolationResultV3;
  convergence: RelativityReferenceConvergenceResultV3;
  reverseTime: RelativityReferenceReverseTimeResultV3;
  deterministic: true;
  liveStateMutated: false;
  promotion: "not-a-promotion-decision";
  boundary: typeof RELATIVITY_REFERENCE_RUNNER_V3_BOUNDARY;
  resultSha256: string;
}>;

type NormalizedSample = {
  sampleId: string;
  positionM: Float64Array;
  velocityMS: Float64Array;
  massKg: Float64Array;
};

type EffectVectors = {
  twoPn: Float64Array;
  lenseThirring: Float64Array;
  combined: Float64Array;
};

const SHA256 = /^[a-f0-9]{64}$/;

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function canonicalNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error("v3-reference-canonical-non-finite-number");
  if (Object.is(value, -0) || value === 0) return "0.0000000000000000e+0";
  const parts = value.toExponential(16).split("e");
  const exponent = Number(parts[1]);
  return `${parts[0]}e${exponent >= 0 ? "+" : ""}${exponent}`;
}

/** Recursively canonicalize JSON-compatible values, including typed arrays. */
export function canonicalizeRelativityReferenceRunnerV3(value: unknown): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") return canonicalNumber(value);
  if (typeof value === "undefined") throw new Error("v3-reference-canonical-undefined");
  if (Array.isArray(value)) return value.map(canonicalizeRelativityReferenceRunnerV3);
  if (ArrayBuffer.isView(value)) {
    return Array.from(value as unknown as ArrayLike<number>, (entry) => canonicalizeRelativityReferenceRunnerV3(entry));
  }
  if (!isObject(value)) throw new Error("v3-reference-canonical-value");
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalizeRelativityReferenceRunnerV3(value[key])]),
  );
}

function unsignedRun(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(unsignedRun);
  if (ArrayBuffer.isView(value)) return Array.from(value as unknown as ArrayLike<number>, unsignedRun);
  if (isObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => key !== "resultSha256")
        .map((key) => [key, unsignedRun(value[key])]),
    );
  }
  return value;
}

/** Canonical unsigned payload used to derive `resultSha256`. */
export function canonicalRelativityReferenceRunV3(value: unknown): string {
  return JSON.stringify(canonicalizeRelativityReferenceRunnerV3(unsignedRun(value)));
}

/** Alias with the longer name used by a few evidence contracts. */
export const canonicalRelativityReferenceRunnerV3 = canonicalRelativityReferenceRunV3;

export function sha256RelativityReferenceRunV3(value: unknown): string {
  return sha256Utf8HexV566(canonicalRelativityReferenceRunV3(value));
}

function cloneNumericArray(value: ArrayLike<number>, label: string): Float64Array {
  if (value == null || typeof value.length !== "number" || !Number.isInteger(value.length) || value.length < 0) {
    throw new TypeError(`v3-reference-${label}-array`);
  }
  const output = new Float64Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    const entry = Number(value[index]);
    if (!Number.isFinite(entry)) throw new RangeError(`v3-reference-${label}-non-finite`);
    output[index] = entry;
  }
  return output;
}

function normalizeSample(
  sample: RelativityReferenceStateSampleV3,
  bodyCount: number,
  ordinal: number,
): NormalizedSample {
  if (!isObject(sample) || typeof sample.sampleId !== "string" || sample.sampleId.trim().length === 0) {
    throw new TypeError(`v3-reference-sample-${ordinal}-id`);
  }
  const positionM = cloneNumericArray(sample.positionM, "position");
  const velocityMS = cloneNumericArray(sample.velocityMS, "velocity");
  const massKg = cloneNumericArray(sample.massKg, "mass");
  if (positionM.length !== 3 * bodyCount) throw new RangeError(`v3-reference-sample-${sample.sampleId}-position-length`);
  if (velocityMS.length !== 3 * bodyCount) throw new RangeError(`v3-reference-sample-${sample.sampleId}-velocity-length`);
  if (massKg.length !== bodyCount) throw new RangeError(`v3-reference-sample-${sample.sampleId}-mass-length`);
  for (let index = 0; index < massKg.length; index += 1) {
    if (!(massKg[index]! > 0)) throw new RangeError(`v3-reference-sample-${sample.sampleId}-mass-positive`);
  }
  return { sampleId: sample.sampleId, positionM, velocityMS, massKg };
}

function validateBodyIds(bodyIds: readonly string[]): string[] {
  if (!Array.isArray(bodyIds) || bodyIds.length === 0) throw new RangeError("v3-reference-body-ids-empty");
  const normalized = bodyIds.map((id) => {
    if (typeof id !== "string" || id.trim().length === 0) throw new TypeError("v3-reference-body-id");
    return id;
  });
  if (new Set(normalized).size !== normalized.length) throw new RangeError("v3-reference-body-ids-duplicate");
  return normalized;
}

function normalizeConfig(config: RelativityForceModelV2Config | undefined, bodyCount: number): RelativityForceModelV2Config {
  const source = config ?? DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG;
  const normalized: RelativityForceModelV2Config = {
    ...source,
    solarSpinAxisJ2000: [
      source.solarSpinAxisJ2000[0],
      source.solarSpinAxisJ2000[1],
      source.solarSpinAxisJ2000[2],
    ],
  };
  if (normalized.mode !== "shadow") throw new RangeError("v3-reference-config-mode");
  if (!Number.isInteger(normalized.centralBodyIndex) || normalized.centralBodyIndex < 0 || normalized.centralBodyIndex >= bodyCount) {
    throw new RangeError("v3-reference-config-central-body");
  }
  if (!finiteNumber(normalized.solarGmM3S2) || normalized.solarGmM3S2 <= 0) throw new RangeError("v3-reference-config-gm");
  if (!finiteNumber(normalized.solarSpinAngularMomentumKgM2S)) throw new RangeError("v3-reference-config-spin");
  if (!Array.isArray(normalized.solarSpinAxisJ2000) || normalized.solarSpinAxisJ2000.length !== 3 || normalized.solarSpinAxisJ2000.some((value) => !finiteNumber(value))) {
    throw new RangeError("v3-reference-config-spin-axis");
  }
  if (typeof normalized.includeSolar2PnMonopole !== "boolean" || typeof normalized.includeSolarLenseThirring !== "boolean" || typeof normalized.preserveLinearMomentum !== "boolean") {
    throw new RangeError("v3-reference-config-flags");
  }
  if (normalized.coordinateGauge !== "harmonic" || normalized.timeScale !== "TDB-compatible-SI-shadow" || normalized.softeningMeters2 !== 0) {
    throw new RangeError("v3-reference-config-coordinate-contract");
  }
  return normalized;
}

function effectConfig(config: RelativityForceModelV2Config, twoPn: boolean, lt: boolean): RelativityForceModelV2Config {
  return { ...config, includeSolar2PnMonopole: twoPn, includeSolarLenseThirring: lt };
}

function assertFiniteOutput(values: Float64Array, label: string): void {
  for (const value of values) if (!Number.isFinite(value)) throw new Error(`v3-reference-${label}-non-finite-output`);
}

function vector(values: Float64Array, offset: number): RelativityReferenceVectorV3 {
  return [values[offset]!, values[offset + 1]!, values[offset + 2]!];
}

function norm(values: Float64Array, offset: number): number {
  return Math.hypot(values[offset]!, values[offset + 1]!, values[offset + 2]!);
}

function rms(values: Float64Array): number {
  let sum = 0;
  for (const value of values) sum += value * value;
  return Math.sqrt(sum / Math.max(1, values.length));
}

function rmsDifference(a: Float64Array, b: Float64Array): number {
  if (a.length !== b.length) throw new RangeError("v3-reference-rms-length");
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) {
    const delta = a[index]! - b[index]!;
    sum += delta * delta;
  }
  return Math.sqrt(sum / Math.max(1, a.length));
}

function maxNorm(values: Float64Array): number {
  let max = 0;
  for (let index = 0; index < values.length; index += 3) max = Math.max(max, norm(values, index));
  return max;
}

function evaluateEffects(sample: NormalizedSample, config: RelativityForceModelV2Config): EffectVectors {
  const width = sample.positionM.length;
  const twoPn = new Float64Array(width);
  const lenseThirring = new Float64Array(width);
  const combined = new Float64Array(width);
  calculateRelativityForceModelV2Delta(sample.positionM, sample.velocityMS, sample.massKg, sample.massKg.length, twoPn, effectConfig(config, true, false));
  calculateRelativityForceModelV2Delta(sample.positionM, sample.velocityMS, sample.massKg, sample.massKg.length, lenseThirring, effectConfig(config, false, true));
  calculateRelativityForceModelV2Delta(sample.positionM, sample.velocityMS, sample.massKg, sample.massKg.length, combined, config);
  assertFiniteOutput(twoPn, "2pn");
  assertFiniteOutput(lenseThirring, "lense-thirring");
  assertFiniteOutput(combined, "combined");
  return { twoPn, lenseThirring, combined };
}

function aggregateComparison(
  sample: NormalizedSample,
  config: RelativityForceModelV2Config,
  effects: EffectVectors,
): RelativityReferenceAggregateResultV3 {
  const comparison = compareRelativityForceModelsShadow(sample.positionM, sample.velocityMS, sample.massKg, sample.massKg.length, config);
  const values = [comparison.newtonAccelerationRmsMS2, comparison.eih1PnDeltaRmsMS2, comparison.solar2PnAndLtDeltaRmsMS2, comparison.combinedV2DeltaRmsMS2, rms(effects.twoPn), rms(effects.lenseThirring), rms(effects.combined)];
  if (!values.every(Number.isFinite)) throw new Error(`v3-reference-${sample.sampleId}-comparison-non-finite`);
  return {
    sampleId: sample.sampleId,
    bodyCount: sample.massKg.length,
    newtonAccelerationRmsMS2: comparison.newtonAccelerationRmsMS2,
    eih1PnDeltaRmsMS2: comparison.eih1PnDeltaRmsMS2,
    solar2PnAndLtDeltaRmsMS2: comparison.solar2PnAndLtDeltaRmsMS2,
    combinedV2DeltaRmsMS2: comparison.combinedV2DeltaRmsMS2,
    twoPnDeltaRmsMS2: rms(effects.twoPn),
    lenseThirringDeltaRmsMS2: rms(effects.lenseThirring),
    v2OnlyDeltaRmsMS2: rms(effects.combined),
    maxTwoPnDeltaNormMS2: maxNorm(effects.twoPn),
    maxLenseThirringDeltaNormMS2: maxNorm(effects.lenseThirring),
    maxCombinedV2DeltaNormMS2: maxNorm(effects.combined),
    comparison,
    finite: true,
  };
}

function normalizeConvergenceSamples(value: RelativityReferenceStateSampleV3 | readonly RelativityReferenceStateSampleV3[]): readonly RelativityReferenceStateSampleV3[] {
  return Array.isArray(value)
    ? value as readonly RelativityReferenceStateSampleV3[]
    : [value as RelativityReferenceStateSampleV3];
}

function isNormalizedSample(value: unknown): value is NormalizedSample {
  if (!isObject(value)) return false;
  const candidate = value as Partial<NormalizedSample>;
  return typeof candidate.sampleId === "string"
    && candidate.positionM instanceof Float64Array
    && candidate.velocityMS instanceof Float64Array
    && candidate.massKg instanceof Float64Array;
}

function evaluateConvergence(
  input: RelativityReferenceConvergenceInputV3 | undefined,
  bodyCount: number,
  config: RelativityForceModelV2Config,
): RelativityReferenceConvergenceResultV3 {
  if (!input) return { status: "not-requested", method: "paired-instantaneous-v2-evaluations", pairCount: 0, pairs: [], maxAbsoluteDifferenceMS2: 0, rmsAbsoluteDifferenceMS2: 0, observedOrder: null, coarseStepLabel: null, fineStepLabel: null, liveStateMutated: false };
  const coarse = normalizeConvergenceSamples(input.coarse).map((sample, index) => normalizeSample(sample, bodyCount, index));
  const fine = normalizeConvergenceSamples(input.fine).map((sample, index) => normalizeSample(sample, bodyCount, index));
  if (coarse.length !== fine.length || coarse.length === 0) throw new RangeError("v3-reference-convergence-pair-count");
  const fineById = new Map(fine.map((sample) => [sample.sampleId, sample]));
  const pairs: RelativityReferenceConvergencePairV3[] = [];
  for (let index = 0; index < coarse.length; index += 1) {
    const coarseSample = coarse[index]!;
    const fineSample = fineById.get(coarseSample.sampleId) ?? fine[index]!;
    const coarseEffects = evaluateEffects(coarseSample, config);
    const fineEffects = evaluateEffects(fineSample, config);
    const coarseMetric = rms(coarseEffects.combined);
    const fineMetric = rms(fineEffects.combined);
    const absoluteDifferenceMS2 = Math.abs(coarseMetric - fineMetric);
    const relativeDifference = absoluteDifferenceMS2 / Math.max(Math.abs(coarseMetric), Math.abs(fineMetric), Number.MIN_VALUE);
    pairs.push({ sampleId: coarseSample.sampleId, coarseSampleId: coarseSample.sampleId, fineSampleId: fineSample.sampleId, coarseCombinedV2DeltaRmsMS2: coarseMetric, fineCombinedV2DeltaRmsMS2: fineMetric, absoluteDifferenceMS2, relativeDifference, finite: true });
  }
  const differences = new Float64Array(pairs.map((pair) => pair.absoluteDifferenceMS2));
  return {
    status: "evaluated",
    method: "paired-instantaneous-v2-evaluations",
    pairCount: pairs.length,
    pairs,
    maxAbsoluteDifferenceMS2: Math.max(...differences, 0),
    rmsAbsoluteDifferenceMS2: rms(differences),
    observedOrder: null,
    coarseStepLabel: input.coarseStepLabel ?? null,
    fineStepLabel: input.fineStepLabel ?? null,
    liveStateMutated: false,
  };
}

function evaluateReverseTime(
  requested: boolean | RelativityReferenceReverseTimeInputV3 | undefined,
  primarySamples: readonly NormalizedSample[],
  bodyCount: number,
  config: RelativityForceModelV2Config,
): RelativityReferenceReverseTimeResultV3 {
  if (requested === false) return { status: "not-requested", method: "instantaneous-velocity-sign-diagnostic", velocitySign: -1, samples: [], sampleCount: 0, maxTwoPnParityResidualRmsMS2: 0, maxLenseThirringOddParityResidualRmsMS2: 0, fullTimeIntegration: false, liveStateMutated: false };
  const reverseInput = typeof requested === "object" && requested !== null ? requested.samples : undefined;
  const samples: readonly NormalizedSample[] = (reverseInput ?? primarySamples).map((sample, index) => (
    isNormalizedSample(sample) ? sample : normalizeSample(sample, bodyCount, index)
  ));
  const rows: RelativityReferenceReverseTimeSampleV3[] = [];
  for (const sample of samples) {
    const original = evaluateEffects(sample, config);
    const reversedVelocity = new Float64Array(sample.velocityMS.length);
    for (let index = 0; index < reversedVelocity.length; index += 1) reversedVelocity[index] = -sample.velocityMS[index]!;
    const reversedSample: NormalizedSample = { sampleId: sample.sampleId, positionM: sample.positionM.slice(), velocityMS: reversedVelocity, massKg: sample.massKg.slice() };
    const reversed = evaluateEffects(reversedSample, config);
    const twoPnForward = evaluateEffects(sample, effectConfig(config, true, false)).twoPn;
    const ltForward = evaluateEffects(sample, effectConfig(config, false, true)).lenseThirring;
    const twoPnReverse = evaluateEffects(reversedSample, effectConfig(config, true, false)).twoPn;
    const ltReverse = evaluateEffects(reversedSample, effectConfig(config, false, true)).lenseThirring;
    rows.push({ sampleId: sample.sampleId, originalCombinedV2DeltaRmsMS2: rms(original.combined), reversedCombinedV2DeltaRmsMS2: rms(reversed.combined), twoPnParityResidualRmsMS2: rmsDifference(twoPnReverse, twoPnForward), lenseThirringOddParityResidualRmsMS2: rmsDifference(ltReverse, negate(ltForward)), finite: true });
  }
  return { status: "evaluated", method: "instantaneous-velocity-sign-diagnostic", velocitySign: -1, samples: rows, sampleCount: rows.length, maxTwoPnParityResidualRmsMS2: Math.max(...rows.map((row) => row.twoPnParityResidualRmsMS2), 0), maxLenseThirringOddParityResidualRmsMS2: Math.max(...rows.map((row) => row.lenseThirringOddParityResidualRmsMS2), 0), fullTimeIntegration: false, liveStateMutated: false };
}

function negate(values: Float64Array): Float64Array {
  const output = new Float64Array(values.length);
  for (let index = 0; index < values.length; index += 1) output[index] = -values[index]!;
  return output;
}

/** Execute a deterministic, read-only V2 reference evaluation. */
export function runRelativityReferenceRunnerV3(input: RelativityReferenceRunnerInputV3): RelativityReferenceRunV3 {
  if (!isObject(input)) throw new TypeError("v3-reference-input-object");
  const bodyIds = validateBodyIds(input.bodyIds);
  if (!Array.isArray(input.samples) || input.samples.length === 0) throw new RangeError("v3-reference-samples-empty");
  const sampleIds = new Set<string>();
  const samples = input.samples.map((sample, index) => {
    const normalized = normalizeSample(sample, bodyIds.length, index);
    if (sampleIds.has(normalized.sampleId)) throw new RangeError("v3-reference-sample-ids-duplicate");
    sampleIds.add(normalized.sampleId);
    return normalized;
  });
  const config = normalizeConfig(input.config, bodyIds.length);
  const perBody: RelativityReferencePerBodyResultV3[] = [];
  const aggregate: RelativityReferenceAggregateResultV3[] = [];
  const effectRows: RelativityReferenceEffectIsolationSampleV3[] = [];
  for (const sample of samples) {
    const effects = evaluateEffects(sample, config);
    aggregate.push(aggregateComparison(sample, config, effects));
    for (let bodyIndex = 0; bodyIndex < bodyIds.length; bodyIndex += 1) {
      const offset = 3 * bodyIndex;
      perBody.push({ sampleId: sample.sampleId, bodyId: bodyIds[bodyIndex]!, bodyIndex, twoPnDeltaMS2: vector(effects.twoPn, offset), lenseThirringDeltaMS2: vector(effects.lenseThirring, offset), combinedV2DeltaMS2: vector(effects.combined, offset), twoPnDeltaNormMS2: norm(effects.twoPn, offset), lenseThirringDeltaNormMS2: norm(effects.lenseThirring, offset), combinedV2DeltaNormMS2: norm(effects.combined, offset), finite: true });
    }
    const residual = new Float64Array(effects.combined.length);
    for (let index = 0; index < residual.length; index += 1) residual[index] = effects.combined[index]! - effects.twoPn[index]! - effects.lenseThirring[index]!;
    effectRows.push({ sampleId: sample.sampleId, twoPnDeltaRmsMS2: rms(effects.twoPn), lenseThirringDeltaRmsMS2: rms(effects.lenseThirring), combinedV2DeltaRmsMS2: rms(effects.combined), additivityResidualRmsMS2: rms(residual), isolatedWithV2Apis: true, finite: true });
  }
  const effectIsolation: RelativityReferenceEffectIsolationResultV3 = {
    status: "complete",
    samples: effectRows,
    sampleCount: effectRows.length,
    twoPnDeltaRmsMS2: rms(new Float64Array(effectRows.map((row) => row.twoPnDeltaRmsMS2))),
    lenseThirringDeltaRmsMS2: rms(new Float64Array(effectRows.map((row) => row.lenseThirringDeltaRmsMS2))),
    combinedV2DeltaRmsMS2: rms(new Float64Array(effectRows.map((row) => row.combinedV2DeltaRmsMS2))),
    additivityResidualRmsMS2: rms(new Float64Array(effectRows.map((row) => row.additivityResidualRmsMS2))),
    isolatedWithV2Apis: true,
    liveStateMutated: false,
  };
  const unsigned = {
    version: RELATIVITY_REFERENCE_RUNNER_V3_VERSION,
    forceModelVersion: RELATIVITY_FORCE_MODEL_V2_VERSION,
    mode: "shadow-read-only" as const,
    bodyIds,
    bodyCount: bodyIds.length,
    sampleCount: samples.length,
    perBody,
    aggregate,
    perBodyResults: perBody,
    aggregateResults: aggregate,
    effectIsolation,
    convergence: evaluateConvergence(input.convergence, bodyIds.length, config),
    reverseTime: evaluateReverseTime(input.reverseTime, samples, bodyIds.length, config),
    deterministic: true as const,
    liveStateMutated: false as const,
    promotion: "not-a-promotion-decision" as const,
    boundary: RELATIVITY_REFERENCE_RUNNER_V3_BOUNDARY,
  };
  const resultSha256 = sha256RelativityReferenceRunV3(unsigned);
  if (!SHA256.test(resultSha256)) throw new Error("v3-reference-sha-invalid");
  return Object.freeze({ ...unsigned, resultSha256 });
}

/** Short alias for callers that use the reference-runner name without Runner. */
export const runRelativityReferenceV3 = runRelativityReferenceRunnerV3;
