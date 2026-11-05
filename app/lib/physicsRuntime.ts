import {
  defaultEps2Meters,
  gravitationalTimeDilationVsBarycenter,
  type GravitationalTimeDilationResult,
} from "./physicsEngine";
import {
  META_F64_SIM_DAYS,
  META_F64_SIM_SEC_ADVANCED,
  META_F64_STEPS_LAST_FRAME,
  META_I32_FALLBACK_REASON,
  META_I32_MODE,
  META_I32_REJECTED_SUBSTEPS,
  PHYSICS_ACTIVE_BODY_COUNT,
  PHYSICS_FALLBACK_MAX_ACCEL_EVALS,
  PHYSICS_FALLBACK_MAX_ATTEMPTS,
  PHYSICS_MODE_GALACTIC_VERLET,
  PHYSICS_MODE_RK4,
  PHYSICS_MODE_RK4_FALLBACK,
  type PhysicsBufferViews,
} from "./physicsSharedBuffer";
import { C_LIGHT, G_SI } from "./physicalConstants";
import { BODY_J2, BODY_REQ_M } from "./planetJ2Data";
import type { PhysicsPrecisionTier } from "./physicsPrecision";
import type { SolarSystemPhysicsRef } from "./solarSystemRef";
import type { PhysicsStepMetrics } from "./solarSystemPhysics";
import {
  assertScientificFrameStep, normalizePhysicsExecutionPolicy,
  type PhysicsExecutionPolicy, type PhysicsExecutionPolicyInput, type ScientificPhysicsFailure,
} from "./physicsExecutionPolicy";

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
  private readonly executionPolicy: PhysicsExecutionPolicy;
  private scientificFailure: ScientificPhysicsFailure | null = null;
  private scientificStepPending = false;
  private scientificSimDays = 0;

  constructor(views: PhysicsBufferViews, worker: Worker, executionPolicy?: PhysicsExecutionPolicyInput) {
    this.executionPolicy = normalizePhysicsExecutionPolicy(executionPolicy);
    this.posM = views.posM;
    this.velM = views.velM;
    this.mass = views.mass;
    this.posAu = views.posAu;
    this.metaF64 = views.metaF64;
    this.metaI32 = views.metaI32;
    this.scientificSimDays = views.metaF64[META_F64_SIM_DAYS]!;
    this.capacity = this.posM.length / 3;
    this.phiTd = new Float64Array(this.n);
    this.worker = worker;
    this.worker.addEventListener("message", (e: MessageEvent) => {
      if (e.data?.type === "stepDone") {
        if (this.executionPolicy.mode === "scientific-shadow" && (this.scientificFailure || !this.scientificStepPending)) return;
        this.scientificStepPending = false;
        this.scientificSimDays = this.metaF64[META_F64_SIM_DAYS]!;
        this.stepDoneListeners.forEach((cb) => cb());
      }
      if (e.data?.type === "stepFailed" && this.executionPolicy.mode === "scientific-shadow") {
        this.scientificStepPending = false;
        this.scientificFailure = Object.freeze(e.data.failure);
      }
    });
    const transportFailed = () => {
      if (this.executionPolicy.mode === "scientific-shadow") {
        this.scientificStepPending = false;
        this.scientificFailure = Object.freeze({ reason: "worker-transport-failed", attemptedSubsteps: 0, attemptedSeconds: 0 });
      }
    };
    this.worker.addEventListener("error", transportFailed);
    this.worker.addEventListener("messageerror", transportFailed);
  }

  subscribeStepDone(callback: StepDoneCallback): () => void {
    this.stepDoneListeners.add(callback);
    return () => { this.stepDoneListeners.delete(callback); };
  }

  getSimDays(): number {
    return this.executionPolicy.mode === "scientific-shadow" ? this.scientificSimDays : this.metaF64[META_F64_SIM_DAYS]!;
  }

  getStepsLastFrame(): number {
    return this.metaF64[META_F64_STEPS_LAST_FRAME]!;
  }

  getSimSecondsLastFrame(): number {
    return this.metaF64[META_F64_SIM_SEC_ADVANCED]!;
  }

  getExecutionPolicy(): PhysicsExecutionPolicy { return this.executionPolicy; }

  getScientificFailure(): ScientificPhysicsFailure | null { return this.scientificFailure; }

  getModeLastFrame(): PhysicsStepMetrics["mode"] {
    switch (this.metaI32[META_I32_MODE]) {
      case PHYSICS_MODE_RK4:
        return "rk4";
      case PHYSICS_MODE_RK4_FALLBACK:
        return "rk4-fallback";
      case PHYSICS_MODE_GALACTIC_VERLET:
        return "galactic-verlet";
      default:
        return "dp";
    }
  }

  getRejectedSubstepsLastFrame(): number {
    return this.metaI32[META_I32_REJECTED_SUBSTEPS]!;
  }

  getFallbackReasonLastFrame(): PhysicsStepMetrics["fallbackReason"] {
    switch (this.metaI32[META_I32_FALLBACK_REASON]) {
      case PHYSICS_FALLBACK_MAX_ATTEMPTS:
        return "max-attempts";
      case PHYSICS_FALLBACK_MAX_ACCEL_EVALS:
        return "max-accel-evals";
      default:
        return undefined;
    }
  }

  integrateOneFrame(
    dtSimS: number,
    invC2: number,
    tier: PhysicsPrecisionTier,
    simDeltaDays: number,
    galacticMode: boolean,
  ): boolean {
    if (this.scientificFailure) throw new Error(`Scientific run terminated: ${this.scientificFailure.reason}`);
    assertScientificFrameStep(this.executionPolicy, { dtSimS, invC2, tier, simDeltaDays, galacticMode });
    if (this.executionPolicy.mode === "scientific-shadow") {
      if (this.scientificStepPending) return false;
      this.scientificStepPending = true;
    }
    try {
      this.worker.postMessage({
        type: "step",
        dtSimS,
        invC2,
        tier,
        simDeltaDays,
        galacticMode,
      });
    } catch (error) {
      this.scientificStepPending = false;
      if (this.executionPolicy.mode === "scientific-shadow") this.scientificFailure = Object.freeze({ reason: "worker-send-failed", attemptedSubsteps: 0, attemptedSeconds: 0 });
      throw error;
    }
    return true;
  }

  /** Replace integrated state (used for time-travel / file import). */
  postApplySnapshot(payload: {
    posAu: number[];
    velAuPerDay: number[];
    massKg: number[];
    n: number;
    simDays: number;
  }): void {
    if (this.executionPolicy.mode === "scientific-shadow") throw new Error("Scientific run is locked; snapshots require a new run");
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
    if (this.executionPolicy.mode === "scientific-shadow") {
      this.scientificStepPending = false;
      this.scientificFailure ??= Object.freeze({ reason: "worker-terminated", attemptedSubsteps: 0, attemptedSeconds: 0 });
    }
    this.worker.terminate();
  }
}
