/**
 * Einstein–Infeld–Hoffmann 1PN (harmonic gauge) + Newton for all bodies,
 * matching `solar_sim/pn_eih_accel.py` `acceleration_eih`.
 *
 * `SolarSystemPhysics` advances state with embedded Dormand–Prince 5(4) by default:
 * each stage evaluates this same `calculateAcceleration` at fixed `invC2` (physical
 * constant for the step), so 1PN remains the instantaneous EIH model; adaptive `dt`
 * only refines sampling in time. Tuning: `solarSystemPhysics.ts`.
 */

import { AU_METERS, C_LIGHT, DAY_SECONDS } from "./physicalConstants";

/** Softening ε² (m²); ~1e-4 AU. */
export function defaultEps2Meters(): number {
  const epsAu = 1e-4;
  return (epsAu * AU_METERS) ** 2;
}

/** AU → m; AU/day → m/s */
export function stateAuToSi(
  posAu: Float64Array,
  velAuPerDay: Float64Array,
  n: number,
  posM: Float64Array,
  velMS: Float64Array
): void {
  for (let k = 0; k < 3 * n; k++) {
    posM[k] = posAu[k] * AU_METERS;
    velMS[k] = (velAuPerDay[k] * AU_METERS) / DAY_SECONDS;
  }
}

/**
 * Total acceleration (flattened 3N): Newton for all bodies; 1PN for every `i` when invC2 > 0.
 * Workspace: `aNewt`, `phi`, `out` (PN accumulates in `out`, then Newton is added).
 */
export function calculateAcceleration(
  pos: Float64Array,
  vel: Float64Array,
  mass: Float64Array,
  n: number,
  G: number,
  invC2: number,
  eps2: number,
  aNewt: Float64Array,
  phi: Float64Array,
  out: Float64Array
): void {
  aNewt.fill(0);
  phi.fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = pos[3 * j] - pos[3 * i];
      const dy = pos[3 * j + 1] - pos[3 * i + 1];
      const dz = pos[3 * j + 2] - pos[3 * i + 2];
      const r2 = dx * dx + dy * dy + dz * dz + eps2;
      const invR = 1 / Math.sqrt(r2);
      const invR2 = invR * invR;
      const gm = G * mass[j];
      phi[i] += gm * invR;
      aNewt[3 * i] += gm * dx * invR * invR2;
      aNewt[3 * i + 1] += gm * dy * invR * invR2;
      aNewt[3 * i + 2] += gm * dz * invR * invR2;
    }
  }

  if (invC2 <= 0) {
    out.set(aNewt);
    return;
  }

  out.fill(0);

  for (let i = 0; i < n; i++) {
    const vix = vel[3 * i];
    const viy = vel[3 * i + 1];
    const viz = vel[3 * i + 2];
    const vi2 = vix * vix + viy * viy + viz * viz;

    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = pos[3 * j] - pos[3 * i];
      const dy = pos[3 * j + 1] - pos[3 * i + 1];
      const dz = pos[3 * j + 2] - pos[3 * i + 2];
      const r2 = dx * dx + dy * dy + dz * dz + eps2;
      const invR = 1 / Math.sqrt(r2);
      const invR2 = invR * invR;

      const nbaX = dx * invR;
      const nbaY = dy * invR;
      const nbaZ = dz * invR;
      const nAbX = -nbaX;
      const nAbY = -nbaY;
      const nAbZ = -nbaZ;

      const vjx = vel[3 * j];
      const vjy = vel[3 * j + 1];
      const vjz = vel[3 * j + 2];
      const vj2 = vjx * vjx + vjy * vjy + vjz * vjz;
      const dotVivj = vix * vjx + viy * vjy + viz * vjz;
      const dotNabVj = nAbX * vjx + nAbY * vjy + nAbZ * vjz;

      const dotRijAB =
        dx * aNewt[3 * j] +
        dy * aNewt[3 * j + 1] +
        dz * aNewt[3 * j + 2];

      const bracket =
        vi2 +
        2 * vj2 -
        4 * dotVivj -
        1.5 * dotNabVj * dotNabVj -
        4 * phi[i] -
        phi[j] +
        0.5 * dotRijAB;

      const gm = G * mass[j];
      const prefBr = invC2 * gm * invR2 * bracket;

      out[3 * i] += prefBr * nbaX;
      out[3 * i + 1] += prefBr * nbaY;
      out[3 * i + 2] += prefBr * nbaZ;

      const fourvIx = 4 * vix - 3 * vjx;
      const fourvIy = 4 * viy - 3 * vjy;
      const fourvIz = 4 * viz - 3 * vjz;
      const scalarN = nAbX * fourvIx + nAbY * fourvIy + nAbZ * fourvIz;

      const dvx = vix - vjx;
      const dvy = viy - vjy;
      const dvz = viz - vjz;
      const prefV = invC2 * gm * invR2 * scalarN;
      out[3 * i] += prefV * dvx;
      out[3 * i + 1] += prefV * dvy;
      out[3 * i + 2] += prefV * dvz;

      const prefTail = 3.5 * invC2 * gm * invR;
      out[3 * i] += prefTail * aNewt[3 * j];
      out[3 * i + 1] += prefTail * aNewt[3 * j + 1];
      out[3 * i + 2] += prefTail * aNewt[3 * j + 2];
    }
  }

  for (let k = 0; k < n; k++) {
    out[3 * k] += aNewt[3 * k];
    out[3 * k + 1] += aNewt[3 * k + 1];
    out[3 * k + 2] += aNewt[3 * k + 2];
  }
}

