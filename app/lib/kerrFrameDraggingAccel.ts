/**
 * Weak-field gravitoelectromagnetism: Newtonian gravity + gravitomagnetic (Lense–Thirring) term.
 * Not a full Kerr geodesic integrator; suitable for qualitative frame-dragging demos with a teaching scale.
 */

import * as THREE from "three";
import { G_SI, C_LIGHT } from "./physicalConstants";
import { kerrAngularMomentumSI } from "./kerrGeometry";

const EPS_R = 1e-3;

/**
 * Acceleration [m/s²] on a test mass at position r (m) and velocity v (m/s) relative to the BH center.
 * Spin axis is unit vector `spinAxis` (e.g. +Z). `teachingScale` multiplies only the gravitomagnetic part.
 */
export function kerrWeakFieldAcceleration(
  r: THREE.Vector3,
  v: THREE.Vector3,
  massKg: number,
  aOverM: number,
  spinAxis: THREE.Vector3,
  teachingScale: number
): THREE.Vector3 {
  const rr = r.length();
  if (rr < EPS_R) {
    return new THREE.Vector3(0, 0, 0);
  }

  const n = r.clone().divideScalar(rr);
  const aNewt = n.clone().multiplyScalar((-G_SI * massKg) / (rr * rr));

  const chiEff = Math.min(Math.abs(aOverM), 0.999999);
  if (chiEff < 1e-9 || teachingScale === 0) {
    return aNewt;
  }

  const Jmag = kerrAngularMomentumSI(massKg, aOverM);
  const J = spinAxis.clone().normalize().multiplyScalar(Jmag);

  // B_g = (G / c² r³) ( 3 (J·n̂) n̂ − J ), dimension 1/s
  const jn = J.dot(n);
  const Bg = n
    .clone()
    .multiplyScalar(3 * jn)
    .sub(J)
    .multiplyScalar(G_SI / (C_LIGHT * C_LIGHT * rr * rr * rr));

  const aGem = v.clone().cross(Bg).multiplyScalar(2 * teachingScale);
  return aNewt.add(aGem);
}
