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
 * Instantaneous heliocentric two-body elements derived from the live N-body
 * state. These are diagnostic values only; the simulation itself remains N-body.
 */
export type HeliocentricOsculatingElements = HeliocentricOsculating & {
  inclinationDeg: number;
  longitudeAscendingNodeDeg: number | null;
  argumentOfPeriapsisDeg: number | null;
  trueAnomalyDeg: number | null;
  perihelionM: number;
  aphelionM: number;
  periodSeconds: number;
  radialVelocityMs: number;
};

const RAD_TO_DEG = 180 / Math.PI;

function degrees0To360(rad: number): number {
  const degrees = rad * RAD_TO_DEG;
  return ((degrees % 360) + 360) % 360;
}

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

/**
 * Full diagnostic element set in an ECLIPJ2000-like inertial frame. Circular
 * and equatorial singularities are represented as null angles instead of
 * inventing an orientation.
 */
export function heliocentricOsculatingElements(
  posM: Float64Array,
  velM: Float64Array,
  sunIdx: number,
  bodyIdx: number,
  mu: number,
): HeliocentricOsculatingElements | null {
  const is = sunIdx * 3;
  const ib = bodyIdx * 3;
  const rx = posM[ib] - posM[is];
  const ry = posM[ib + 1] - posM[is + 1];
  const rz = posM[ib + 2] - posM[is + 2];
  const vx = velM[ib] - velM[is];
  const vy = velM[ib + 1] - velM[is + 1];
  const vz = velM[ib + 2] - velM[is + 2];
  const r = Math.hypot(rx, ry, rz);
  if (r < 1e6 || !Number.isFinite(mu) || mu <= 0) return null;

  const v2 = vx * vx + vy * vy + vz * vz;
  const energy = 0.5 * v2 - mu / r;
  if (energy >= 0) return null;

  const hx = ry * vz - rz * vy;
  const hy = rz * vx - rx * vz;
  const hz = rx * vy - ry * vx;
  const h = Math.hypot(hx, hy, hz);
  if (h < 1e-30) return null;

  const vxhX = vy * hz - vz * hy;
  const vxhY = vz * hx - vx * hz;
  const vxhZ = vx * hy - vy * hx;
  const ex = vxhX / mu - rx / r;
  const ey = vxhY / mu - ry / r;
  const ez = vxhZ / mu - rz / r;
  const e = Math.hypot(ex, ey, ez);
  if (e >= 1 - 1e-12) return null;
  const a = -mu / (2 * energy);
  if (!Number.isFinite(a) || a <= 0) return null;

  const inclinationDeg = Math.acos(Math.min(1, Math.max(-1, hz / h))) * RAD_TO_DEG;
  const nx = -hy;
  const ny = hx;
  const n = Math.hypot(nx, ny);
  const hasNode = n > 1e-18;
  const hasPeriapsis = e > 1e-8;
  const longitudeAscendingNodeDeg = hasNode ? degrees0To360(Math.atan2(ny, nx)) : null;
  const dotNE = nx * ex + ny * ey;
  const crossNEdotH = (ny * ez) * hx + (-nx * ez) * hy + (nx * ey - ny * ex) * hz;
  const argumentOfPeriapsisDeg = hasNode && hasPeriapsis
    ? degrees0To360(Math.atan2(crossNEdotH / (n * e * h), dotNE / (n * e)))
    : null;
  const dotER = ex * rx + ey * ry + ez * rz;
  const crossERdotH = (ey * rz - ez * ry) * hx + (ez * rx - ex * rz) * hy + (ex * ry - ey * rx) * hz;
  const trueAnomalyDeg = hasPeriapsis
    ? degrees0To360(Math.atan2(crossERdotH / (e * r * h), dotER / (e * r)))
    : null;

  return {
    e,
    a,
    inclinationDeg,
    longitudeAscendingNodeDeg,
    argumentOfPeriapsisDeg,
    trueAnomalyDeg,
    perihelionM: a * (1 - e),
    aphelionM: a * (1 + e),
    periodSeconds: keplerPeriodSeconds(a, mu),
    radialVelocityMs: (vx * rx + vy * ry + vz * rz) / r,
  };
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
