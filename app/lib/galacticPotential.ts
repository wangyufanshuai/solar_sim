/**
 * Analytical galactic gravitational potential for large-scale simulation.
 *
 * Two components:
 * 1. **Miyamoto-Nagai** – flattened stellar disk potential.
 *    Phi(R,z) = -G * M_disk / sqrt(R^2 + (a + sqrt(z^2 + b^2))^2)
 *
 * 2. **NFW** (Navarro-Frenk-White) – dark matter halo potential.
 *    Phi(r) = -G * M_vir / (ln(1+c) - c/(1+c)) * ln(1 + r/rs) / r
 *
 * All internal calculations use SI (meters, kg, s).
 * Public API accepts AU positions and returns m/s^2 acceleration.
 */

import { G_SI, AU_METERS } from "./physicalConstants";

// ── Constants ────────────────────────────────────────────────────────

/** Solar mass in kg. */
const M_SUN_KG = 1.98892e30;

/** Parsec in meters. */
const PC_METERS = 3.08568e16;

/** Kiloparsec in meters. */
const KPC_METERS = 3.08568e19;

// ── Parameters ───────────────────────────────────────────────────────

export type GalacticPotentialParams = {
  // Miyamoto-Nagai disk
  /** Disk mass in kg. Default ~1.0e11 M_sun ≈ 2.0e41 kg. */
  diskMassKg: number;
  /** Disk radial scale length in meters. Default 6.5 kpc. */
  diskScaleA_M: number;
  /** Disk vertical scale height in meters. Default 0.26 kpc. */
  diskScaleB_M: number;

  // NFW halo
  /** Halo virial mass in kg. Default ~1.0e12 M_sun ≈ 2.0e42 kg. */
  haloVirialMassKg: number;
  /** Halo scale radius in meters. Default 20 kpc. */
  haloScaleRadius_M: number;
  /** Halo concentration parameter. Default 12. */
  haloConcentration: number;
};

export const DEFAULT_GALACTIC_POTENTIAL: GalacticPotentialParams = {
  diskMassKg: 1.0e11 * M_SUN_KG,
  diskScaleA_M: 6.5 * KPC_METERS,
  diskScaleB_M: 0.26 * KPC_METERS,
  haloVirialMassKg: 1.0e12 * M_SUN_KG,
  haloScaleRadius_M: 20.0 * KPC_METERS,
  haloConcentration: 12.0,
};

// ── Acceleration computation ─────────────────────────────────────────

/**
 * Compute acceleration (m/s^2) from the combined Miyamoto-Nagai + NFW potential.
 *
 * @param posX_m  Position x in meters (galactic-centric).
 * @param posY_m  Position y in meters (galactic-centric).
 * @param posZ_m  Position z in meters (galactic-centric, perpendicular to disk).
 * @param params  Galactic potential parameters.
 * @returns [ax, ay, az] in m/s^2.
 */
export function galacticAccelerationMs2(
  posX_m: number,
  posY_m: number,
  posZ_m: number,
  params: GalacticPotentialParams = DEFAULT_GALACTIC_POTENTIAL
): [number, number, number] {
  const G = G_SI;

  // ── Miyamoto-Nagai ──────────────────────────────────────────────
  const a = params.diskScaleA_M;
  const b = params.diskScaleB_M;
  const Md = params.diskMassKg;

  const R2 = posX_m * posX_m + posY_m * posY_m;
  const zeta = Math.sqrt(posZ_m * posZ_m + b * b);
  const Az = a + zeta;
  const denomDisk = Math.pow(R2 + Az * Az, 1.5);

  // d(Phi_disk)/dx = G * Md * x / denomDisk  (acceleration = -grad(Phi))
  // Acceleration = -dPhi/dx, but Phi = -G*M/denom^(1/2), so
  // -dPhi/dx = -G*M * d(1/denom^(1/2))/dx ... let's compute directly:
  // Phi = -G*M / sqrt(R^2 + (a + sqrt(z^2 + b^2))^2)
  // -dPhi/dx = G*M * x / (R^2 + Az^2)^(3/2)
  // -dPhi/dz = G*M * z * Az / (zeta * (R^2 + Az^2)^(3/2))
  const axDisk = G * Md * posX_m / denomDisk;
  const ayDisk = G * Md * posY_m / denomDisk;
  const azDisk = G * Md * posZ_m * Az / (zeta * denomDisk);

  // ── NFW halo ────────────────────────────────────────────────────
  const Mvir = params.haloVirialMassKg;
  const rs = params.haloScaleRadius_M;
  const c = params.haloConcentration;
  const fc = Math.log(1 + c) - c / (1 + c);
  // Normalization: G * M_vir / fc
  const GMvirOverFc = G * Mvir / fc;

  const r2 = R2 + posZ_m * posZ_m;
  const r = Math.sqrt(Math.max(r2, 1e10)); // avoid singularity at r=0
  const s = r / rs;
  const ln1ps = Math.log(1 + s);

  // NFW enclosed mass profile: M(<r) = M_vir/fc * (ln(1+r/rs) - (r/rs)/(1+r/rs))
  // Acceleration magnitude: G * M(<r) / r^2, directed inward
  // -dPhi/dx = G*M_vir/(fc * r^2) * (ln(1+s) - s/(1+s)) * (x/r)
  const nfwMassFactor = ln1ps - s / (1 + s);
  const nfwAccelMagOverR = GMvirOverFc * nfwMassFactor / (r2 * r);

  const axNfw = nfwAccelMagOverR * posX_m;
  const ayNfw = nfwAccelMagOverR * posY_m;
  const azNfw = nfwAccelMagOverR * posZ_m;

  return [
    axDisk + axNfw,
    ayDisk + ayNfw,
    azDisk + azNfw,
  ];
}

/**
 * Compute circular velocity (km/s) at radius R in the galactic plane (z=0).
 * Useful for setting initial conditions and verifying the rotation curve.
 *
 * v_circ = sqrt(R * |dPhi/dR|) at z=0.
 */
export function galacticCircularVelocityKmS(
  radiusPc: number,
  params: GalacticPotentialParams = DEFAULT_GALACTIC_POTENTIAL
): number {
  const rM = radiusPc * PC_METERS;
  const [ax] = galacticAccelerationMs2(rM, 0, 0, params);
  // ax is acceleration toward center at (rM, 0, 0), so |ax| = v^2/r
  const vMs = Math.sqrt(Math.abs(ax) * rM);
  return vMs / 1000;
}

// ── AU interface for physics engine ──────────────────────────────────

/** Position offset of the solar system from galactic center in parsecs. */
export const SOLAR_POSITION_PC: [number, number, number] = [
  -8500,  // ~8.5 kpc from center (negative x direction)
  0,
  25,     // ~25 pc above midplane
];

/**
 * Convert AU position (relative to solar system barycenter) to galactic-centric
 * meters, then compute galactic acceleration in m/s^2.
 */
export function galacticAccelFromAuPosition(
  posAuX: number,
  posAuY: number,
  posAuZ: number,
  params: GalacticPotentialParams = DEFAULT_GALACTIC_POTENTIAL
): [number, number, number] {
  // AU -> meters (relative to SSB)
  const xM = posAuX * AU_METERS + SOLAR_POSITION_PC[0] * PC_METERS;
  const yM = posAuY * AU_METERS + SOLAR_POSITION_PC[1] * PC_METERS;
  const zM = posAuZ * AU_METERS + SOLAR_POSITION_PC[2] * PC_METERS;
  return galacticAccelerationMs2(xM, yM, zM, params);
}
