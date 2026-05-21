"use client";

export type Vec3 = { x: number; y: number; z: number };

export type SatelliteState = {
  posM: Vec3;
  velMs: Vec3;
};

const MU_EARTH = 3.986004418e14;
const J2_EARTH = 1.08262668e-3;
const REQ_EARTH_M = 6_378_137;

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}
function scale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

export function gravityWithJ2Earth(posM: Vec3): Vec3 {
  const x = posM.x;
  const y = posM.y;
  const z = posM.z;
  const r2 = x * x + y * y + z * z;
  const r = Math.sqrt(Math.max(1, r2));
  const r5 = Math.max(1, r2 * r2 * r);
  const muOverR3 = MU_EARTH / Math.max(1, r2 * r);

  // Central gravity.
  let ax = -muOverR3 * x;
  let ay = -muOverR3 * y;
  let az = -muOverR3 * z;

  // J2 perturbation.
  const z2 = z * z;
  const k = (1.5 * J2_EARTH * MU_EARTH * REQ_EARTH_M * REQ_EARTH_M) / r5;
  const f = 5 * z2 / r2;
  ax += k * x * (f - 1);
  ay += k * y * (f - 1);
  az += k * z * (f - 3);

  return { x: ax, y: ay, z: az };
}

export class SatelliteParticle {
  state: SatelliteState;
  constructor(initial: SatelliteState) {
    this.state = initial;
  }

  // High-frequency RK4 sub-steps to keep short-period orbit stable.
  integrateWithSubsteps(dtS: number, maxSubstepS = 2): void {
    const n = Math.max(1, Math.ceil(dtS / Math.max(0.1, maxSubstepS)));
    const h = dtS / n;
    for (let i = 0; i < n; i++) this.rk4(h);
  }

  private rk4(h: number): void {
    const s = this.state;
    const a1 = gravityWithJ2Earth(s.posM);
    const k1p = s.velMs;
    const k1v = a1;

    const p2 = add(s.posM, scale(k1p, 0.5 * h));
    const v2 = add(s.velMs, scale(k1v, 0.5 * h));
    const a2 = gravityWithJ2Earth(p2);
    const k2p = v2;
    const k2v = a2;

    const p3 = add(s.posM, scale(k2p, 0.5 * h));
    const v3 = add(s.velMs, scale(k2v, 0.5 * h));
    const a3 = gravityWithJ2Earth(p3);
    const k3p = v3;
    const k3v = a3;

    const p4 = add(s.posM, scale(k3p, h));
    const v4 = add(s.velMs, scale(k3v, h));
    const a4 = gravityWithJ2Earth(p4);
    const k4p = v4;
    const k4v = a4;

    s.posM = add(
      s.posM,
      scale(add(add(k1p, scale(add(k2p, k3p), 2)), k4p), h / 6)
    );
    s.velMs = add(
      s.velMs,
      scale(add(add(k1v, scale(add(k2v, k3v), 2)), k4v), h / 6)
    );
  }
}