export type Rk4Workspaces = {
  aNewt: Float64Array;
  phi: Float64Array;
  acc: Float64Array;
  posTmp: Float64Array;
  velTmp: Float64Array;
  kPos1: Float64Array;
  kVel1: Float64Array;
  kPos2: Float64Array;
  kVel2: Float64Array;
  kPos3: Float64Array;
  kVel3: Float64Array;
  kPos4: Float64Array;
  kVel4: Float64Array;
};

export function createRk4Workspaces(n: number): Rk4Workspaces {
  const m = 3 * n;
  return {
    aNewt: new Float64Array(m),
    phi: new Float64Array(n),
    acc: new Float64Array(m),
    posTmp: new Float64Array(m),
    velTmp: new Float64Array(m),
    kPos1: new Float64Array(m),
    kVel1: new Float64Array(m),
    kPos2: new Float64Array(m),
    kVel2: new Float64Array(m),
    kPos3: new Float64Array(m),
    kVel3: new Float64Array(m),
    kPos4: new Float64Array(m),
    kVel4: new Float64Array(m),
  };
}

function statePlusScaled(
  pos: Float64Array,
  vel: Float64Array,
  outPos: Float64Array,
  outVel: Float64Array,
  n: number,
  dt: number,
  scale: number,
  kPos: Float64Array,
  kVel: Float64Array
): void {
  const h = dt * scale;
  for (let b = 0; b < 3 * n; b++) {
    outPos[b] = pos[b] + h * kPos[b];
    outVel[b] = vel[b] + h * kVel[b];
  }
}

/** Classic RK4 on ẋ = v, v̇ = a(x,v). No heap alloc in the hot path. */
export function rk4Step(
  pos: Float64Array,
  vel: Float64Array,
  mass: Float64Array,
  n: number,
  dt: number,
  G: number,
  invC2: number,
  eps2: number,
  ws: Rk4Workspaces
): void {
  const {
    aNewt,
    phi,
    acc,
    posTmp,
    velTmp,
    kPos1,
    kVel1,
    kPos2,
    kVel2,
    kPos3,
    kVel3,
    kPos4,
    kVel4,
  } = ws;

  calculateAcceleration(pos, vel, mass, n, G, invC2, eps2, aNewt, phi, acc);
  for (let b = 0; b < 3 * n; b++) {
    kVel1[b] = acc[b];
    kPos1[b] = vel[b];
  }

  statePlusScaled(pos, vel, posTmp, velTmp, n, dt, 0.5, kPos1, kVel1);
  calculateAcceleration(posTmp, velTmp, mass, n, G, invC2, eps2, aNewt, phi, acc);
  for (let b = 0; b < 3 * n; b++) {
    kVel2[b] = acc[b];
    kPos2[b] = velTmp[b];
  }

  statePlusScaled(pos, vel, posTmp, velTmp, n, dt, 0.5, kPos2, kVel2);
  calculateAcceleration(posTmp, velTmp, mass, n, G, invC2, eps2, aNewt, phi, acc);
  for (let b = 0; b < 3 * n; b++) {
    kVel3[b] = acc[b];
    kPos3[b] = velTmp[b];
  }

  statePlusScaled(pos, vel, posTmp, velTmp, n, dt, 1, kPos3, kVel3);
  calculateAcceleration(posTmp, velTmp, mass, n, G, invC2, eps2, aNewt, phi, acc);
  for (let b = 0; b < 3 * n; b++) {
    kVel4[b] = acc[b];
    kPos4[b] = velTmp[b];
  }

  const h6 = dt / 6;
  for (let b = 0; b < 3 * n; b++) {
    pos[b] +=
      h6 *
      (kPos1[b] + 2 * kPos2[b] + 2 * kPos3[b] + kPos4[b]);
    vel[b] +=
      h6 *
      (kVel1[b] + 2 * kVel2[b] + 2 * kVel3[b] + kVel4[b]);
  }
}

