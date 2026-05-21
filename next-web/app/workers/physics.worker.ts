/// <reference lib="webworker" />

import { createPhysicsBufferViews } from "../lib/physicsSharedBuffer";
import {
  META_F64_SIM_DAYS,
  META_F64_SIM_SEC_ADVANCED,
  META_F64_STEPS_LAST_FRAME,
  META_I32_SEQ,
} from "../lib/physicsSharedBuffer";
import { stateAuToSi } from "../lib/physicsEngine";
import { SolarSystemPhysics } from "../lib/solarSystemPhysics";
import type { PhysicsPrecisionTier } from "../lib/physicsPrecision";
import type { PhysicsBufferViews } from "../lib/physicsSharedBuffer";

type InitMsg = {
  type: "init";
  sab: SharedArrayBuffer;
  forceFixedRk4: boolean;
};

type StepMsg = {
  type: "step";
  dtSimS: number;
  invC2: number;
  tier: PhysicsPrecisionTier;
  simDeltaDays: number;
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

self.onmessage = (ev: MessageEvent<InitMsg | StepMsg | ApplySnapshotMsg>) => {
  const d = ev.data;
  if (d.type === "init") {
    const views = createPhysicsBufferViews(d.sab);
    bufferViews = views;
    scratchVelAu = new Float64Array(views.posAu.length);
    metaF64 = views.metaF64;
    metaI32 = views.metaI32;
    metaF64[META_F64_SIM_DAYS] = 0;
    metaF64[META_F64_STEPS_LAST_FRAME] = 0;
    metaF64[META_F64_SIM_SEC_ADVANCED] = 0;
    metaI32[META_I32_SEQ] = 0;

    physics = new SolarSystemPhysics({
      buffers: {
        posM: views.posM,
        velM: views.velM,
        mass: views.mass,
        posAu: views.posAu,
      },
      forceFixedRk4: d.forceFixedRk4,
    });
    self.postMessage({ type: "ready" });
    return;
  }

  if (d.type === "step" && physics && metaF64 && metaI32) {
    physics.setPrecisionTier(d.tier);
    const inv = d.tier === "newton" ? 0 : d.invC2;
    const m = physics.stepSimulatedSeconds(d.dtSimS, inv);
    metaF64[META_F64_STEPS_LAST_FRAME] = m.acceptedSubsteps;
    metaF64[META_F64_SIM_SEC_ADVANCED] = m.simSecondsAdvanced;
    metaF64[META_F64_SIM_DAYS] += d.simDeltaDays;
    metaI32[META_I32_SEQ] = (metaI32[META_I32_SEQ] ?? 0) + 1;
    self.postMessage({ type: "stepDone" });
    return;
  }

  if (d.type === "applySnapshot" && physics && bufferViews && metaF64 && scratchVelAu) {
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
