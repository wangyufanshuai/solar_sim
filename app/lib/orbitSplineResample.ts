import * as THREE from "three";
import {
  ORBIT_SPLINE_MAX_SAMPLES,
  ORBIT_SPLINE_MIN_SAMPLES,
} from "./orbitCinematicTokens";

/**
 * Uniformly resample a closed polyline with Catmull–Rom (≥ ORBIT_SPLINE_MIN_SAMPLES points).
 */
export function resampleClosedOrbitPolyline(
  controlPoints: THREE.Vector3[],
  nCtrl: number,
  out: THREE.Vector3[],
  targetCount: number = ORBIT_SPLINE_MAX_SAMPLES
): number {
  if (nCtrl < 3) return 0;
  const t = Math.max(
    ORBIT_SPLINE_MIN_SAMPLES,
    Math.min(targetCount, ORBIT_SPLINE_MAX_SAMPLES)
  );
  const curve = new THREE.CatmullRomCurve3(
    controlPoints.slice(0, nCtrl),
    true,
    "centripetal"
  );
  for (let i = 0; i < t; i++) {
    curve.getPoint(i / t, out[i]!);
  }
  return t;
}

/**
 * Open trail: Catmull–Rom through control points, uniform output count.
 */
export function resampleOpenOrbitPolyline(
  controlPoints: THREE.Vector3[],
  nCtrl: number,
  out: THREE.Vector3[],
  targetCount: number
): number {
  if (nCtrl < 2) return 0;
  const t = Math.max(
    ORBIT_SPLINE_MIN_SAMPLES,
    Math.min(targetCount, ORBIT_SPLINE_MAX_SAMPLES)
  );
  if (nCtrl === 2) {
    const a = controlPoints[0]!;
    const b = controlPoints[1]!;
    for (let k = 0; k < t; k++) {
      out[k]!.lerpVectors(a, b, t === 1 ? 0 : k / (t - 1));
    }
    return t;
  }
  const curve = new THREE.CatmullRomCurve3(
    controlPoints.slice(0, nCtrl),
    false,
    "centripetal"
  );
  for (let i = 0; i < t; i++) {
    curve.getPoint(t === 1 ? 0 : i / (t - 1), out[i]!);
  }
  return t;
}
