import { AU_METERS } from "./physicalConstants";

/**
 * Heliocentric two-body osculating ellipse: relative position (AU) from the Sun
 * for each sample, from instantaneous r,v vs the Sun. Returns null if unbound or degenerate.
 */
export function osculatingEllipseRelativeAu(
  posM: Float64Array,
  velM: Float64Array,
  sunIdx: number,
  bodyIdx: number,
  mu: number,
  nSeg: number
): Float64Array | null {
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
  const eMag = Math.sqrt(1 + (2 * eps * h * h) / (mu * mu));
  if (eMag >= 1 - 1e-12) return null;

  const vxhX = vy * hz - vz * hy;
  const vxhY = vz * hx - vx * hz;
  const vxhZ = vx * hy - vy * hx;
  const ex = vxhX / mu - rx / r;
  const ey = vxhY / mu - ry / r;
  const ez = vxhZ / mu - rz / r;
  const eNorm = Math.hypot(ex, ey, ez);

  const invH = 1 / h;
  const kx = hx * invH;
  const ky = hy * invH;
  const kz = hz * invH;

  let px: number;
  let py: number;
  let pz: number;
  if (eNorm < 1e-10) {
    px = rx / r;
    py = ry / r;
    pz = rz / r;
  } else {
    const invE = 1 / eNorm;
    px = ex * invE;
    py = ey * invE;
    pz = ez * invE;
  }

  let qx = ky * pz - kz * py;
  let qy = kz * px - kx * pz;
  let qz = kx * py - ky * px;
  const qLen = Math.hypot(qx, qy, qz);
  if (qLen < 1e-30) return null;
  qx /= qLen;
  qy /= qLen;
  qz /= qLen;

  const invAu = 1 / AU_METERS;
  const out = new Float64Array(nSeg * 3);
  const om2 = 1 - eMag * eMag;
  for (let i = 0; i < nSeg; i++) {
    const nu = (i / nSeg) * Math.PI * 2;
    const cosnu = Math.cos(nu);
    const sinnu = Math.sin(nu);
    const rmag = (a * om2) / (1 + eMag * cosnu);
    const x = rmag * (cosnu * px + sinnu * qx);
    const y = rmag * (cosnu * py + sinnu * qy);
    const z = rmag * (cosnu * pz + sinnu * qz);
    out[3 * i] = x * invAu;
    out[3 * i + 1] = y * invAu;
    out[3 * i + 2] = z * invAu;
  }
  return out;
}
