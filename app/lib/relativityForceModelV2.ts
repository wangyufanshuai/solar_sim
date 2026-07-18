import { calculateAcceleration } from "./physicsEngine";
import { C_LIGHT, G_SI } from "./physicalConstants";

export const RELATIVITY_FORCE_MODEL_V2_VERSION =
  "v128-relativity-force-model-v2-shadow" as const;

export type RelativityForceModelV2Config = {
  mode: "shadow";
  centralBodyIndex: number;
  solarGmM3S2: number;
  solarSpinAngularMomentumKgM2S: number;
  solarSpinAxisJ2000: readonly [number, number, number];
  includeSolar2PnMonopole: boolean;
  includeSolarLenseThirring: boolean;
  preserveLinearMomentum: boolean;
  coordinateGauge: "harmonic";
  timeScale: "TDB-compatible-SI-shadow";
  softeningMeters2: 0;
};

export type RelativityShadowComparison = {
  version: typeof RELATIVITY_FORCE_MODEL_V2_VERSION;
  mode: "shadow-read-only";
  bodyCount: number;
  newtonAccelerationRmsMS2: number;
  eih1PnDeltaRmsMS2: number;
  solar2PnAndLtDeltaRmsMS2: number;
  combinedV2DeltaRmsMS2: number;
  liveStateMutated: false;
  promotion: "blocked-pending-ephemeris-gates";
};

export const RELATIVITY_V2_EPHEMERIS_GATES = {
  firstStage: {
    positionRmsKmExclusive: 100_000,
    velocityRmsMSExclusive: 3,
  },
  promotion: {
    positionRmsKmExclusive: 10_000,
    velocityRmsMSExclusive: 1,
  },
} as const;

const DEG_TO_RAD = Math.PI / 180;
const SOLAR_POLE_RA_J2000_RAD = 286.13 * DEG_TO_RAD;
const SOLAR_POLE_DEC_J2000_RAD = 63.87 * DEG_TO_RAD;

export const DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG: RelativityForceModelV2Config = {
  mode: "shadow",
  centralBodyIndex: 0,
  solarGmM3S2: 1.3271244004127942e20,
  solarSpinAngularMomentumKgM2S: 1.92e41,
  solarSpinAxisJ2000: [
    Math.cos(SOLAR_POLE_DEC_J2000_RAD) * Math.cos(SOLAR_POLE_RA_J2000_RAD),
    Math.cos(SOLAR_POLE_DEC_J2000_RAD) * Math.sin(SOLAR_POLE_RA_J2000_RAD),
    Math.sin(SOLAR_POLE_DEC_J2000_RAD),
  ],
  includeSolar2PnMonopole: true,
  includeSolarLenseThirring: true,
  preserveLinearMomentum: true,
  coordinateGauge: "harmonic",
  timeScale: "TDB-compatible-SI-shadow",
  softeningMeters2: 0,
};

/**
 * Adds the solar test-particle 2PN monopole and Lense-Thirring terms in SI.
 *
 * 2PN harmonic-coordinate monopole:
 * Iorio, Universe 6, 53 (2020), Eq. (1), DOI 10.3390/universe6040053.
 * LT arbitrary-spin acceleration:
 * Iorio, Astronomy 1, 2 (2022), Eq. (22), DOI 10.3390/astronomy1010002.
 * Solar pole: NASA NSSDC J2000 RA 286.13 deg, Dec 63.87 deg.
 * Solar angular momentum: helioseismology mean 1.92e41 kg m2 s-1.
 *
 * This function is shadow-only. It never writes to pos, vel, or mass.
 */
