/// <reference lib="webworker" />

import { createPhysicsBufferViews } from "../lib/physicsSharedBuffer";
import {
  META_F64_SIM_DAYS,
  META_F64_SIM_SEC_ADVANCED,
  META_F64_STEPS_LAST_FRAME,
  META_I32_FALLBACK_REASON,
  META_I32_MODE,
  META_I32_REJECTED_SUBSTEPS,
  META_I32_SEQ,
  PHYSICS_FALLBACK_MAX_ACCEL_EVALS,
  PHYSICS_FALLBACK_MAX_ATTEMPTS,
  PHYSICS_FALLBACK_NONE,
  PHYSICS_MODE_DP,
  PHYSICS_MODE_GALACTIC_VERLET,
  PHYSICS_MODE_RK4,
  PHYSICS_MODE_RK4_FALLBACK,
} from "../lib/physicsSharedBuffer";
import { stateAuToSi } from "../lib/physicsEngine";
import { SolarSystemPhysics } from "../lib/solarSystemPhysics";
import type { PhysicsPrecisionTier } from "../lib/physicsPrecision";
import type { PhysicsBufferViews } from "../lib/physicsSharedBuffer";
import { DAY_SECONDS } from "../lib/physicalConstants";
import { assertScientificFrameStep, type PhysicsExecutionPolicyInput, type ScientificPhysicsFailure } from "../lib/physicsExecutionPolicy";

type InitMsg = {
  type: "init";
  sab: SharedArrayBuffer;
  forceFixedRk4: boolean;
  executionPolicy?: PhysicsExecutionPolicyInput;
};

type StepMsg = {
  type: "step";
  dtSimS: number;
  invC2: number;
  tier: PhysicsPrecisionTier;
  simDeltaDays: number;
  galacticMode: boolean;
};

type ApplySnapshotMsg = {
  type: "applySnapshot";
  payload: {
    posAu: number[];
    velAuPerDay: number[];
    massKg: number[];
    n: number;
    simDays: number;
  };
};

let physics: SolarSystemPhysics | null = null;
let metaF64: Float64Array | null = null;
let metaI32: Int32Array | null = null;
let bufferViews: PhysicsBufferViews | null = null;
let scratchVelAu: Float64Array | null = null;
let scientificFailure: ScientificPhysicsFailure | null = null;

function failScientificRequest(reason: string): void {
  scientificFailure ??= physics?.getScientificFailure() ?? Object.freeze({ reason, attemptedSubsteps: 0, attemptedSeconds: 0 });
  self.postMessage({ type: "stepFailed", failure: scientificFailure });
}

self.onmessage = (ev: MessageEvent<InitMsg | StepMsg | ApplySnapshotMsg>) => {
  const d = ev.data;
  if (d.type === "init") {
    if (physics?.getExecutionPolicy().mode === "scientific-shadow") {
      failScientificRequest("scientific-reinitialization-rejected");
      return;
    }
    const views = createPhysicsBufferViews(d.sab);
    bufferViews = views;
    scratchVelAu = new Float64Array(views.posAu.length);
    metaF64 = views.metaF64;
    metaI32 = views.metaI32;
    metaF64[META_F64_SIM_DAYS] = 0;
    metaF64[META_F64_STEPS_LAST_FRAME] = 0;
    metaF64[META_F64_SIM_SEC_ADVANCED] = 0;
    metaI32[META_I32_SEQ] = 0;
    metaI32[META_I32_MODE] = PHYSICS_MODE_DP;
    metaI32[META_I32_REJECTED_SUBSTEPS] = 0;
    metaI32[META_I32_FALLBACK_REASON] = PHYSICS_FALLBACK_NONE;

    physics = new SolarSystemPhysics({
      buffers: {
        posM: views.posM,
        velM: views.velM,
        mass: views.mass,
        posAu: views.posAu,
      },
      forceFixedRk4: d.forceFixedRk4,
      executionPolicy: d.executionPolicy,
    });
    self.postMessage({ type: "ready", executionPolicy: physics.getExecutionPolicy() });
    return;
  }

  if (d.type === "step" && physics && metaF64 && metaI32) {
    if (scientificFailure) { failScientificRequest(scientificFailure.reason); return; }
    try {
      assertScientificFrameStep(physics.getExecutionPolicy(), d);
      physics.setGalacticMode(d.galacticMode);
      physics.setPrecisionTier(d.tier);
      const inv = d.tier === "newton" ? 0 : d.invC2;
      const m = physics.stepSimulatedSeconds(d.dtSimS, inv);
      metaF64[META_F64_STEPS_LAST_FRAME] = m.acceptedSubsteps;
      metaF64[META_F64_SIM_SEC_ADVANCED] = m.simSecondsAdvanced;
      metaI32[META_I32_MODE] =
        m.mode === "dp"
          ? PHYSICS_MODE_DP
          : m.mode === "rk4"
            ? PHYSICS_MODE_RK4
            : m.mode === "rk4-fallback"
              ? PHYSICS_MODE_RK4_FALLBACK
              : PHYSICS_MODE_GALACTIC_VERLET;
      metaI32[META_I32_REJECTED_SUBSTEPS] = m.rejectedSubsteps;
      metaI32[META_I32_FALLBACK_REASON] =
        m.fallbackReason === "max-attempts"
          ? PHYSICS_FALLBACK_MAX_ATTEMPTS
          : m.fallbackReason === "max-accel-evals"
            ? PHYSICS_FALLBACK_MAX_ACCEL_EVALS
            : PHYSICS_FALLBACK_NONE;
      metaF64[META_F64_SIM_DAYS] += physics.getExecutionPolicy().mode === "scientific-shadow"
        ? m.simSecondsAdvanced / DAY_SECONDS : d.simDeltaDays;
      metaI32[META_I32_SEQ] = (metaI32[META_I32_SEQ] ?? 0) + 1;
      self.postMessage({ type: "stepDone" });
    } catch (error) {
      if (physics.getExecutionPolicy().mode !== "scientific-shadow") throw error;
      // No calendar, shared metrics or completion sequence is published for a rejected step.
      failScientificRequest(error instanceof Error ? error.message : "scientific-step-rejected");
    }
    return;
  }

  if (d.type === "applySnapshot" && physics && bufferViews && metaF64 && scratchVelAu) {
    if (physics.getExecutionPolicy().mode === "scientific-shadow") {
      failScientificRequest("scientific-snapshot-rejected");
      return;
    }
    const { posAu, velAuPerDay, massKg, n, simDays } = d.payload;
    const { posAu: posAuBuf, posM, velM, mass } = bufferViews;
    const n3 = n * 3;
    for (let i = 0; i < n3; i++) {
      posAuBuf[i] = posAu[i]!;
      scratchVelAu[i] = velAuPerDay[i]!;
    }
    stateAuToSi(posAuBuf, scratchVelAu, n, posM, velM);
    for (let i = 0; i < n; i++) mass[i] = massKg[i]!;
    physics.syncPosAu();
    metaF64[META_F64_SIM_DAYS] = simDays;
    self.postMessage({ type: "applyDone" });
  }
};

export {};
