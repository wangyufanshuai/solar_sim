/**
 * Local launch physics engine — operates in meters and seconds,
 * Earth-centered coordinate frame, independent of the global AU-scale N-body simulation.
 *
 * During launch, the global EIH integrator is paused. This module runs its own
 * RK4 integration with simplified gravity (Earth + Moon point mass) and the
 * full SLS Block 1 multi-stage rocket model from artemisMissionModel.ts.
 */

import {
  SLS_BLOCK_1,
  effectiveIsp,
  effectiveThrust,
  G0,
  circularVelocity,
  TARGET_LEO_ALT_REAL_M,
  type ArtemisVehicle,
} from "./artemisMissionModel";
import type { LaunchConfig, LaunchMissionMode } from "./launchTelemetryTypes";

// ─── Constants ──────────────────────────────────────────────────────

const EARTH_RADIUS_M = 6_378_137;
const EARTH_GM = 3.986004418e14; // m³/s²
const MOON_GM = 4.9048695e12; // m³/s²
const ATMOSPHERE_SCALE_HEIGHT = 8500; // meters
const SEA_LEVEL_DENSITY = 1.225; // kg/m³
const EARTH_ROT_RATE = (2 * Math.PI) / 86164.0905; // rad/s

// ─── Phase types (reuse same enum as spacecraftAutopilot) ───────────

export type LocalLaunchPhase =
  | "prelaunch"
  | "srbBurn"
  | "coreBurn"
  | "staging"
  | "icpsFirst"
  | "orbitCoast"
  | "tliBurn"
  | "transLunarCoast"
  | "marsInjection"
  | "interplanetaryCoast";

// ─── Telemetry output ───────────────────────────────────────────────

export type LocalTelemetry = {
  phase: LocalLaunchPhase;
  missionName: string;
  destination: NonNullable<LaunchConfig["destination"]>;
  missionTimeS: number;
  altitudeKm: number;
  speedKms: number;
  gForce: number;
  thrustKN: number;
  stage: string;
  fuelPercent: number;
  downrangeKm: number;
  mach: number;
  dynamicPressurePa: number;
  totalMassKg: number;
  apoapsisAltKm: number;
  periapsisAltKm: number;
};

// ─── State ──────────────────────────────────────────────────────────

export type LocalLaunchState = {
  // Position & velocity relative to Earth center (meters, m/s)
  posX: number;
  posY: number;
  posZ: number;
  velX: number;
  velY: number;
  velZ: number;

  // Mission
  phase: LocalLaunchPhase;
  phaseElapsedS: number;
  missionTimeS: number;
  stageIndex: number;
  fuelRemaining: number[]; // kg per stage (3 entries for SLS Block 1)
  currentThrustN: number;
  currentGForce: number;
  totalMassKg: number;
  missionMode: LaunchMissionMode;
  missionName: string;
  destination: NonNullable<LaunchConfig["destination"]>;
  targetOrbitAltM: number;
  coastBeforeInjectionS: number;
  injectionBurnS: number;
  handoffAltitudeM: number;
  payloadMassKg: number;

  // Launch pad
  launchLatRad: number;
  launchLonRad: number;

  // Earth's heliocentric state at launch moment (for handoff)
  earthHeliocentricPosM: [number, number, number];
  earthHeliocentricVelMs: [number, number, number];

  // Moon offset from Earth at launch moment (meters)
  moonOffsetM: [number, number, number];

  // Computed telemetry
  altitudeM: number;
  speedMs: number;
  downrangeM: number;
  mach: number;
  dynamicPressurePa: number;
  apoapsisAltKm: number;
  periapsisAltKm: number;
};

// ─── Helpers ────────────────────────────────────────────────────────

function normalize3(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  const n = Math.hypot(x, y, z);
  if (n < 1e-9) return [0, 1, 0];
  return [x / n, y / n, z / n];
}

