export type Vec3 = readonly [number, number, number];

export type LambertTransferResult = {
  converged: boolean;
  iterations: number;
  residualSeconds: number;
  departureVelocityMps: [number, number, number];
  arrivalVelocityMps: [number, number, number];
  transferAngleDeg: number;
  error?: string;
};

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec3, b: Vec3): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function norm(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

function stumpffC(z: number): number {
  if (z > 1e-8) {
    const s = Math.sqrt(z);
    return (1 - Math.cos(s)) / z;
  }
  if (z < -1e-8) {
    const s = Math.sqrt(-z);
    return (Math.cosh(s) - 1) / -z;
  }
  return 0.5 - z / 24 + (z * z) / 720;
}

function stumpffS(z: number): number {
  if (z > 1e-8) {
    const s = Math.sqrt(z);
    return (s - Math.sin(s)) / (s * s * s);
  }
  if (z < -1e-8) {
    const s = Math.sqrt(-z);
    return (Math.sinh(s) - s) / (s * s * s);
  }
  return 1 / 6 - z / 120 + (z * z) / 5040;
}

function zeroVelocityResult(error: string, angleDeg = 0): LambertTransferResult {
  return {
    converged: false,
    iterations: 0,
    residualSeconds: Number.POSITIVE_INFINITY,
    departureVelocityMps: [0, 0, 0],
    arrivalVelocityMps: [0, 0, 0],
    transferAngleDeg: angleDeg,
    error,
  };
}

export function solveLambertTransfer({
  r1M,
  r2M,
  tofSeconds,
  mu,
  prograde = true,
  maxIterations = 64,
  toleranceSeconds = 2,
}: {
  r1M: Vec3;
  r2M: Vec3;
  tofSeconds: number;
  mu: number;
  prograde?: boolean;
  maxIterations?: number;
  toleranceSeconds?: number;
}): LambertTransferResult {
  const r1 = norm(r1M);
  const r2 = norm(r2M);
  if (!Number.isFinite(r1) || !Number.isFinite(r2) || r1 < 1 || r2 < 1) {
    return zeroVelocityResult("invalid position vector");
  }
  if (!Number.isFinite(tofSeconds) || tofSeconds <= 0 || !Number.isFinite(mu) || mu <= 0) {
    return zeroVelocityResult("invalid time of flight or gravitational parameter");
  }

  const cosDtheta = Math.max(-1, Math.min(1, dot(r1M, r2M) / (r1 * r2)));
  const h = cross(r1M, r2M);
  let dtheta = Math.acos(cosDtheta);
  if (prograde ? h[2] < 0 : h[2] >= 0) dtheta = 2 * Math.PI - dtheta;
  const sinDtheta = Math.sin(dtheta);
  const angleDeg = (dtheta * 180) / Math.PI;
  const aLambert = sinDtheta * Math.sqrt((r1 * r2) / Math.max(1e-12, 1 - cosDtheta));
  if (!Number.isFinite(aLambert) || Math.abs(sinDtheta) < 1e-8 || Math.abs(aLambert) < 1e-9) {
    return zeroVelocityResult("near-180 degree Lambert geometry is singular for this first-pass solver", angleDeg);
  }

  const timeForZ = (z: number): { time: number; y: number; c: number; s: number } | null => {
    const c = stumpffC(z);
    const s = stumpffS(z);
    if (c <= 0 || !Number.isFinite(c) || !Number.isFinite(s)) return null;
    const y = r1 + r2 + (aLambert * (z * s - 1)) / Math.sqrt(c);
    if (y <= 0 || !Number.isFinite(y)) return null;
    const x = Math.sqrt(y / c);
    const time = (x * x * x * s + aLambert * Math.sqrt(y)) / Math.sqrt(mu);
    return Number.isFinite(time) ? { time, y, c, s } : null;
  };

  let lo = -4 * Math.PI * Math.PI;
  let hi = 4 * Math.PI * Math.PI;
  let loEval = timeForZ(lo);
  let hiEval = timeForZ(hi);
  for (let i = 0; i < 8 && (!loEval || !hiEval || loEval.time > tofSeconds || hiEval.time < tofSeconds); i++) {
    if (!loEval || loEval.time > tofSeconds) lo *= 1.65;
    if (!hiEval || hiEval.time < tofSeconds) hi *= 1.65;
    loEval = timeForZ(lo);
    hiEval = timeForZ(hi);
  }

  let bestZ = 0;
  let best = timeForZ(0);
  if (!best) return zeroVelocityResult("Lambert initial bracket failed", angleDeg);
  let residual = Math.abs(best.time - tofSeconds);
  let iterations = 0;

  for (let i = 0; i < maxIterations; i++) {
    iterations = i + 1;
    const z = 0.5 * (lo + hi);
    const current = timeForZ(z);
    if (!current) {
      lo = z;
      continue;
    }
    const currentResidual = Math.abs(current.time - tofSeconds);
    if (currentResidual < residual) {
      residual = currentResidual;
      bestZ = z;
      best = current;
    }
    if (currentResidual <= toleranceSeconds) break;
    if (current.time <= tofSeconds) lo = z;
    else hi = z;
  }

  if (!best) return zeroVelocityResult("Lambert solve failed", angleDeg);
  const y = best.y;
  const g = aLambert * Math.sqrt(y / mu);
  if (!Number.isFinite(g) || Math.abs(g) < 1e-9) {
    return zeroVelocityResult("Lambert g function degenerate", angleDeg);
  }
  const f = 1 - y / r1;
  const gdot = 1 - y / r2;
  const v1: [number, number, number] = [
    (r2M[0] - f * r1M[0]) / g,
    (r2M[1] - f * r1M[1]) / g,
    (r2M[2] - f * r1M[2]) / g,
  ];
  const v2: [number, number, number] = [
    (gdot * r2M[0] - r1M[0]) / g,
    (gdot * r2M[1] - r1M[1]) / g,
    (gdot * r2M[2] - r1M[2]) / g,
  ];

  return {
    converged: residual <= Math.max(toleranceSeconds, tofSeconds * 1e-6),
    iterations,
    residualSeconds: residual,
    departureVelocityMps: v1,
    arrivalVelocityMps: v2,
    transferAngleDeg: angleDeg,
    error: residual <= Math.max(toleranceSeconds, tofSeconds * 1e-6) ? undefined : `Lambert residual ${residual.toFixed(1)} s at z=${bestZ.toFixed(3)}`,
  };
}
