import * as THREE from "three";

const DEG = Math.PI / 180;

/**
 * Closed heliocentric orbit polyline in the J2000 ecliptic frame (xy ≈ ecliptic plane).
 * Parametrized by eccentric anomaly E; semi-major axis `aAu` in AU.
 */
export function keplerianEllipsePointsAu(
  aAu: number,
  e: number,
  incDeg: number,
  lanDeg: number,
  argPeriDeg: number,
  segments: number
): THREE.Vector3[] {
  const i = incDeg * DEG;
  const Om = lanDeg * DEG;
  const w = argPeriDeg * DEG;
  const sqrt1me2 = Math.sqrt(Math.max(0, 1 - e * e));

  const cosO = Math.cos(Om);
  const sinO = Math.sin(Om);
  const cosw = Math.cos(w);
  const sinw = Math.sin(w);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);

  const Px = cosw * cosO - sinw * sinO * cosi;
  const Py = cosw * sinO + sinw * cosO * cosi;
  const Pz = sinw * sini;

  const Qx = -sinw * cosO - cosw * sinO * cosi;
  const Qy = -sinw * sinO + cosw * cosO * cosi;
  const Qz = cosw * sini;

  const pts: THREE.Vector3[] = [];
  for (let k = 0; k <= segments; k++) {
    const E = (k / segments) * Math.PI * 2;
    const x = aAu * (Math.cos(E) - e);
    const y = aAu * sqrt1me2 * Math.sin(E);
    const xw = Px * x + Qx * y;
    const yw = Py * x + Qy * y;
    const zw = Pz * x + Qz * y;
    pts.push(new THREE.Vector3(xw, yw, zw));
  }
  return pts;
}

/**
 * Heliocentric position on the orbit (AU) at mean anomaly M (rad), epoch at perihelion (M=E=0).
 */
export function positionAuFromMeanAnomaly(
  aAu: number,
  e: number,
  incDeg: number,
  lanDeg: number,
  argPeriDeg: number,
  meanAnomalyRad: number
): THREE.Vector3 {
  let E = meanAnomalyRad;
  for (let iter = 0; iter < 12; iter++) {
    E = meanAnomalyRad + e * Math.sin(E);
  }
  const sqrt1me2 = Math.sqrt(Math.max(0, 1 - e * e));
  const i = incDeg * DEG;
  const Om = lanDeg * DEG;
  const w = argPeriDeg * DEG;
  const cosO = Math.cos(Om);
  const sinO = Math.sin(Om);
  const cosw = Math.cos(w);
  const sinw = Math.sin(w);
  const cosi = Math.cos(i);
  const sini = Math.sin(i);
  const Px = cosw * cosO - sinw * sinO * cosi;
  const Py = cosw * sinO + sinw * cosO * cosi;
  const Pz = sinw * sini;
  const Qx = -sinw * cosO - cosw * sinO * cosi;
  const Qy = -sinw * sinO + cosw * cosO * cosi;
  const Qz = cosw * sini;
  const x = aAu * (Math.cos(E) - e);
  const y = aAu * sqrt1me2 * Math.sin(E);
  return new THREE.Vector3(Px * x + Qx * y, Py * x + Qy * y, Pz * x + Qz * y);
}
