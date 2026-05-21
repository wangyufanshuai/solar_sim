/**
 * Convert galactic coordinates (l, b) to equatorial J2000 (RA hours, Dec degrees).
 * Uses the inverse of the IAU 1958 rotation (same constants as gaiaStarCatalog.ts).
 */

const RA_GAL_POLE_DEG = 192.8595;
const DEC_GAL_POLE_DEG = 27.1284;
const LON_ASC_NODE_DEG = 32.932;

const raGP = (RA_GAL_POLE_DEG * Math.PI) / 180;
const decGP = (DEC_GAL_POLE_DEG * Math.PI) / 180;
const lAN = (LON_ASC_NODE_DEG * Math.PI) / 180;

export function galacticToEquatorial(
  lDeg: number,
  bDeg: number,
): [raHours: number, decDeg: number] {
  const l = (lDeg * Math.PI) / 180;
  const b = (bDeg * Math.PI) / 180;

  const sinB = Math.sin(b);
  const cosB = Math.cos(b);
  const sinDecGP = Math.sin(decGP);
  const cosDecGP = Math.cos(decGP);

  // Dec from sin(Dec) = sin(b)*sin(decGP) + cos(b)*cos(decGP)*sin(l - lAN)
  const sinDec =
    sinB * sinDecGP + cosB * cosDecGP * Math.sin(l - lAN);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));

  // RA from atan2
  const yNum =
    cosB * Math.cos(l - lAN);
  const yDen =
    sinB * cosDecGP - cosB * sinDecGP * Math.sin(l - lAN);
  let ra = Math.atan2(yNum, yDen) + raGP;
  if (ra < 0) ra += 2 * Math.PI;
  if (ra >= 2 * Math.PI) ra -= 2 * Math.PI;

  return [(ra / (2 * Math.PI)) * 24, (dec / Math.PI) * 180];
}