function computeTotalMass(
  vehicle: ArtemisVehicle,
  fuelRemaining: number[],
  stageIndex: number
): number {
  let m = vehicle.payloadMassKg;
  for (let i = 0; i < vehicle.stages.length; i++) {
    // Only include stages that haven't been jettisoned
    if (i >= stageIndex || i > 2) {
      m += vehicle.stages[i]!.dryMassKg;
    }
    m += Math.max(0, fuelRemaining[i] ?? 0);
  }
  return m;
}

function computeTotalMassWithPayload(
  vehicle: ArtemisVehicle,
  fuelRemaining: number[],
  stageIndex: number,
  payloadMassKg: number,
): number {
  return computeTotalMass(vehicle, fuelRemaining, stageIndex) - vehicle.payloadMassKg + payloadMassKg;
}

function getMissionSettings(config?: LaunchConfig): {
  missionMode: LaunchMissionMode;
  missionName: string;
  destination: NonNullable<LaunchConfig["destination"]>;
  targetOrbitAltM: number;
  coastBeforeInjectionS: number;
  injectionBurnS: number;
  handoffAltitudeM: number;
  payloadMassKg: number;
} {
  const missionMode = config?.missionMode ?? (config?.profile === "mars" ? "mars_cargo" : "lunar_flyby");
  const targetOrbitAltM = Math.max(160_000, Math.min(500_000, config?.target_altitude_m ?? TARGET_LEO_ALT_REAL_M));
  const isMars = missionMode === "mars_cargo" || missionMode === "mars_crew";
  const isLeo = missionMode === "leo";
  const requestedPayloadKg = config?.cargoMassKg ?? SLS_BLOCK_1.payloadMassKg;
  // The profile may describe a full Mars campaign payload. The local ascent
  // model represents the launch stack that reaches parking orbit, not every
  // cargo element assembled later, so clamp the mass to a flyable stack.
  const payloadMassKg = Math.max(
    12_000,
    Math.min(requestedPayloadKg, isMars ? 38_000 : 32_000),
  );

  return {
    missionMode,
    missionName: config?.missionName ?? (isMars ? "Mars Transfer" : isLeo ? "LEO Validation" : "Artemis"),
    destination: config?.destination ?? (isMars ? "Mars" : isLeo ? "LEO" : "Moon"),
    targetOrbitAltM,
    coastBeforeInjectionS: isLeo ? Number.POSITIVE_INFINITY : isMars ? 6400 : 4500,
    injectionBurnS: isMars ? 560 : missionMode === "gateway_logistics" ? 340 : 280,
    handoffAltitudeM: isMars ? 95_000_000 : isLeo ? 700_000 : 50_000_000,
    payloadMassKg,
  };
}

/** Exponential atmosphere density model. */
function atmosphereDensity(altitudeM: number): number {
  if (altitudeM < 0 || altitudeM > 200_000) return 0;
  return SEA_LEVEL_DENSITY * Math.exp(-altitudeM / ATMOSPHERE_SCALE_HEIGHT);
}

/** Approximate speed of sound (m/s) based on altitude. */
function speedOfSound(altitudeM: number): number {
  // Simplified ISA model: 340 m/s at sea level, decreasing with altitude
  if (altitudeM < 11_000) return 340.3 - 0.004 * altitudeM;
  if (altitudeM < 25_000) return 295.0;
  return 295.0 + 0.001 * (altitudeM - 25_000);
}

/**
 * Compute apsidal altitudes from position and velocity relative to Earth center.
 * Uses vis-viva equation.
 */
