/**
 * Kerr metric in Cartesian Kerr–Schild coordinates (G = c = M = 1, spin along +z).
 *
 *   g_{μν} = η_{μν} + f l_μ l_ν,   g^{μν} = η^{μν} − f l^μ l^ν
 *   f   = 2 r³ / (r⁴ + a² z²)
 *   l_μ = (1, (r x + a y)/(r² + a²), (r y − a x)/(r² + a²), z / r)
 *   r⁴ − (R² − a²) r² − a² z² = 0,  R² = x² + y² + z²
 *
 * Signature (−,+,+,+). The KS radius r equals the Boyer–Lindquist radius, and
 * the outer horizon is regular in these coordinates, which is why both the
 * float64 reference and the GPU shader integrate here.
 *
 * The photon Hamiltonian is H = ½ g^{μν} k_μ k_ν = ½(−k_t² + |k|²) − ½ f L²,
 * with L = l^μ k_μ = −k_t + l·k. k_t is conserved (stationary metric).
 *
 * Every formula here is mirrored line by line in kerrShaderV4.ts (float32).
 */

export type Vec3 = [number, number, number];

export function clampSpin(a: number): number {
  if (!Number.isFinite(a)) return 0;
  return Math.max(-0.999, Math.min(0.999, a));
}

/** Kerr–Schild / Boyer–Lindquist radius r(x, y, z). */
export function ksRadius(a: number, x: number, y: number, z: number): number {
  const R2 = x * x + y * y + z * z;
  const b = R2 - a * a;
  const r2 = 0.5 * (b + Math.sqrt(b * b + 4 * a * a * z * z));
  return Math.sqrt(Math.max(r2, 1e-300));
}

export function outerHorizon(a: number): number {
  return 1 + Math.sqrt(Math.max(0, 1 - a * a));
}

/** Prograde (a > 0 co-rotating) equatorial ISCO, Bardeen–Press–Teukolsky. */
export function iscoRadius(a: number): number {
  const z1 = 1 + Math.cbrt(1 - a * a) * (Math.cbrt(1 + a) + Math.cbrt(1 - a));
  const z2 = Math.sqrt(3 * a * a + z1 * z1);
  return 3 + z2 - Math.sign(a || 1) * Math.sqrt(Math.max(0, (3 - z1) * (3 + z1 + 2 * z2)));
}

/** Equatorial circular photon orbit radii (prograde, retrograde) for a ≥ 0. */
export function photonOrbitRadii(a: number): { prograde: number; retrograde: number } {
  const s = Math.abs(a);
  return {
    prograde: 2 * (1 + Math.cos((2 / 3) * Math.acos(-s))),
    retrograde: 2 * (1 + Math.cos((2 / 3) * Math.acos(s))),
  };
}

/**
 * Reduced axial angular momentum λ = L/E of the equatorial circular photon orbit
 * at radius r. For an edge-on observer at infinity the shadow's horizontal
 * edges sit at screen coordinate α = −λ.
 */
export function photonOrbitLambda(a: number, r: number): number {
  return -(r * r * r - 3 * r * r + a * a * r + a * a) / (a * (r - 1));
}

export type KSGeometry = {
  r: number;
  f: number;
  l: Vec3;
  /** ∂_i r */
  dr: Vec3;
  /** ∂_i f */
  df: Vec3;
  /** dl[i][j] = ∂_i l_j */
  dl: [Vec3, Vec3, Vec3];
};

export function ksGeometry(a: number, x: number, y: number, z: number): KSGeometry {
  const r = ksRadius(a, x, y, z);
  const r2 = r * r;
  const a2 = a * a;
  const R2 = x * x + y * y + z * z;
  // ∂_i r = (x_i r² + a² z δ_iz) / (r (2r² − R² + a²))
  const den = r * (2 * r2 - R2 + a2);
  const dr: Vec3 = [(x * r2) / den, (y * r2) / den, (z * r2 + a2 * z) / den];

  const q = r2 * r2 + a2 * z * z;
  const f = (2 * r2 * r) / q;
  const df: Vec3 = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const dq = 4 * r2 * r * dr[i] + (i === 2 ? 2 * a2 * z : 0);
    df[i] = (6 * r2 * dr[i] * q - 2 * r2 * r * dq) / (q * q);
  }

  const s = r2 + a2;
  const lx = (r * x + a * y) / s;
  const ly = (r * y - a * x) / s;
  const lz = z / r;
  const dl: [Vec3, Vec3, Vec3] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < 3; i++) {
    const ds = 2 * r * dr[i];
    const nx = dr[i] * x + (i === 0 ? r : 0) + (i === 1 ? a : 0);
    const ny = dr[i] * y + (i === 1 ? r : 0) - (i === 0 ? a : 0);
    dl[i][0] = (nx * s - (r * x + a * y) * ds) / (s * s);
    dl[i][1] = (ny * s - (r * y - a * x) * ds) / (s * s);
    dl[i][2] = (i === 2 ? 1 / r : 0) - (z * dr[i]) / r2;
  }
  return { r, f, l: [lx, ly, lz], dr, df, dl };
}

