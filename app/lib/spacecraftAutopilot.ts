"use client";

import {
  EARTH_BODY_INDEX,
  MOON_BODY_INDEX,
  SPACECRAFT_BODY_INDEX,
} from "../data/planetsJ2000";
import { AU_METERS, DAY_SECONDS } from "./physicalConstants";
import type { SolarSystemPhysicsRef } from "./solarSystemRef";
import {
  SLS_BLOCK_1,
  effectiveIsp,
  effectiveThrust,
  G0,
  circularVelocity,
  TARGET_LEO_ALT_REAL_M,
  type ArtemisVehicle,
} from "./artemisMissionModel";

// ─── Phase types ────────────────────────────────────────────────

export type LaunchPhase =
  | "idle"
  | "prelaunch"
  | "srbBurn"
  | "coreBurn"
  | "staging"
  | "icpsFirst"
  | "orbitCoast"
  | "tliBurn"
  | "transLunarCoast"
  | "descent"
  | "landed";

// ─── Telemetry output ───────────────────────────────────────────

export type ArtemisTelemetry = {
  phase: LaunchPhase;
  missionTimeS: number;
  altitudeKm: number;
  speedKms: number;
  gForce: number;
  thrustKN: number;
  stage: string;
  fuelPercent: number;
  downrangeKm: number;
  apoapsisAltKm: number;
  periapsisAltKm: number;
};

// ─── Internal state ─────────────────────────────────────────────

type MissionState = {
  enabled: boolean;
  phase: LaunchPhase;
  phaseElapsedS: number;
  missionTimeS: number;
  launchedOnce: boolean;
  /** Which stage is currently burning (index into SLS_BLOCK_1.stages). */
  stageIndex: number;
  /** Remaining fuel per stage (kg). */
  fuelRemaining: number[];
  /** Set of staging event indices already fired. */
  eventsFired: Set<number>;
  /** Launch latitude/longitude (radians). */
  launchLatRad: number;
  launchLonRad: number;
  /** Total vehicle mass (updated each frame). */
  totalMassKg: number;
  /** Current thrust (N). */
  currentThrustN: number;
  /** Current G-force. */
  currentGForce: number;
  /** Target body index (Earth for launch). */
  targetBodyIndex: number;
};

const EARTH_ROT_RATE_RAD_S = (2 * Math.PI) / 86164.0905;
const EARTH_RADIUS_M = 6_378_137;

let _state: MissionState = {
  enabled: false,
  phase: "idle",
  phaseElapsedS: 0,
  missionTimeS: 0,
  launchedOnce: false,
  stageIndex: 0,
  fuelRemaining: SLS_BLOCK_1.stages.map((s) => s.fuelMassKg),
  eventsFired: new Set(),
  launchLatRad: (28.6 * Math.PI) / 180, // Kennedy Space Center LC-39B
  launchLonRad: (-80.6 * Math.PI) / 180,
  totalMassKg: 0,
  currentThrustN: 0,
  currentGForce: 0,
  targetBodyIndex: EARTH_BODY_INDEX,
};

// ─── Pending thrust buffer ──────────────────────────────────────

let _pendingThrust = {
  active: false,
  dirX: 0,
  dirY: 0,
  dirZ: 0,
  thrustN: 0,
  totalMassKg: 0,
  ispS: 0,
};

// ─── Helpers ────────────────────────────────────────────────────

function bodyK(i: number): number {
  return 3 * i;
}

function normalize3(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  const n = Math.hypot(x, y, z);
  if (n < 1e-9) return [0, 1, 0];
  return [x / n, y / n, z / n];
}

function setPosVel(
  p: SolarSystemPhysicsRef,
  bodyIndex: number,
  px: number,
  py: number,
  pz: number,
  vx: number,
  vy: number,
  vz: number
): void {
  const k = bodyK(bodyIndex);
  if (!("posM" in p) || !("velM" in p)) return;
  p.posM[k] = px;
  p.posM[k + 1] = py;
  p.posM[k + 2] = pz;
  p.velM[k] = vx;
  p.velM[k + 1] = vy;
  p.velM[k + 2] = vz;
  if ("syncPosAu" in p && typeof p.syncPosAu === "function") {
    p.syncPosAu();
  }
}

/** Compute total vehicle mass from stages + payload. */
function computeTotalMass(vehicle: ArtemisVehicle, fuelRemaining: number[]): number {
  let m = vehicle.payloadMassKg;
  for (let i = 0; i < vehicle.stages.length; i++) {
    m += vehicle.stages[i]!.dryMassKg;
    m += Math.max(0, fuelRemaining[i] ?? 0);
  }
  return m;
}