function computeApsides(
  rM: number,
  vMs: number,
  gm: number
): { apoapsisKm: number; periapsisKm: number } {
  // Specific orbital energy
  const eps = vMs * vMs / 2 - gm / rM;
  if (eps >= 0) {
    // Hyperbolic — no apoapsis
    return { apoapsisKm: Infinity, periapsisKm: (rM - EARTH_RADIUS_M) / 1000 };
  }
  const a = -gm / (2 * eps); // semi-major axis
  // Specific angular momentum magnitude
  // h = |r × v|, but we need eccentricity
  // For simplicity, compute from vis-viva:
  // Use energy-based approach:
  // v² = gm (2/r - 1/a) → already known
  // e = sqrt(1 - h²/(gm*a))
  // Instead, use: r_apo = a(1+e), r_peri = a(1-e)
  // and r = a(1-e²)/(1+e*cos(θ)) — at current point
  // Simplified: just use a and compute e from current r
  // Actually let's use the simpler formula:
  // From angular momentum: h = r × v (magnitude)
  // We don't have the cross product easily from scalars, so use:
  // At any point: r = a(1-e²)/(1+e*cos(θ))
  // Since we know r, a, and eps, compute e from:
  //   e = sqrt(1 + 2*eps*h²/(gm²))
  // But h requires cross product.
  // Alternative: from vis-viva and radial velocity
  // Let's use a simpler approach: assume circular-ish and report current radius
  const approxE = Math.abs(1 - rM / a);
  const rApo = a * (1 + approxE);
  const rPeri = a * (1 - approxE);
  return {
    apoapsisKm: (rApo - EARTH_RADIUS_M) / 1000,
    periapsisKm: (rPeri - EARTH_RADIUS_M) / 1000,
  };
}

// ─── Create initial state ───────────────────────────────────────────

/**
 * Create the local launch state, positioned on Earth's surface at the given lat/lon.
 *
 * @param earthPosM Earth's heliocentric position [x,y,z] in meters
 * @param earthVelMs Earth's heliocentric velocity [vx,vy,vz] in m/s
 * @param lat Launch latitude (radians)
 * @param lon Launch longitude (radians)
 * @param moonOffsetM Moon's position offset from Earth [x,y,z] in meters
 */
export function createLocalLaunchState(
  earthPosM: [number, number, number],
  earthVelMs: [number, number, number],
  lat: number,
  lon: number,
  moonOffsetM: [number, number, number],
  config?: LaunchConfig,
): LocalLaunchState {
  // Position on Earth surface (ECEF-like, then rotated by sidereal angle = 0 at launch epoch)
  const cl = Math.cos(lat);
  const sl = Math.sin(lat);
  const cs = Math.cos(lon);
  const ss = Math.sin(lon);
  const surfaceX = EARTH_RADIUS_M * cl * cs;
  const surfaceY = EARTH_RADIUS_M * cl * ss;
  const surfaceZ = EARTH_RADIUS_M * sl;

  // Surface velocity from Earth rotation
  const surfVelX = -EARTH_ROT_RATE * surfaceY;
  const surfVelY = EARTH_ROT_RATE * surfaceX;
  const surfVelZ = 0;

  const fuelRemaining = SLS_BLOCK_1.stages.map((s) => s.fuelMassKg);
  const mission = getMissionSettings(config);

  return {
    posX: surfaceX,
    posY: surfaceY,
    posZ: surfaceZ,
    velX: surfVelX,
    velY: surfVelY,
    velZ: surfVelZ,

    phase: "prelaunch",
    phaseElapsedS: 0,
    missionTimeS: 0,
    stageIndex: 0,
    fuelRemaining,
    currentThrustN: 0,
    currentGForce: 0,
    totalMassKg: computeTotalMassWithPayload(SLS_BLOCK_1, fuelRemaining, 0, mission.payloadMassKg),
    missionMode: mission.missionMode,
    missionName: mission.missionName,
    destination: mission.destination,
    targetOrbitAltM: mission.targetOrbitAltM,
    coastBeforeInjectionS: mission.coastBeforeInjectionS,
    injectionBurnS: mission.injectionBurnS,
    handoffAltitudeM: mission.handoffAltitudeM,
    payloadMassKg: mission.payloadMassKg,

    launchLatRad: lat,
    launchLonRad: lon,

    earthHeliocentricPosM: [...earthPosM],
    earthHeliocentricVelMs: [...earthVelMs],
    moonOffsetM: [...moonOffsetM],

    altitudeM: 0,
    speedMs: 0,
    downrangeM: 0,
    mach: 0,
    dynamicPressurePa: 0,
    apoapsisAltKm: 0,
    periapsisAltKm: 0,
  };
}