/** Covariant metric g_{μν} as a 4×4 array (index 0 = t). */
export function ksMetricLower(a: number, x: number, y: number, z: number): number[][] {
  const { f, l } = ksGeometry(a, x, y, z);
  const L = [1, l[0], l[1], l[2]];
  const g: number[][] = [];
  for (let m = 0; m < 4; m++) {
    g.push([]);
    for (let n = 0; n < 4; n++) {
      g[m].push((m === n ? (m === 0 ? -1 : 1) : 0) + f * L[m] * L[n]);
    }
  }
  return g;
}

export function dot4(g: number[][], u: number[], v: number[]): number {
  let s = 0;
  for (let m = 0; m < 4; m++) for (let n = 0; n < 4; n++) s += g[m][n] * u[m] * v[n];
  return s;
}

export function lower4(g: number[][], v: number[]): number[] {
  return [0, 1, 2, 3].map((m) => g[m][0] * v[0] + g[m][1] * v[1] + g[m][2] * v[2] + g[m][3] * v[3]);
}

/**
 * Photon phase-space state: position x^i and covariant spatial momentum k_i.
 * k_t is a constant of motion carried alongside.
 */
export type PhotonState = { x: Vec3; k: Vec3 };

export function photonHamiltonian(a: number, kt: number, s: PhotonState): number {
  const { f, l } = ksGeometry(a, s.x[0], s.x[1], s.x[2]);
  const L = -kt + l[0] * s.k[0] + l[1] * s.k[1] + l[2] * s.k[2];
  const k2 = s.k[0] * s.k[0] + s.k[1] * s.k[1] + s.k[2] * s.k[2];
  return 0.5 * (-kt * kt + k2) - 0.5 * f * L * L;
}

/** Hamilton's equations: returns (dx/dλ, dk/dλ). */
export function photonRhs(a: number, kt: number, x: Vec3, k: Vec3): [Vec3, Vec3] {
  const G = ksGeometry(a, x[0], x[1], x[2]);
  const L = -kt + G.l[0] * k[0] + G.l[1] * k[1] + G.l[2] * k[2];
  const dx: Vec3 = [k[0] - G.f * L * G.l[0], k[1] - G.f * L * G.l[1], k[2] - G.f * L * G.l[2]];
  const dk: Vec3 = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const dL = G.dl[i][0] * k[0] + G.dl[i][1] * k[1] + G.dl[i][2] * k[2];
    dk[i] = 0.5 * G.df[i] * L * L + G.f * L * dL;
  }
  return [dx, dk];
}

/** Prograde Keplerian circular orbit in the equatorial plane. */
export function circularOrbit(a: number, r: number) {
  const sr = Math.sqrt(r);
  const r32 = r * sr;
  const omega = 1 / (r32 + a);
  const root = Math.sqrt(r32 - 3 * sr + 2 * a);
  const r34 = Math.pow(r, 0.75);
  const energy = (r32 - 2 * sr + a) / (r34 * root);
  const angularMomentum = (r * r - 2 * a * sr + a * a) / (r34 * root);
  const ut = (r32 + a) / (r34 * root);
  return { omega, energy, angularMomentum, ut };
}

/**
 * Emitter four-velocity (contravariant, KS Cartesian) at equatorial point (x, y, 0).
 * For r = const, dt_KS = dt_BL and dφ_KS = dφ_BL, so Ω is the BL value.
 */
export function emitterVelocity(a: number, x: number, y: number): number[] {
  const r = ksRadius(a, x, y, 0);
  const { omega } = circularOrbit(a, r);
  const v = [1, -omega * y, omega * x, 0];
  const g = ksMetricLower(a, x, y, 0);
  const n = -dot4(g, v, v);
  const ut = 1 / Math.sqrt(n);
  return v.map((c) => c * ut);
}
