import { G_SI, C_LIGHT } from "./physicalConstants";

/** Relative drift above this ⇒ UI suggests reducing simulation step. */
export const CONSERVATION_DRIFT_WARN_THRESHOLD = 8e-4;

const HISTORY_LEN = 64;

export type RingBuffers = {
  energy: number[];
  angMom: number[];
  idx: number;
  count: number;
};

export function createRingBuffers(): RingBuffers {
  return { energy: new Array(HISTORY_LEN).fill(0), angMom: new Array(HISTORY_LEN).fill(0), idx: 0, count: 0 };
}

export function pushRing(buf: RingBuffers, e: number, l: number): void {
  buf.energy[buf.idx] = e;
  buf.angMom[buf.idx] = l;
  buf.idx = (buf.idx + 1) % HISTORY_LEN;
  buf.count = Math.min(buf.count + 1, HISTORY_LEN);
}

/** Ordered samples oldest → newest for plotting. */
export function ringAsSeries(buf: RingBuffers, which: "energy" | "angMom"): number[] {
  const L = HISTORY_LEN;
  const n = buf.count;
  if (n === 0) return [];
  const arr = which === "energy" ? buf.energy : buf.angMom;
  const out: number[] = [];
  if (n < L) {
    for (let i = 0; i < n; i++) out.push(arr[i]!);
    return out;
  }
  for (let k = 0; k < L; k++) {
    const i = (buf.idx + k) % L;
    out.push(arr[i]!);
  }
  return out;
}

/**
 * Softened Newtonian potential energy matching the integrator's `eps2`.
 */
export function totalMechanicalEnergy(
  pos: Float64Array,
  vel: Float64Array,
  mass: Float64Array,
  n: number,
  G: number,
  eps2: number
): number {
  let T = 0;
  for (let i = 0; i < n; i++) {
    const vix = vel[3 * i];
    const viy = vel[3 * i + 1];
    const viz = vel[3 * i + 2];
    T += 0.5 * mass[i]! * (vix * vix + viy * viy + viz * viz);
  }
  let V = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = pos[3 * j] - pos[3 * i];
      const dy = pos[3 * j + 1] - pos[3 * i + 1];
      const dz = pos[3 * j + 2] - pos[3 * i + 2];
      const r2 = dx * dx + dy * dy + dz * dz + eps2;
      V -= (G * mass[i]! * mass[j]!) / Math.sqrt(r2);
    }
  }
  return T + V;
}

/**
 * |L| about the barycenter (SI: kg·m²/s).
 */
export function barycentricAngularMomentumNorm(
  pos: Float64Array,
  vel: Float64Array,
  mass: Float64Array,
  n: number
): number {
  let mTot = 0;
  let rcx = 0;
  let rcy = 0;
  let rcz = 0;
  let vcx = 0;
  let vcy = 0;
  let vcz = 0;
  for (let i = 0; i < n; i++) {
    const mi = mass[i]!;
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

  let lx = 0;
  let ly = 0;
  let lz = 0;
  for (let i = 0; i < n; i++) {
    const mi = mass[i]!;
    const rx = pos[3 * i] - rcx;
    const ry = pos[3 * i + 1] - rcy;
    const rz = pos[3 * i + 2] - rcz;
    const vx = vel[3 * i] - vcx;
    const vy = vel[3 * i + 1] - vcy;
    const vz = vel[3 * i + 2] - vcz;
    lx += mi * (ry * vz - rz * vy);
    ly += mi * (rz * vx - rx * vz);
    lz += mi * (rx * vy - ry * vx);
  }
  return Math.sqrt(lx * lx + ly * ly + lz * lz);
}

/** Schwarzschild surface-to-infinity redshift z = 1/√(1−r_s/R) − 1. */
export function schwarzschildSurfaceRedshiftZ(
  massKg: number,
  radiusMeters: number
): number | null {
  if (radiusMeters <= 0 || massKg <= 0) return null;
  const rs = (2 * G_SI * massKg) / (C_LIGHT * C_LIGHT);
  if (radiusMeters <= rs) return null;
  const x = rs / radiusMeters;
  if (x >= 1) return null;
  return 1 / Math.sqrt(1 - x) - 1;
}

function unwrapAngle(delta: number): number {
  let d = delta;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

export type MercuryPerihelionTracker = {
  prevVr: number | null;
  lastLambda: number | null;
  lastSimDays: number | null;
  arcsecPerCenturyEma: number | null;
  status: string;
};

export function createMercuryPerihelionTracker(): MercuryPerihelionTracker {
  return {
    prevVr: null,
    lastLambda: null,
    lastSimDays: null,
    arcsecPerCenturyEma: null,
    status: "等待径向速度过零（近日点）…",
  };
}

export function resetMercuryPerihelionTracker(t: MercuryPerihelionTracker): void {
  t.prevVr = null;
  t.lastLambda = null;
  t.lastSimDays = null;
  t.arcsecPerCenturyEma = null;
  t.status = "等待径向速度过零（近日点）…";
}

const MERCURY_EMA_ALPHA = 0.18;

/**
 * Heliocentric radial velocity v_r = (r·v)/|r| with r = r_Me − r_Sun.
 * Perihelion ≈ v_r crossing from negative to non-negative.
 */
export function updateMercuryPerihelionPrecession(
  t: MercuryPerihelionTracker,
  pos: Float64Array,
  vel: Float64Array,
  mercuryIdx: number,
  sunIdx: number,
  simDays: number
): void {
  if (mercuryIdx < 0 || sunIdx < 0) {
    t.status = "水星索引无效";
    return;
  }
  const rx = pos[3 * mercuryIdx] - pos[3 * sunIdx];
  const ry = pos[3 * mercuryIdx + 1] - pos[3 * sunIdx + 1];
  const rz = pos[3 * mercuryIdx + 2] - pos[3 * sunIdx + 2];
  const vx = vel[3 * mercuryIdx] - vel[3 * sunIdx];
  const vy = vel[3 * mercuryIdx + 1] - vel[3 * sunIdx + 1];
  const vz = vel[3 * mercuryIdx + 2] - vel[3 * sunIdx + 2];
  const rho = Math.sqrt(rx * rx + ry * ry + rz * rz);
  if (rho < 1e6) {
    t.status = "距离过小，跳过";
    return;
  }
  const vr = (rx * vx + ry * vy + rz * vz) / rho;

  if (t.prevVr !== null && t.prevVr < 0 && vr >= 0) {
    const lambda = Math.atan2(ry, rx);
    if (t.lastLambda !== null && t.lastSimDays !== null) {
      const dLambda = unwrapAngle(lambda - t.lastLambda);
      const deltaDays = simDays - t.lastSimDays;
      if (deltaDays > 0.5) {
        const T_yr = deltaDays / 365.25;
        if (T_yr > 0.01) {
          const arcsec = dLambda * (180 / Math.PI) * 3600;
          const perCy = arcsec * (100 / T_yr);
          t.arcsecPerCenturyEma =
            t.arcsecPerCenturyEma === null
              ? perCy
              : MERCURY_EMA_ALPHA * perCy +
                (1 - MERCURY_EMA_ALPHA) * t.arcsecPerCenturyEma;
          t.status = "已跨 ≥1 轨道：EMA 弧秒/世纪";
        }
      }
    } else {
      t.status = "首近日点已记录，累积下一圈…";
    }
    t.lastLambda = lambda;
    t.lastSimDays = simDays;
  }
  t.prevVr = vr;
}