// ─── RK4 integration helpers ────────────────────────────────────────

type Vec3 = { x: number; y: number; z: number };

function gravityAccel(pos: Vec3, moonOffset: [number, number, number]): Vec3 {
  const r = Math.hypot(pos.x, pos.y, pos.z);
  const rSafe = Math.max(r, EARTH_RADIUS_M * 0.5);
  const r3 = rSafe * rSafe * rSafe;

  // Earth gravity
  let ax = -EARTH_GM * pos.x / r3;
  let ay = -EARTH_GM * pos.y / r3;
  let az = -EARTH_GM * pos.z / r3;

  // Moon gravity (point mass at offset from Earth)
  const mx = moonOffset[0] - pos.x;
  const my = moonOffset[1] - pos.y;
  const mz = moonOffset[2] - pos.z;
  const mr = Math.max(Math.hypot(mx, my, mz), 1e6);
  const mr3 = mr * mr * mr;
  ax += MOON_GM * mx / mr3;
  ay += MOON_GM * my / mr3;
  az += MOON_GM * mz / mr3;

  return { x: ax, y: ay, z: az };
}

type DerivState = {
  vx: number; vy: number; vz: number;
  ax: number; ay: number; az: number;
};

function derivs(
  pos: Vec3,
  vel: Vec3,
  moonOffset: [number, number, number],
  thrustDir: Vec3,
  thrustAccel: number
): DerivState {
  const g = gravityAccel(pos, moonOffset);
  return {
    vx: vel.x,
    vy: vel.y,
    vz: vel.z,
    ax: g.x + thrustDir.x * thrustAccel,
    ay: g.y + thrustDir.y * thrustAccel,
    az: g.z + thrustDir.z * thrustAccel,
  };
}

function rk4Step(
  pos: Vec3,
  vel: Vec3,
  dt: number,
  moonOffset: [number, number, number],
  thrustDir: Vec3,
  thrustAccel: number
): { pos: Vec3; vel: Vec3 } {
  const k1 = derivs(pos, vel, moonOffset, thrustDir, thrustAccel);

  const p2: Vec3 = {
    x: pos.x + k1.vx * dt * 0.5,
    y: pos.y + k1.vy * dt * 0.5,
    z: pos.z + k1.vz * dt * 0.5,
  };
  const v2: Vec3 = {
    x: vel.x + k1.ax * dt * 0.5,
    y: vel.y + k1.ay * dt * 0.5,
    z: vel.z + k1.az * dt * 0.5,
  };
  const k2 = derivs(p2, v2, moonOffset, thrustDir, thrustAccel);

  const p3: Vec3 = {
    x: pos.x + k2.vx * dt * 0.5,
    y: pos.y + k2.vy * dt * 0.5,
    z: pos.z + k2.vz * dt * 0.5,
  };
  const v3: Vec3 = {
    x: vel.x + k2.ax * dt * 0.5,
    y: vel.y + k2.ay * dt * 0.5,
    z: vel.z + k2.az * dt * 0.5,
  };
  const k3 = derivs(p3, v3, moonOffset, thrustDir, thrustAccel);

  const p4: Vec3 = {
    x: pos.x + k3.vx * dt,
    y: pos.y + k3.vy * dt,
    z: pos.z + k3.vz * dt,
  };
  const v4: Vec3 = {
    x: vel.x + k3.ax * dt,
    y: vel.y + k3.ay * dt,
    z: vel.z + k3.az * dt,
  };
  const k4 = derivs(p4, v4, moonOffset, thrustDir, thrustAccel);

  return {
    pos: {
      x: pos.x + (k1.vx + 2 * k2.vx + 2 * k3.vx + k4.vx) * dt / 6,
      y: pos.y + (k1.vy + 2 * k2.vy + 2 * k3.vy + k4.vy) * dt / 6,
      z: pos.z + (k1.vz + 2 * k2.vz + 2 * k3.vz + k4.vz) * dt / 6,
    },
    vel: {
      x: vel.x + (k1.ax + 2 * k2.ax + 2 * k3.ax + k4.ax) * dt / 6,
      y: vel.y + (k1.ay + 2 * k2.ay + 2 * k3.ay + k4.ay) * dt / 6,
      z: vel.z + (k1.az + 2 * k2.az + 2 * k3.az + k4.az) * dt / 6,
    },
  };
}