// ─── Public API ─────────────────────────────────────────────────

export function getLaunchStateSnapshot(): MissionState {
  return { ..._state, eventsFired: new Set(_state.eventsFired) };
}

export function isLaunchActivePhase(): boolean {
  return (
    _state.enabled &&
    _state.phase !== "idle" &&
    _state.phase !== "landed"
  );
}

export function isLaunchPowered(): boolean {
  return (
    _state.enabled &&
    (_state.phase === "srbBurn" ||
      _state.phase === "coreBurn" ||
      _state.phase === "icpsFirst" ||
      _state.phase === "tliBurn")
  );
}

export function startLaunchSequence(): void {
  _state.enabled = true;
  _state.phase = "prelaunch";
  _state.phaseElapsedS = 0;
  _state.missionTimeS = 0;
  _state.launchedOnce = true;
  _state.stageIndex = 0;
  _state.fuelRemaining = SLS_BLOCK_1.stages.map((s) => s.fuelMassKg);
  _state.eventsFired = new Set();
  _state.totalMassKg = computeTotalMass(SLS_BLOCK_1, _state.fuelRemaining);
  _state.currentThrustN = 0;
  _state.currentGForce = 0;
}

export function stopLaunchSequence(p?: SolarSystemPhysicsRef | null): void {
  _state.enabled = false;
  _state.phase = "idle";
  _state.phaseElapsedS = 0;
  _pendingThrust.active = false;
}

export function startPoweredDescent(targetBodyIndex: number): void {
  if (targetBodyIndex < 0) return;
  _state.enabled = true;
  _state.targetBodyIndex = targetBodyIndex;
  _state.phase = "descent";
  _state.phaseElapsedS = 0;
}

export function getArtemisTelemetry(): ArtemisTelemetry {
  return {
    phase: _state.phase,
    missionTimeS: _state.missionTimeS,
    altitudeKm: 0, // filled by updateLaunchAutopilot
    speedKms: 0,
    gForce: _state.currentGForce,
    thrustKN: _state.currentThrustN / 1000,
    stage:
      _state.stageIndex < SLS_BLOCK_1.stages.length
        ? SLS_BLOCK_1.stages[_state.stageIndex]!.id
        : "none",
    fuelPercent: 0,
    downrangeKm: 0,
    apoapsisAltKm: 0,
    periapsisAltKm: 0,
  };
}

// ─── Apply pending thrust to physics ────────────────────────────

/**
 * Apply the stored thrust impulse to the spacecraft's velocity.
 * Called AFTER integrateOneFrame in the useFrame loop.
 *
 * Uses the Tsiolkovsky rocket equation:
 *   deltaV = (thrust / mass) * dt
 *   fuelConsumed = thrust / (Isp * g0) * dt
 */
export function applyPendingThrustToPhysics(
  p: SolarSystemPhysicsRef,
  dtSimS: number
): void {
  if (!_pendingThrust.active || SPACECRAFT_BODY_INDEX < 0) return;
  const n = "n" in p ? p.n : 0;
  if (SPACECRAFT_BODY_INDEX >= n) return;

  const thrust = _pendingThrust.thrustN;
  const mass = _pendingThrust.totalMassKg;
  const isp = _pendingThrust.ispS;

  if (thrust <= 0 || mass <= 0 || dtSimS <= 0) return;

  // Compute acceleration
  const accel = thrust / mass; // m/s²
  const dv = accel * dtSimS;

  // Apply velocity impulse in thrust direction
  const k = bodyK(SPACECRAFT_BODY_INDEX);
  p.velM[k] += _pendingThrust.dirX * dv;
  p.velM[k + 1] += _pendingThrust.dirY * dv;
  p.velM[k + 2] += _pendingThrust.dirZ * dv;

  // Compute fuel consumed this step
  if (isp > 0) {
    const fuelRate = thrust / (isp * G0); // kg/s
    const fuelConsumed = fuelRate * dtSimS;
    const stageIdx = _state.stageIndex;
    if (stageIdx < _state.fuelRemaining.length) {
      _state.fuelRemaining[stageIdx] = Math.max(
        0,
        _state.fuelRemaining[stageIdx]! - fuelConsumed
      );
      // Update body mass in physics
      const newMass = computeTotalMass(SLS_BLOCK_1, _state.fuelRemaining);
      p.mass[SPACECRAFT_BODY_INDEX] = newMass;
      _state.totalMassKg = newMass;
    }
  }

  if ("syncPosAu" in p && typeof p.syncPosAu === "function") {
    p.syncPosAu();
  }

  _pendingThrust.active = false;
}