// --- Dormand–Prince 5(4) (DOPRI5 / ode45 族): embedded error for adaptive dt ---
// Coefficients: Hairer–Nørsett–Wanner I (1993), Table 5.2; same as MATLAB ode45 core.

const DP_A21 = 1 / 5;

const DP_A31 = 3 / 40;
const DP_A32 = 9 / 40;

const DP_A41 = 44 / 45;
const DP_A42 = -56 / 15;
const DP_A43 = 32 / 9;

const DP_A51 = 19372 / 6561;
const DP_A52 = -25360 / 2187;
const DP_A53 = 64448 / 6561;
const DP_A54 = -212 / 729;

const DP_A61 = 9017 / 3168;
const DP_A62 = -355 / 33;
const DP_A63 = 46732 / 5247;
const DP_A64 = 49 / 176;
const DP_A65 = -5103 / 18656;

/** Order-5 weights (b1..b7); b2=b7=0 */
const DP_B1 = 35 / 384;
const DP_B3 = 500 / 1113;
const DP_B4 = 125 / 192;
const DP_B5 = -2187 / 6784;
const DP_B6 = 11 / 84;

/** Embedded order-4 weights (b̂) */
const DP_BS1 = 5179 / 57600;
const DP_BS3 = 7571 / 16695;
const DP_BS4 = 393 / 640;
const DP_BS5 = -92097 / 339200;
const DP_BS6 = 187 / 2100;
const DP_BS7 = 1 / 40;

/** e_i = b_i − b̂_i (b2=b̂2=0); b7=0 ⇒ e7 = −b̂7 */
const DP_E1 = DP_B1 - DP_BS1;
const DP_E3 = DP_B3 - DP_BS3;
const DP_E4 = DP_B4 - DP_BS4;
const DP_E5 = DP_B5 - DP_BS5;
const DP_E6 = DP_B6 - DP_BS6;
const DP_E7 = -DP_BS7;

export type Dp54Workspaces = {
  aNewt: Float64Array;
  phi: Float64Array;
  acc: Float64Array;
  pos0: Float64Array;
  vel0: Float64Array;
  posTmp: Float64Array;
  velTmp: Float64Array;
  posNew: Float64Array;
  velNew: Float64Array;
  kPos1: Float64Array;
  kVel1: Float64Array;
  kPos2: Float64Array;
  kVel2: Float64Array;
  kPos3: Float64Array;
  kVel3: Float64Array;
  kPos4: Float64Array;
  kVel4: Float64Array;
  kPos5: Float64Array;
  kVel5: Float64Array;
  kPos6: Float64Array;
  kVel6: Float64Array;
  kPos7: Float64Array;
  kVel7: Float64Array;
};

export function createDp54Workspaces(n: number): Dp54Workspaces {
  const m = 3 * n;
  const z = () => new Float64Array(m);
  return {
    aNewt: new Float64Array(m),
    phi: new Float64Array(n),
    acc: new Float64Array(m),
    pos0: z(),
    vel0: z(),
    posTmp: z(),
    velTmp: z(),
    posNew: z(),
    velNew: z(),
    kPos1: z(),
    kVel1: z(),
    kPos2: z(),
    kVel2: z(),
    kPos3: z(),
    kVel3: z(),
    kPos4: z(),
    kVel4: z(),
    kPos5: z(),
    kVel5: z(),
    kPos6: z(),
    kVel6: z(),
    kPos7: z(),
    kVel7: z(),
  };
}

function copyVec(dst: Float64Array, src: Float64Array, len: number): void {
  dst.set(src.subarray(0, len));
}

/**
 * One Dormand–Prince 5(4) trial step of size `h`.
 * Does not mutate `pos`/`vel`; writes 5th-order endpoint to `ws.posNew`/`ws.velNew`.
 * Returns a dimensionless WRMS error estimate (compare to 1.0 for accept/reject).
 * `invC2` is fixed for all internal stages so EIH 1PN stays the same instantaneous model.
 */