// ─── Phase logic: compute thrust for current phase ──────────────────

type ThrustCommand = {
  dirX: number;
  dirY: number;
  dirZ: number;
  thrustN: number;
  ispS: number;
  fuelStageIndex: number; // which stage's fuel to consume
  /** Whether to consume fuel from both stages 0 AND 1 simultaneously. */
  dualBurn: boolean;
};

function computeThrustForPhase(
  state: LocalLaunchState
): ThrustCommand | null {
  const [upx, upy, upz] = normalize3(state.posX, state.posY, state.posZ);
  const [prox, proy, proz] = normalize3(state.velX, state.velY, state.velZ);
  const alt = state.altitudeM;

  switch (state.phase) {
    case "prelaunch":
      return null;

    case "srbBurn": {
      // SRBs + Core fire simultaneously
      const srbStage = SLS_BLOCK_1.stages[0]!;
      const coreStage = SLS_BLOCK_1.stages[1]!;
      const srbThrust = effectiveThrust(srbStage, alt);
      const coreThrust = effectiveThrust(coreStage, alt);
      const totalThrust = srbThrust + coreThrust;

      // Gravity turn: vertical → prograde interpolation
      const turn = Math.max(0, Math.min(1, (alt - 500) / 40_000));
      const tx = upx * (1 - turn) + prox * turn;
      const ty = upy * (1 - turn) + proy * turn;
      const tz = upz * (1 - turn) + proz * turn;
      const [dx, dy, dz] = normalize3(tx, ty, tz);

      // Combined Isp
      const srbIsp = effectiveIsp(srbStage, alt);
      const coreIsp = effectiveIsp(coreStage, alt);
      const combinedIsp =
        (srbThrust + coreThrust) /
        (srbThrust / srbIsp + coreThrust / coreIsp);

      return {
        dirX: dx, dirY: dy, dirZ: dz,
        thrustN: totalThrust,
        ispS: combinedIsp,
        fuelStageIndex: 0,
        dualBurn: true,
      };
    }

    case "coreBurn": {
      const coreStage = SLS_BLOCK_1.stages[1]!;
      const thrust = effectiveThrust(coreStage, alt);
      const isp = effectiveIsp(coreStage, alt);

      const turn = Math.max(0, Math.min(1, (alt - 12_000) / 130_000));
      const tx = upx * (1 - turn) + prox * turn;
      const ty = upy * (1 - turn) + proy * turn;
      const tz = upz * (1 - turn) + proz * turn;
      const [dx, dy, dz] = normalize3(tx, ty, tz);

      return {
        dirX: dx, dirY: dy, dirZ: dz,
        thrustN: thrust,
        ispS: isp,
        fuelStageIndex: 1,
        dualBurn: false,
      };
    }

    case "staging":
      return null;

    case "icpsFirst": {
      const icpsStage = SLS_BLOCK_1.stages[2]!;
      return {
        dirX: prox, dirY: proy, dirZ: proz,
        thrustN: icpsStage.thrustVacuumN,
        ispS: icpsStage.ispVacuumS,
        fuelStageIndex: 2,
        dualBurn: false,
      };
    }

    case "orbitCoast":
      return null;

    case "tliBurn": {
      const icpsStage = SLS_BLOCK_1.stages[2]!;
      return {
        dirX: prox, dirY: proy, dirZ: proz,
        thrustN: icpsStage.thrustVacuumN,
        ispS: icpsStage.ispVacuumS,
        fuelStageIndex: 2,
        dualBurn: false,
      };
    }

    case "marsInjection": {
      const icpsStage = SLS_BLOCK_1.stages[2]!;
      return {
        dirX: prox, dirY: proy, dirZ: proz,
        thrustN: icpsStage.thrustVacuumN * 1.18,
        ispS: icpsStage.ispVacuumS * 1.03,
        fuelStageIndex: 2,
        dualBurn: false,
      };
    }

    case "transLunarCoast":
    case "interplanetaryCoast":
      return null;

    default:
      return null;
  }
}

