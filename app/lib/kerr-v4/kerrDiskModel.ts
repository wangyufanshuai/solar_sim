/**
 * Thin-disk emission model shared by the float64 reference and the GPU shader.
 *
 * - Page–Thorne radiative flux F(r) of a geometrically thin, optically thick
 *   Novikov–Thorne disk, computed by quadrature from the circular-orbit E, L, Ω:
 *     F(r) ∝ −Ω'(r) / (r (E − ΩL)²) · ∫_{r_in}^{r} (E − ΩL) L' dr
 *   (equatorial √(−g) = r in BL coordinates; the overall Ṁ/4π scale is dropped).
 * - Local effective temperature T ∝ F^{1/4}; observed T_obs = g · T_em.
 * - Bolometric observed intensity I_obs = g⁴ · I_em, I_em ∝ F.
 * - Blackbody chromaticity → linear sRGB, normalised to luminance Y = 1.
 *
 * Tables are uploaded as uniforms so GPU and CPU read identical numbers.
 */
import { circularOrbit, iscoRadius } from "./kerrMetricKS";

export const FLUX_TABLE_SIZE = 128;
export const COLOR_TABLE_SIZE = 64;
export const COLOR_T_MIN = 1000;
export const COLOR_T_MAX = 100000;

export type FluxTable = {
  rIn: number;
  rOut: number;
  /** F/F_max sampled uniformly in ln r between rIn and rOut. */
  values: Float32Array;
  /** radius of maximum flux */
  rPeak: number;
};

export function pageThorneFluxTable(a: number, rOut: number, n = FLUX_TABLE_SIZE): FluxTable {
  const rIn = iscoRadius(a);
  const fine = 4096;
  const lnIn = Math.log(rIn);
  const lnOut = Math.log(rOut);
  const rs: number[] = [];
  for (let i = 0; i <= fine; i++) rs.push(Math.exp(lnIn + ((lnOut - lnIn) * i) / fine));
  const h = 1e-6;
  const integrand = (r: number) => {
    const o = circularOrbit(a, r);
    const lp = (circularOrbit(a, r * (1 + h)).angularMomentum - circularOrbit(a, r * (1 - h)).angularMomentum) / (2 * r * h);
    return (o.energy - o.omega * o.angularMomentum) * lp;
  };
  // cumulative trapezoid on the log grid (dr = r dln r); integrand vanishes smoothly at ISCO (L' = 0).
  const cum = new Float64Array(fine + 1);
  let prev = integrand(rs[0]) * rs[0];
  const dln = (lnOut - lnIn) / fine;
  for (let i = 1; i <= fine; i++) {
    const cur = integrand(rs[i]) * rs[i];
    cum[i] = cum[i - 1] + 0.5 * (prev + cur) * dln;
    prev = cur;
  }
  const flux = (i: number) => {
    const r = rs[i];
    const o = circularOrbit(a, r);
    const dOmega = (-1.5 * Math.sqrt(r)) / Math.pow(r * Math.sqrt(r) + a, 2);
    const eol = o.energy - o.omega * o.angularMomentum;
    return Math.max(0, (-dOmega / (r * eol * eol)) * cum[i]);
  };
  const full = new Float64Array(fine + 1);
  let fmax = 0;
  let iPeak = 0;
  for (let i = 0; i <= fine; i++) {
    full[i] = flux(i);
    if (full[i] > fmax) {
      fmax = full[i];
      iPeak = i;
    }
  }
  const values = new Float32Array(n);
  for (let j = 0; j < n; j++) {
    const t = (j / (n - 1)) * fine;
    const i0 = Math.min(fine - 1, Math.floor(t));
    const w = t - i0;
    values[j] = ((1 - w) * full[i0] + w * full[i0 + 1]) / fmax;
  }
  return { rIn, rOut, values, rPeak: rs[iPeak] };
}

/** Linear interpolation in the flux table (same arithmetic as the shader). */
export function sampleFlux(table: FluxTable, r: number): number {
  if (r < table.rIn || r > table.rOut) return 0;
  const n = table.values.length;
  const t = ((Math.log(r) - Math.log(table.rIn)) / (Math.log(table.rOut) - Math.log(table.rIn))) * (n - 1);
  const i0 = Math.min(n - 2, Math.max(0, Math.floor(t)));
  const w = t - i0;
  return (1 - w) * table.values[i0] + w * table.values[i0 + 1];
}

// --- blackbody colour -------------------------------------------------------

/** Wyman, Sloan & Shirley (2013) multi-lobe fit of the CIE 1931 2° observer. */
function cieXYZ(lambdaNm: number): [number, number, number] {
  const g = (x: number, mu: number, s1: number, s2: number) => {
    const t = (x - mu) / (x < mu ? s1 : s2);
    return Math.exp(-0.5 * t * t);
  };
  const X = 1.056 * g(lambdaNm, 599.8, 37.9, 31.0) + 0.362 * g(lambdaNm, 442.0, 16.0, 26.7) - 0.065 * g(lambdaNm, 501.1, 20.4, 26.2);
  const Y = 0.821 * g(lambdaNm, 568.8, 46.9, 40.5) + 0.286 * g(lambdaNm, 530.9, 16.3, 31.1);
  const Z = 1.217 * g(lambdaNm, 437.0, 11.8, 36.0) + 0.681 * g(lambdaNm, 459.0, 26.0, 13.8);
  return [X, Y, Z];
}

function planck(lambdaNm: number, T: number): number {
  const l = lambdaNm * 1e-9;
  const c2 = 1.438776877e-2; // hc/k  [m K]
  return 1 / (Math.pow(l, 5) * (Math.exp(c2 / (l * T)) - 1));
}

/** Linear-sRGB colour of a blackbody at temperature T, normalised to Y = 1. */
export function blackbodyLinearSRGB(T: number): [number, number, number] {
  let X = 0;
  let Y = 0;
  let Z = 0;
  for (let l = 380; l <= 780; l += 2) {
    const p = planck(l, T);
    const c = cieXYZ(l);
    X += p * c[0];
    Y += p * c[1];
    Z += p * c[2];
  }
  X /= Y;
  Z /= Y;
  Y = 1;
  const r = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  const gg = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const b = 0.0557 * X - 0.204 * Y + 1.057 * Z;
  return [Math.max(0, r), Math.max(0, gg), Math.max(0, b)];
}

/** COLOR_TABLE_SIZE entries, uniform in ln T between COLOR_T_MIN and COLOR_T_MAX, packed rgb. */
export function blackbodyColorTable(n = COLOR_TABLE_SIZE): Float32Array {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const T = Math.exp(Math.log(COLOR_T_MIN) + ((Math.log(COLOR_T_MAX) - Math.log(COLOR_T_MIN)) * i) / (n - 1));
    const c = blackbodyLinearSRGB(T);
    out.set(c, i * 3);
  }
  return out;
}
