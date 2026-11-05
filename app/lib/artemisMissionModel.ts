/**
 * SLS Block 1 vehicle model for Artemis Mission simulation.
 *
 * Physical parameters from NASA fact sheets.
 * Thrust is applied as a post-integration velocity impulse
 * (Tsiolkovsky rocket equation) — no changes to the core EIH integrator.
 */

export type RocketStage = {
  id: string;
  dryMassKg: number;
  fuelMassKg: number;
  thrustVacuumN: number;
  thrustSeaLevelN: number;
  ispVacuumS: number;
  ispSeaLevelS: number;
};

export type StagingEvent = {
  timeS: number;
  action: string;
};

export type ArtemisVehicle = {
  stages: RocketStage[];
  payloadMassKg: number;
  stagingEvents: StagingEvent[];
};

/**
 * SLS Block 1 — Artemis I configuration.
 *
 * Stage 0: Two five-segment SRBs (combined)
 * Stage 1: Core stage (RS-25 × 4)
 * Stage 2: ICPS (RL-10C-2-1)
 * Payload: Orion MPCV (26,500 kg)
 */
export const SLS_BLOCK_1: ArtemisVehicle = {
  stages: [
    {
      id: "srb_pair",
      dryMassKg: 172_000,
      fuelMassKg: 1_256_000,
      thrustVacuumN: 16_000_000,
      thrustSeaLevelN: 14_000_000,
      ispVacuumS: 269,
      ispSeaLevelS: 242,
    },
    {
      id: "core",
      dryMassKg: 85_000,
      fuelMassKg: 893_000,
      thrustVacuumN: 4_018_000,
      thrustSeaLevelN: 3_300_000,
      ispVacuumS: 452,
      ispSeaLevelS: 366,
    },
    {
      id: "icps",
      dryMassKg: 3_500,
      fuelMassKg: 27_200,
      thrustVacuumN: 110_000,
      thrustSeaLevelN: 0,
      ispVacuumS: 459,
      ispSeaLevelS: 0,
    },
  ],
  payloadMassKg: 26_500,
  stagingEvents: [
    { timeS: 126, action: "srb_separation" },
    { timeS: 330, action: "meco" },
    { timeS: 335, action: "core_separation" },
    { timeS: 340, action: "icps_first_ignition" },
    { timeS: 760, action: "icps_first_cutoff" },
    { timeS: 4500, action: "tli_ignition" },
    { timeS: 4780, action: "tli_cutoff" },
    { timeS: 4790, action: "orion_separation" },
  ],
};

/** Standard gravity (m/s²) for Isp→mass-flow conversion. */
export const G0 = 9.80665;

/**
 * Interpolate effective Isp based on altitude.
 * Linear transition from sea-level to vacuum Isp over 0–100 km.
 */
export function effectiveIsp(
  stage: RocketStage,
  altitudeM: number
): number {
  const t = Math.max(0, Math.min(1, altitudeM / 100_000));
  return stage.ispSeaLevelS * (1 - t) + stage.ispVacuumS * t;
}

/**
 * Interpolate effective thrust based on altitude.
 */
export function effectiveThrust(
  stage: RocketStage,
  altitudeM: number
): number {
  const t = Math.max(0, Math.min(1, altitudeM / 100_000));
  return stage.thrustSeaLevelN * (1 - t) + stage.thrustVacuumN * t;
}

/** TLI delta-v budget (m/s). Used as a sanity check. */
export const TLI_DELTA_V_MS = 3_150;

/** Target LEO altitude for Artemis parking orbit (m). */
export const TARGET_LEO_ALT_M = 1_835_000; // ~1,835 km (actually ~185 km for real, but we use a wider view)

/** Target LEO altitude (m) — realistic 185 km. */
export const TARGET_LEO_ALT_REAL_M = 185_000;

/** Circular velocity at target LEO altitude (m/s). */
export function circularVelocity(altitudeM: number): number {
  const GM = 3.986004418e14; // Earth GM (m³/s²)
  const R = 6_378_137 + altitudeM;
  return Math.sqrt(GM / R);
}
