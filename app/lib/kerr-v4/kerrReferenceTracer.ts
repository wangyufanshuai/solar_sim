/**
 * float64 reference null-geodesic tracer (Kerr–Schild Cartesian, Hamiltonian form).
 *
 * Adaptive Dormand–Prince 5(4) with tight tolerances. Equatorial crossings are
 * located by secant iteration on the step length from the last accepted state,
 * so disk-hit radii and redshifts are limited by the integrator tolerance, not
 * by the step size. This is the ground truth the GPU shader is scored against.
 *
 * Model scope (stated, not hidden): vacuum Kerr, test photons, geometrically
 * thin opaque Novikov–Thorne disk in the equatorial plane between the ISCO and
 * rOut, static camera. Not GRMHD, no plasma, no radiative transfer through gas.
 */
import { ksRadius, outerHorizon, photonHamiltonian, photonRhs, emitterVelocity, type Vec3 } from "./kerrMetricKS";
import { buildCameraFrame, initialMomentum, pixelScreen, type KerrCameraInput } from "./kerrCameraV4";
import { iscoRadius } from "./kerrMetricKS";

export type RayStatus = "disk" | "captured" | "escaped" | "max-steps";

export type RayResult = {
  status: RayStatus;
  /** emission radius for disk hits */
  r: number | null;
  /** redshift factor g = E_obs / E_em for disk hits */
  g: number | null;
  /** number of equatorial-plane crossings before the hit (photon-ring order) */
  order: number;
  /** escape direction (Euclidean unit vector) for escaped rays */
  escapeDir: Vec3 | null;
  maxHamiltonian: number;
  steps: number;
};

export type TraceOptions = {
  rOut: number;
  /** capture when r < r_+ + captureMargin (shared with the shader) */
  captureMargin: number;
  escapeRadius: number;
  rtol: number;
  atol: number;
  maxSteps: number;
};

export const SHARED_CAPTURE_MARGIN = 0.02;

/**
 * Rays are declared escaped only far from the hole, so the residual deflection
 * (~4M/r) is negligible and neighbouring pixels map to a continuous sky.
 */
export function sharedEscapeRadius(cameraDistance: number, rOut: number): number {
  return Math.max(8 * cameraDistance, 20 * rOut, 600);
}

export function defaultTraceOptions(cameraDistance: number, rOut = 20): TraceOptions {
  return {
    rOut,
    captureMargin: SHARED_CAPTURE_MARGIN,
    escapeRadius: sharedEscapeRadius(cameraDistance, rOut),
    rtol: 1e-10,
    atol: 1e-12,
    maxSteps: 200000,
  };
}

type S = number[]; // [x, y, z, kx, ky, kz]

function rhs(a: number, kt: number, s: S): S {
  const [dx, dk] = photonRhs(a, kt, [s[0], s[1], s[2]], [s[3], s[4], s[5]]);
  return [dx[0], dx[1], dx[2], dk[0], dk[1], dk[2]];
}

const C2 = 1 / 5, C3 = 3 / 10, C4 = 4 / 5, C5 = 8 / 9;
const A21 = 1 / 5;
const A31 = 3 / 40, A32 = 9 / 40;
const A41 = 44 / 45, A42 = -56 / 15, A43 = 32 / 9;
const A51 = 19372 / 6561, A52 = -25360 / 2187, A53 = 64448 / 6561, A54 = -212 / 729;
const A61 = 9017 / 3168, A62 = -355 / 33, A63 = 46732 / 5247, A64 = 49 / 176, A65 = -5103 / 18656;
const B1 = 35 / 384, B3 = 500 / 1113, B4 = 125 / 192, B5 = -2187 / 6784, B6 = 11 / 84;
const E1 = 71 / 57600, E3 = -71 / 16695, E4 = 71 / 1920, E5 = -17253 / 339200, E6 = 22 / 525, E7 = -1 / 40;
void C2; void C3; void C4; void C5;

function axpy(s: S, terms: Array<[number, S]>, h: number): S {
  const out = s.slice();
  for (const [c, k] of terms) for (let i = 0; i < 6; i++) out[i] += h * c * k[i];
  return out;
}

/** One Dormand–Prince step; returns 5th-order solution and error estimate. */
function dpStep(a: number, kt: number, s: S, h: number): { y: S; err: S } {
  const k1 = rhs(a, kt, s);
  const k2 = rhs(a, kt, axpy(s, [[A21, k1]], h));
  const k3 = rhs(a, kt, axpy(s, [[A31, k1], [A32, k2]], h));
  const k4 = rhs(a, kt, axpy(s, [[A41, k1], [A42, k2], [A43, k3]], h));
  const k5 = rhs(a, kt, axpy(s, [[A51, k1], [A52, k2], [A53, k3], [A54, k4]], h));
  const k6 = rhs(a, kt, axpy(s, [[A61, k1], [A62, k2], [A63, k3], [A64, k4], [A65, k5]], h));
  const y = axpy(s, [[B1, k1], [B3, k3], [B4, k4], [B5, k5], [B6, k6]], h);
  const k7 = rhs(a, kt, y);
  const err = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 6; i++) err[i] = h * (E1 * k1[i] + E3 * k3[i] + E4 * k4[i] + E5 * k5[i] + E6 * k6[i] + E7 * k7[i]);
  return { y, err };
}