// ─── Main step function ─────────────────────────────────────────────

/**
 * Advance local launch physics by `dtS` seconds.
 * Runs RK4 integration with thrust applied as acceleration.
 * Handles phase transitions and fuel consumption.
 */
export function stepLocalLaunch(
  state: LocalLaunchState,
  dtS: number
): void {
  if (dtS <= 0) return;

  state.phaseElapsedS += dtS;
  state.missionTimeS += dtS;

  // Compute telemetry values
  const r = Math.hypot(state.posX, state.posY, state.posZ);
  state.altitudeM = Math.max(0, r - EARTH_RADIUS_M);
  state.speedMs = Math.hypot(state.velX, state.velY, state.velZ);
  const rho = atmosphereDensity(state.altitudeM);
  state.dynamicPressurePa = 0.5 * rho * state.speedMs * state.speedMs;
  state.mach = state.speedMs / speedOfSound(state.altitudeM);

  // Compute downrange (great circle distance on Earth surface)
  const [launchUpX, launchUpY, launchUpZ] = surfaceNormal(
    state.launchLatRad,
    state.launchLonRad
  );
  // Cross product gives tangent; dot with current position gives downrange angle
  const dotUp =
    state.posX * launchUpX + state.posY * launchUpY + state.posZ * launchUpZ;
  const horizR = Math.sqrt(
    state.posX * state.posX +
      state.posY * state.posY +
      state.posZ * state.posZ -
      dotUp * dotUp
  );
  state.downrangeM = horizR > 0 ? Math.atan2(horizR, dotUp) * EARTH_RADIUS_M : 0;

  // Compute apsides
  const apsides = computeApsides(r, state.speedMs, EARTH_GM);
  state.apoapsisAltKm = apsides.apoapsisKm;
  state.periapsisAltKm = apsides.periapsisKm;

  // ── Phase: Prelaunch ──────────────────────────────────────────
  if (state.phase === "prelaunch") {
    state.currentThrustN = 0;
    state.currentGForce = 0;
    // After 2s, ignite
    if (state.phaseElapsedS >= 2) {
      state.phase = "srbBurn";
      state.stageIndex = 0;
      state.phaseElapsedS = 0;
    }
    return;
  }

  // ── Compute thrust for current phase ──────────────────────────
  const cmd = computeThrustForPhase(state);

  if (cmd && cmd.thrustN > 0 && state.totalMassKg > 0) {
    const thrustAccel = cmd.thrustN / state.totalMassKg;
    const thrustDir: Vec3 = { x: cmd.dirX, y: cmd.dirY, z: cmd.dirZ };

    // RK4 step
    const pos: Vec3 = { x: state.posX, y: state.posY, z: state.posZ };
    const vel: Vec3 = { x: state.velX, y: state.velY, z: state.velZ };
    const result = rk4Step(pos, vel, dtS, state.moonOffsetM, thrustDir, thrustAccel);

    state.posX = result.pos.x;
    state.posY = result.pos.y;
    state.posZ = result.pos.z;
    state.velX = result.vel.x;
    state.velY = result.vel.y;
    state.velZ = result.vel.z;

    // Consume fuel
    if (cmd.ispS > 0) {
      const fuelRate = cmd.thrustN / (cmd.ispS * G0); // kg/s
      const consumed = fuelRate * dtS;

      if (cmd.dualBurn) {
        // SRB+Core: consume from both stages proportionally
        const srbStage = SLS_BLOCK_1.stages[0]!;
        const coreStage = SLS_BLOCK_1.stages[1]!;
        const srbThrust = effectiveThrust(srbStage, state.altitudeM);
        const coreThrust = effectiveThrust(coreStage, state.altitudeM);
        const totalThrust = srbThrust + coreThrust;

        const srbConsumed = consumed * (srbThrust / totalThrust);
        const coreConsumed = consumed * (coreThrust / totalThrust);

        state.fuelRemaining[0] = Math.max(0, state.fuelRemaining[0]! - srbConsumed);
        state.fuelRemaining[1] = Math.max(0, state.fuelRemaining[1]! - coreConsumed);
      } else {
        const idx = cmd.fuelStageIndex;
        state.fuelRemaining[idx] = Math.max(0, state.fuelRemaining[idx]! - consumed);
      }
    }

    state.currentThrustN = cmd.thrustN;
    state.currentGForce = cmd.thrustN / (state.totalMassKg * G0);
    state.totalMassKg = computeTotalMassWithPayload(
      SLS_BLOCK_1,
      state.fuelRemaining,
      state.stageIndex,
      state.payloadMassKg,
    );
  } else {
    // Coast — gravity only
    const pos: Vec3 = { x: state.posX, y: state.posY, z: state.posZ };
    const vel: Vec3 = { x: state.velX, y: state.velY, z: state.velZ };
    const zeroDir: Vec3 = { x: 0, y: 0, z: 0 };
    const result = rk4Step(pos, vel, dtS, state.moonOffsetM, zeroDir, 0);

    state.posX = result.pos.x;
    state.posY = result.pos.y;
    state.posZ = result.pos.z;
    state.velX = result.vel.x;
    state.velY = result.vel.y;
    state.velZ = result.vel.z;

    state.currentThrustN = 0;
    state.currentGForce = 0;
  }

  // ── Phase transitions ─────────────────────────────────────────

  if (state.phase === "srbBurn") {
    if (state.fuelRemaining[0]! <= 0 || state.missionTimeS >= 126) {
      state.phase = "coreBurn";
      state.stageIndex = 1;
      state.phaseElapsedS = 0;
      // Jettison SRBs (zero out their dry mass + fuel)
      state.fuelRemaining[0] = 0;
    }
  }

  if (state.phase === "coreBurn") {
    if (state.fuelRemaining[1]! <= 0 || state.missionTimeS >= 330) {
      state.phase = "staging";
      state.stageIndex = 2;
      state.phaseElapsedS = 0;
      state.fuelRemaining[1] = 0;
      state.currentThrustN = 0;
      state.currentGForce = 0;
    }
  }

  if (state.phase === "staging") {
    state.currentThrustN = 0;
    state.currentGForce = 0;
    if (state.phaseElapsedS >= 5) {
      state.phase = "icpsFirst";
      state.phaseElapsedS = 0;
    }
  }

  if (state.phase === "icpsFirst") {
    const targetSpeed = circularVelocity(state.targetOrbitAltM);
    if (state.altitudeM >= state.targetOrbitAltM && state.speedMs >= targetSpeed * 0.98) {
      state.phase = "orbitCoast";
      state.phaseElapsedS = 0;
      state.currentThrustN = 0;
      state.currentGForce = 0;
    }
  }

  if (state.phase === "orbitCoast") {
    state.currentThrustN = 0;
    state.currentGForce = 0;
    if (state.missionTimeS >= state.coastBeforeInjectionS) {
      if (state.destination === "Mars") {
        state.fuelRemaining[2] = Math.max(state.fuelRemaining[2]!, 58_000);
        state.phase = "marsInjection";
      } else {
        state.fuelRemaining[2] = Math.max(state.fuelRemaining[2]!, 18_000);
        state.phase = "tliBurn";
      }
      state.phaseElapsedS = 0;
    }
  }

  if (state.phase === "tliBurn") {
    if (state.fuelRemaining[2]! <= 0 || state.phaseElapsedS >= state.injectionBurnS) {
      state.phase = "transLunarCoast";
      state.phaseElapsedS = 0;
      state.currentThrustN = 0;
      state.currentGForce = 0;
    }
  }

  if (state.phase === "marsInjection") {
    if (state.fuelRemaining[2]! <= 0 || state.phaseElapsedS >= state.injectionBurnS) {
      state.phase = "interplanetaryCoast";
      state.phaseElapsedS = 0;
      state.currentThrustN = 0;
      state.currentGForce = 0;
    }
  }

  // transLunarCoast/interplanetaryCoast: no transitions, just coast
}

