/**
 * Static observer camera in Kerr–Schild coordinates.
 *
 * The observer is at rest with respect to the KS coordinates (u ∝ ∂_t), which
 * requires it to sit outside the ergosphere. An orthonormal tetrad
 * (u, e_forward, e_right, e_up) is built by metric Gram–Schmidt in float64.
 * The GPU receives these four vectors plus g_{μν}(camera) and only forms the
 * per-pixel linear combination, so both tracers start from identical rays.
 *
 * Per pixel (screen coords sx, sy already scaled by tan(fov/2)):
 *   d = (e_f + sx e_r + sy e_u) / √(1 + sx² + sy²)
 *   k^μ = −u^μ + d^μ          (past-directed null vector, traced backwards)
 *   k_μ = g_{μν} k^ν          (E_obs = k·u = 1 by construction)
 */
import { dot4, ksMetricLower, type Vec3 } from "./kerrMetricKS";

export type KerrCameraInput = {
  spin: number;
  /** camera position, KS Cartesian, units of M */
  position: Vec3;
  /** look direction (Euclidean, need not be unit) */
  forward: Vec3;
  /** approximate up direction */
  up: Vec3;
  /** vertical field of view, radians */
  fovY: number;
  aspect: number;
};

export type KerrCameraFrame = {
  spin: number;
  position: Vec3;
  u: number[];
  eForward: number[];
  eRight: number[];
  eUp: number[];
  /** g_{μν} at the camera, row-major 4×4 */
  metric: number[][];
  tanHalfFovY: number;
  aspect: number;
};

/** Camera on a sphere of radius `distance`, inclination from the spin axis, looking at the hole. */
export function orbitCamera(spin: number, distance: number, inclination: number, azimuth: number, fovY: number, aspect: number): KerrCameraInput {
  const s = Math.sin(inclination);
  const position: Vec3 = [distance * s * Math.cos(azimuth), distance * s * Math.sin(azimuth), distance * Math.cos(inclination)];
  return { spin, position, forward: [-position[0], -position[1], -position[2]], up: [0, 0, 1], fovY, aspect };
}

export function buildCameraFrame(input: KerrCameraInput): KerrCameraFrame {
  const [x, y, z] = input.position;
  const g = ksMetricLower(input.spin, x, y, z);
  const gtt = g[0][0];
  if (gtt >= 0) throw new Error("camera is inside the ergosphere: no static observer exists there");
  const u = [1 / Math.sqrt(-gtt), 0, 0, 0];

  const project = (v: number[], basis: number[][]) => {
    let w = v.slice();
    const vu = dot4(g, w, u);
    w = w.map((c, i) => c + vu * u[i]); // remove the u component (u·u = −1)
    for (const e of basis) {
      const ve = dot4(g, w, e);
      w = w.map((c, i) => c - ve * e[i]);
    }
    const n = Math.sqrt(dot4(g, w, w));
    return w.map((c) => c / n);
  };
  const f = input.forward;
  let upv = input.up;
  // guard against forward ∥ up
  const fn = Math.hypot(f[0], f[1], f[2]);
  const cross = Math.abs((f[0] * upv[0] + f[1] * upv[1] + f[2] * upv[2]) / (fn * Math.hypot(upv[0], upv[1], upv[2])));
  if (cross > 0.999) upv = [0, 1, 0];
  const right: Vec3 = [f[1] * upv[2] - f[2] * upv[1], f[2] * upv[0] - f[0] * upv[2], f[0] * upv[1] - f[1] * upv[0]];
  const eForward = project([0, f[0], f[1], f[2]], []);
  const eUp = project([0, upv[0], upv[1], upv[2]], [eForward]);
  const eRight = project([0, right[0], right[1], right[2]], [eForward, eUp]);
  return {
    spin: input.spin,
    position: input.position,
    u,
    eForward,
    eRight,
    eUp,
    metric: g,
    tanHalfFovY: Math.tan(input.fovY / 2),
    aspect: input.aspect,
  };
}

/** Screen offsets for pixel centre (i, j) of a W×H image, j = 0 at the bottom. */
export function pixelScreen(frame: KerrCameraFrame, i: number, j: number, W: number, H: number): [number, number] {
  return [((2 * (i + 0.5)) / W - 1) * frame.tanHalfFovY * frame.aspect, ((2 * (j + 0.5)) / H - 1) * frame.tanHalfFovY];
}

/** Covariant initial momentum (k_t, k_x, k_y, k_z) of the backwards ray through screen point (sx, sy). */
export function initialMomentum(frame: KerrCameraFrame, sx: number, sy: number): number[] {
  const n = Math.sqrt(1 + sx * sx + sy * sy);
  const kUp = [0, 1, 2, 3].map((m) => -frame.u[m] + (frame.eForward[m] + sx * frame.eRight[m] + sy * frame.eUp[m]) / n);
  const g = frame.metric;
  return [0, 1, 2, 3].map((m) => g[m][0] * kUp[0] + g[m][1] * kUp[1] + g[m][2] * kUp[2] + g[m][3] * kUp[3]);
}