export function dp54TrialStepErrorNorm(
  pos: Float64Array,
  vel: Float64Array,
  mass: Float64Array,
  n: number,
  h: number,
  G: number,
  invC2: number,
  eps2: number,
  ws: Dp54Workspaces,
  rtol: number,
  atolPos: number,
  atolVel: number
): number {
  const m = 3 * n;
  const {
    aNewt,
    phi,
    acc,
    pos0,
    vel0,
    posTmp,
    velTmp,
    posNew,
    velNew,
    kPos1,
    kVel1,
    kPos2,
    kVel2,
    kPos3,
    kVel3,
    kPos4,
    kVel4,
    kPos5,
    kVel5,
    kPos6,
    kVel6,
    kPos7,
    kVel7,
  } = ws;

  copyVec(pos0, pos, m);
  copyVec(vel0, vel, m);

  calculateAcceleration(pos0, vel0, mass, n, G, invC2, eps2, aNewt, phi, acc);
  for (let b = 0; b < m; b++) {
    kVel1[b] = acc[b];
    kPos1[b] = vel0[b];
  }

  for (let b = 0; b < m; b++) {
    posTmp[b] = pos0[b] + h * DP_A21 * kPos1[b];
    velTmp[b] = vel0[b] + h * DP_A21 * kVel1[b];
  }
  calculateAcceleration(posTmp, velTmp, mass, n, G, invC2, eps2, aNewt, phi, acc);
  for (let b = 0; b < m; b++) {
    kVel2[b] = acc[b];
    kPos2[b] = velTmp[b];
  }

  for (let b = 0; b < m; b++) {
    posTmp[b] =
      pos0[b] + h * (DP_A31 * kPos1[b] + DP_A32 * kPos2[b]);
    velTmp[b] =
      vel0[b] + h * (DP_A31 * kVel1[b] + DP_A32 * kVel2[b]);
  }
  calculateAcceleration(posTmp, velTmp, mass, n, G, invC2, eps2, aNewt, phi, acc);
  for (let b = 0; b < m; b++) {
    kVel3[b] = acc[b];
    kPos3[b] = velTmp[b];
  }

  for (let b = 0; b < m; b++) {
    posTmp[b] =
      pos0[b] +
      h *
        (DP_A41 * kPos1[b] +
          DP_A42 * kPos2[b] +
          DP_A43 * kPos3[b]);
    velTmp[b] =
      vel0[b] +
      h *
        (DP_A41 * kVel1[b] +
          DP_A42 * kVel2[b] +
          DP_A43 * kVel3[b]);
  }
  calculateAcceleration(posTmp, velTmp, mass, n, G, invC2, eps2, aNewt, phi, acc);
  for (let b = 0; b < m; b++) {
    kVel4[b] = acc[b];
    kPos4[b] = velTmp[b];
  }

  for (let b = 0; b < m; b++) {
    posTmp[b] =
      pos0[b] +
      h *
        (DP_A51 * kPos1[b] +
          DP_A52 * kPos2[b] +
          DP_A53 * kPos3[b] +
          DP_A54 * kPos4[b]);
    velTmp[b] =
      vel0[b] +
      h *
        (DP_A51 * kVel1[b] +
          DP_A52 * kVel2[b] +
          DP_A53 * kVel3[b] +
          DP_A54 * kVel4[b]);
  }
  calculateAcceleration(posTmp, velTmp, mass, n, G, invC2, eps2, aNewt, phi, acc);
  for (let b = 0; b < m; b++) {
    kVel5[b] = acc[b];
    kPos5[b] = velTmp[b];
  }

  for (let b = 0; b < m; b++) {
    posTmp[b] =
      pos0[b] +
      h *
        (DP_A61 * kPos1[b] +
          DP_A62 * kPos2[b] +
          DP_A63 * kPos3[b] +
          DP_A64 * kPos4[b] +
          DP_A65 * kPos5[b]);
    velTmp[b] =
      vel0[b] +
      h *
        (DP_A61 * kVel1[b] +
          DP_A62 * kVel2[b] +
          DP_A63 * kVel3[b] +
          DP_A64 * kVel4[b] +
          DP_A65 * kVel5[b]);
  }
  calculateAcceleration(posTmp, velTmp, mass, n, G, invC2, eps2, aNewt, phi, acc);
  for (let b = 0; b < m; b++) {
    kVel6[b] = acc[b];
    kPos6[b] = velTmp[b];
  }

  for (let b = 0; b < m; b++) {
    posNew[b] =
      pos0[b] +
      h *
        (DP_B1 * kPos1[b] +
          DP_B3 * kPos3[b] +
          DP_B4 * kPos4[b] +
          DP_B5 * kPos5[b] +
          DP_B6 * kPos6[b]);
    velNew[b] =
      vel0[b] +
      h *
        (DP_B1 * kVel1[b] +
          DP_B3 * kVel3[b] +
          DP_B4 * kVel4[b] +
          DP_B5 * kVel5[b] +
          DP_B6 * kVel6[b]);
  }

  calculateAcceleration(posNew, velNew, mass, n, G, invC2, eps2, aNewt, phi, acc);
  for (let b = 0; b < m; b++) {
    kVel7[b] = acc[b];
    kPos7[b] = velNew[b];
  }

  let sumSq = 0;
  const invDim = 1 / (2 * m);
  for (let b = 0; b < m; b++) {
    const dPos =
      h *
      (DP_E1 * kPos1[b] +
        DP_E3 * kPos3[b] +
        DP_E4 * kPos4[b] +
        DP_E5 * kPos5[b] +
        DP_E6 * kPos6[b] +
        DP_E7 * kPos7[b]);
    const dVel =
      h *
      (DP_E1 * kVel1[b] +
        DP_E3 * kVel3[b] +
        DP_E4 * kVel4[b] +
        DP_E5 * kVel5[b] +
        DP_E6 * kVel6[b] +
        DP_E7 * kVel7[b]);
    const scP = atolPos + rtol * Math.max(Math.abs(pos0[b]), 1e-12);
    const scV = atolVel + rtol * Math.max(Math.abs(vel0[b]), 1e-18);
    const rP = dPos / scP;
    const rV = dVel / scV;
    sumSq += rP * rP + rV * rV;
  }

  return Math.sqrt(sumSq * invDim);
}

