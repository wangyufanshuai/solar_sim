/**
 * Circular Restricted Three-Body Problem (CR3BP), normalized coordinates.
 * Primary m₁ at (-μ, 0), secondary m₂ at (1−μ, 0); separation = 1; origin = barycenter.
 * μ = m₂ / (m₁ + m₂).
 *
 * Effective potential (rotating frame):
 * Ω(x,y) = ½(x²+y²) + (1−μ)/r₁ + μ/r₂,
 * r₁ = √((x+μ)²+y²), r₂ = √((x−1+μ)²+y²).
 */

export type Vec2 = { x: number; y: number };

export type LagrangePointsFive = {
  L1: Vec2;
  L2: Vec2;
  L3: Vec2;
  L4: Vec2;
  L5: Vec2;
};

export function cr3bpOmega(x: number, y: number, mu: number): number {
  const r1 = Math.hypot(x + mu, y);
  const r2 = Math.hypot(x - 1 + mu, y);
  if (r1 < 1e-15 || r2 < 1e-15) return 1e12;
  return 0.5 * (x * x + y * y) + (1 - mu) / r1 + mu / r2;
}

/** ∂Ω/∂x for y = 0 collinear points or general (x,y). */
export function cr3bpDomegaDx(x: number, y: number, mu: number): number {
  const r1 = Math.hypot(x + mu, y);
  const r2 = Math.hypot(x - 1 + mu, y);
  const e = 1e-18;
  if (r1 < e || r2 < e) return 0;
  const r13 = r1 * r1 * r1;
  const r23 = r2 * r2 * r2;
  return (
    x -
    ((1 - mu) * (x + mu)) / r13 -
    (mu * (x - 1 + mu)) / r23
  );
}

function bisectCollinear(
  mu: number,
  lo: number,
  hi: number,
  maxIter = 80,
): number {
  let a = lo;
  let b = hi;
  let fa = cr3bpDomegaDx(a, 0, mu);
  let fb = cr3bpDomegaDx(b, 0, mu);
  if (!Number.isFinite(fa) || !Number.isFinite(fb)) return (a + b) * 0.5;
  if (fa * fb > 0) {
    // Expand bracket slightly (tiny μ)
    const step = (b - a) * 0.02;
    for (let k = 0; k < 12 && fa * fb > 0; k++) {
      a -= step;
      b += step;
      fa = cr3bpDomegaDx(a, 0, mu);
      fb = cr3bpDomegaDx(b, 0, mu);
    }
  }
  if (fa * fb > 0) return (lo + hi) * 0.5;
  for (let i = 0; i < maxIter; i++) {
    const m = 0.5 * (a + b);
    const fm = cr3bpDomegaDx(m, 0, mu);
    if (Math.abs(fm) < 1e-14 || b - a < 1e-15) return m;
    if (fa * fm <= 0) {
      b = m;
      fb = fm;
    } else {
      a = m;
      fa = fm;
    }
  }
  return 0.5 * (a + b);
}

/**
 * Five Lagrange points in normalized barycentric coordinates (unit separation).
 */
export function computeLagrangePointsCR3BP(mu: number): LagrangePointsFive {
  const eps = Math.max(1e-7, mu * 1e-6);
  const xL1 = bisectCollinear(mu, -mu + eps, 1 - mu - eps);
  const xL2 = bisectCollinear(mu, 1 - mu + eps, 2.5);
  const xL3 = bisectCollinear(mu, -2.5, -mu - eps);
  const xTri = 0.5 - mu;
  const yTri = Math.sqrt(3) / 2;
  return {
    L1: { x: xL1, y: 0 },
    L2: { x: xL2, y: 0 },
    L3: { x: xL3, y: 0 },
    L4: { x: xTri, y: yTri },
    L5: { x: xTri, y: -yTri },
  };
}
