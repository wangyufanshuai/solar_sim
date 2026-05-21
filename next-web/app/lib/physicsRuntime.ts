import {
  defaultEps2Meters,
  gravitationalTimeDilationVsBarycenter,
  type GravitationalTimeDilationResult,
} from "./physicsEngine";
import {
  META_F64_SIM_DAYS,
  META_F64_SIM_SEC_ADVANCED,
  META_F64_STEPS_LAST_FRAME,
  PHYSICS_ACTIVE_BODY_COUNT,
  type PhysicsBufferViews,
} from "./physicsSharedBuffer";
import { C_LIGHT, G_SI } from "./physicalConstants";
import { BODY_J2, BODY_REQ_M } from "./planetJ2Data";
import type { PhysicsPrecisionTier } from "./physicsPrecision";
import type { SolarSystemPhysicsRef } from "./solarSystemRef";

export function isPhysicsRuntime(
  p: SolarSystemPhysicsRef
): p is PhysicsRuntime {
  return p.integratesOnMainThread === false;
}

/**
 * Main-thread view of worker-owned physics state (SharedArrayBuffer).
 * Do not write `posM`/`velM`/`mass`/`posAu` from the main thread.
 */
type StepDoneCallback = () => void;

export class PhysicsRuntime {
  readonly integratesOnMainThread = false;
  readonly n = PHYSICS_ACTIVE_BODY_COUNT;
  readonly capacity: number;
  readonly G = G_SI;
  readonly eps2 = defaultEps2Meters();
  readonly posM: Float64Array;
  readonly velM: Float64Array;
  readonly mass: Float64Array;
  readonly posAu: Float64Array;

  private readonly phiTd: Float64Array;
  private readonly worker: Worker;
  readonly metaF64: Float64Array;
  readonly metaI32: Int32Array;
  private readonly stepDoneListeners: Set<StepDoneCallback> = new Set();

  constructor(views: PhysicsBufferViews, worker: Worker) {
    this.posM = views.posM;
    this.velM = views.velM;
    this.mass = views.mass;
    this.posAu = views.posAu;
    this.metaF64 = views.metaF64;
    this.metaI32 = views.metaI32;
    this.capacity = this.posM.length / 3;
    this.phiTd = new Float64Array(this.n);
    this.worker = worker;
    this.worker.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "stepDone") {
        this.stepDoneListeners.forEach((cb) => cb());
      }
    });
  }

  subscribeStepDone(callback: StepDoneCallback): () => void {
    this.stepDoneListeners.add(callback);
    return () => { this.stepDoneListeners.delete(callback); };
  }

  getSimDays(): number {
    return this.metaF64[META_F64_SIM_DAYS]!;
  }

  getStepsLastFrame(): number {
    return this.metaF64[META_F64_STEPS_LAST_FRAME]!;
  }

  getSimSecondsLastFrame(): number {
    return this.metaF64[META_F64_SIM_SEC_ADVANCED]!;
  }

  integrateOneFrame(
    dtSimS: number,
    invC2: number,
    tier: PhysicsPrecisionTier,
    simDeltaDays: number
  ): void {
    this.worker.postMessage({
      type: "step",
      dtSimS,
      invC2,
      tier,
      simDeltaDays,
    });
  }

  /** Replace integrated state (used for time-travel / file import). */
  postApplySnapshot(payload: {
    posAu: number[];
    velAuPerDay: number[];
    massKg: number[];
    n: number;
    simDays: number;
  }): void {
    this.worker.postMessage({ type: "applySnapshot", payload });
  }

  getGravitationalTimeDilationVsCom(
    bodyIndex: number
  ): GravitationalTimeDilationResult {
    return gravitationalTimeDilationVsBarycenter(
      bodyIndex,
      this.posM,
      this.velM,
      this.mass,
      this.n,
      this.G,
      C_LIGHT,
      this.eps2,
      this.phiTd,
      BODY_J2,
      BODY_REQ_M
    );
  }

  terminateWorker(): void {
    this.worker.terminate();
  }
}