export function traceRay(spin: number, x0: Vec3, kLower: number[], opts: TraceOptions): RayResult {
  const a = spin;
  const kt = kLower[0];
  const rh = outerHorizon(a);
  const rIn = iscoRadius(a);
  let s: S = [x0[0], x0[1], x0[2], kLower[1], kLower[2], kLower[3]];
  let r = ksRadius(a, s[0], s[1], s[2]);
  let h = 0.01 * r;
  let order = 0;
  let maxH = 0;
  let steps = 0;
  const done = (status: RayStatus, extra: Partial<RayResult> = {}): RayResult => ({
    status,
    r: null,
    g: null,
    order,
    escapeDir: null,
    maxHamiltonian: maxH,
    steps,
    ...extra,
  });

  while (steps < opts.maxSteps) {
    const { y, err } = dpStep(a, kt, s, h);
    let en = 0;
    for (let i = 0; i < 6; i++) {
      const sc = opts.atol + opts.rtol * Math.max(Math.abs(s[i]), Math.abs(y[i]));
      en = Math.max(en, Math.abs(err[i]) / sc);
    }
    if (!(en <= 1)) {
      h *= Math.max(0.1, 0.9 * Math.pow(en, -0.2));
      if (!Number.isFinite(h) || h < 1e-14) return done("max-steps");
      continue;
    }
    steps++;
    // equatorial crossing between s and y?
    // rays lying exactly in the plane (|z| at round-off level) do not count as crossings
    if (s[2] * y[2] < 0 && Math.max(Math.abs(s[2]), Math.abs(y[2])) > 1e-9) {
      let lo = 0;
      let hi = h;
      let zlo = s[2];
      let zhi = y[2];
      let c = y;
      for (let it = 0; it < 60; it++) {
        const t = lo + (hi - lo) * (zlo / (zlo - zhi));
        c = dpStep(a, kt, s, t).y;
        if (Math.abs(c[2]) < 1e-12) break;
        if (c[2] * zlo > 0) {
          lo = t;
          zlo = c[2];
        } else {
          hi = t;
          zhi = c[2];
        }
      }
      const rc = ksRadius(a, c[0], c[1], 0);
      if (rc >= rIn && rc <= opts.rOut) {
        const u = emitterVelocity(a, c[0], c[1]);
        const ku = kt * u[0] + c[3] * u[1] + c[4] * u[2] + c[5] * u[3];
        maxH = Math.max(maxH, Math.abs(photonHamiltonian(a, kt, { x: [c[0], c[1], c[2]], k: [c[3], c[4], c[5]] })));
        return done("disk", { r: rc, g: 1 / ku });
      }
      order++;
    }
    s = y;
    r = ksRadius(a, s[0], s[1], s[2]);
    maxH = Math.max(maxH, Math.abs(photonHamiltonian(a, kt, { x: [s[0], s[1], s[2]], k: [s[3], s[4], s[5]] })));
    if (r < rh + opts.captureMargin) return done("captured");
    const [dx] = photonRhs(a, kt, [s[0], s[1], s[2]], [s[3], s[4], s[5]]);
    if (r > opts.escapeRadius && s[0] * dx[0] + s[1] * dx[1] + s[2] * dx[2] > 0) {
      const n = Math.hypot(dx[0], dx[1], dx[2]);
      return done("escaped", { escapeDir: [dx[0] / n, dx[1] / n, dx[2] / n] });
    }
    const fac = en > 0 ? Math.min(5, 0.9 * Math.pow(en, -0.2)) : 5;
    h = Math.min(h * fac, 0.25 * r);
  }
  return done("max-steps");
}

export type ReferenceImage = {
  width: number;
  height: number;
  rays: RayResult[];
};

/** Trace a W×H image (row-major from the bottom row, matching gl.readPixels). */
export function traceImage(camera: KerrCameraInput, width: number, height: number, opts: TraceOptions): ReferenceImage {
  const frame = buildCameraFrame(camera);
  const rays: RayResult[] = [];
  for (let j = 0; j < height; j++) {
    for (let i = 0; i < width; i++) {
      const [sx, sy] = pixelScreen(frame, i, j, width, height);
      rays.push(traceRay(camera.spin, camera.position, initialMomentum(frame, sx, sy), opts));
    }
  }
  return { width, height, rays };
}

export function traceScreenPoint(camera: KerrCameraInput, sx: number, sy: number, opts: TraceOptions): RayResult {
  const frame = buildCameraFrame(camera);
  return traceRay(camera.spin, camera.position, initialMomentum(frame, sx, sy), opts);
}
