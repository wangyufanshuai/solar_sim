import { SOLAR_SYSTEM_BODIES } from "../data/planetsJ2000";
import {
  createDp54Workspaces,
  createRk4Workspaces,
  defaultEps2Meters,
  dp54Commit,
  dp54TrialStepErrorNorm,
  gravitationalTimeDilationVsBarycenter,
  rk4Step,
  stateAuToSi,
  type Dp54Workspaces,
  type GravitationalTimeDilationResult,
  type Rk4Workspaces,
} from "./physicsEngine";
import { AU_METERS, C_LIGHT, G_SI } from "./physicalConstants";
import { BODY_J2, BODY_REQ_M } from "./planetJ2Data";
import type { PhysicsPrecisionTier } from "./physicsPrecision";
import { galacticAccelFromAuPosition, DEFAULT_GALACTIC_POTENTIAL, type GalacticPotentialParams } from "./galacticPotential";

const MAX_SUBSTEPS = 256;
/** Legacy fixed RK4: max substep length (s). */
const MAX_DT_SUBSTEP_S = 1200;

/** Dormand–Prince trial uses 7 `calculateAcceleration` calls per attempt. */
const ACCEL_EVALS_PER_DP_TRIAL = 7;

/** Adaptive DP5(4) step bounds (s). */
const ADAPTIVE_DT_MIN_S = 0.5;
const ADAPTIVE_DT_MAX_S = 2400;

const DEFAULT_RTOL = 1e-10;
const ECONOMY_RTOL = 1e-8;
const ADAPTIVE_ATOL_POS_M = 1.0;
const ADAPTIVE_ATOL_VEL_MS = 1e-4;

const ADAPTIVE_SAFETY = 0.9;
const ADAPTIVE_FACMIN = 0.2;
const ADAPTIVE_FACMAX = 5.0;

const DEFAULT_MAX_DP_ATTEMPTS = 50_000;
const DEFAULT_MAX_ACCEL_EVALS = 45_000;
const ECONOMY_MAX_ACCEL_EVALS = 12_000;

/** Hard cap on rejected/accepted DP trials per `stepSimulatedSeconds` (infinite-loop guard). */
const MAX_DP_ATTEMPTS_PER_STEP = DEFAULT_MAX_DP_ATTEMPTS;

function readFixedRk4FromEnv(): boolean {
  if (typeof process === "undefined") return false;
  return process.env.NEXT_PUBLIC_SOLAR_FIXED_RK4 === "1";
}

export type SolarSystemPhysicsBuffers = {
  posM: Float64Array;
  velM: Float64Array;
  mass: Float64Array;
  posAu: Float64Array;
};

export type SolarSystemPhysicsOptions = {
  /** Shared or owned buffers; length must be capacity * 3 (vectors) / capacity (mass). */
  buffers?: SolarSystemPhysicsBuffers;
  /** Active bodies integrated (first `activeN` slots). */
  activeN?: number;
  /** Buffer capacity (defaults to activeN). */
  capacity?: number;
  /** Override fixed RK4 mode (else env). */
  forceFixedRk4?: boolean;
};

export type PhysicsStepMetrics = {
  /** Accepted DP commits or RK4 sub-steps in this call. */
  acceptedSubsteps: number;
  /** Simulated seconds advanced (may be < dt if aborted). */
  simSecondsAdvanced: number;
  mode: "dp" | "rk4";
};

/**
 * Mutable N-body state (SI); advances with adaptive Dormand–Prince 5(4) or optional fixed RK4.
 */
export class SolarSystemPhysics {
  readonly n: number;
  readonly capacity: number;
  readonly posM: Float64Array;
  readonly velM: Float64Array;
  readonly mass: Float64Array;
  readonly posAu: Float64Array;

  readonly G: number;
  readonly eps2: number;

  private readonly rk4: Rk4Workspaces;
  private readonly dp54: Dp54Workspaces;
  private readonly phiTd: Float64Array;
  private readonly scratchVelAu: Float64Array;
  private readonly useFixedRk4: boolean;

