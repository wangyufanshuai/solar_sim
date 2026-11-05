import { describe, expect, it } from "vitest";
import { DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG } from "./relativityForceModelV2";
import {
  canonicalRelativityTrajectoryReferenceV3,
  runRelativityTrajectoryReferenceV3,
  sha256RelativityTrajectoryReferenceV3,
} from "./relativityTrajectoryReferenceV3";

const BODY_IDS = ["sun", "earth", "jupiter"] as const;
const DURATION_SECONDS = 8 * 86_400;
const COARSE_STEP_SECONDS = 21_600;
const EXPECTED_RESULT_SHA256 =
  "631443a8dcd61e4ff5dd742841f4b7a5c7f633af593490d40f9bf83e3445768a";

function state() {
  return {
    sampleId: "j2000",
    positionM: new Float64Array([
      0, 0, 0,
      1.495978707e11, 0, 0,
      0, 7.7857e11, 0,
    ]),
    velocityMS: new Float64Array([
      0, 0, 0,
      0, 29_784.6918, 0,
      -13_070, 0, 0,
    ]),
    massKg: new Float64Array([1.98847e30, 5.9722e24, 1.89813e27]),
  };
}

function input() {
  return {
    bodyIds: BODY_IDS,
    initialState: state(),
    durationSeconds: DURATION_SECONDS,
    coarseStepSeconds: COARSE_STEP_SECONDS,
  } as const;
}

describe("post-v593 independent full-trajectory relativity reference", () => {
  it("is deterministic, seals the unsigned evidence, and preserves caller-owned arrays", () => {
    const firstInput = input();
    const positionsBefore = firstInput.initialState.positionM.slice();
    const velocitiesBefore = firstInput.initialState.velocityMS.slice();
    const massesBefore = firstInput.initialState.massKg.slice();
    const first = runRelativityTrajectoryReferenceV3(firstInput);
    const second = runRelativityTrajectoryReferenceV3(input());

    expect(second).toEqual(first);
    expect(first.resultSha256).toBe(EXPECTED_RESULT_SHA256);
    expect(sha256RelativityTrajectoryReferenceV3(first)).toBe(first.resultSha256);
    expect(canonicalRelativityTrajectoryReferenceV3(first)).toContain(
      "offline-fixed-step-rk4-shadow-no-live-or-worker-state-mutation",
    );
    expect(Array.from(firstInput.initialState.positionM)).toEqual(Array.from(positionsBefore));
    expect(Array.from(firstInput.initialState.velocityMS)).toEqual(Array.from(velocitiesBefore));
    expect(Array.from(firstInput.initialState.massKg)).toEqual(Array.from(massesBefore));
    expect(first).toMatchObject({
      deterministic: true,
      callerStateMutated: false,
      liveStateMutated: false,
      workerStateMutated: false,
      scientificPayloadWriteback: false,
      promotion: "not-a-promotion-decision",
    });
  });

  it("observes fourth-order convergence for Newton, legacy EIH 1PN, and V2 shadow", () => {
    const run = runRelativityTrajectoryReferenceV3(input());

    expect(run.convergence).toMatchObject({
      status: "evaluated",
      method: "three-level-richardson-observed-order",
      allQualified: true,
    });
    expect(run.convergence.rows.map((row) => row.kernel)).toEqual([
      "newton",
      "legacy-eih-1pn",
      "eih-1pn-plus-v2-shadow",
    ]);
    for (const row of run.convergence.rows) {
      expect(row.coarseStepCount).toBe(32);
      expect(row.mediumStepCount).toBe(64);
      expect(row.fineStepCount).toBe(128);
      expect(row.observedPositionOrder).toBeGreaterThanOrEqual(row.orderFloor);
      expect(row.observedVelocityOrder).toBeGreaterThanOrEqual(row.orderFloor);
      expect(row.qualified).toBe(true);
    }
  });

  it("runs a complete forward/reverse trajectory and reverses source spin only for V2", () => {
    const config = {
      ...DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG,
      solarSpinAxisJ2000: [...DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG.solarSpinAxisJ2000] as const,
    };
    const configBefore = structuredClone(config);
    const run = runRelativityTrajectoryReferenceV3({ ...input(), config });

    expect(config).toEqual(configBefore);
    expect(run.reverseTimeRoundTrip).toMatchObject({
      status: "evaluated",
      fullTimeIntegration: true,
      allQualified: true,
    });
    expect(run.reverseTimeRoundTrip.rows.map((row) => ({
      kernel: row.kernel,
      spinReversed: row.solarSpinAngularMomentumReversedForBackwardLeg,
    }))).toEqual([
      { kernel: "newton", spinReversed: false },
      { kernel: "legacy-eih-1pn", spinReversed: false },
      { kernel: "eih-1pn-plus-v2-shadow", spinReversed: true },
    ]);
    for (const row of run.reverseTimeRoundTrip.rows) {
      expect(row.stepCountEachDirection).toBe(128);
      expect(row.positionRelativeError).toBeLessThan(row.relativeErrorLimit);
      expect(row.velocityRelativeError).toBeLessThan(row.relativeErrorLimit);
      expect(row.qualified).toBe(true);
    }
  });

  it("reports per-body Newton/EIH/V2 deltas and independently integrated effect isolation", () => {
    const run = runRelativityTrajectoryReferenceV3(input());

    expect(run.bodyIds).toEqual(BODY_IDS);
    expect(run.perBody).toHaveLength(BODY_IDS.length);
    expect(run.perBody.map((row) => row.bodyId)).toEqual(BODY_IDS);
    expect(run.perBody.every((row) => row.finite)).toBe(true);
    expect(run.aggregate.legacyMinusNewtonPositionRmsM).toBeGreaterThan(0);
    expect(run.aggregate.legacyMinusNewtonVelocityRmsMS).toBeGreaterThan(0);
    expect(run.aggregate.v2MinusLegacyPositionRmsM).toBeGreaterThan(0);
    expect(run.aggregate.v2MinusLegacyVelocityRmsMS).toBeGreaterThan(0);
    expect(run.effectIsolation.method).toBe("independent-trajectory-integrations");
    expect(run.effectIsolation.combinedPositionRmsM).toBeGreaterThan(0);
    expect(run.effectIsolation.combinedVelocityRmsMS).toBeGreaterThan(0);
    expect(run.effectIsolation.additivityResidualPositionRmsM).toBeLessThan(
      run.effectIsolation.combinedPositionRmsM,
    );
    expect(run.effectIsolation.additivityResidualVelocityRmsMS).toBeLessThan(
      run.effectIsolation.combinedVelocityRmsMS,
    );
  });
});