// ─── Main autopilot update ──────────────────────────────────────

export function updateLaunchAutopilot(
  p: SolarSystemPhysicsRef,
  simDays: number,
  dtSimS: number
): void {
  if (!_state.enabled || dtSimS <= 0) return;
  if (SPACECRAFT_BODY_INDEX < 0 || EARTH_BODY_INDEX < 0) return;
  const n = "n" in p ? p.n : 0;
  if (SPACECRAFT_BODY_INDEX >= n || EARTH_BODY_INDEX >= n) return;

  _state.phaseElapsedS += dtSimS;
  _state.missionTimeS += dtSimS;

  const ke = bodyK(EARTH_BODY_INDEX);
  const ks = bodyK(SPACECRAFT_BODY_INDEX);
  const ex = p.posM[ke]!;
  const ey = p.posM[ke + 1]!;
  const ez = p.posM[ke + 2]!;
  const evx = p.velM[ke]!;
  const evy = p.velM[ke + 1]!;
  const evz = p.velM[ke + 2]!;
  const sx = p.posM[ks]!;
  const sy = p.posM[ks + 1]!;
  const sz = p.posM[ks + 2]!;
  const svx = p.velM[ks]!;
  const svy = p.velM[ks + 1]!;
  const svz = p.velM[ks + 2]!;

  const relx = sx - ex;
  const rely = sy - ey;
  const relz = sz - ez;
  const [upx, upy, upz] = normalize3(relx, rely, relz);
  const altitudeM = Math.max(
    0,
    Math.hypot(relx, rely, relz) - EARTH_RADIUS_M
  );
  const speedMs = Math.hypot(svx - evx, svy - evy, svz - evz);
  const [prox, proy, proz] = normalize3(svx - evx, svy - evy, svz - evz);

  // ── Phase: Prelaunch ────────────────────────────────────────
  if (_state.phase === "prelaunch") {
    // Place spacecraft on Earth surface at launch site
    const lat = _state.launchLatRad;
    const lon0 = _state.launchLonRad;
    const sidereal = lon0 + simDays * DAY_SECONDS * EARTH_ROT_RATE_RAD_S;
    const cl = Math.cos(lat);
    const sl = Math.sin(lat);
    const cs = Math.cos(sidereal);
    const ss = Math.sin(sidereal);
    const lx = EARTH_RADIUS_M * cl * cs;
    const ly = EARTH_RADIUS_M * cl * ss;
    const lz = EARTH_RADIUS_M * sl;
    const rvx = -EARTH_ROT_RATE_RAD_S * ly;
    const rvy = EARTH_ROT_RATE_RAD_S * lx;
    setPosVel(
      p,
      SPACECRAFT_BODY_INDEX,
      ex + lx,
      ey + ly,
      ez + lz,
      evx + rvx,
      evy + rvy,
      evz
    );
    // Initialize mass
    _state.totalMassKg = computeTotalMass(SLS_BLOCK_1, _state.fuelRemaining);
    p.mass[SPACECRAFT_BODY_INDEX] = _state.totalMassKg;

    _pendingThrust.active = false;
    _state.currentThrustN = 0;
    _state.currentGForce = 0;

    // Transition after 2 seconds simulation time
    if (_state.phaseElapsedS >= 2) {
      _state.phase = "srbBurn";
      _state.stageIndex = 0;
      _state.phaseElapsedS = 0;
    }
    return;
  }

  // ── Phase: SRB Burn (Stage 0 — both SRBs + core firing) ────
  if (_state.phase === "srbBurn") {
    // SRBs + Core fire simultaneously during initial ascent
    const srbStage = SLS_BLOCK_1.stages[0]!;
    const coreStage = SLS_BLOCK_1.stages[1]!;
    const srbThrust = effectiveThrust(srbStage, altitudeM);
    const coreThrust = effectiveThrust(coreStage, altitudeM);
    const totalThrust = srbThrust + coreThrust;

    // Gravity turn: start vertical, gradually pitch toward prograde
    const turn = Math.max(0, Math.min(1, (altitudeM - 500) / 40_000));
    const tx = upx * (1 - turn) + prox * turn;
    const ty = upy * (1 - turn) + proy * turn;
    const tz = upz * (1 - turn) + proz * turn;
    const [dx, dy, dz] = normalize3(tx, ty, tz);

    // Combined Isp (mass-flow weighted)
    const srbIsp = effectiveIsp(srbStage, altitudeM);
    const coreIsp = effectiveIsp(coreStage, altitudeM);
    const combinedIsp =
      (srbThrust + coreThrust) /
      (srbThrust / srbIsp + coreThrust / coreIsp);

    _pendingThrust.active = true;
    _pendingThrust.dirX = dx;
    _pendingThrust.dirY = dy;
    _pendingThrust.dirZ = dz;
    _pendingThrust.thrustN = totalThrust;
    _pendingThrust.totalMassKg = _state.totalMassKg;
    _pendingThrust.ispS = combinedIsp;

    _state.currentThrustN = totalThrust;
    _state.currentGForce = totalThrust / (_state.totalMassKg * G0);

    // Transition: SRB burnout at ~126s
    if (
      _state.fuelRemaining[0]! <= 0 ||
      _state.missionTimeS >= 126
    ) {
      _state.phase = "coreBurn";
      _state.stageIndex = 1;
      _state.phaseElapsedS = 0;
      // Jettison SRBs (remove dry mass)
      _state.fuelRemaining[0] = 0;
      SLS_BLOCK_1.stages[0]!.dryMassKg = 0;
    }
    return;
  }

  // ── Phase: Core Burn (Stage 1 only) ─────────────────────────
  if (_state.phase === "coreBurn") {
    const coreStage = SLS_BLOCK_1.stages[1]!;
    const thrust = effectiveThrust(coreStage, altitudeM);
    const isp = effectiveIsp(coreStage, altitudeM);

    // Continue gravity turn toward prograde
    const turn = Math.max(0, Math.min(1, (altitudeM - 12_000) / 130_000));
    const tx = upx * (1 - turn) + prox * turn;
    const ty = upy * (1 - turn) + proy * turn;
    const tz = upz * (1 - turn) + proz * turn;
    const [dx, dy, dz] = normalize3(tx, ty, tz);

    _pendingThrust.active = true;
    _pendingThrust.dirX = dx;
    _pendingThrust.dirY = dy;
    _pendingThrust.dirZ = dz;
    _pendingThrust.thrustN = thrust;
    _pendingThrust.totalMassKg = _state.totalMassKg;
    _pendingThrust.ispS = isp;

    _state.currentThrustN = thrust;
    _state.currentGForce = thrust / (_state.totalMassKg * G0);

    // MECO at ~330s or when fuel depleted
    if (
      _state.fuelRemaining[1]! <= 0 ||
      _state.missionTimeS >= 330
    ) {
      _state.phase = "staging";
      _state.stageIndex = 2;
      _state.phaseElapsedS = 0;
      _pendingThrust.active = false;
      _state.currentThrustN = 0;
      _state.currentGForce = 0;
      // Jettison core stage
      _state.fuelRemaining[1] = 0;
      SLS_BLOCK_1.stages[1]!.dryMassKg = 0;
    }
    return;
  }

  // ── Phase: Staging (brief coast during separation) ──────────
  if (_state.phase === "staging") {
    _pendingThrust.active = false;
    _state.currentThrustN = 0;
    _state.currentGForce = 0;

    // 5-second coast for stage separation
    if (_state.phaseElapsedS >= 5) {
      _state.phase = "icpsFirst";
      _state.phaseElapsedS = 0;
    }
    return;
  }

  // ── Phase: ICPS First Burn (LEO insertion) ──────────────────
  if (_state.phase === "icpsFirst") {
    const icpsStage = SLS_BLOCK_1.stages[2]!;
    const thrust = icpsStage.thrustVacuumN; // vacuum only
    const isp = icpsStage.ispVacuumS;

    // Prograde thrust for circularization
    _pendingThrust.active = true;
    _pendingThrust.dirX = prox;
    _pendingThrust.dirY = proy;
    _pendingThrust.dirZ = proz;
    _pendingThrust.thrustN = thrust;
    _pendingThrust.totalMassKg = _state.totalMassKg;
    _pendingThrust.ispS = isp;

    _state.currentThrustN = thrust;
    _state.currentGForce = thrust / (_state.totalMassKg * G0);

    // Target circular velocity at ~185 km
    const targetSpeed = circularVelocity(TARGET_LEO_ALT_REAL_M);

    if (
      altitudeM >= TARGET_LEO_ALT_REAL_M &&
      speedMs >= targetSpeed * 0.98
    ) {
      _state.phase = "orbitCoast";
      _state.phaseElapsedS = 0;
      _pendingThrust.active = false;
      _state.currentThrustN = 0;
      _state.currentGForce = 0;
    }
    return;
  }

  // ── Phase: Orbit Coast (wait for TLI window) ────────────────
  if (_state.phase === "orbitCoast") {
    _pendingThrust.active = false;
    _state.currentThrustN = 0;
    _state.currentGForce = 0;

    // After ~1.5 orbits (≈5400s total mission time), fire TLI
    // For simplicity, coast for a fixed duration then fire
    if (_state.missionTimeS >= 4500) {
      _state.phase = "tliBurn";
      _state.phaseElapsedS = 0;
    }
    return;
  }

  // ── Phase: TLI Burn (ICPS second ignition) ──────────────────
  if (_state.phase === "tliBurn") {
    const icpsStage = SLS_BLOCK_1.stages[2]!;
    const thrust = icpsStage.thrustVacuumN;
    const isp = icpsStage.ispVacuumS;

    // Prograde burn for trans-lunar injection
    _pendingThrust.active = true;
    _pendingThrust.dirX = prox;
    _pendingThrust.dirY = proy;
    _pendingThrust.dirZ = proz;
    _pendingThrust.thrustN = thrust;
    _pendingThrust.totalMassKg = _state.totalMassKg;
    _pendingThrust.ispS = isp;

    _state.currentThrustN = thrust;
    _state.currentGForce = thrust / (_state.totalMassKg * G0);

    // Burn for ~280s or until fuel depleted
    if (
      _state.fuelRemaining[2]! <= 0 ||
      _state.phaseElapsedS >= 280
    ) {
      _state.phase = "transLunarCoast";
      _state.phaseElapsedS = 0;
      _pendingThrust.active = false;
      _state.currentThrustN = 0;
      _state.currentGForce = 0;
    }
    return;
  }

  // ── Phase: Trans-Lunar Coast (passive) ───────────────────────
  if (_state.phase === "transLunarCoast") {
    // Spacecraft is now a passive body in the full N-body gravity field.
    // The EIH integrator handles everything — no thrust needed.
    _pendingThrust.active = false;
    _state.currentThrustN = 0;
    _state.currentGForce = 0;
    return;
  }

  // ── Phase: Descent (powered landing) ────────────────────────
  if (_state.phase === "descent") {
    const kt = bodyK(_state.targetBodyIndex);
    if (_state.targetBodyIndex < 0 || _state.targetBodyIndex >= n) return;
    const tx = p.posM[kt] ?? 0;
    const ty = p.posM[kt + 1] ?? 0;
    const tz = p.posM[kt + 2] ?? 0;
    const tvx = p.velM[kt] ?? 0;
    const tvy = p.velM[kt + 1] ?? 0;
    const tvz = p.velM[kt + 2] ?? 0;
    const rsx = sx - tx;
    const rsy = sy - ty;
    const rsz = sz - tz;
    const [nx, ny, nz] = normalize3(rsx, rsy, rsz);
    const rvx = svx - tvx;
    const rvy = svy - tvy;
    const rvz = svz - tvz;
    const vVertical = rvx * nx + rvy * ny + rvz * nz;
    const radiusM =
      _state.targetBodyIndex === EARTH_BODY_INDEX
        ? EARTH_RADIUS_M
        : 3_390_000;
    const alt = Math.max(0, Math.hypot(rsx, rsy, rsz) - radiusM);
    const needBrake = Math.max(
      0,
      Math.abs(vVertical) - Math.max(1.3, Math.sqrt(Math.max(0, alt) * 0.00065))
    );
    const throttle = Math.max(0, Math.min(1, needBrake / 700));

    _pendingThrust.active = throttle > 0.001;
    _pendingThrust.dirX = -nx;
    _pendingThrust.dirY = -ny;
    _pendingThrust.dirZ = -nz;
    _pendingThrust.thrustN = 44_000 * throttle;
    _pendingThrust.totalMassKg = _state.totalMassKg;
    _pendingThrust.ispS = 310;

    _state.currentThrustN = 44_000 * throttle;

    if (alt <= 4 && Math.abs(vVertical) < 2) {
      _state.phase = "landed";
      _state.phaseElapsedS = 0;
      _pendingThrust.active = false;
      _state.currentThrustN = 0;
      setPosVel(
        p,
        SPACECRAFT_BODY_INDEX,
        tx + nx * (radiusM + 2),
        ty + ny * (radiusM + 2),
        tz + nz * (radiusM + 2),
        tvx,
        tvy,
        tvz
      );
    }
    return;
  }
}
