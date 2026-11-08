import * as THREE from "three";

/**
 * Roadmap A4: camera pose between two sky focus frames.
 *
 * The look-at target moves on a straight line; the camera's offset from the target turns by a
 * spherical interpolation (constant angular rate in the eased parameter) and its length is
 * interpolated logarithmically. Interpolating camera position and target separately in Cartesian
 * space (the previous method) makes the view direction swing late and fast when the offset
 * changes direction; this keeps the turn spread over the whole transition.
 */
const scratch = {
  a: new THREE.Vector3(),
  b: new THREE.Vector3(),
  q: new THREE.Quaternion(),
  identity: new THREE.Quaternion(),
};

export function interpolateSkyCameraPose(
  startTarget: THREE.Vector3, startCamera: THREE.Vector3,
  endTarget: THREE.Vector3, endCamera: THREE.Vector3,
  ease: number,
  outTarget: THREE.Vector3, outCamera: THREE.Vector3,
): void {
  const t = Math.max(0, Math.min(1, ease));
  outTarget.lerpVectors(startTarget, endTarget, t);
  const from = scratch.a.subVectors(startCamera, startTarget);
  const to = scratch.b.subVectors(endCamera, endTarget);
  const fromLength = from.length();
  const toLength = to.length();
  if (!(fromLength > 1e-9 && toLength > 1e-9) || !Number.isFinite(fromLength + toLength)) {
    outCamera.lerpVectors(startCamera, endCamera, t);
    return;
  }
  from.divideScalar(fromLength);
  to.divideScalar(toLength);
  // Rotation taking `from` to `to`, applied by fraction t (slerp from identity).
  scratch.q.setFromUnitVectors(from, to);
  const turn = scratch.identity.identity().slerp(scratch.q, t);
  const direction = from.applyQuaternion(turn);
  const length = Math.exp(Math.log(fromLength) * (1 - t) + Math.log(toLength) * t);
  outCamera.copy(outTarget).addScaledVector(direction, length);
}

/** Angle between the current view direction and a destination view direction (radians). */
export function skyTransitionTurnRad(
  cameraPosition: THREE.Vector3, target: THREE.Vector3, destinationForward: THREE.Vector3,
): number {
  const forward = scratch.a.subVectors(target, cameraPosition);
  const length = forward.length();
  const destination = destinationForward.length();
  if (!(length > 1e-9 && destination > 1e-9)) return Math.PI;
  return Math.acos(Math.max(-1, Math.min(1, forward.dot(destinationForward) / (length * destination))));
}
