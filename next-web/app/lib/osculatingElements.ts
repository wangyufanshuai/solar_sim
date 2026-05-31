/**
 * Heliocentric two-body osculating elements from instantaneous r, v vs Sun.
 * Matches the bound-orbit branch of `osculatingEllipseRelativeAu`.
 */

export type HeliocentricOsculating = {
  /** Dimensionless eccentricity */
  e: number;
  /** Semi-major axis (m) */
  a: number;
};

/**
 * Standard gravitational parameter for Sun + body (SI m³/s²).
 */
export function reducedMassMu(
  G: number,
  massSun: number,
  massBody: number
): number {
  return G * (massSun + massBody);
}

/**
 * Returns osculating e and a, or null if unbound / degenerate.
 */
export function heliocentricOsculatingEccentricityAndSemiMajorAxis(
  posM: Float64Array,
  velM: Float64Array,
  sunIdx: number,
  bodyIdx: number,
  mu: number
): HeliocentricOsculating | null {
  const is = sunIdx * 3;
  const ib = bodyIdx * 3;
  const rx = posM[ib] - posM[is];
  const ry = posM[ib + 1] - posM[is + 1];
  const rz = posM[ib + 2] - posM[is + 2];
  const vx = velM[ib] - velM[is];
  const vy = velM[ib + 1] - velM[is + 1];
  const vz = velM[ib + 2] - velM[is + 2];

  const r = Math.hypot(rx, ry, rz);
  if (r < 1e6) return null;

  const v2 = vx * vx + vy * vy + vz * vz;
  const eps = 0.5 * v2 - mu / r;
  if (eps >= 0) return null;

  const hx = ry * vz - rz * vy;
  const hy = rz * vx - rx * vz;
  const hz = rx * vy - ry * vx;
  const h = Math.hypot(hx, hy, hz);
  if (h < 1e-30) return null;

  const a = -mu / (2 * eps);
  const e = Math.sqrt(1 + (2 * eps * h * h) / (mu * mu));
  if (e >= 1 - 1e-12) return null;

  return { e, a };
}

/** Heliocentric radial velocity (m/s): (v_b - v_sun) · r̂ */
export function heliocentricRadialVelocityMs(
  posM: Float64Array,
  velM: Float64Array,
  sunIdx: number,
  bodyIdx: number
): number | null {
  const is = sunIdx * 3;
  const ib = bodyIdx * 3;
  const rx = posM[ib] - posM[is];
  const ry = posM[ib + 1] - posM[is + 1];
  const rz = posM[ib + 2] - posM[is + 2];
  const vx = velM[ib] - velM[is];
  const vy = velM[ib + 1] - velM[is + 1];
  const vz = velM[ib + 2] - velM[is + 2];
  const r = Math.hypot(rx, ry, rz);
  if (r < 1e-3) return null;
  const inv = 1 / r;
  return (vx * rx + vy * ry + vz * rz) * inv;
}

/** Kepler period (s) from semi-major axis and μ. */
export function keplerPeriodSeconds(a: number, mu: number): number {
  return 2 * Math.PI * Math.sqrt((a * a * a) / mu);
}