/** Apply a successful DP5 trial (`posNew`/`velNew` → state). */
export function dp54Commit(pos: Float64Array, vel: Float64Array, ws: Dp54Workspaces): void {
  const m = pos.length;
  copyVec(pos, ws.posNew, m);
  copyVec(vel, ws.velNew, m);
}

/** Newtonian φ_i = Σ_{j≠i} G m_j / r_ij (same softening as gravity). */
export function computeNewtonianPhi(
  pos: Float64Array,
  mass: Float64Array,
  n: number,
  G: number,
  eps2: number,
  phiOut: Float64Array
): void {
  phiOut.fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = pos[3 * j] - pos[3 * i];
      const dy = pos[3 * j + 1] - pos[3 * i + 1];
      const dz = pos[3 * j + 2] - pos[3 * i + 2];
      const r2 = dx * dx + dy * dy + dz * dz + eps2;
      const invR = 1 / Math.sqrt(r2);
      phiOut[i] += G * mass[j] * invR;
    }
  }
}

/**
 * Oblate (J2) correction to the same φ convention as `computeNewtonianPhi` (+G M / r monopole),
 * spin axis along +Z. Dynamics unchanged — use for weak-field time dilation only.
 */
export function addJ2PhiCorrection(
  pos: Float64Array,
  mass: Float64Array,
  n: number,
  G: number,
  eps2: number,
  j2: Float64Array,
  reqM: Float64Array,
  phiOut: Float64Array
): void {
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const J2 = j2[j]!;
      const Req = reqM[j]!;
      if (J2 <= 0 || Req <= 0) continue;
      const dx = pos[3 * i] - pos[3 * j];
      const dy = pos[3 * i + 1] - pos[3 * j + 1];
      const dz = pos[3 * i + 2] - pos[3 * j + 2];
      const r2 = dx * dx + dy * dy + dz * dz + eps2;
      const r = Math.sqrt(r2);
      const invR3 = 1 / (r2 * r);
      const cos = dz / r;
      const p2 = 0.5 * (3 * cos * cos - 1);
      phiOut[i] += G * mass[j]! * J2 * Req * Req * invR3 * p2;
    }
  }
}