// ─── Helpers ────────────────────────────────────────────────────────

function surfaceNormal(lat: number, lon: number): [number, number, number] {
  return [
    Math.cos(lat) * Math.cos(lon),
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
  ];
}

// ─── Scale conversion ───────────────────────────────────────────────

/**
 * Convert local Earth-centered position/velocity to heliocentric frame.
 * Used when handing off from local launch physics to global N-body simulation.
 */
export function convertToHeliocentric(state: LocalLaunchState): {
  posM: [number, number, number];
  velMs: [number, number, number];
} {
  return {
    posM: [
      state.earthHeliocentricPosM[0] + state.posX,
      state.earthHeliocentricPosM[1] + state.posY,
      state.earthHeliocentricPosM[2] + state.posZ,
    ],
    velMs: [
      state.earthHeliocentricVelMs[0] + state.velX,
      state.earthHeliocentricVelMs[1] + state.velY,
      state.earthHeliocentricVelMs[2] + state.velZ,
    ],
  };
}

/**
 * Check if the local launch phase has completed (orbit coast achieved).
 */
export function isLocalPhaseReadyForHandoff(state: LocalLaunchState): boolean {
  return (
    state.phase === "orbitCoast" ||
    state.phase === "tliBurn" ||
    state.phase === "transLunarCoast" ||
    state.phase === "marsInjection" ||
    state.phase === "interplanetaryCoast"
  );
}