export function calculateRelativityForceModelV2Delta(
  posM: Float64Array,
  velMS: Float64Array,
  massKg: Float64Array,
  n: number,
  outDeltaMS2: Float64Array,
  config: RelativityForceModelV2Config = DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG,
): void {
  if (posM.length < 3 * n || velMS.length < 3 * n || massKg.length < n) {
    throw new RangeError("Relativity V2 state arrays are smaller than body count");
  }
  if (outDeltaMS2.length < 3 * n) {
    throw new RangeError("Relativity V2 output array is smaller than body count");
  }
  if (config.centralBodyIndex < 0 || config.centralBodyIndex >= n) {
    throw new RangeError("Relativity V2 central body index is invalid");
  }

  outDeltaMS2.fill(0);
  const sun = config.centralBodyIndex;
  const sunOffset = 3 * sun;
  const sunMass = massKg[sun];
  const mu = config.solarGmM3S2;
  const invC2 = 1 / (C_LIGHT * C_LIGHT);
  const invC4 = invC2 * invC2;
  const [spinX, spinY, spinZ] = normalized(config.solarSpinAxisJ2000);
  const ltScaleNumerator =
    2 * G_SI * config.solarSpinAngularMomentumKgM2S * invC2;

  for (let body = 0; body < n; body += 1) {
    if (body === sun) continue;
    const offset = 3 * body;
    const rx = posM[offset] - posM[sunOffset];
    const ry = posM[offset + 1] - posM[sunOffset + 1];
    const rz = posM[offset + 2] - posM[sunOffset + 2];
    const vx = velMS[offset] - velMS[sunOffset];
    const vy = velMS[offset + 1] - velMS[sunOffset + 1];
    const vz = velMS[offset + 2] - velMS[sunOffset + 2];
    const r2 = rx * rx + ry * ry + rz * rz;
    if (!(r2 > 0)) continue;

    const r = Math.sqrt(r2);
    const invR = 1 / r;
    const nx = rx * invR;
    const ny = ry * invR;
    const nz = rz * invR;
    const radialVelocity = vx * nx + vy * ny + vz * nz;
    let ax = 0;
    let ay = 0;
    let az = 0;

    if (config.includeSolar2PnMonopole) {
      const scalar = 2 * radialVelocity * radialVelocity - 9 * mu * invR;
      const scale = mu * mu * invC4 * invR * invR * invR;
      ax += scale * (scalar * nx - 2 * radialVelocity * vx);
      ay += scale * (scalar * ny - 2 * radialVelocity * vy);
      az += scale * (scalar * nz - 2 * radialVelocity * vz);
    }

    if (config.includeSolarLenseThirring) {
      const spinDotN = spinX * nx + spinY * ny + spinZ * nz;
      const nCrossVx = ny * vz - nz * vy;
      const nCrossVy = nz * vx - nx * vz;
      const nCrossVz = nx * vy - ny * vx;
      const vCrossSpinX = vy * spinZ - vz * spinY;
      const vCrossSpinY = vz * spinX - vx * spinZ;
      const vCrossSpinZ = vx * spinY - vy * spinX;
      const scale = ltScaleNumerator * invR * invR * invR;
      ax += scale * (3 * spinDotN * nCrossVx + vCrossSpinX);
      ay += scale * (3 * spinDotN * nCrossVy + vCrossSpinY);
      az += scale * (3 * spinDotN * nCrossVz + vCrossSpinZ);
    }

    const bodyMass = massKg[body];
    const relativeDenominator = config.preserveLinearMomentum
      ? sunMass + bodyMass
      : sunMass;
    const bodyShare = sunMass / relativeDenominator;
    const sunShare = config.preserveLinearMomentum
      ? bodyMass / relativeDenominator
      : 0;
    outDeltaMS2[offset] += ax * bodyShare;
    outDeltaMS2[offset + 1] += ay * bodyShare;
    outDeltaMS2[offset + 2] += az * bodyShare;
    outDeltaMS2[sunOffset] -= ax * sunShare;
    outDeltaMS2[sunOffset + 1] -= ay * sunShare;
    outDeltaMS2[sunOffset + 2] -= az * sunShare;
  }
}

export function compareRelativityForceModelsShadow(
  posM: Float64Array,
  velMS: Float64Array,
  massKg: Float64Array,
  n: number,
  config: RelativityForceModelV2Config = DEFAULT_RELATIVITY_FORCE_MODEL_V2_CONFIG,
): RelativityShadowComparison {
  const width = 3 * n;
  const aNewt = new Float64Array(width);
  const phi = new Float64Array(n);
  const newton = new Float64Array(width);
  const eih = new Float64Array(width);
  const v2 = new Float64Array(width);
  calculateAcceleration(posM, velMS, massKg, n, G_SI, 0, 0, aNewt, phi, newton);
  calculateAcceleration(
    posM,
    velMS,
    massKg,
    n,
    G_SI,
    1 / (C_LIGHT * C_LIGHT),
    0,
    aNewt,
    phi,
    eih,
  );
  calculateRelativityForceModelV2Delta(posM, velMS, massKg, n, v2, config);

  return {
    version: RELATIVITY_FORCE_MODEL_V2_VERSION,
    mode: "shadow-read-only",
    bodyCount: n,
    newtonAccelerationRmsMS2: rms(newton),
    eih1PnDeltaRmsMS2: rmsDifference(eih, newton),
    solar2PnAndLtDeltaRmsMS2: rms(v2),
    combinedV2DeltaRmsMS2: rmsCombinedDifference(eih, newton, v2),
    liveStateMutated: false,
    promotion: "blocked-pending-ephemeris-gates",
  };
}

function normalized(
  vector: readonly [number, number, number],
): readonly [number, number, number] {
  const magnitude = Math.hypot(vector[0], vector[1], vector[2]);
  if (!(magnitude > 0)) throw new RangeError("Solar spin axis must be non-zero");
  return [vector[0] / magnitude, vector[1] / magnitude, vector[2] / magnitude];
}

function rms(values: Float64Array): number {
  let sum = 0;
  for (let index = 0; index < values.length; index += 1) {
    sum += values[index] * values[index];
  }
  return Math.sqrt(sum / Math.max(1, values.length));
}

function rmsDifference(a: Float64Array, b: Float64Array): number {
  let sum = 0;
  for (let index = 0; index < a.length; index += 1) {
    const delta = a[index] - b[index];
    sum += delta * delta;
  }
  return Math.sqrt(sum / Math.max(1, a.length));
}

function rmsCombinedDifference(
  eih: Float64Array,
  newton: Float64Array,
  v2Delta: Float64Array,
): number {
  let sum = 0;
  for (let index = 0; index < eih.length; index += 1) {
    const delta = eih[index] - newton[index] + v2Delta[index];
    sum += delta * delta;
  }
  return Math.sqrt(sum / Math.max(1, eih.length));
}