/** J2 part of φ at field point (fx,fy,fz) from all bodies j (axis +Z). */
export function j2PhiAtPoint(
  fx: number,
  fy: number,
  fz: number,
  pos: Float64Array,
  mass: Float64Array,
  n: number,
  G: number,
  eps2: number,
  j2: Float64Array,
  reqM: Float64Array
): number {
  let sum = 0;
  for (let j = 0; j < n; j++) {
    const J2 = j2[j]!;
    const Req = reqM[j]!;
    if (J2 <= 0 || Req <= 0) continue;
    const dx = fx - pos[3 * j];
    const dy = fy - pos[3 * j + 1];
    const dz = fz - pos[3 * j + 2];
    const r2 = dx * dx + dy * dy + dz * dz + eps2;
    const r = Math.sqrt(r2);
    const invR3 = 1 / (r2 * r);
    const cos = dz / r;
    const p2 = 0.5 * (3 * cos * cos - 1);
    sum += G * mass[j]! * J2 * Req * Req * invR3 * p2;
  }
  return sum;
}

/**
 * Weak-field proper-time rate vs coordinate time (harmonic / PN-style display):
 *   dτ/dt ≈ 1 − Φ/c² − v²/(2c²)
 * with Φ the Newtonian potential at the body. Teaching / visualization only.
 */
export function weakFieldTauDt(phi: number, v2: number, invC2: number): number {
  return 1 - phi * invC2 - 0.5 * v2 * invC2;
}

export type GravitationalTimeDilationResult = {
  /** (dτ/dt)_body / (dτ/dt)_cm */
  ratio: number;
  /** 1 − ratio (positive ⇒ body clock slower than barycentric). */
  slowdownFraction: number;
  dTauDtBody: number;
  dTauDtCm: number;
};

/**
 * Barycenter R_cm = Σ m r / M, v_cm = Σ m v / M; Φ_cm = Σ_j G m_j / |R_cm − r_j|.
 */
export function gravitationalTimeDilationVsBarycenter(
  bodyIndex: number,
  pos: Float64Array,
  vel: Float64Array,
  mass: Float64Array,
  n: number,
  G: number,
  cLight: number,
  eps2: number,
  phiScratch: Float64Array,
  j2?: Float64Array | null,
  reqEquatorialM?: Float64Array | null
): GravitationalTimeDilationResult {
  const invC2 = 1 / (cLight * cLight);
  computeNewtonianPhi(pos, mass, n, G, eps2, phiScratch);
  if (j2 && reqEquatorialM && j2.length >= n && reqEquatorialM.length >= n) {
    addJ2PhiCorrection(pos, mass, n, G, eps2, j2, reqEquatorialM, phiScratch);
  }

  let mTot = 0;
  let rcx = 0;
  let rcy = 0;
  let rcz = 0;
  let vcx = 0;
  let vcy = 0;
  let vcz = 0;
  for (let i = 0; i < n; i++) {
    const mi = mass[i];
    mTot += mi;
    rcx += mi * pos[3 * i];
    rcy += mi * pos[3 * i + 1];
    rcz += mi * pos[3 * i + 2];
    vcx += mi * vel[3 * i];
    vcy += mi * vel[3 * i + 1];
    vcz += mi * vel[3 * i + 2];
  }
  const invM = 1 / mTot;
  rcx *= invM;
  rcy *= invM;
  rcz *= invM;
  vcx *= invM;
  vcy *= invM;
  vcz *= invM;
  const vcm2 = vcx * vcx + vcy * vcy + vcz * vcz;

  let phiCm = 0;
  for (let j = 0; j < n; j++) {
    const dx = pos[3 * j] - rcx;
    const dy = pos[3 * j + 1] - rcy;
    const dz = pos[3 * j + 2] - rcz;
    const r2 = dx * dx + dy * dy + dz * dz + eps2;
    phiCm += (G * mass[j]) / Math.sqrt(r2);
  }
  if (j2 && reqEquatorialM && j2.length >= n && reqEquatorialM.length >= n) {
    phiCm += j2PhiAtPoint(rcx, rcy, rcz, pos, mass, n, G, eps2, j2, reqEquatorialM);
  }

  const i = bodyIndex;
  const vix = vel[3 * i];
  const viy = vel[3 * i + 1];
  const viz = vel[3 * i + 2];
  const vi2 = vix * vix + viy * viy + viz * viz;

  const dTauDtBody = weakFieldTauDt(phiScratch[i], vi2, invC2);
  const dTauDtCm = weakFieldTauDt(phiCm, vcm2, invC2);

  const eps = 1e-30;
  const fcm = Math.max(dTauDtCm, eps);
  const ratio = dTauDtBody / fcm;
  return {
    ratio,
    slowdownFraction: 1 - ratio,
    dTauDtBody,
    dTauDtCm,
  };
}