  private rtol: number;
  private maxAccelEvalsPerStep: number;
  private precisionTier: PhysicsPrecisionTier = "full";

  /** When true, use analytical galactic potential instead of O(N^2) N-body. */
  private galacticMode = false;
  private galacticParams: GalacticPotentialParams = DEFAULT_GALACTIC_POTENTIAL;

  readonly integratesOnMainThread = true;

  constructor(options?: SolarSystemPhysicsOptions) {
    const bodies = SOLAR_SYSTEM_BODIES;
    const activeN = options?.activeN ?? bodies.length;
    const cap =
      options?.capacity ??
      (options?.buffers ? options.buffers.posM.length / 3 : activeN);
    const cap3 = cap * 3;

    if (options?.buffers) {
      const b = options.buffers;
      if (b.posM.length < cap3 || b.velM.length < cap3 || b.posAu.length < cap3) {
        throw new Error("SolarSystemPhysics: buffer too small for capacity");
      }
      if (b.mass.length < cap) {
        throw new Error("SolarSystemPhysics: mass buffer too small");
      }
      this.posM = b.posM;
      this.velM = b.velM;
      this.mass = b.mass;
      this.posAu = b.posAu;
    } else {
      this.posM = new Float64Array(cap3);
      this.velM = new Float64Array(cap3);
      this.mass = new Float64Array(cap);
      this.posAu = new Float64Array(cap3);
    }

    this.capacity = cap;
    this.n = activeN;
    this.G = G_SI;
    this.eps2 = defaultEps2Meters();
    this.phiTd = new Float64Array(this.n);
    this.scratchVelAu = new Float64Array(cap3);
    this.useFixedRk4 = options?.forceFixedRk4 ?? readFixedRk4FromEnv();
    this.rtol = DEFAULT_RTOL;
    this.maxAccelEvalsPerStep = DEFAULT_MAX_ACCEL_EVALS;

    this.rk4 = createRk4Workspaces(this.n);
    this.dp54 = createDp54Workspaces(this.n);

    this.resetFromEphemeris();
  }

  setPrecisionTier(tier: PhysicsPrecisionTier): void {
    this.precisionTier = tier;
    if (tier === "economy") {
      this.rtol = ECONOMY_RTOL;
      this.maxAccelEvalsPerStep = ECONOMY_MAX_ACCEL_EVALS;
    } else {
      this.rtol = DEFAULT_RTOL;
      this.maxAccelEvalsPerStep = DEFAULT_MAX_ACCEL_EVALS;
    }
  }

  getPrecisionTier(): PhysicsPrecisionTier {
    return this.precisionTier;
  }

  /** Switch between N-body and analytical galactic potential. */
  setGalacticMode(enabled: boolean, params?: GalacticPotentialParams): void {
    this.galacticMode = enabled;
    if (params) this.galacticParams = params;
  }

  getGalacticMode(): boolean {
    return this.galacticMode;
  }

  resetFromEphemeris(): void {
    const bodies = SOLAR_SYSTEM_BODIES;
    if (bodies.length !== this.n) {
      console.warn("SolarSystemPhysics.resetFromEphemeris: body count mismatch");
    }
    const posAu = new Float64Array(this.n * 3);
    const velAuPerDay = new Float64Array(this.n * 3);
    for (let i = 0; i < this.n; i++) {
      this.mass[i] = bodies[i]!.massKg;
      posAu[3 * i] = bodies[i]!.positionAu[0];
      posAu[3 * i + 1] = bodies[i]!.positionAu[1];
      posAu[3 * i + 2] = bodies[i]!.positionAu[2];
      velAuPerDay[3 * i] = bodies[i]!.velocityAuPerDay[0];
      velAuPerDay[3 * i + 1] = bodies[i]!.velocityAuPerDay[1];
      velAuPerDay[3 * i + 2] = bodies[i]!.velocityAuPerDay[2];
    }
    for (let i = this.n; i < this.capacity; i++) {
      this.mass[i] = 0;
    }
    stateAuToSi(posAu, velAuPerDay, this.n, this.posM, this.velM);
    this.syncPosAu();
  }