/**
 * Extract telemetry for UI display.
 */
export function getLocalTelemetry(state: LocalLaunchState): LocalTelemetry {
  const totalFuel = SLS_BLOCK_1.stages.reduce((s, st) => s + st.fuelMassKg, 0);
  const remainingFuel = state.fuelRemaining.reduce((s, f) => s + f, 0);

  return {
    phase: state.phase,
    missionName: state.missionName,
    destination: state.destination,
    missionTimeS: state.missionTimeS,
    altitudeKm: state.altitudeM / 1000,
    speedKms: state.speedMs / 1000,
    gForce: state.currentGForce,
    thrustKN: state.currentThrustN / 1000,
    stage:
      state.phase === "marsInjection"
        ? "MARS-INJ"
        : state.phase === "interplanetaryCoast"
          ? "CRUISE"
          : state.phase === "transLunarCoast"
            ? "TLC"
            :
      state.stageIndex < SLS_BLOCK_1.stages.length
        ? SLS_BLOCK_1.stages[state.stageIndex]!.id
        : "none",
    fuelPercent: (remainingFuel / totalFuel) * 100,
    downrangeKm: state.downrangeM / 1000,
    mach: state.mach,
    dynamicPressurePa: state.dynamicPressurePa,
    totalMassKg: state.totalMassKg,
    apoapsisAltKm: state.apoapsisAltKm,
    periapsisAltKm: state.periapsisAltKm,
  };
}

/** Scene scale: 1 scene unit = EARTH_RADIUS_M meters. */
export const EARTH_SCENE_RADIUS = 1.0;

/** Convert local meters to scene units. */
export function localMToScene(m: number): number {
  return (m / EARTH_RADIUS_M) * EARTH_SCENE_RADIUS;
}
