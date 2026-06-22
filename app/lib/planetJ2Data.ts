/**
 * Oblate gravity parameters for J2 correction to Newtonian potential (time dilation Φ only).
 * J2 dimensionless; R_eq equatorial radius [m]. Spin axis approximated as +Z (ecliptic north);
 * Uranus/Neptune obliquity errors are a known teaching limitation.
 *
 * Values from NASA Planetary Fact Sheets where cited; extras use 0 J2 (disabled in φ_J2).
 * Order matches `SOLAR_SYSTEM_BODIES` (100 entries).
 */
const _J2_PREFIX = [
  2.2e-7, 5.03e-5, 2.7e-5, 1.082616e-3, 2.033542e-4, 1.96045e-3, 1.4736e-2,
  1.62908e-2, 3.34343e-3, 3.408e-3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
] as const;

export const BODY_J2: Float64Array = new Float64Array([
  ..._J2_PREFIX,
  ...Array(100 - _J2_PREFIX.length).fill(0),
]);

export const BODY_REQ_M: Float64Array = new Float64Array([
  6.9634e8, 2.4397e6, 6.0518e6, 6.378137e6, 1.7374e6, 3.3962e6, 7.1492e7,
  6.0268e7, 2.5559e7, 2.4764e7, 1.1883e6, 4.73e5, 1.8213e6, 1.5608e6,
  2.6341e6, 2.4103e6, 2.575e6, 2.522e5, 1.98e5, 5.31e5, 5.62e5, 7.64e5,
  1.35e5, 7.35e5, 8.35e4, 1.13e4, 6.2e3, 5.79e5, 5.847e5, 7.889e5, 7.614e5,
  2.358e5, 1.3534e6, 2.1e5, 6.06e5, 1.163e6, 8.5e5, 8.16e5, 6.15e5, 5.55e5,
  5e5, 4.55e5, 4.25e5, 2.627e5, 2.56e5, 2.25e5,
  // thebe … pholus (mean radius m, approximate)
  49e3, 43e3, 8.2e3, 85e3, 43e3, 36e3, 14e3, 16e3, 23e3, 106.5e3, 89.5e3,
  58.1e3, 17.6e3, 12.4e3, 9.5e3, 14.4e3, 43.1e3, 40.7e3, 14.1e3, 3.8e3,
  20.1e3, 21.4e3, 25.7e3, 72e3, 81e3, 29e3, 41e3, 75e3, 88.5e3, 97e3, 23e3,
  30e3, 12e3, 6e3, 233e3, 93e3, 100e3, 85e3, 50e3, 104e3, 60e3, 8.4e3,
  15.7e3, 26e3, 350, 2.65e3, 334e3, 308e3, 200e3, 358e3, 84e3, 40e3, 62e3,
  85e3,
]);