  /**
   * Single-frame integration entry (main thread). Sim calendar is advanced in `SolarSystemIntegrator`.
   */
  integrateOneFrame(
    dtSimS: number,
    invC2: number,
    tier: PhysicsPrecisionTier
  ): PhysicsStepMetrics {
    this.setPrecisionTier(tier);
    const inv = tier === "newton" ? 0 : invC2;
    return this.stepSimulatedSeconds(dtSimS, inv);
  }

  syncPosAu(): void {
    const inv = 1 / AU_METERS;
    for (let k = 0; k < this.n * 3; k++) {
      this.posAu[k] = this.posM[k] * inv;
    }
  }

  /**
   * Overwrite state from AU/day form (time travel / import). Updates `posM`/`velM`/`mass`/`posAu`.
   */
  applySnapshotFromAu(
    posAuIn: ArrayLike<number>,
    velAuPerDayIn: ArrayLike<number>,
    massKgIn: ArrayLike<number>,
    activeN: number,
  ): void {
    if (activeN !== this.n) {
      console.warn("SolarSystemPhysics.applySnapshotFromAu: n mismatch");
      return;
    }
    const n3 = activeN * 3;
    for (let i = 0; i < n3; i++) {
      this.posAu[i] = posAuIn[i]!;
      this.scratchVelAu[i] = velAuPerDayIn[i]!;
    }
    stateAuToSi(this.posAu, this.scratchVelAu, activeN, this.posM, this.velM);
    for (let i = 0; i < activeN; i++) this.mass[i] = massKgIn[i]!;
    for (let i = activeN; i < this.capacity; i++) this.mass[i] = 0;
    this.syncPosAu();
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

  private stepRemainderFixedRk4(
    tRem: number,
    invC2: number,
    metrics: PhysicsStepMetrics
  ): void {
    let t = tRem;
    while (t > 0) {
      const h = Math.min(MAX_DT_SUBSTEP_S, t);
      rk4Step(
        this.posM,
        this.velM,
        this.mass,
        this.n,
        h,
        this.G,
        invC2,
        this.eps2,
        this.rk4
      );
      metrics.acceptedSubsteps += 1;
      t -= h;
    }
  }

  /**
   * Advance physics by `dtTotalS` simulated seconds.
   * @param invC2  `1/c²` for 1PN, or `0` for pure Newton.
   */
  stepSimulatedSeconds(dtTotalS: number, invC2: number): PhysicsStepMetrics {
    const metrics: PhysicsStepMetrics = {
      acceptedSubsteps: 0,
      simSecondsAdvanced: 0,
      mode: "dp",
    };
    if (dtTotalS <= 0) return metrics;

    // Galactic potential mode: O(N) analytical acceleration, leapfrog integrator.
    if (this.galacticMode) {
      this.stepGalactic(dtTotalS, metrics);
      return metrics;
    }

    if (this.useFixedRk4) {
      metrics.mode = "rk4";
      const nSteps = Math.min(
        MAX_SUBSTEPS,
        Math.max(1, Math.ceil(dtTotalS / MAX_DT_SUBSTEP_S))
      );
      const h = dtTotalS / nSteps;
      for (let s = 0; s < nSteps; s++) {
        rk4Step(
          this.posM,
          this.velM,
          this.mass,
          this.n,
          h,
          this.G,
          invC2,
          this.eps2,
          this.rk4
        );
        metrics.acceptedSubsteps += 1;
      }
      metrics.simSecondsAdvanced = dtTotalS;
      this.syncPosAu();
      return metrics;
    }

    let tRem = dtTotalS;
    let hTry = Math.min(ADAPTIVE_DT_MAX_S, tRem);
    let attempts = 0;
    let accelEvals = 0;

    while (tRem > 0) {
      if (attempts++ > MAX_DP_ATTEMPTS_PER_STEP) {
        this.stepRemainderFixedRk4(tRem, invC2, metrics);
        metrics.simSecondsAdvanced += tRem;
        break;
      }
      if (accelEvals + ACCEL_EVALS_PER_DP_TRIAL > this.maxAccelEvalsPerStep) {
        this.stepRemainderFixedRk4(tRem, invC2, metrics);
        metrics.simSecondsAdvanced += tRem;
        break;
      }

      let h = Math.min(hTry, ADAPTIVE_DT_MAX_S, tRem);
      if (h < ADAPTIVE_DT_MIN_S && tRem > ADAPTIVE_DT_MIN_S) {
        h = ADAPTIVE_DT_MIN_S;
        if (h > tRem) h = tRem;
      }

      const err = dp54TrialStepErrorNorm(
        this.posM,
        this.velM,
        this.mass,
        this.n,
        h,
        this.G,
        invC2,
        this.eps2,
        this.dp54,
        this.rtol,
        ADAPTIVE_ATOL_POS_M,
        ADAPTIVE_ATOL_VEL_MS
      );
      accelEvals += ACCEL_EVALS_PER_DP_TRIAL;

      const ok = Number.isFinite(err) && err <= 1;
      if (ok) {
        dp54Commit(this.posM, this.velM, this.dp54);
        tRem -= h;
        metrics.simSecondsAdvanced += h;
        metrics.acceptedSubsteps += 1;
        const grow =
          ADAPTIVE_SAFETY * Math.pow(1 / Math.max(err, 1e-30), 1 / 5);
        hTry =
          h * Math.min(ADAPTIVE_FACMAX, Math.max(ADAPTIVE_FACMIN, grow));
      } else {
        const shrink =
          ADAPTIVE_SAFETY * Math.pow(1 / Math.max(err, 1e-30), 1 / 4);
        hTry = h * Math.max(ADAPTIVE_FACMIN, shrink);
        if (hTry >= h) hTry = h * 0.5;
      }
    }

    this.syncPosAu();
    return metrics;
  }

  /**
   * Galactic potential integration: O(N) leapfrog with analytical Miyamoto-Nagai + NFW.
   * Uses velocity-Verlet (symplectic, second-order) for long-term orbital stability.
   */
  private stepGalactic(dtTotalS: number, metrics: PhysicsStepMetrics): void {
    const n = this.n;
    const posM = this.posM;
    const velM = this.velM;
    const params = this.galacticParams;
    metrics.mode = "dp";

    // Substeps: use adaptive step sizing similar to fixed RK4 path.
    const nSteps = Math.min(MAX_SUBSTEPS, Math.max(1, Math.ceil(dtTotalS / MAX_DT_SUBSTEP_S)));
    const h = dtTotalS / nSteps;
    const hHalf = h * 0.5;

    for (let step = 0; step < nSteps; step++) {
      // Velocity-Verlet: kick-drift-kick
      // Half-kick: v += 0.5 * h * a(x)
      for (let i = 0; i < n; i++) {
        const k = 3 * i;
        // Convert SI position to AU for galacticAccelFromAuPosition
        const axAu = posM[k]! / AU_METERS;
        const ayAu = posM[k + 1]! / AU_METERS;
        const azAu = posM[k + 2]! / AU_METERS;
        const [ax, ay, az] = galacticAccelFromAuPosition(axAu, ayAu, azAu, params);
        velM[k]!     += hHalf * ax;
        velM[k + 1]! += hHalf * ay;
        velM[k + 2]! += hHalf * az;
      }

      // Drift: x += h * v
      for (let k = 0; k < 3 * n; k++) {
        posM[k] = posM[k]! + h * velM[k]!;
      }

      // Half-kick: v += 0.5 * h * a(x_new)
      for (let i = 0; i < n; i++) {
        const k = 3 * i;
        const axAu = posM[k]! / AU_METERS;
        const ayAu = posM[k + 1]! / AU_METERS;
        const azAu = posM[k + 2]! / AU_METERS;
        const [ax, ay, az] = galacticAccelFromAuPosition(axAu, ayAu, azAu, params);
        velM[k]!     += hHalf * ax;
        velM[k + 1]! += hHalf * ay;
        velM[k + 2]! += hHalf * az;
      }

      metrics.acceptedSubsteps += 1;
    }

    metrics.simSecondsAdvanced = dtTotalS;
    this.syncPosAu();
  }
}
